
import React from 'react';
import { Transaction, TransactionType } from '../types.ts';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onShare: (tx: Transaction) => void;
  onCopy: (tx: Transaction) => void;
  avgBuyingRate: number;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onShare, onCopy, avgBuyingRate }) => {
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
              <th className="py-3 px-2 text-left text-[10px] font-bold text-gray-400 uppercase text-green-600">ইউরো লাভ</th>
              <th className="py-3 px-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-blue-50/30 transition group">
                <td className="py-4 px-2 whitespace-nowrap">
                  <div className="text-xs font-bold text-gray-800">{new Date(tx.date).toLocaleDateString('bn-BD')}</div>
                  <div className="text-[9px] text-gray-400 uppercase">{tx.customerPhoneNumber || 'No Phone'}</div>
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
                  {tx.type === TransactionType.BUY ? (
                    <span className="text-[10px] text-gray-200">—</span>
                  ) : (
                    <div className="flex flex-col">
                      <span className={`text-xs font-black ${tx.profitEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.profitEur >= 0 ? '+' : ''}€{tx.profitEur.toFixed(2)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex gap-1 justify-end">
                    {tx.type === TransactionType.SELL && (
                      <>
                        <button title="মেসেজ কপি করুন" onClick={() => onCopy(tx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                        <button title="WhatsApp এ শেয়ার করুন" onClick={() => onShare(tx)} className="p-1.5 text-green-500 hover:bg-green-50 rounded transition">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                      </>
                    )}
                    <button title="ডিলিট করুন" onClick={() => onDelete(tx.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
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
