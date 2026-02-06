
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';

interface TransactionFormProps {
  onSubmit: (tx: Omit<Transaction, 'id' | 'date' | 'profitEur' | 'profitBdt'>) => void;
  avgBuyingRate: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, avgBuyingRate }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [eurAmount, setEurAmount] = useState('');
  const [rate, setRate] = useState('');
  const [transferFee, setTransferFee] = useState(''); // Extra EUR cost for Buy
  const [useBonus, setUseBonus] = useState(true); // 2.5% incentive
  const [cashOutFee, setCashOutFee] = useState(''); // EUR Deduction for Sell (User's request)
  const [note, setNote] = useState('');

  const [previewBdt, setPreviewBdt] = useState<number>(0);
  const [previewTotalEur, setPreviewTotalEur] = useState<number>(0);

  // Auto-calculate fee logic based on user's table
  const getAutoFee = (amount: number): string => {
    if (amount <= 0) return '';
    if (amount <= 100) return '3';
    if (amount <= 300) return '5';
    if (amount <= 500) return '7';
    if (amount <= 1000) return '10';
    return '10'; // Default for > 1000 or as per last slab
  };

  // Update auto-fee when eurAmount changes in SELL mode
  useEffect(() => {
    if (type === TransactionType.SELL) {
      const eur = parseFloat(eurAmount) || 0;
      if (eur > 0) {
        setCashOutFee(getAutoFee(eur));
      } else {
        setCashOutFee('');
      }
    }
  }, [eurAmount, type]);

  useEffect(() => {
    const eur = parseFloat(eurAmount) || 0;
    const r = parseFloat(rate) || 0;
    const feeEur = parseFloat(type === TransactionType.BUY ? transferFee : cashOutFee) || 0;
    
    if (type === TransactionType.BUY) {
      const baseBdt = eur * r;
      const bonus = useBonus ? baseBdt * 0.025 : 0;
      setPreviewBdt(baseBdt + bonus);
      setPreviewTotalEur(eur + feeEur);
    } else {
      // Logic for Sell: (EUR - Fee EUR) * Rate
      const netEur = eur - feeEur;
      setPreviewBdt(netEur * r);
      setPreviewTotalEur(eur); // Still took full eur from customer
    }
  }, [eurAmount, rate, transferFee, useBonus, cashOutFee, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eurAmount || !rate) return;

    onSubmit({
      type,
      eurAmount: previewTotalEur,
      rate: parseFloat(rate),
      bdtAmount: previewBdt,
      cashOutFee: parseFloat(cashOutFee) || 0,
      note: note || (type === TransactionType.BUY ? `Investment` : `Sent to customer (Fee: ${cashOutFee}€)`)
    });

    setEurAmount('');
    setRate('');
    setTransferFee('');
    setCashOutFee('');
    setNote('');
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex mb-6 bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setType(TransactionType.BUY)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            type === TransactionType.BUY ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
          }`}
        >
          ইনভেস্ট (Buy)
        </button>
        <button
          onClick={() => setType(TransactionType.SELL)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            type === TransactionType.SELL ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'
          }`}
        >
          কাস্টমার (Sell)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">
            {type === TransactionType.BUY ? 'কত ইউরো পাঠিয়েছেন?' : 'কাস্টমার থেকে নেওয়া ইউরো'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
            <input
              type="number"
              step="any"
              required
              value={eurAmount}
              onChange={(e) => setEurAmount(e.target.value)}
              className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl text-gray-800"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">
            {type === TransactionType.BUY ? 'এক্সচেঞ্জ রেট (টাকা)' : 'কাস্টমারকে দেওয়া রেট'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
            <input
              type="number"
              step="any"
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl text-orange-600"
              placeholder="0.00"
            />
          </div>
        </div>

        {type === TransactionType.SELL && (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">চার্জ/খরচ (ইউরো)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
              <input
                type="number"
                step="any"
                value={cashOutFee}
                onChange={(e) => setCashOutFee(e.target.value)}
                className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition font-bold text-red-600"
                placeholder="যেমন: ৩"
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400 font-medium italic">* স্ল্যাব অনুযায়ী অটোমেটিক হিসাব করা হয়েছে। চাইলে এডিট করতে পারেন।</p>
          </div>
        )}

        {type === TransactionType.BUY && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">ট্রান্সফার ফি (ইউরো)</label>
              <input
                type="number"
                step="any"
                value={transferFee}
                onChange={(e) => setTransferFee(e.target.value)}
                className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold"
                placeholder="যেমন: ৭"
              />
            </div>
            <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer border border-blue-100">
              <input 
                type="checkbox" 
                checked={useBonus} 
                onChange={e => setUseBonus(e.target.checked)}
                className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-blue-700">২.৫% বোনাস যোগ করুন</span>
            </label>
          </div>
        )}

        {previewBdt > 0 && (
          <div className={`p-5 rounded-2xl transition-all ${type === TransactionType.BUY ? 'bg-gray-900' : 'bg-blue-600'} text-white shadow-xl`}>
            <div className="flex justify-between text-[10px] font-black uppercase text-white/60 mb-1 tracking-tighter">
              <span>{type === TransactionType.BUY ? 'মোট বিডিটি পাবেন (বোনাসসহ)' : 'সবশেষে কাস্টমার পাবে (বিডিটি)'}</span>
              <span>{type === TransactionType.BUY ? 'মোট খরচ (EUR)' : ''}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black">৳{previewBdt.toLocaleString()}</span>
              {type === TransactionType.BUY && (
                <span className="text-lg font-bold text-blue-300">€{previewTotalEur}</span>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            type === TransactionType.BUY ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {type === TransactionType.BUY ? 'ইনভেস্টমেন্ট সেভ' : 'এন্ট্রি সেভ করুন'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
