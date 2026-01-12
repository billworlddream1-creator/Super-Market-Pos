
import React, { useState } from 'react';
import { UserAccount } from '../types';
import { UserPlus, Shield, User as UserIcon, Trash2, Mail, Calendar, Edit3, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UserManagementProps {
  currentUser: UserAccount;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, setUsers }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'STAFF' as 'ADMIN' | 'STAFF' });

  const handleRemove = (id: string) => {
    if (id === currentUser.id) return alert("You cannot remove yourself!");
    if (confirm("Permanently remove this user from the system?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const toggleRole = (id: string) => {
    if (id === currentUser.id) return alert("You cannot demote yourself!");
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, role: u.role === 'ADMIN' ? 'STAFF' : 'ADMIN' };
      }
      return u;
    }));
  };

  const handleAdd = () => {
    if (!newUser.name || !newUser.email) return;
    const colors = ['#4f46e5', '#059669', '#0284c7', '#be123c', '#d97706', '#7c3aed'];
    const user: UserAccount = {
      id: uuidv4(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      bio: 'New staff member.',
      joinDate: Date.now()
    };
    setUsers(prev => [...prev, user]);
    setIsAdding(false);
    setNewUser({ name: '', email: '', role: 'STAFF' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Portal Operators</h2>
          <p className="text-slate-500 font-medium">Control system access and user permissions.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <UserPlus size={20} />
          <span>Add New Operator</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Configure New Account</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">System Role</label>
              <select 
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}
              >
                <option value="STAFF">Staff Operator</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Discard</button>
            <button onClick={handleAdd} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">Initialize Access</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleRemove(u.id)}
                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                title="Remove User"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg"
                style={{ backgroundColor: u.avatarColor || '#4f46e5' }}
              >
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate text-lg">{u.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    u.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail size={16} />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span>Joined {new Date(u.joinDate || Date.now()).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 italic">"{u.bio || 'No bio provided'}"</p>
            </div>

            <div className="pt-4 border-t border-slate-50 flex gap-2">
              <button 
                onClick={() => toggleRole(u.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-colors"
              >
                <Shield size={14} />
                {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold transition-colors">
                <Edit3 size={14} />
                Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
