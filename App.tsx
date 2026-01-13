
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ProductManager from './components/ProductManager';
import POS from './components/POS';
import Analytics from './components/Analytics';
import ReceiptHistory from './components/ReceiptHistory';
import Debtors from './components/Debtors';
import SpreadsheetView from './components/SpreadsheetView';
import Settings from './components/Settings';
import Auth from './components/Auth';
import Chat from './components/Chat';
import UserManagement from './components/UserManagement';
import { ViewState, Product, Receipt, User, AppSettings, UserAccount, ChatMessage, ChatRoom, Debtor } from './types';
import { INITIAL_PRODUCTS, THEMES, STAFF_SALUTATIONS } from './constants';
import { LayoutDashboard, Menu, X, ArrowUpRight, TrendingUp, Users, ShoppingCart, Globe, MessageSquare, BookOpen, Table } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('portal_users');
    return saved ? JSON.parse(saved) : [
      { id: 'u-1', name: 'System Admin', email: 'admin@supermart.ai', role: 'ADMIN', avatarColor: '#4f46e5', bio: 'Main system administrator.', joinDate: Date.now() },
      { id: 'u-2', name: 'John Cashier', email: 'john@supermart.ai', role: 'STAFF', avatarColor: '#059669', bio: 'Lead cashier since 2023.', joinDate: Date.now() }
    ];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      lowStockThreshold: 10,
      themeColor: '#4f46e5',
      googleSheetUrl: '',
      currency: 'USD',
      paymentMethods: [
        { id: '1', label: 'Cash Payment', enabled: true, type: 'CASH' },
        { id: '2', label: 'Credit/Debit Card', enabled: true, type: 'CARD' },
        { id: '3', label: 'Mobile Transfer', enabled: true, type: 'DIGITAL' }
      ]
    };
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [debtors, setDebtors] = useState<Debtor[]>(() => {
    const saved = localStorage.getItem('debtors');
    return saved ? JSON.parse(saved) : [];
  });

  const currencySymbol = settings.currency === 'NGN' ? '₦' : '$';

  // Apply random theme on login
  useEffect(() => {
    if (user) {
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      setSettings(prev => ({
        ...prev,
        themeColor: randomTheme.primary
      }));
      document.documentElement.style.setProperty('--bg-color', randomTheme.bg);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
    document.documentElement.style.setProperty('--primary-hover', settings.themeColor + 'dd');
  }, [settings.themeColor]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('receipts', JSON.stringify(receipts));
    localStorage.setItem('appSettings', JSON.stringify(settings));
    localStorage.setItem('portal_users', JSON.stringify(registeredUsers));
    localStorage.setItem('chat_messages', JSON.stringify(messages));
    localStorage.setItem('debtors', JSON.stringify(debtors));
  }, [products, receipts, settings, registeredUsers, messages, debtors]);

  const handleRegister = (newUser: UserAccount) => {
    setRegisteredUsers(prev => [...prev, newUser]);
  };

  const syncToSheet = async (receipt: Receipt) => {
    // Simulated sheet registration - in a real app this would call a backend or Google API
    console.log(`Syncing receipt ${receipt.id} to Google Sheet ${settings.googleSheetUrl}`);
  };

  const handleSaleComplete = (newReceipt: Receipt) => {
    setReceipts(prev => [...prev, newReceipt]);
    
    // Register Debtor if PENDING
    if (newReceipt.status === 'PENDING' && newReceipt.customerName) {
      setDebtors(prev => {
        const existing = prev.find(d => d.name.toLowerCase() === newReceipt.customerName?.toLowerCase());
        if (existing) {
          return prev.map(d => d.id === existing.id ? { 
            ...d, 
            totalOwed: d.totalOwed + newReceipt.totalAmount,
            lastUpdate: Date.now()
          } : d);
        } else {
          return [...prev, {
            id: uuidv4(),
            name: newReceipt.customerName!,
            location: newReceipt.customerLocation || 'Unknown',
            phone: newReceipt.customerPhone || 'N/A',
            totalOwed: newReceipt.totalAmount,
            lastUpdate: Date.now()
          }];
        }
      });
    }

    // Register products and sales for records
    setProducts(prevProducts => {
      const updated = [...prevProducts];
      newReceipt.items.forEach(soldItem => {
        const productIndex = updated.findIndex(p => p.id === soldItem.productId);
        if (productIndex !== -1) {
          updated[productIndex] = {
            ...updated[productIndex],
            stock: Math.max(0, updated[productIndex].stock - soldItem.quantity)
          };
        }
      });
      return updated;
    });

    // Sync to Google Sheet if configured
    if (settings.googleSheetUrl) {
      syncToSheet(newReceipt);
    }
  };

  const handleReceiptCancel = (receiptId: string) => {
    const receiptToCancel = receipts.find(r => r.id === receiptId);
    if (!receiptToCancel || receiptToCancel.status === 'CANCELLED') return;

    if (!confirm("Are you sure you want to cancel this receipt? Stock will be restored.")) return;

    // 1. Mark Receipt as Cancelled
    setReceipts(prev => prev.map(r => r.id === receiptId ? { ...r, status: 'CANCELLED' } : r));

    // 2. Restore Stock
    setProducts(prevProducts => {
      const updated = [...prevProducts];
      receiptToCancel.items.forEach(item => {
        const productIndex = updated.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updated[productIndex] = {
            ...updated[productIndex],
            stock: updated[productIndex].stock + item.quantity
          };
        }
      });
      return updated;
    });

    // 3. If it was a credit sale (PENDING), reduce debtor amount
    if (receiptToCancel.status === 'PENDING' && receiptToCancel.customerName) {
      setDebtors(prev => prev.map(d => {
        if (d.name.toLowerCase() === receiptToCancel.customerName?.toLowerCase()) {
          return {
            ...d,
            totalOwed: Math.max(0, d.totalOwed - receiptToCancel.totalAmount),
            lastUpdate: Date.now()
          };
        }
        return d;
      }));
    }
  };

  const handleClearDebt = (id: string) => {
    const debtor = debtors.find(d => d.id === id);
    if (!debtor) return;

    // Optional: Mark all pending receipts for this user as PAID
    setReceipts(prev => prev.map(r => {
      if (r.status === 'PENDING' && r.customerName?.toLowerCase() === debtor.name.toLowerCase()) {
        return { ...r, status: 'PAID' };
      }
      return r;
    }));

    setDebtors(prev => prev.map(d => d.id === id ? { ...d, totalOwed: 0, lastUpdate: Date.now() } : d));
  };

  const handleRemoveDebtor = (id: string) => {
    if (confirm("Permanently remove this customer record?")) {
      setDebtors(prev => prev.filter(d => d.id !== id));
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'POS':
        return (
          <POS 
            products={products} 
            onCompleteSale={handleSaleComplete} 
            paymentMethods={settings.paymentMethods} 
            currencySymbol={currencySymbol} 
            currency={settings.currency}
            onCurrencyChange={(c) => setSettings({...settings, currency: c})}
          />
        );
      case 'PRODUCTS':
        return (
          <ProductManager 
            products={products} 
            setProducts={setProducts} 
            lowStockThreshold={settings.lowStockThreshold}
            setLowStockThreshold={(v) => setSettings({...settings, lowStockThreshold: v})}
            currencySymbol={currencySymbol}
          />
        );
      case 'ANALYTICS':
        return <Analytics receipts={receipts} currencySymbol={currencySymbol} />;
      case 'RECEIPTS':
        return <ReceiptHistory receipts={receipts} onCancelReceipt={handleReceiptCancel} currencySymbol={currencySymbol} />;
      case 'DEBTORS':
        return <Debtors debtors={debtors} receipts={receipts} onClearDebt={handleClearDebt} onRemoveDebtor={handleRemoveDebtor} currencySymbol={currencySymbol} />;
      case 'SHEET':
        return <SpreadsheetView sheetUrl={settings.googleSheetUrl} />;
      case 'SETTINGS':
        return <Settings settings={settings} setSettings={setSettings} />;
      case 'CHAT':
        return <Chat currentUser={user!} users={registeredUsers} messages={messages} onSendMessage={(m) => setMessages(prev => [...prev, m])} />;
      case 'USERS':
        return <UserManagement currentUser={user!} users={registeredUsers} setUsers={setRegisteredUsers} />;
      case 'DASHBOARD':
      default:
        return (
          <DashboardOverview 
            onChangeView={(view) => { setCurrentView(view); }} 
            products={products} 
            receipts={receipts} 
            lowStockThreshold={settings.lowStockThreshold}
            user={user!}
            portalUserCount={registeredUsers.length}
            messageCount={messages.length}
            debtorCount={debtors.filter(d => d.totalOwed > 0).length}
            currencySymbol={currencySymbol}
          />
        );
    }
  };

  if (!user) {
    return <Auth onLogin={setUser} onRegister={handleRegister} existingUsers={registeredUsers} />;
  }

  return (
    <div className="flex h-screen overflow-hidden relative selection:bg-indigo-100">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <Sidebar 
          currentView={currentView} 
          onChangeView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }} 
          user={user}
          onLogout={() => setUser(null)}
        />
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white md:hidden">
          <X size={24} />
        </button>
      </div>

      <main className="flex-1 h-screen flex flex-col overflow-hidden relative w-full">
         <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between z-30 shadow-sm print:hidden">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors">
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                {currentView === 'DASHBOARD' && 'Operation Hub'}
                {currentView === 'POS' && 'Sales Terminal'}
                {currentView === 'PRODUCTS' && 'Inventory Control'}
                {currentView === 'ANALYTICS' && 'Market Analytics'}
                {currentView === 'RECEIPTS' && 'Audit Logs'}
                {currentView === 'SETTINGS' && 'System Preferences'}
                {currentView === 'CHAT' && 'Staff Community'}
                {currentView === 'USERS' && 'User Management'}
                {currentView === 'DEBTORS' && 'Customer Credit'}
                {currentView === 'SHEET' && 'Live Spreadsheet'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Global Instance</span>
                <span className="text-[10px] text-gray-400 font-mono">STATUS: OPTIMAL</span>
              </div>
              <div 
                className="h-10 w-10 border-2 rounded-xl flex items-center justify-center font-black shadow-sm ring-2 ring-white text-white"
                style={{ backgroundColor: user.avatarColor || 'var(--primary-color)' }}
              >
                {user.name.charAt(0)}
              </div>
            </div>
         </div>

         <div className="flex-1 overflow-auto relative bg-[var(--bg-color)]">
            {renderView()}
         </div>
      </main>
    </div>
  );
};

const DashboardOverview: React.FC<{ 
  onChangeView: (view: ViewState) => void,
  products: Product[],
  receipts: Receipt[],
  lowStockThreshold: number,
  user: User,
  portalUserCount: number,
  messageCount: number,
  debtorCount: number,
  currencySymbol: string
}> = ({ onChangeView, products, receipts, lowStockThreshold, user, portalUserCount, messageCount, debtorCount, currencySymbol }) => {
  const totalSales = receipts.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.totalAmount, 0);
  const lowStockItems = products.filter(p => p.stock <= lowStockThreshold);
  const salutation = useMemo(() => STAFF_SALUTATIONS[Math.floor(Math.random() * STAFF_SALUTATIONS.length)], []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-top duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-lg text-gray-500 mt-2 font-medium flex items-center gap-2">
            <span className="text-indigo-600 font-bold italic">"{salutation}"</span>
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Portal Users</p>
              <p className="text-2xl font-black text-gray-900">{portalUserCount}</p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => onChangeView('POS')}
          className="group bg-[var(--primary-color)] rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 cursor-pointer transform hover:scale-[1.02] active:scale-95 transition-all flex flex-col justify-between h-56"
        >
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <ShoppingCart size={32} />
            </div>
            <ArrowUpRight size={24} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="text-2xl font-black mb-1">POS Checkout</h3>
            <p className="text-white/80 text-sm font-medium">Terminal initialized & ready</p>
          </div>
        </div>

        <div 
          onClick={() => onChangeView('DEBTORS')}
          className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-56 group hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className={`p-4 rounded-2xl ${debtorCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <BookOpen size={32} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Debtors</p>
            <h3 className="text-3xl font-black text-gray-900">{debtorCount}</h3>
            <p className="text-amber-600 text-xs font-bold mt-2">Manage customer credit</p>
          </div>
        </div>

        <div 
          onClick={() => onChangeView('PRODUCTS')}
          className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm cursor-pointer hover:border-red-200 transition-all flex flex-col justify-between h-56"
        >
          <div className="flex justify-between items-start">
            <div className={`p-4 rounded-2xl ${lowStockItems.length > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
              <LayoutDashboard size={32} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Inventory Alert</p>
            <h3 className={`text-3xl font-black ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {lowStockItems.length} <span className="text-sm text-gray-400 font-bold">REORDER</span>
            </h3>
          </div>
        </div>

        <div 
          onClick={() => onChangeView('SHEET')}
          className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl cursor-pointer hover:bg-slate-800 transition-all flex flex-col justify-between h-56"
        >
          <div className="flex justify-between items-start">
            <div className="bg-green-500/20 p-4 rounded-2xl text-green-400">
              <Table size={32} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-1">Records</h3>
            <p className="text-xs text-slate-400 font-medium">Synced to Google Sheets</p>
            <p className="text-2xl font-bold text-white tracking-tight mt-2">{currencySymbol}{totalSales.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
