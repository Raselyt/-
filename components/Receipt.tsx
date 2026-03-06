
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  businessName: string;
  userEmail: string;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction, businessName, userEmail }) => {
  const date = new Date(transaction.date).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div id={`receipt-${transaction.id}`} className="bg-white p-8 w-[400px] border border-gray-200 shadow-lg font-sans">
      <div className="text-center border-b-2 border-gray-100 pb-4 mb-6">
        <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tight">{businessName}</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{userEmail}</p>
        <div className="mt-2 inline-block bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
          ডিজিটাল মানি রিসিট
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">তারিখ:</span>
          <span className="text-gray-800 font-black">{date}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">লেনদেনের ধরন:</span>
          <span className={`font-black uppercase ${transaction.type === TransactionType.BUY ? 'text-orange-500' : 'text-green-600'}`}>
            {transaction.type === TransactionType.BUY ? 'ইনভেস্টমেন্ট (BUY)' : 'রেমিটেন্স (SELL)'}
          </span>
        </div>

        {transaction.customerPhoneNumber && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">ফোন নাম্বার:</span>
            <span className="text-gray-800 font-black">{transaction.customerPhoneNumber}</span>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">পরিমাণ (ইউরো):</span>
            <span className="text-xl font-black text-gray-800">€{transaction.eurAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">রেট (প্রতি ইউরো):</span>
            <span className="text-xl font-black text-orange-500">৳{transaction.rate.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট টাকা (বিডিটি):</span>
            <span className="text-2xl font-black text-blue-600">৳{Math.round(transaction.bdtAmount).toLocaleString()}</span>
          </div>
        </div>

        {transaction.note && (
          <div className="text-[10px] text-gray-400 italic text-center mt-4">
            * নোট: {transaction.note}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ</p>
        <div className="mt-4 flex justify-center">
          <div className="w-12 h-1 bg-blue-600 rounded-full opacity-20"></div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
