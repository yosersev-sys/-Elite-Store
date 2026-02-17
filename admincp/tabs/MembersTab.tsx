import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { ApiService } from '../../services/api';

interface MembersTabProps {
  users: User[];
  currentUser: User | null;
  adminSearch: string;
  isLoading: boolean;
  setAdminSearch: (val: string) => void;
  onDeleteUser: (id: string) => void;
  onRefreshData?: () => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ users, currentUser, adminSearch, isLoading, setAdminSearch, onDeleteUser, onRefreshData }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });

  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch]);

  const filteredUsers = useMemo(() => {
    const q = (adminSearch || '').toLowerCase().trim();
    return safeUsers.filter(u => 
      (u.name || '').toLowerCase().includes(q) || 
      (u.phone || '').includes(q)
    );
  }, [safeUsers, adminSearch]);

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

  const handleDeleteClick = (user: User) => {
    if (user.id === 'admin_root') {
      return alert('لا يمكن حذف الحساب الرئيسي للنظام 🛡️');
    }
    if (user.id === currentUser?.id) {
      return alert('لا يمكنك حذف حسابك الشخصي أثناء تسجيل الدخول ⚠️');
    }
    if (confirm(`هل أنت متأكد من حذف العضو "${user.name}" نهائياً؟`)) {
      onDeleteUser(user.id);
    }
  };

  if (isLoading && safeUsers.length === 0) {
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
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {editingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-slideUp">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">👤</div>
              <h3 className="text-2xl font-black text-slate-800">تعديل حساب العضو</h3>
            </div>
            <div className="space-y-5">
              <input value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="الاسم" />
              <input value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" dir="ltr" placeholder="الهاتف" />
              <input value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="كلمة مرور جديدة (اختياري)" />
              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={handleSaveEdit} className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-black">{isSaving ? 'جاري الحفظ...' : 'تحديث البيانات'}</button>
                <button onClick={() => setEditingUser(null)} className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الهاتف..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all" 
          />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black border-b">
              <th className="px-8 py-5">العضو</th>
              <th className="px-8 py-5">رقم الموبايل</th>
              <th className="px-8 py-5">الصلاحية</th>
              <th className="px-8 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                <td className="px-8 py-5 font-black text-slate-500">{u.phone}</td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.role === 'admin' ? 'مدير' : 'عميل'}
                  </span>
                </td>
                <td className="px-8 py-5">
                   <div className="flex justify-center gap-2">
                     <button onClick={() => openEditModal(u)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="تعديل">✎</button>
                     <button onClick={() => handleDeleteClick(u)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="حذف">🗑</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
           {Array.from({length: totalPages}, (_, i) => i + 1).map(num => (
             <button key={num} onClick={() => setCurrentPage(num)} className={`w-10 h-10 rounded-xl font-black ${currentPage === num ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border'}`}>{num}</button>
           ))}
        </div>
      )}
    </div>
  );
};

export default MembersTab;
