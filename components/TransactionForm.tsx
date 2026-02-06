
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';

interface TransactionFormProps {
  onSubmit: (tx: Omit<Transaction, 'id' | 'date' | 'profitEur' | 'profitBdt'>) => void;
  avgBuyingRate: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, avgBuyingRate }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [inputMode, setInputMode] = useState<'EUR' | 'BDT'>('EUR');
  
  // States for inputs
  const [eurInput, setEurInput] = useState(''); // EUR Mode: Total received | BUY Mode: Principal Investment
  const [bdtInput, setBdtInput] = useState(''); 
  const [rate, setRate] = useState('');
  const [cashOutFee, setCashOutFee] = useState(''); // Fee deducted from customer (SELL)
  const [transferFee, setTransferFee] = useState(''); // Cost to send money (BUY)
  const [note, setNote] = useState('');

  // Derived calculation results
  const [calculatedBdt, setCalculatedBdt] = useState<number>(0);
  const [calculatedTotalEur, setCalculatedTotalEur] = useState<number>(0);
  const [netEur, setNetEur] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);

  /**
   * Automatic Fee Slab for Customer Remittance (SELL)
   */
  const getAutoFee = (amount: number): number => {
    if (amount <= 0) return 0;
    if (amount <= 50) return 2;
    if (amount <= 100) return 3;
    if (amount <= 200) return 4;
    if (amount <= 500) return 5;
    if (amount <= 1000) return 7;
    return 10;
  };

  // Main Calculation Engine
  useEffect(() => {
    const r = parseFloat(rate) || 0;

    if (type === TransactionType.SELL) {
      setBonusAmount(0);
      if (inputMode === 'BDT') {
        const bdt = parseFloat(bdtInput) || 0;
        if (bdt > 0 && r > 0) {
          const neededNet = bdt / r;
          const autoFee = getAutoFee(neededNet);
          setCashOutFee(autoFee.toString());
          const total = Math.round(neededNet + autoFee);
          setCalculatedTotalEur(total);
          setNetEur(neededNet);
          setCalculatedBdt(bdt);
        } else {
          setCalculatedTotalEur(0);
          setCalculatedBdt(0);
        }
      } else {
        const total = parseInt(eurInput) || 0;
        if (total > 0 && r > 0) {
          const autoFee = getAutoFee(total);
          setCashOutFee(autoFee.toString());
          const net = total - autoFee;
          setNetEur(net);
          setCalculatedTotalEur(total);
          setCalculatedBdt(net * r);
        } else {
          setCalculatedBdt(0);
          setCalculatedTotalEur(0);
        }
      }
    } else {
      // BUY / INVESTMENT MODE Logic
      const principalEur = parseInt(eurInput) || 0;
      const tFee = parseFloat(transferFee) || 0;
      
      if (principalEur > 0 && r > 0) {
        const baseBdt = principalEur * r;
        const bonus = baseBdt * 0.025; // 2.5% Government Incentive
        setBonusAmount(bonus);
        setCalculatedBdt(baseBdt + bonus);
        setCalculatedTotalEur(principalEur + tFee);
        setNetEur(principalEur);
      } else {
        setCalculatedBdt(0);
        setCalculatedTotalEur(0);
        setBonusAmount(0);
      }
    }
  }, [type, inputMode, bdtInput, eurInput, rate, transferFee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEur = calculatedTotalEur;
    const finalRate = parseFloat(rate);
    if (!finalEur || !finalRate) return;

    onSubmit({
      type,
      eurAmount: finalEur,
      rate: finalRate,
      bdtAmount: calculatedBdt,
      cashOutFee: type === TransactionType.SELL ? (parseFloat(cashOutFee) || 0) : (parseFloat(transferFee) || 0),
      note: note || (type === TransactionType.BUY ? `Investment (+2.5% Bonus)` : `Remittance: ৳${Math.round(calculatedBdt)}`)
    });

    // Reset fields
    setEurInput('');
    setBdtInput('');
    setRate('');
    setCashOutFee('');
    setTransferFee('');
    setNote('');
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      {/* SELL/BUY Toggle */}
      <div className="flex mb-6 bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => { setType(TransactionType.BUY); setEurInput(''); setBdtInput(''); setTransferFee(''); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            type === TransactionType.BUY ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
          }`}
        >
          ইনভেস্ট (Buy)
        </button>
        <button
          onClick={() => { setType(TransactionType.SELL); setEurInput(''); setBdtInput(''); setCashOutFee(''); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            type === TransactionType.SELL ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'
          }`}
        >
          কাস্টমার (Sell)
        </button>
      </div>

      {/* Mode Selector (Sell only) */}
      {type === TransactionType.SELL && (
        <div className="flex mb-5 gap-2 justify-center">
          <button
            onClick={() => { setInputMode('EUR'); setBdtInput(''); }}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
              inputMode === 'EUR' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            ইউরো দিয়ে হিসাব
          </button>
          <button
            onClick={() => { setInputMode('BDT'); setEurInput(''); }}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
              inputMode === 'BDT' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            টাকা দিয়ে হিসাব
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Rate Input */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">
            {type === TransactionType.BUY ? 'ইনভেস্টমেন্ট রেট' : 'কাস্টমার রেট'}
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

        {/* EUR Input */}
        {(type === TransactionType.BUY || (type === TransactionType.SELL && inputMode === 'EUR')) && (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">
              {type === TransactionType.BUY ? 'কত ইউরো ইনভেস্ট করবেন?' : 'কাস্টমার মোট কত ইউরো দিবে?'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
              <input
                type="number"
                required
                value={eurInput}
                onChange={(e) => setEurInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl text-gray-800"
                placeholder="যেমন: ১০০"
              />
            </div>
          </div>
        )}

        {/* BDT Input (Sell BDT Mode only) */}
        {type === TransactionType.SELL && inputMode === 'BDT' && (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">বাংলাদেশে কত টাকা পাঠাবে?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
              <input
                type="number"
                required
                value={bdtInput}
                onChange={(e) => setBdtInput(e.target.value)}
                className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl text-gray-800"
                placeholder="যেমন: ২০০০০"
              />
            </div>
          </div>
        )}

        {/* Fee Fields */}
        {type === TransactionType.SELL ? (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">চার্জ/খরচ (স্বয়ংক্রিয়)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
              <input
                type="number"
                value={cashOutFee}
                readOnly
                className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl font-bold text-red-600 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] bg-red-100 text-red-600 px-2 py-1 rounded font-black uppercase">Auto-Slab</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">পাঠাতে খরচ (EUR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
              <input
                type="number"
                step="any"
                value={transferFee}
                onChange={(e) => setTransferFee(e.target.value)}
                className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl font-bold text-red-500 focus:ring-2 focus:ring-red-300 outline-none transition"
                placeholder="যেমন: ২.৫০"
              />
            </div>
          </div>
        )}

        {/* Result Area */}
        {(calculatedBdt > 0 || calculatedTotalEur > 0) && (
          <div className={`p-6 rounded-3xl transition-all ${type === TransactionType.BUY ? 'bg-gray-900' : 'bg-blue-600'} text-white shadow-2xl space-y-4`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="block text-[10px] font-black uppercase text-white/50 tracking-widest mb-1">বাংলাদেশে জমা হবে</span>
                <span className="text-3xl font-black">৳{Math.round(calculatedBdt).toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black uppercase text-white/50 tracking-widest mb-1">
                  {type === TransactionType.BUY ? 'মোট ইউরো খরচ' : 'মোট ইউরো নিন'}
                </span>
                <div className="text-3xl font-black flex items-center justify-end gap-1">
                  <span className="text-white/40">€</span>
                  <span>{calculatedTotalEur}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-between items-center text-[10px] font-bold text-white/70">
              {type === TransactionType.SELL ? (
                <div className="flex items-center gap-2 italic">
                   <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                   <span>হিসাব: {calculatedTotalEur}€ - {cashOutFee}€ (চার্জ) = {netEur.toFixed(0)}€ নিট পাঠানো</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 italic">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                   <span>২.৫% বোনাস: +৳{Math.round(bonusAmount).toLocaleString()} অ্যাড করা হয়েছে</span>
                </div>
              )}
              <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider font-black text-white">
                রাউন্ড ফিগার
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
            type === TransactionType.BUY ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {type === TransactionType.BUY ? 'ইনভেস্টমেন্ট সেভ করুন' : 'এন্ট্রি সেভ করুন'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
