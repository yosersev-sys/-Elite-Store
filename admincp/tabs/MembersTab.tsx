
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'user'
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

  const handleAddUser = async () => {
    if (!formData.name || !formData.phone || !formData.password) return alert('يرجى ملء كافة الحقول');
    if (!/^01[0125][0-9]{8}$/.test(formData.phone)) return alert('رقم هاتف غير صحيح');

    setIsSaving(true);
    try {
      const res = await ApiService.adminAddUser(formData);
      if (res.status === 'success') {
        alert('تم إضافة العضو بنجاح ✨');
        setIsAddModalOpen(false);
        setFormData({ name: '', phone: '', password: '', role: 'user' });
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل الإضافة');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!formData.name || !formData.phone) return alert('الاسم والهاتف مطلوبان');

    setIsSaving(true);
    try {
      const res = await ApiService.adminUpdateUser({
        id: editingUser.id,
        name: formData.name,
        phone: formData.phone,
        password: formData.password || undefined,
        role: formData.role
      });

      if (res.status === 'success') {
        alert('تم تحديث بيانات العضو ✨');
        setEditingUser(null);
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل التحديث');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      password: '',
      role: user.role
    });
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', password: '', role: 'user' });
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    // Fix: Using code blocks instead of direct return from void alert() function
    if (user.id === 'admin_root') {
      alert('لا يمكن حذف الحساب الرئيسي 🛡️');
      return;
    }
    // Fix: Separated logic to avoid truthiness check on void return
    if (user.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي ⚠️');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف العضو "${user.name}" نهائياً؟`)) {
      onDeleteUser(user.id);
    }
  };

  if (isLoading && safeUsers.length === 0) {
    return <div className="p-20 text-center animate-pulse text-slate-400 font-black">جاري جلب قائمة الأعضاء...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Modal Add/Edit */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Fix: Replaced truthiness evaluation of void expressions with a clear function block on line 141 */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => { if (!isSaving) { setIsAddModalOpen(false); setEditingUser(null); } }}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-slideUp">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${isAddModalOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {isAddModalOpen ? '✨' : '👤'}
              </div>
              <h3 className="text-2xl font-black text-slate-800">{isAddModalOpen ? 'إضافة عضو جديد' : 'تعديل بيانات العضو'}</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الاسم بالكامل</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold" placeholder="الاسم" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الجوال</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-left" dir="ltr" placeholder="01xxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">{isAddModalOpen ? 'كلمة المرور' : 'تغيير كلمة المرور (اختياري)'}</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold" placeholder="••••••••" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">صلاحية الحساب</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                   <button onClick={() => setFormData({...formData, role: 'user'})} className={`py-2.5 rounded-xl font-black text-xs transition-all ${formData.role === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>عميل عادي</button>
                   <button onClick={() => setFormData({...formData, role: 'admin'})} className={`py-2.5 rounded-xl font-black text-xs transition-all ${formData.role === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}>مدير نظام</button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={isAddModalOpen ? handleAddUser : handleUpdateUser} className={`flex-grow py-4 rounded-2xl font-black text-white shadow-xl transition-all ${isAddModalOpen ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                  {isSaving ? 'جاري الحفظ...' : (isAddModalOpen ? 'إضافة العضو الآن' : 'حفظ التعديلات')}
                </button>
                <button onClick={() => {setIsAddModalOpen(false); setEditingUser(null);}} className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <button onClick={openAddModal} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:scale-105 transition-transform active:scale-95 whitespace-nowrap">
          + إضافة عضو جديد
        </button>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الهاتف..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold pr-12 focus:ring-2 focus:ring-emerald-500/20" 
          />
          <span className="absolute right-4 top-2.5 text-slate-300 text-lg">🔍</span>
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
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                    {u.role === 'admin' ? 'مدير نظام ⚙️' : 'عميل متجر 👤'}
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
             <button key={num} onClick={() => setCurrentPage(num)} className={`w-10 h-10 rounded-xl font-black ${currentPage === num ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{num}</button>
           ))}
        </div>
      )}
    </div>
  );
};

export default MembersTab;
