
import React from 'react';
import { BusinessSummary } from '../types';

interface DashboardProps {
  summary: BusinessSummary & { periodProfitEur: number, periodProfitBdt: number };
  timeRange: 'today' | '7days' | '30days' | 'total';
}

const Dashboard: React.FC<DashboardProps> = ({ summary, timeRange }) => {
  const rangeLabels = {
    today: 'আজকের লাভ',
    '7days': 'গত ৭ দিনের লাভ',
    '30days': 'গত ৩০ দিনের লাভ',
    total: 'সর্বমোট লাভ'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Primary Stats - Period Profit Focus */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition bg-gradient-to-br from-white to-green-50/30">
        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
           {rangeLabels[timeRange]} (ইউরো)
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-4xl font-black ${summary.periodProfitEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            €{summary.periodProfitEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-3 text-xs font-bold text-gray-400 border-t pt-2 border-gray-50 flex justify-between items-center">
          <span>৳{summary.periodProfitBdt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          {timeRange === 'total' && summary.totalProfitEur !== summary.periodProfitEur && (
            <span className="text-[9px] uppercase">সব সময়</span>
          )}
          {timeRange !== 'total' && (
            <span className="text-[9px] uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">নির্বাচিত সময়</span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition relative group">
        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">বিকাশ ব্যালেন্স (বিডিটি)</span>
        <div className="mt-2">
          <span className={`text-4xl font-black ${summary.currentBdtBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            ৳{summary.currentBdtBalance.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 text-[10px] font-bold text-gray-400 border-t pt-2 border-gray-50 flex justify-between">
          <span>এজেন্টের কাছে বর্তমান জমা</span>
          {summary.openingBalanceBdt !== 0 && (
             <span className="text-blue-400">শুরু: ৳{summary.openingBalanceBdt.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">গড় কেনা দাম (Rate)</span>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-black text-orange-500">
            ৳{summary.avgBuyingRate.toFixed(2)}
          </span>
          <span className="text-sm font-bold text-gray-400">/€</span>
        </div>
        <div className="mt-3 text-xs font-bold text-gray-400 border-t pt-2 border-gray-50">
          আপনার ইনভেস্টমেন্ট রেট
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">মোট লাভ (EUR)</div>
            <div className="text-lg font-bold text-green-600">€{summary.totalProfitEur.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">মোট ইনভেস্ট (BDT)</div>
            <div className="text-lg font-bold text-gray-700">৳{summary.totalInvestmentBdt.toLocaleString()}</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">আমার কাছে EUR</div>
            <div className="text-lg font-bold text-gray-700">€{summary.currentEurBalance.toLocaleString()}</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">রেমিটেন্স কাউন্টার</div>
            <div className="text-lg font-bold text-blue-600">Active Ledger</div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
