
import React from 'react';
import { User } from '../../types';

interface MembersTabProps {
  users: User[];
  adminSearch: string;
  setAdminSearch: (val: string) => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ users, adminSearch, setAdminSearch }) => {
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(adminSearch.toLowerCase()) || u.phone.includes(adminSearch));

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold" />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-8 py-5">الاسم</th>
              <th className="px-8 py-5">رقم الموبايل</th>
              <th className="px-8 py-5">الصلاحية</th>
              <th className="px-8 py-5">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                <td className="px-8 py-5 font-black text-slate-500">{u.phone}</td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {u.role === 'admin' ? 'مدير' : 'عميل'}
                  </span>
                </td>
                <td className="px-8 py-5 text-[10px] text-slate-400 font-bold">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTab;
