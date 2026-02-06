
import React from 'react';
import { BusinessSummary } from '../types';

interface DashboardProps {
  summary: BusinessSummary;
}

const Dashboard: React.FC<DashboardProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Primary Stats */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">মোট নিট লাভ (ইউরো)</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-4xl font-black ${summary.totalProfitEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            €{summary.totalProfitEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-3 text-xs font-bold text-gray-400 border-t pt-2 border-gray-50">
          সমপরিমাণ টাকা: ৳{summary.totalProfitBdt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">বিকাশ ব্যালেন্স (বিডিটি)</span>
        <div className="mt-2">
          <span className="text-4xl font-black text-blue-600">
            ৳{summary.currentBdtBalance.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 text-xs font-bold text-gray-400 border-t pt-2 border-gray-50">
          এজেন্টের কাছে জমা টাকা
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
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">মোট ইনভেস্ট (EUR)</div>
            <div className="text-lg font-bold text-gray-700">€{summary.totalInvestmentEur.toLocaleString()}</div>
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
            <div className="text-[9px] text-gray-400 font-black uppercase mb-1">এন্ট্রি সংখ্যা</div>
            <div className="text-lg font-bold text-blue-600">Active Ledger</div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
