
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface MonthlyReportProps {
  transactions: Transaction[];
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthlyStats = useMemo(() => {
    const filtered = transactions.filter(tx => {
      const date = new Date(tx.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const bdtSent = filtered
      .filter(tx => tx.type === TransactionType.SELL)
      .reduce((sum, tx) => sum + tx.bdtAmount, 0);

    const eurCollected = filtered
      .filter(tx => tx.type === TransactionType.SELL)
      .reduce((sum, tx) => sum + tx.eurAmount, 0);

    const profitEur = filtered
      .filter(tx => tx.type === TransactionType.SELL)
      .reduce((sum, tx) => sum + tx.profitEur, 0);

    const txCount = filtered.filter(tx => tx.type === TransactionType.SELL).length;

    return { bdtSent, eurCollected, profitEur, txCount };
  }, [transactions, selectedMonth, selectedYear]);

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-gray-900 font-black flex items-center gap-2 tracking-tight uppercase text-xs">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          মাসিক হিসাব রিপোর্ট
        </h3>
        <div className="flex gap-2">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 text-[11px] font-bold bg-purple-50 text-purple-600 px-3 py-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-[11px] font-bold bg-purple-50 text-purple-600 px-3 py-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">এ মাসের মোট বিকাশ পাঠানো</span>
          <span className="text-xl font-black text-gray-900">৳{Math.round(monthlyStats.bdtSent).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">সংগৃহীত ইউরো</span>
            <span className="text-xl font-black text-blue-600">€{Math.round(monthlyStats.eurCollected).toLocaleString()}</span>
          </div>
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
            <span className="block text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">নীট লাভ (EUR)</span>
            <span className="text-xl font-black text-green-600">€{Math.round(monthlyStats.profitEur).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">মোট লেনদেন:</span>
          <span className="text-xs font-black text-gray-700">{monthlyStats.txCount} বার</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
