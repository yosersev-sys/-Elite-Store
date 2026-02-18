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
    if (!formData.name || !formData.phone || !formData.password) {
      alert('يرجى ملء كافة الحقول الإلزامية');
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      alert('يرجى إدخال رقم هاتف مصري صحيح (11 رقم)');
      return;
    }

    setIsSaving(true);
    try {
      const res = await ApiService.adminAddUser(formData);
      if (res && res.status === 'success') {
        alert('تم إضافة العضو بنجاح ✨');
        setIsAddModalOpen(false);
        setFormData({ name: '', phone: '', password: '', role: 'user' });
        if (onRefreshData) onRefreshData();
      } else {
        alert(res?.message || 'فشل إضافة العضو، قد يكون الرقم مسجلاً بالفعل');
      }
    } catch (err) {
      alert('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!formData.name || !formData.phone) {
      alert('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    setIsSaving(true);
    try {
      const res = await ApiService.adminUpdateUser({
        id: editingUser.id,
        name: formData.name,
        phone: formData.phone,
        password: formData.password || undefined,
        role: formData.role
      });

      if (res && res.status === 'success') {
        alert('تم تحديث بيانات العضو بنجاح ✨');
        setEditingUser(null);
        if (onRefreshData) onRefreshData();
      } else {
        alert(res?.message || 'فشل تحديث البيانات');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
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
    if (user.id === 'admin_root') {
      alert('تحذير أمان: لا يمكن حذف حساب المدير الرئيسي للنظام 🛡️');
      return;
    }
    if (user.id === currentUser?.id) {
      alert('تنبيه: لا يمكنك حذف حسابك الذي تسجل به الدخول حالياً ⚠️');
      return;
    }
    if (window.confirm(`هل أنت متأكد تماماً من حذف العضو "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      onDeleteUser(user.id);
    }
  };

  if (isLoading && safeUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black">جاري جلب قائمة الأعضاء...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Modal Add/Edit */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
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
                <input disabled={isSaving} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold shadow-inner" placeholder="الاسم" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الجوال</label>
                <input disabled={isSaving} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-left shadow-inner" dir="ltr" placeholder="01xxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">{isAddModalOpen ? 'كلمة المرور' : 'تغيير كلمة المرور (اختياري)'}</label>
                <input disabled={isSaving} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold shadow-inner" placeholder="••••••••" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">صلاحية الحساب</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                   <button disabled={isSaving} onClick={() => setFormData({...formData, role: 'user'})} className={`py-2.5 rounded-xl font-black text-xs transition-all ${formData.role === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>عميل عادي</button>
                   <button disabled={isSaving} onClick={() => setFormData({...formData, role: 'admin'})} className={`py-2.5 rounded-xl font-black text-xs transition-all ${formData.role === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}>مدير نظام</button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={isAddModalOpen ? handleAddUser : handleUpdateUser} className={`flex-grow py-4 rounded-2xl font-black text-white shadow-xl transition-all ${isAddModalOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}>
                  {isSaving ? 'جاري الحفظ...' : (isAddModalOpen ? 'إضافة العضو الآن' : 'حفظ التعديلات')}
                </button>
                <button disabled={isSaving} onClick={() => {setIsAddModalOpen(false); setEditingUser(null);}} className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-colors">إلغاء</button>
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
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold pr-12 focus:ring-2 focus:ring-emerald-500/20 shadow-inner" 
          />
          <span className="absolute right-4 top-2.5 text-slate-300 text-lg">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <th className="px-8 py-5">العضو</th>
              <th className="px-8 py-5">رقم الموبايل</th>
              <th className="px-8 py-5">الصلاحية</th>
              <th className="px-8 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                <td className="px-8 py-5 font-black text-slate-500 tracking-widest">{u.phone}</td>
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
             <button key={num} onClick={() => { setCurrentPage(num); window.scrollTo({top: 0, behavior: 'smooth'}); }} className={`w-10 h-10 rounded-xl font-black ${currentPage === num ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>{num}</button>
           ))}
        </div>
      )}
    </div>
  );
};

export default MembersTab;