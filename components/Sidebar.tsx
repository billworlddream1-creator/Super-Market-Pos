
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Receipt, Settings, LogOut, MessageSquare, Users, BookOpen, Table } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user, onLogout }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'POS', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'PRODUCTS', label: 'Inventory', icon: Package },
    { id: 'RECEIPTS', label: 'Receipts', icon: Receipt },
    { id: 'DEBTORS', label: 'Debtors', icon: BookOpen },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'SHEET', label: 'Spreadsheet', icon: Table },
    { id: 'CHAT', label: 'Community', icon: MessageSquare },
  ];

  if (user.role === 'ADMIN') {
    menuItems.splice(7, 0, { id: 'USERS', label: 'Users', icon: Users });
  }

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          SuperMart AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">POS & Management</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id as ViewState)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <button 
          onClick={() => onChangeView('SETTINGS')}
          className={`flex items-center space-x-3 text-slate-400 hover:text-white transition-colors px-4 py-2 w-full rounded-lg hover:bg-slate-800 ${currentView === 'SETTINGS' ? 'bg-slate-800 text-white' : ''}`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center space-x-3 text-red-400 hover:text-red-300 transition-colors px-4 py-2 w-full rounded-lg hover:bg-red-900/20"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="p-4 bg-slate-800/50 flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner"
          style={{ backgroundColor: user.avatarColor || '#4f46e5' }}
        >
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{user.name}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
