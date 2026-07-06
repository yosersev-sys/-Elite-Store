/**
 * Offline Sync and Network Configuration Constants - Souq Al-Asr
 * Warning: Do not modify these values without consultation. 
 * Automatic synchronization is disabled by default to protect internet bandwidth.
 */
export const SYNC_CONFIG = {
  BATCH_SIZE: 50,                   // Maximum number of invoices to sync in a single batch
  REQUEST_TIMEOUT_MS: 5000,         // strict request timeout for individual invoice uploads (5 seconds)
  RATE_LIMITER_MS: 3000,            // rate limiting gap between successive sync invocations (3 seconds)
  PING_INTERVAL_ONLINE_MS: 60000,   // ping interval to check server connection when online (1 minute)
  PING_INTERVAL_OFFLINE_MS: 10000,  // ping interval to check server connection when offline (10 seconds)
  OFFLINE_CLEANUP_DAYS: 7           // time after which synced local offline invoices are purged from IndexedDB
};
