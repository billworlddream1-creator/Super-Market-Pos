
import React from 'react';
import { AppSettings, PaymentMethodConfig } from '../types';
import { THEMES } from '../constants';
import { CreditCard, Banknote, Smartphone, Palette, Shield, Info, Table, Link, Coins } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
    const newMethods = settings.paymentMethods.map(m => m.id === id ? { ...m, ...updates } : m);
    setSettings({ ...settings, paymentMethods: newMethods });
  };

  const changeTheme = (theme: typeof THEMES[0]) => {
    setSettings({ ...settings, themeColor: theme.primary });
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-hover', theme.primary + 'dd');
    document.documentElement.style.setProperty('--bg-color', theme.bg);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-500">Global configurations for your supermarket terminal.</p>
      </div>

      {/* Currency & Region */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
          <Coins className="text-indigo-600" size={20} />
          <h3 className="font-bold text-gray-800">Regional & Currency</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
             <h4 className="font-bold text-slate-800">Operational Currency</h4>
             <p className="text-sm text-slate-500">Select the currency symbol used across the application.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => setSettings({...settings, currency: 'USD'})}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${settings.currency === 'USD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
             >
               Dollar ($)
             </button>
             <button 
               onClick={() => setSettings({...settings, currency: 'NGN'})}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${settings.currency === 'NGN' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}
             >
               Naira (₦)
             </button>
          </div>
        </div>
      </section>

      {/* Google Sheets Integration */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
          <Table className="text-green-600" size={20} />
          <h3 className="font-bold text-gray-800">Google Sheets Records</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-green-50 text-green-800 rounded-xl border border-green-100 mb-4">
            <Link className="flex-shrink-0 mt-1" size={18} />
            <p className="text-xs font-medium leading-relaxed">
              Connect a Google Sheet to automatically record every sold receipt. Use a <strong>Public Sharing Link</strong> or a <strong>Publish to Web</strong> link to enable the direct view within the spreadsheet tab.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Spreadsheet URL</label>
            <input 
              type="text" 
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium"
              value={settings.googleSheetUrl}
              onChange={(e) => setSettings({ ...settings, googleSheetUrl: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
          <CreditCard className="text-indigo-600" size={20} />
          <h3 className="font-bold text-gray-800">Payment Gateway Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">Enable, disable, or rename the payment options shown at checkout.</p>
          {settings.paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {method.type === 'CASH' && <Banknote className="text-green-600" size={20} />}
                  {method.type === 'CARD' && <CreditCard className="text-blue-600" size={20} />}
                  {method.type === 'DIGITAL' && <Smartphone className="text-purple-600" size={20} />}
                </div>
                <input 
                  type="text" 
                  className="font-semibold bg-transparent border-none focus:ring-0 p-0"
                  value={method.label}
                  onChange={(e) => updatePaymentMethod(method.id, { label: e.target.value })}
                />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={method.enabled}
                  onChange={(e) => updatePaymentMethod(method.id, { enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Theme Selection */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
          <Palette className="text-indigo-600" size={20} />
          <h3 className="font-bold text-gray-800">Visual Appearance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => changeTheme(theme)}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                  settings.themeColor === theme.primary ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-full h-12 rounded-lg" style={{ backgroundColor: theme.primary }}></div>
                <span className="font-bold text-sm">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-start gap-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
        <Info className="flex-shrink-0" size={20} />
        <p className="text-sm">These settings are stored locally on this device. Multi-device sync is available on enterprise plans.</p>
      </section>
    </div>
  );
};

export default Settings;
