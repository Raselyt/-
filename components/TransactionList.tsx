
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  avgBuyingRate: number;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, avgBuyingRate }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">কোনো লেনদেনের রেকর্ড নেই।</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr>
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase">তারিখ</th>
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase">টাইপ</th>
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase">পরিমাণ</th>
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase">রেট</th>
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase text-green-600">ইউরো লাভ</th>
              <th className="py-3 px-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-blue-50/30 transition group">
                <td className="py-4 px-2 whitespace-nowrap">
                  <div className="text-xs font-bold text-gray-800">{new Date(tx.date).toLocaleDateString('bn-BD')}</div>
                  <div className="text-[9px] text-gray-400 uppercase">{new Date(tx.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="py-4 px-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    tx.type === TransactionType.BUY ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {tx.type === TransactionType.BUY ? 'BUY' : 'SELL'}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <div className="text-xs font-black text-gray-800">€{tx.eurAmount.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-400">৳{tx.bdtAmount.toLocaleString()}</div>
                </td>
                <td className="py-4 px-2">
                  <div className="text-xs font-bold text-gray-700">৳{tx.rate.toFixed(2)}</div>
                </td>
                <td className="py-4 px-2">
                  {tx.type === TransactionType.BUY ? (
                    <span className="text-[10px] text-gray-200">—</span>
                  ) : (
                    <div className="flex flex-col">
                      <span className={`text-xs font-black ${tx.profitEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.profitEur >= 0 ? '+' : ''}€{tx.profitEur.toFixed(2)}
                      </span>
                      {tx.cashOutFee > 0 && (
                        <span className="text-[8px] text-red-400 font-bold leading-none">ফি: ৳{tx.cashOutFee}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-2 text-right">
                  <button 
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
