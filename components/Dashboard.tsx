
import React from 'react';
import { BusinessSummary, Transaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  summary: BusinessSummary & { periodProfitEur: number, periodProfitBdt: number };
  timeRange: 'today' | '7days' | '30days' | 'total';
  onOpenSettings: () => void;
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ summary, timeRange, onOpenSettings, transactions }) => {
  const rangeLabels = {
    today: 'আজকের লাভ',
    '7days': 'গত ৭ দিনের লাভ',
    '30days': 'গত ৩০ দিনের লাভ',
    total: 'সর্বমোট লাভ'
  };

  const isBdtNegative = summary.currentBdtBalance < 0;

  // Prepare chart data
  const chartData = transactions
    .slice(0, 15)
    .reverse()
    .map(tx => ({
      date: new Date(tx.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
      profit: Math.round(tx.profitEur)
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Profit Card */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50/20 group">
          <div>
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:text-green-600 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {rangeLabels[timeRange]} (ইউরো)
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-5xl font-black tracking-tighter ${summary.periodProfitEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                €{Math.round(summary.periodProfitEur).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500">৳{Math.round(summary.periodProfitBdt).toLocaleString()}</span>
            <span className="text-[9px] font-black uppercase bg-green-50 text-green-700 px-3 py-1 rounded-full shadow-inner">নির্বাচিত লাভ</span>
          </div>
        </div>

        {/* BDT Balance Card (Debt/Surplus) */}
        <div className={`p-8 rounded-[32px] shadow-sm border flex flex-col justify-between hover:shadow-lg transition-all duration-300 group ${isBdtNegative ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-100'}`}>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isBdtNegative ? 'text-red-400' : 'text-gray-400 group-hover:text-blue-600'}`}>
              বিকাশ ব্যালেন্স (বিডিটি)
            </span>
            <div className="mt-3">
              <span className={`text-5xl font-black tracking-tighter ${isBdtNegative ? 'text-red-500' : 'text-blue-600'}`}>
                ৳{Math.round(summary.currentBdtBalance).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className={`text-[10px] font-bold uppercase ${isBdtNegative ? 'text-red-400' : 'text-gray-400'}`}>
              {isBdtNegative ? 'এজেন্ট আপনার কাছে পাবে' : 'এজেন্টের কাছে বর্তমান জমা'}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isBdtNegative ? 'text-red-300' : 'text-blue-300'}`}>
              শুরু: ৳{Math.round(summary.openingBalanceBdt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* EUR Cash Balance Card */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border-4 border-orange-100/30 flex flex-col justify-between hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest group-hover:text-orange-500 transition-colors">আমার কাছে EUR (ক্যাশ)</span>
              <button onClick={onOpenSettings} className="p-1.5 rounded-full hover:bg-orange-50 text-orange-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.443.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
              </button>
            </div>
            <div className="mt-3">
              <span className={`text-5xl font-black tracking-tighter ${summary.currentEurBalance >= 0 ? 'text-orange-500' : 'text-red-500'}`}>
                €{Math.round(summary.currentEurBalance).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">বর্তমান পকেট ক্যাশ</span>
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">ওপেনিং: €{Math.round(summary.openingBalanceEur).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            লাভের ট্রেন্ড (ইউরো)
          </h3>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white px-6 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">মোট লাভ (EUR)</span>
          <span className="text-xl font-black text-green-600">€{Math.round(summary.totalProfitEur).toLocaleString()}</span>
        </div>
        <div className="bg-white px-6 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{timeRange === 'total' ? 'মোট ইনভেস্ট (BDT)' : 'নির্বাচিত ইনভেস্ট (BDT)'}</span>
          <span className="text-xl font-black text-gray-700">৳{Math.round(summary.totalInvestmentBdt).toLocaleString()}</span>
        </div>
        <div className="bg-white px-6 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">হাতে থাকা সংগৃহীত ইউরো</span>
          <span className={`text-xl font-black ${summary.totalCustomerEur >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            €{Math.round(summary.totalCustomerEur).toLocaleString()}
          </span>
        </div>
        <div className="bg-white px-6 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{timeRange === 'total' ? 'গড় কেনা রেট' : 'নির্বাচিত গড় রেট'}</span>
          <span className="text-xl font-black text-orange-500">৳{summary.avgBuyingRate.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
