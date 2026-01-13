
import React, { useState, useMemo } from 'react';
import { Receipt, SalesSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, ShoppingBag, CreditCard, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity, Receipt as ReceiptIcon } from 'lucide-react';

interface AnalyticsProps {
  receipts: Receipt[];
  currencySymbol: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ receipts, currencySymbol }) => {
  const [timeRange, setTimeRange] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');

  // Filter out cancelled receipts for valid analytics
  const validReceipts = useMemo(() => receipts.filter(r => r.status !== 'CANCELLED'), [receipts]);
  const paidReceipts = useMemo(() => validReceipts.filter(r => r.status === 'PAID'), [validReceipts]);

  // Calculations
  const periodData = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = dayStart - (now.getDay() * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    const getRevenue = (start: number) => paidReceipts.filter(r => r.timestamp >= start).reduce((sum, r) => sum + r.totalAmount, 0);
    const getCount = (start: number) => validReceipts.filter(r => r.timestamp >= start).length;

    return {
      revenue: {
        day: getRevenue(dayStart),
        week: getRevenue(weekStart),
        month: getRevenue(monthStart),
        year: getRevenue(yearStart),
      },
      count: {
        day: getCount(dayStart),
        week: getCount(weekStart),
        month: getCount(monthStart),
        year: getCount(yearStart),
      }
    };
  }, [paidReceipts, validReceipts]);

  const summary: SalesSummary = useMemo(() => {
    return {
      totalRevenue: paidReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
      totalItemsSold: paidReceipts.reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + i.quantity, 0), 0),
      totalTransactions: paidReceipts.length,
      totalUsers: 0, 
      periodRevenue: periodData.revenue,
      periodCounts: periodData.count
    };
  }, [paidReceipts, periodData]);

  // Grouped Chart Data
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    
    paidReceipts.forEach(r => {
      const date = new Date(r.timestamp);
      let key = '';

      if (timeRange === 'DAY') {
        key = date.getHours() + ':00';
      } else if (timeRange === 'WEEK') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeRange === 'MONTH') {
        key = date.getDate().toString();
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      }

      data[key] = (data[key] || 0) + r.totalAmount;
    });

    return Object.keys(data).map(key => ({
      name: key,
      sales: data[key]
    }));
  }, [paidReceipts, timeRange]);

  // Payment Status Distribution
  const statusData = useMemo(() => {
    return [
      { name: 'Paid', value: receipts.filter(r => r.status === 'PAID').length, color: '#4f46e5' },
      { name: 'Pending', value: receipts.filter(r => r.status === 'PENDING').length, color: '#f59e0b' },
      { name: 'Cancelled', value: receipts.filter(r => r.status === 'CANCELLED').length, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [receipts]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 font-bold uppercase tracking-[0.2em] text-xs mb-2">
             <Activity size={16} /> Financial Pulse
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Business Intelligence</h2>
          <p className="text-gray-500 font-medium mt-1">Granular breakdown of your store's fiscal health.</p>
        </div>
        <div className="bg-white p-1.5 rounded-2xl border shadow-sm flex space-x-1">
          {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                timeRange === range 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Periods */}
      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><DollarSign size={20} className="text-indigo-500"/> Revenue Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RevenueCard label="Today's Intake" amount={summary.periodRevenue.day} period="24h" trend="+12.5%" symbol={currencySymbol} />
        <RevenueCard label="This Week" amount={summary.periodRevenue.week} period="7d" trend="+8.2%" symbol={currencySymbol} />
        <RevenueCard label="Monthly Goal" amount={summary.periodRevenue.month} period="30d" trend="+15.1%" symbol={currencySymbol} />
        <RevenueCard label="Annual Yield" amount={summary.periodRevenue.year} period="365d" trend="+22.4%" symbol={currencySymbol} />
      </div>

      {/* Receipt Count Periods */}
      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mt-8"><ReceiptIcon size={20} className="text-blue-500"/> Transaction Volume (Receipts Printed)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CountCard label="Today" count={summary.periodCounts.day} period="24h" />
        <CountCard label="This Week" count={summary.periodCounts.week} period="7d" />
        <CountCard label="This Month" count={summary.periodCounts.month} period="30d" />
        <CountCard label="This Year" count={summary.periodCounts.year} period="365d" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Main Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <Calendar className="text-indigo-600" size={24} />
              Revenue Dynamics
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Feed</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} tickFormatter={(value) => `${currencySymbol}${value}`} />
                <Tooltip 
                  cursor={{fill: '#f9fafb', radius: 8}}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '1rem'}}
                  formatter={(value: any) => [`${currencySymbol}${value}`, 'Revenue']}
                />
                <Bar dataKey="sales" fill="#4F46E5" radius={[12, 12, 12, 12]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Distribution */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
           <h3 className="text-xl font-black text-gray-900 self-start mb-8">Order Status</h3>
           <div className="h-64 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={10}
                   dataKey="value"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '12px'}} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-black text-gray-900">{receipts.length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
             </div>
           </div>
           <div className="w-full mt-4 space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-sm font-bold text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{item.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const RevenueCard = ({ label, amount, period, trend, symbol }: any) => {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <DollarSign size={24} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{symbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
        <span className="text-xs font-bold text-gray-400">/{period}</span>
      </div>
    </div>
  );
};

const CountCard = ({ label, count, period }: any) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <ReceiptIcon size={24} />
        </div>
      </div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{count}</h4>
        <span className="text-xs font-bold text-gray-400">receipts</span>
      </div>
    </div>
  );
};

export default Analytics;
