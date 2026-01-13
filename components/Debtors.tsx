
import React, { useState } from 'react';
import { Debtor, Receipt } from '../types';
import { User, MapPin, Phone, DollarSign, Search, Trash2, CheckCircle, Clock, AlertCircle, Printer, X, FileText } from 'lucide-react';

interface DebtorsProps {
  debtors: Debtor[];
  receipts: Receipt[];
  onClearDebt: (id: string) => void;
  onRemoveDebtor: (id: string) => void;
  currencySymbol: string;
}

const Debtors: React.FC<DebtorsProps> = ({ debtors, receipts, onClearDebt, onRemoveDebtor, currencySymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatement, setSelectedStatement] = useState<{ debtor: Debtor, items: any[] } | null>(null);

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenStatement = (debtor: Debtor) => {
    // Find all pending receipts for this customer name
    const pendingReceipts = receipts.filter(r => 
      r.status === 'PENDING' && 
      r.customerName?.toLowerCase() === debtor.name.toLowerCase()
    );

    // Flatten all items from these receipts
    const allItems = pendingReceipts.flatMap(r => r.items.map(item => ({
      ...item,
      date: new Date(r.timestamp).toLocaleDateString(),
      receiptId: r.id
    })));

    setSelectedStatement({ debtor, items: allItems });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Credit & Debtors</h2>
          <p className="text-slate-500 font-medium mt-1">Manage outstanding balances and customer credit locations.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or location..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredDebtors.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 space-y-4 print:hidden">
          <div className="p-6 bg-slate-50 rounded-full">
            <User size={48} className="opacity-20" />
          </div>
          <p className="font-bold text-lg">No debtors found</p>
          <p className="text-sm text-center max-w-xs">New debtors are automatically added when you settle a POS order as 'Credit'.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {filteredDebtors.map(debtor => (
            <div key={debtor.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                  {debtor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{debtor.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">
                    <Clock size={12} /> Last updated: {new Date(debtor.lastUpdate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <MapPin size={16} className="text-indigo-500" />
                  <span className="font-medium truncate" title={debtor.location}>{debtor.location || 'Unknown Location'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Phone size={16} className="text-indigo-500" />
                  <span className="font-medium">{debtor.phone || 'No Phone Number'}</span>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-slate-50 pt-6 mt-2">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Owed</p>
                  <p className="text-3xl font-black text-red-600 tracking-tighter">{currencySymbol}{debtor.totalOwed.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenStatement(debtor)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"
                    title="Print Statement"
                  >
                    <Printer size={20} />
                  </button>
                  <button 
                    onClick={() => onClearDebt(debtor.id)}
                    className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors"
                    title="Mark as Paid"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => onRemoveDebtor(debtor.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                    title="Remove Account"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {debtor.totalOwed > 100 && (
                <div className="absolute top-0 right-0 p-3">
                  <AlertCircle className="text-amber-500 animate-pulse" size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedStatement && (
        <DebtStatementModal 
          debtor={selectedStatement.debtor} 
          items={selectedStatement.items} 
          onClose={() => setSelectedStatement(null)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};

const DebtStatementModal = ({ debtor, items, onClose, currencySymbol }: { debtor: Debtor, items: any[], onClose: () => void, currencySymbol: string }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-full print:w-full">
        <div className="bg-amber-600 p-6 text-center text-white print:hidden relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
          <FileText className="mx-auto mb-2" size={40} />
          <h3 className="text-2xl font-black uppercase tracking-tight">Credit Statement</h3>
          <p className="text-amber-100 text-xs font-bold mt-1">Outstanding Balance Summary</p>
        </div>

        <div className="p-10 overflow-y-auto flex-1 font-mono text-sm leading-relaxed">
          <div className="text-center mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight">SuperMart AI POS</h2>
            <p className="text-gray-400 text-[10px] mt-1 font-bold italic tracking-widest">OFFICIAL DEBT RECORD</p>
            <div className="mt-6 border-y border-dashed border-gray-200 py-4 flex flex-col gap-1 items-center">
              <p className="text-gray-900 font-black text-lg">{debtor.name}</p>
              <p className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={10} /> {debtor.location}</p>
              <p className="text-gray-500 text-xs flex items-center gap-1"><Phone size={10} /> {debtor.phone}</p>
            </div>
          </div>
          
          <div className="mb-4">
             <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase border-b border-dashed pb-2">
                <span>Item & Date</span>
                <span>Subtotal</span>
             </div>
          </div>

          <div className="space-y-4 mb-8">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 py-4 italic">No pending individual items found.</p>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                     <span className="font-bold">{item.quantity}x {item.name}</span>
                     <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 font-bold uppercase">
                       <span>{item.date}</span>
                       <span>#{item.receiptId}</span>
                     </div>
                  </div>
                  <span className="font-black text-slate-800">{currencySymbol}{item.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t-2 border-slate-900 pt-6">
            <div className="flex justify-between font-black text-2xl tracking-tighter text-red-600">
              <span>TOTAL OWED</span>
              <span>{currencySymbol}{debtor.totalOwed.toFixed(2)}</span>
            </div>
            <div className="pt-8 text-center border-t border-dashed border-gray-200 mt-10">
               <p className="text-[10px] text-gray-400 font-bold mb-6">Report Date: {new Date().toLocaleString()}</p>
               <div className="grid grid-cols-2 gap-8 text-[10px] font-black uppercase">
                  <div className="border-t border-slate-900 pt-2">Customer Sign</div>
                  <div className="border-t border-slate-900 pt-2">Authorized Officer</div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex flex-col gap-3 print:hidden">
          <button 
            onClick={() => window.print()} 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Printer size={20} /> Print Full Statement
          </button>
          <button onClick={onClose} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors">Close View</button>
        </div>
      </div>
    </div>
  );
};

export default Debtors;
