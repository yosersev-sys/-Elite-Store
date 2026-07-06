import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.ts';
import { OfflineStorageService, OfflineQueueItem, SyncLog } from '../../services/offlineStorage.ts';
import { SYNC_CONFIG } from '../../services/syncConfig.ts';
import { User } from '../../types.ts';

interface OfflineSyncManagerProps {
  currentUser: User | null;
  onClose: () => void;
  onSyncComplete: () => void; // Triggered when sync run ends to reload dashboard
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ currentUser, onClose, onSyncComplete }) => {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; successCount: number; failedCount: number } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [dbVersion, setDbVersion] = useState<number>(0);
  const [rateLimitActive, setRateLimitActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Active ping checking for genuine server connectivity
  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('api.php?action=get_current_user', { signal: controller.signal });
        clearTimeout(tId);
        if (active) setIsOnline(res.ok);
      } catch (e) {
        if (active) setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, SYNC_CONFIG.PING_INTERVAL_ONLINE_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    const items = await OfflineStorageService.getQueueItems();
    // Sort so unsynced orders are shown first
    const sorted = [...items].sort((a, b) => {
      if (a.syncStatus === 'synced' && b.syncStatus !== 'synced') return 1;
      if (a.syncStatus !== 'synced' && b.syncStatus === 'synced') return -1;
      return b.createdAt - a.createdAt;
    });
    setQueue(sorted);

    const logs = await OfflineStorageService.getSyncLogs();
    setSyncLogs(logs);

    const version = await OfflineStorageService.getIndexedDbVersion();
    setDbVersion(version);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartBulkSync = async () => {
    if (isSyncing || rateLimitActive) return;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0, successCount: 0, failedCount: 0 });

    try {
      const result = await ApiService.syncOfflineData((progress) => {
        setSyncProgress(progress);
      });

      // Centralized updates and diagnostic notifications
      await loadData();
      onSyncComplete();
    } catch (e) {
      console.error('Bulk sync failed:', e);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      
      // Enforce Rate Limiter (3 seconds gap) before next execution
      setRateLimitActive(true);
      setTimeout(() => setRateLimitActive(false), SYNC_CONFIG.RATE_LIMITER_MS);
    }
  };

  const handleCancelSync = () => {
    ApiService.cancelSync();
    setIsSyncing(false);
  };

  const handleSyncItem = async (localUuid: string, force: boolean = false) => {
    if (isSyncing || rateLimitActive) return;
    
    // Check permission for Force Syncing conflicts
    if (force && currentUser?.role !== 'admin') {
      alert('❌ عذراً، تطلب عملية المزامنة بالقوة صلاحيات المدير العام.');
      return;
    }

    if (force && !window.confirm('⚠️ تحذير: المزامنة بالقوة تتجاوز تعارضات السعر وتعتمد بيانات الفاتورة المحلية كما هي. هل تريد المتابعة؟')) {
      return;
    }

    setIsSyncing(true);
    try {
      const res = await ApiService.syncOfflineOrder(localUuid, force);
      if (res.success) {
        alert('✅ تمت مزامنة الفاتورة بنجاح!');
      } else {
        alert(`❌ فشلت المزامنة: ${res.error || 'خطأ غير معروف'}`);
      }
      await loadData();
      onSyncComplete();
    } catch (e) {
      console.error('Sync item failed:', e);
    } finally {
      setIsSyncing(false);
      setRateLimitActive(true);
      setTimeout(() => setRateLimitActive(false), SYNC_CONFIG.RATE_LIMITER_MS);
    }
  };

  const handleDeleteItem = async (localUuid: string) => {
    if (window.confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة المحلية؟ سيؤدي ذلك لمسح مبيعاتها بالكامل ولا يمكن التراجع.')) {
      await OfflineStorageService.deleteQueueItem(localUuid);
      await loadData();
      onSyncComplete();
    }
  };

  const getStatusBadge = (status: OfflineQueueItem['syncStatus']) => {
    switch (status) {
      case 'synced':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black">✓ تمت المزامنة</span>;
      case 'syncing':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-black animate-pulse">🔄 جاري المزامنة</span>;
      case 'failed':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-xs font-black">⚠️ فشل الرفع</span>;
      case 'conflict':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-black">🚫 تعارض</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-100 rounded-full text-xs font-black">⏳ معلقة</span>;
    }
  };

  const pendingItems = queue.filter(item => item.syncStatus !== 'synced');
  const failedItemsCount = queue.filter(item => item.syncStatus === 'failed' || item.syncStatus === 'conflict').length;
  const totalAmount = queue.reduce((sum, item) => sum + Number(item.payload.total || 0), 0);
  const pendingAmount = pendingItems.reduce((sum, item) => sum + Number(item.payload.total || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-slideUp font-Cairo">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <div>
              <h3 className="text-lg md:text-xl font-black">إدارة فواتير ومزامنة الأوفلاين</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                تأمين وحماية البيانات المالية عند انقطاع الشبكة
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 transition-all font-black"
          >
            ✕
          </button>
        </div>

        {/* Sync Warning banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3.5 flex items-center gap-2.5 text-amber-800 text-xs font-bold leading-relaxed">
          <span>⚠️</span>
          <p>
            <strong>تنبيه مالي مهم:</strong> الفواتير المعلقة مخزنة محلياً في ذاكرة المتصفح. 
            تجنب مسح الكاش أو سجل التصفح قبل إتمام عملية المزامنة لتفادي فقدان المبيعات.
          </p>
        </div>

        {/* Status Dashboard Panel */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black block">حالة الاتصال الفعلي</span>
            <span className={`text-sm font-black mt-1 flex items-center gap-1.5 ${isOnline ? 'text-emerald-600' : 'text-rose-500 animate-pulse'}`}>
              <span className={`w-2 h-2 rounded-full bg-current`}></span>
              {isOnline ? 'متصل بالإنترنت' : 'دون اتصال (أوفلاين)'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black block">الفواتير غير المتزامنة</span>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {pendingItems.length} فاتورة <span className="text-xs font-bold text-slate-400">({pendingAmount} ج.م)</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black block">إجمالي الفواتير المخزنة</span>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {queue.length} فاتورة <span className="text-xs font-bold text-slate-400">({totalAmount}  ج.م)</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black block">فشل آخر محاولة</span>
            <span className={`text-lg font-black mt-1 block ${failedItemsCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {failedItemsCount} فواتير
            </span>
          </div>
        </div>

        {/* Sync Progress Bar */}
        {syncProgress && (
          <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 space-y-2">
            <div className="flex justify-between items-center text-xs text-emerald-800 font-black">
              <span>جاري المزامنة التدريجية (ممنوع إغلاق الصفحة)...</span>
              <span>{syncProgress.current} من {syncProgress.total}</span>
            </div>
            <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex gap-4 text-[10px] text-emerald-700 font-bold">
              <span>الناجحة: {syncProgress.successCount}</span>
              <span>الفاشلة: {syncProgress.failedCount}</span>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Main queue list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 text-sm">قائمة الطلبات المعلقة محلياً</h4>
              
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <button 
                    onClick={handleCancelSync}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    🛑 إيقاف المزامنة
                  </button>
                ) : (
                  <button 
                    disabled={pendingItems.length === 0 || !isOnline || rateLimitActive}
                    onClick={handleStartBulkSync}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                      pendingItems.length > 0 && isOnline && !rateLimitActive
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    🚀 بدء مزامنة الكل
                  </button>
                )}
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                📭 لا توجد أي فواتير مخزنة محلياً في الوقت الحالي.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900/5 text-slate-600 font-black border-b border-slate-100">
                      <th className="p-4">الفاتورة / المرجع</th>
                      <th className="p-4">التاريخ الفعلي</th>
                      <th className="p-4">العميل</th>
                      <th className="p-4">القيمة</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {queue.map((item) => (
                      <tr key={item.localUuid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-slate-800">#{item.payload.id}</p>
                          <span className="text-[8px] font-bold text-slate-400 uppercase select-all block mt-0.5">UUID: {item.localUuid}</span>
                        </td>
                        <td className="p-4 text-slate-500 font-bold">
                          {new Date(item.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{item.payload.customerName || 'عميل نقدي'}</p>
                          <span className="text-[10px] text-slate-400 font-bold">{item.payload.phone || 'بدون هاتف'}</span>
                        </td>
                        <td className="p-4 font-black text-slate-800">
                          {item.payload.total} ج.م
                        </td>
                        <td className="p-4">
                          {getStatusBadge(item.syncStatus)}
                          {item.syncError && (
                            <p className="text-[9px] font-bold text-rose-500 mt-1 max-w-[200px] leading-relaxed truncate" title={item.syncError}>
                              ❌ {item.syncError}
                            </p>
                          )}
                        </td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          {item.syncStatus !== 'synced' && (
                            <>
                              <button 
                                disabled={isSyncing || !isOnline}
                                onClick={() => handleSyncItem(item.localUuid, false)}
                                className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg font-black text-[10px] disabled:opacity-50 transition-all cursor-pointer"
                                title="محاولة رفع الفاتورة الآن"
                              >
                                مزامنة 🔄
                              </button>
                              {item.syncStatus === 'conflict' && currentUser?.role === 'admin' && (
                                <button 
                                  disabled={isSyncing || !isOnline}
                                  onClick={() => handleSyncItem(item.localUuid, true)}
                                  className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1.5 rounded-lg font-black text-[10px] disabled:opacity-50 transition-all cursor-pointer"
                                  title="تجاوز التعارض وحفظ الفاتورة بالأسعار المحلية"
                                >
                                  مزامنة بالقوة ⚡
                                </button>
                              )}
                              <button 
                                disabled={isSyncing}
                                onClick={() => handleDeleteItem(item.localUuid)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all cursor-pointer"
                                title="مسح الفاتورة المحلية"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {item.syncStatus === 'synced' && (
                            <span className="text-[10px] text-emerald-600 font-black">✓ مكتملة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Diagnostic screen toggle */}
          <div className="border-t border-slate-100 pt-6">
            <button 
              type="button" 
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-xs font-black text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all"
            >
              ⚙️ {showDiagnostics ? 'إخفاء بيانات التشخيص الفنية' : 'عرض بيانات التشخيص للمطورين'}
            </button>

            {showDiagnostics && (
              <div className="mt-4 p-5 bg-slate-950 text-slate-300 font-mono rounded-2xl text-[10px] space-y-4 shadow-inner border border-slate-800 leading-relaxed">
                <div>
                  <h5 className="text-emerald-500 font-bold border-b border-slate-800 pb-1 mb-2 text-xs">💻 مواصفات النظام الحالية</h5>
                  <p>حالة الشبكة: {isOnline ? 'Online' : 'Offline'}</p>
                  <p>إصدار قاعدة بيانات IndexedDB: {dbVersion}</p>
                  <p>الحد الأقصى للدفعة المسموحة: {SYNC_CONFIG.BATCH_SIZE} فواتير</p>
                  <p>مهلة الاتصال الفردية: {SYNC_CONFIG.REQUEST_TIMEOUT_MS} ملي ثانية</p>
                  <p>حالة قفل Mutex الحالي: {isSyncing ? 'Locked' : 'Unlocked'}</p>
                </div>

                <div>
                  <h5 className="text-amber-500 font-bold border-b border-slate-800 pb-1 mb-2 text-xs">📋 سجل تدقيق المزامنة الأخير (Sync logs)</h5>
                  {syncLogs.length === 0 ? (
                    <p className="text-slate-500">لا يوجد سجل مزامنة مدون حالياً.</p>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {syncLogs.map((log) => (
                        <div key={log.id} className="border-b border-slate-900 pb-2">
                          <p className="font-bold text-slate-200">
                            [{new Date(log.startTime).toLocaleString('ar-EG')}] ID: {log.id} - {log.status.toUpperCase()}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            مدة العملية: {log.endTime - log.startTime}ms | الفواتير: {log.processedCount} | الطلبات المرسلة: {log.requestsSentCount}
                          </p>
                          {log.details !== 'تمت مزامنة كافة الفواتير بنجاح' && (
                            <p className="text-rose-400 text-[8px] mt-0.5 break-all max-w-full">تفاصيل الخطأ: {log.details}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
