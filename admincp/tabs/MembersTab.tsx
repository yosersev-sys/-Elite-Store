
import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { ApiService } from '../../services/api';

interface MembersTabProps {
  users: User[];
  adminSearch: string;
  isLoading: boolean;
  setAdminSearch: (val: string) => void;
  onRefreshData?: () => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ users, adminSearch, isLoading, setAdminSearch, onRefreshData }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });

  // تصفير الصفحة عند تغيير البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      u.phone.includes(adminSearch)
    );
  }, [users, adminSearch]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      phone: user.phone,
      password: '' 
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editFormData.name || !editFormData.phone) return alert('يرجى ملء الاسم ورقم الهاتف');

    setIsSaving(true);
    try {
      const res = await ApiService.adminUpdateUser({
        id: editingUser.id,
        name: editFormData.name,
        phone: editFormData.phone,
        password: editFormData.password || undefined
      });

      if (res.status === 'success') {
        alert('تم تحديث بيانات العضو بنجاح ✨');
        setEditingUser(null);
        // تحديث البيانات دون إعادة تحميل الصفحة بالكامل
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        alert(res.message || 'فشل التحديث');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  // واجهة جاري التحميل للأعضاء
  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex justify-end">
           <div className="w-80 h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
           <div className="p-8 space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                     <div className="space-y-2">
                        <div className="w-40 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="w-24 h-3 bg-slate-50 rounded-lg animate-pulse"></div>
                     </div>
                  </div>
                  <div className="w-24 h-6 bg-slate-50 rounded-full animate-pulse"></div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                </div>
              ))}
           </div>
           <div className="bg-slate-50 p-4 text-center">
              <p className="text-slate-400 font-black text-[10px] animate-bounce uppercase tracking-widest">جاري مزامنة بيانات أعضاء المتجر...</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Modal التعديل */}
      {editingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-slideUp overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">👤</div>
              <h3 className="text-2xl font-black text-slate-800">تعديل حساب العضو</h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">ID: {editingUser.id}</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاسم بالكامل</label>
                <input 
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم الجوال</label>
                <input 
                  type="tel"
                  value={editFormData.phone}
                  onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-left shadow-inner"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كلمة مرور جديدة (اختياري)</label>
                <input 
                  type="text"
                  value={editFormData.password}
                  onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                  placeholder="اتركها فارغة لعدم التغيير"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  disabled={isSaving}
                  onClick={handleSaveEdit}
                  className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات ✨'}
                </button>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شريط البحث */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الهاتف..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" 
          />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>

      {/* جدول المستخدمين */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-8 py-5">العضو</th>
              <th className="px-8 py-5">رقم الموبايل</th>
              <th className="px-8 py-5">الصلاحية</th>
              <th className="px-8 py-5">تاريخ الانضمام</th>
              <th className="px-8 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                        {u.name[0].toUpperCase()}
                      </div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-500">{u.phone}</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {u.role === 'admin' ? 'مدير نظام' : 'عميل متجر'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[10px] text-slate-400 font-bold">
                    {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                       <button 
                         onClick={() => openEditModal(u)}
                         className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm md:opacity-0 md:group-hover:opacity-100"
                         title="تعديل بيانات العضو"
                       >
                         ✎
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                  لا توجد نتائج مطابقة لبحثك
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* أدوات التحكم بالترقيم (Pagination UI) */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            عرض الصفحة {currentPage} من أصل {totalPages} صفحات
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              السابق 🡒
            </button>
            
            <div className="flex gap-1">
              {Array.from({length: totalPages}, (_, i) => i + 1).map(num => (
                <button 
                  key={num}
                  onClick={() => { setCurrentPage(num); }}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === num ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {num}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              🡐 التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersTab;
