
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface DailyDetailsProps {
  transactions: Transaction[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DailyDetails: React.FC<DailyDetailsProps> = ({ transactions, selectedDate, onDateChange }) => {
  // Filter transactions for the selected date
  const filteredTxs = transactions.filter(tx => {
    const txDate = new Date(tx.date).toISOString().split('T')[0];
    return txDate === selectedDate;
  });

  // Calculate totals for that specific day
  const dailyBdtSent = filteredTxs
    .filter(tx => tx.type === TransactionType.SELL)
    .reduce((sum, tx) => sum + tx.bdtAmount, 0);

  const dailyEurTaken = filteredTxs
    .filter(tx => tx.type === TransactionType.SELL)
    .reduce((sum, tx) => sum + tx.eurAmount, 0);

  const sellCount = filteredTxs.filter(tx => tx.type === TransactionType.SELL).length;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-900 font-black flex items-center gap-2 tracking-tight uppercase text-xs">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          তারিখ অনুযায়ী রিপোর্ট
        </h3>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer"
        />
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
          <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">মোট পাঠানো হয়েছে (বিকাশ)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-700">৳{Math.round(dailyBdtSent).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
          <span className="block text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">মোট সংগৃহীত ইউরো</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-green-700">€{dailyEurTaken.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">মোট কাস্টমার:</span>
          <span className="text-xs font-black text-gray-700">{sellCount} জন</span>
        </div>
      </div>
    </div>
  );
};

export default DailyDetails;
