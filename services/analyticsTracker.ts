import { ApiService } from './api';

export interface AnalyticsEvent {
  eventUuid: string;
  visitorId: string;
  sessionId: string;
  userId?: string | null;
  eventType: string;
  page: string;
  productId?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  eventData?: any | null;
  duration?: number; // active duration in seconds
  createdAt: number;
  appVersion?: string;
}

const STORAGE_VISITOR_KEY = 'souq_analytics_visitor_id';
const STORAGE_RETRY_KEY = 'souq_analytics_retry_queue';
const APP_VERSION = 'v8.7-analytics';

class AnalyticsTrackerService {
  private queue: AnalyticsEvent[] = [];
  private visitorId = '';
  private sessionId = '';
  private lastSendTime = Date.now();
  private currentPage = 'store';
  private currentProductId: string | null = null;
  private pageOpenedAt = Date.now();
  private activeDuration = 0; // in seconds
  private lastActiveTime = Date.now();
  private isTabActive = true;
  private utmParams: Record<string, string> = {};

  constructor() {
    if (typeof window === 'undefined') return;

    // 1. Initialize IDs
    this.initVisitorAndSession();

    // 2. Parse UTM campaign parameters
    this.parseUtmParameters();

    // 3. Listen to page visibility changes to accurately track duration
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    window.addEventListener('pagehide', () => this.flushSync());
    window.addEventListener('beforeunload', () => this.flushSync());

    // 4. Try sending any pending offline events from localStorage
    setTimeout(() => this.processRetryQueue(), 2000);

    // 5. Periodic check every 10 seconds
    setInterval(() => {
      if (Date.now() - this.lastSendTime >= 10000 && this.queue.length > 0) {
        this.sendBatch();
      }
    }, 5000);
  }

  private initVisitorAndSession() {
    // Visitor ID (Permanent in localStorage)
    let savedVisitor = localStorage.getItem(STORAGE_VISITOR_KEY);
    if (!savedVisitor) {
      savedVisitor = 'v_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_VISITOR_KEY, savedVisitor);
    }
    this.visitorId = savedVisitor;

    // Session ID (Temporary in sessionStorage)
    let savedSession = sessionStorage.getItem('souq_analytics_session_id');
    if (!savedSession) {
      savedSession = 's_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      sessionStorage.setItem('souq_analytics_session_id', savedSession);
    }
    this.sessionId = savedSession;
  }

  private parseUtmParameters() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      
      // Store in session storage so it persists for the session even on navigation
      utms.forEach(param => {
        const val = urlParams.get(param);
        if (val) {
          this.utmParams[param] = val;
          sessionStorage.setItem(`souq_utm_${param}`, val);
        } else {
          const cached = sessionStorage.getItem(`souq_utm_${param}`);
          if (cached) {
            this.utmParams[param] = cached;
          }
        }
      });
    } catch (e) {
      console.warn('Failed parsing UTM parameters', e);
    }
  }

  private getLoggedInUserId(): string | null {
    try {
      const profileStr = localStorage.getItem('souq_user_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        // Exclude tracking for admin
        if (profile.role === 'admin') {
          return 'admin'; 
        }
        return profile.id || null;
      }
    } catch {}
    return null;
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
  }

  private pauseTimer() {
    if (!this.isTabActive) return;
    this.isTabActive = false;
    const elapsed = Math.floor((Date.now() - this.lastActiveTime) / 1000);
    this.activeDuration += Math.max(0, elapsed);
  }

  private resumeTimer() {
    if (this.isTabActive) return;
    this.isTabActive = true;
    this.lastActiveTime = Date.now();
  }

  // Navigation track
  public trackPageView(page: string, productId: string | null = null) {
    const userId = this.getLoggedInUserId();
    if (userId === 'admin') return; // Don't track admin actions

    // 1. Calculate time spent on previous page
    this.pauseTimer();
    const finalDuration = this.activeDuration + Math.floor((Date.now() - this.lastActiveTime) / 1000);
    
    if (this.activeDuration > 0 || finalDuration > 0) {
      // Record duration event for the exit page
      this.pushEvent('page_duration', this.currentPage, this.currentProductId, {
        seconds: Math.max(1, finalDuration)
      }, Math.max(1, finalDuration));
    }

    // 2. Reset timers for the new page
    this.currentPage = page;
    this.currentProductId = productId;
    this.pageOpenedAt = Date.now();
    this.activeDuration = 0;
    this.lastActiveTime = Date.now();
    this.isTabActive = !document.hidden;

    // 3. Register the new page view
    this.pushEvent('page_view', page, productId);
  }

  // Search track
  public trackSearch(query: string, resultsCount: number, clickedResult = false) {
    this.pushEvent('search', this.currentPage, null, {
      query,
      resultsCount,
      clickedResult: clickedResult.toString()
    });
  }

  // Cart events
  public trackCartEvent(eventType: 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'checkout_complete' | 'payment_failed', product?: any, currentCart: any[] = []) {
    let itemsInfo = null;
    if (currentCart && currentCart.length > 0) {
      itemsInfo = currentCart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
    }
    
    this.pushEvent(eventType, this.currentPage, product?.id || null, {
      productName: product?.name || null,
      cartTotal: currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      cartCount: currentCart.length,
      items: itemsInfo
    });
  }

  // Coupon events
  public trackCoupon(code: string, success: boolean, discountAmount = 0, errorMessage = '') {
    this.pushEvent(success ? 'use_coupon' : 'coupon_failed', this.currentPage, null, {
      code,
      discountAmount,
      error: errorMessage
    });
  }

  // Share and social events
  public trackSocialClick(network: 'whatsapp' | 'facebook' | 'telegram' | 'other', action: 'share' | 'contact', productId: string | null = null) {
    this.pushEvent(action === 'share' ? 'share_product' : 'social_click', this.currentPage, productId, {
      network
    });
  }

  // Login / Registration
  public trackUserAuth(type: 'login' | 'signup', success: boolean, errorMsg = '') {
    this.pushEvent(type, this.currentPage, null, {
      success: success.toString(),
      error: errorMsg
    });
  }

  // Favorites
  public trackFavorite(productId: string, action: 'add' | 'remove') {
    this.pushEvent('add_to_favorites', this.currentPage, productId, {
      action
    });
  }

  // Standard pusher
  private pushEvent(eventType: string, page: string, productId: string | null = null, eventData: any = null, duration = 0) {
    const userId = this.getLoggedInUserId();
    if (userId === 'admin') return;

    const event: AnalyticsEvent = {
      eventUuid: this.generateUUID(),
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      userId: userId,
      eventType: eventType,
      page: page,
      productId: productId,
      referrer: document.referrer || null,
      utm_source: this.utmParams.utm_source || null,
      utm_medium: this.utmParams.utm_medium || null,
      utm_campaign: this.utmParams.utm_campaign || null,
      utm_content: this.utmParams.utm_content || null,
      utm_term: this.utmParams.utm_term || null,
      eventData: eventData,
      duration: duration,
      createdAt: Date.now(),
      appVersion: APP_VERSION
    };

    this.queue.push(event);

    // Queue trigger threshold check (20 events)
    if (this.queue.length >= 20) {
      this.sendBatch();
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Async batch sending
  private async sendBatch() {
    if (this.queue.length === 0) return;

    const batchToSend = [...this.queue];
    this.queue = []; // clear queue before call to avoid race conditions
    this.lastSendTime = Date.now();

    try {
      const response = await fetch('api.php?action=track_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ events: batchToSend })
      });

      if (!response.ok) {
        throw new Error('Server returned error status');
      }

      const res = await response.json();
      if (res.status !== 'success') {
        throw new Error(res.message || 'Tracking failed');
      }
    } catch (e) {
      console.warn('Analytics events send failed. Enqueuing to retry offline.', e);
      this.saveToRetryQueue(batchToSend);
    }
  }

  // Synchronous flush for window close
  private flushSync() {
    this.pauseTimer();
    const finalDuration = this.activeDuration + Math.floor((Date.now() - this.lastActiveTime) / 1000);
    if (finalDuration > 0) {
      this.pushEvent('page_duration', this.currentPage, this.currentProductId, {
        seconds: Math.max(1, finalDuration)
      }, Math.max(1, finalDuration));
    }

    if (this.queue.length === 0) return;

    try {
      const payload = JSON.stringify({ events: this.queue });
      // Use navigator.sendBeacon for reliable unload data dispatch
      if (navigator.sendBeacon) {
        navigator.sendBeacon('api.php?action=track_events', new Blob([payload], { type: 'application/json' }));
      } else {
        // Fallback to synchronous XHR
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'api.php?action=track_events', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
      this.queue = [];
    } catch (e) {
      console.error('Failed to flush analytics sync', e);
    }
  }

  // Local storage cache for offline mode
  private saveToRetryQueue(events: AnalyticsEvent[]) {
    try {
      const existing = localStorage.getItem(STORAGE_RETRY_KEY);
      const queue: AnalyticsEvent[] = existing ? JSON.parse(existing) : [];
      
      // Limit local retry queue to 200 items to avoid localStorage overflow
      const combined = [...queue, ...events].slice(-200);
      localStorage.setItem(STORAGE_RETRY_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error('Failed to save to localStorage retry queue', e);
    }
  }

  private async processRetryQueue() {
    try {
      const existing = localStorage.getItem(STORAGE_RETRY_KEY);
      if (!existing) return;

      const events: AnalyticsEvent[] = JSON.parse(existing);
      if (events.length === 0) return;

      const response = await fetch('api.php?action=track_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ events })
      });

      if (response.ok) {
        const res = await response.json();
        if (res.status === 'success') {
          localStorage.removeItem(STORAGE_RETRY_KEY);
        }
      }
    } catch (e) {
      // Keep in storage for next attempt
    }
  }
}

export const AnalyticsTracker = new AnalyticsTrackerService();
