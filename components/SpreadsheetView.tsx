
import React from 'react';
import { ExternalLink, Info, Table, AlertCircle } from 'lucide-react';

interface SpreadsheetViewProps {
  sheetUrl: string;
}

const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ sheetUrl }) => {
  // Convert typical Google Sheet URL to embed URL if possible
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      // Basic detection for standard Google Sheet link
      if (url.includes('docs.google.com/spreadsheets')) {
        const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/edit?usp=sharing&widget=true&headers=false`;
        }
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(sheetUrl);

  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Table className="text-indigo-600" /> Google Sheets Records
          </h2>
          <p className="text-slate-500 font-medium">Real-time backup of inventory and sales data.</p>
        </div>
        {sheetUrl && (
          <a 
            href={sheetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <ExternalLink size={18} />
            Open Full Sheet
          </a>
        )}
      </div>

      {!sheetUrl ? (
        <div className="flex-1 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="p-6 bg-slate-50 rounded-full">
            <Table size={48} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-400">No Spreadsheet Connected</h3>
          <p className="text-slate-500 max-w-sm">
            Configure your Google Sheet URL in the <strong>Settings</strong> panel to embed your records directly in this terminal.
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden relative group">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none"
            title="Google Sheets Records"
            loading="lazy"
          ></iframe>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-2">
              <Info size={12} /> Syncing Active
            </div>
          </div>
        </div>
      )}
      
      {sheetUrl && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Every transaction is automatically queued for export. If the sheet does not update immediately, check your Google Apps Script configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetView;
