import React from 'react';
import { Receipt } from '../types';
import { FileText, Clock, User, DollarSign, Download, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ReceiptHistoryProps {
  receipts: Receipt[];
}

const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({ receipts }) => {
  // Sort by newest first
  const sortedReceipts = [...receipts].sort((a, b) => b.timestamp - a.timestamp);

  const handleExportCSV = () => {
    if (receipts.length === 0) return;

    const headers = ['Receipt ID', 'Date', 'Customer', 'Items', 'Total', 'Payment Method', 'Status'];
    const rows = sortedReceipts.map(r => [
      r.id,
      new Date(r.timestamp).toLocaleString().replace(',', ''), // Simple sanitize
      r.customerName || 'Walk-in',
      r.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
      r.totalAmount.toFixed(2),
      r.paymentMethod,
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-tighter">
            <CheckCircle size={12} className="mr-1" />
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-tighter">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-tighter">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Detailed audit trail of all supermarket transactions.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={receipts.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
        >
          <Download size={18} />
          <span>Export Sales CSV</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {sortedReceipts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedReceipts.map(receipt => (
              <div key={receipt.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded text-sm">
                        {receipt.id}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(receipt.timestamp).toLocaleString()}
                      </span>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600 font-medium">
                      <User size={16} className="mr-2 text-gray-400" />
                      {receipt.customerName || 'Walk-in Customer'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900 tracking-tight">${receipt.totalAmount.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">
                      VIA {receipt.paymentMethod}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-all">
                  <div className="flex flex-wrap gap-2">
                    {receipt.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center bg-white px-3 py-1 rounded-lg border border-gray-200 text-xs shadow-sm font-medium">
                        <span className="font-black text-indigo-600 mr-2">{item.quantity}×</span>
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptHistory;