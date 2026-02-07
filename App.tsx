
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, BusinessSummary } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import AIInput from './components/AIInput.tsx';
import ProfitAdvisor from './components/ProfitAdvisor.tsx';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('remittance_ledger_txs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse transactions", e);
      return [];
    }
  });
  
  const [openingBdt, setOpeningBdt] = useState<number>(() => {
    const saved = localStorage.getItem('remittance_opening_bdt');
    return saved ? parseFloat(saved) : 0;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempOpeningBdt, setTempOpeningBdt] = useState(openingBdt.toString());
  const [profitTimeRange, setProfitTimeRange] = useState<'today' | '7days' | '30days' | 'total'>('total');

  useEffect(() => {
    localStorage.setItem('remittance_ledger_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('remittance_opening_bdt', openingBdt.toString());
  }, [openingBdt]);

  // Logic to calculate summary and dynamic profits
  const summary = useMemo(() => {
    let totalInvEur = 0;
    let totalInvBdt = 0;
    let currentBdt = openingBdt;
    let currentEur = 0;
    let totalBuyBdt = 0;
    let totalBuyEur = 0;

    // First pass: Calculate Buying Rate only
    transactions.forEach(tx => {
      if (tx.type === TransactionType.BUY) {
        totalInvEur += tx.eurAmount;
        totalInvBdt += tx.bdtAmount;
        totalBuyBdt += tx.bdtAmount;
        totalBuyEur += tx.eurAmount;
      }
    });

    const avgBuyingRate = totalBuyEur > 0 ? totalBuyBdt / totalBuyEur : 0;

    let totalProfitBdt = 0;
    let totalProfitEur = 0;
    let periodProfitEur = 0;
    let periodProfitBdt = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTimestamp = now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // Second pass: Calculate balances and DYNAMIC profits based on current Buying Rate
    const processedTransactions = transactions.map(tx => {
      let pEur = tx.profitEur;
      let pBdt = tx.profitBdt;

      if (tx.type === TransactionType.BUY) {
        currentBdt += tx.bdtAmount;
        currentEur -= tx.eurAmount;
      } else {
        currentBdt -= tx.bdtAmount;
        currentEur += tx.eurAmount;

        // CRITICAL FIX: Only calculate profit if we have a cost basis (avgBuyingRate > 0)
        if (avgBuyingRate > 0) {
          const costOfBdtInEur = tx.bdtAmount / avgBuyingRate;
          pEur = tx.eurAmount - costOfBdtInEur;
          pBdt = pEur * avgBuyingRate;
        } else {
          // No investment yet, so we don't know the profit. It's 0 until we buy Euro.
          pEur = 0;
          pBdt = 0;
        }

        totalProfitBdt += pBdt;
        totalProfitEur += pEur;

        let isInPeriod = false;
        if (profitTimeRange === 'total') isInPeriod = true;
        else if (profitTimeRange === 'today' && tx.date >= todayTimestamp) isInPeriod = true;
        else if (profitTimeRange === '7days' && (Date.now() - tx.date) <= (7 * oneDay)) isInPeriod = true;
        else if (profitTimeRange === '30days' && (Date.now() - tx.date) <= (30 * oneDay)) isInPeriod = true;

        if (isInPeriod) {
          periodProfitEur += pEur;
          periodProfitBdt += pBdt;
        }
      }
      return { ...tx, profitEur: pEur, profitBdt: pBdt };
    });

    return {
      transactions: processedTransactions,
      summary: {
        totalInvestmentEur: totalInvEur,
        totalInvestmentBdt: totalInvBdt,
        avgBuyingRate,
        totalProfitBdt,
        totalProfitEur,
        currentBdtBalance: currentBdt,
        currentEurBalance: currentEur,
        openingBalanceBdt: openingBdt,
        periodProfitEur,
        periodProfitBdt
      }
    };
  }, [transactions, openingBdt, profitTimeRange]);

  const getMessageText = (tx: Transaction) => {
    return `${tx.customerPhoneNumber || ''} বিকাশ ${Math.round(tx.bdtAmount)} টাকা`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      return false;
    }
  };

  const handleShare = async (tx: Transaction) => {
    const message = getMessageText(tx);
    await copyToClipboard(message);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'date' | 'profitEur' | 'profitBdt'>) => {
    const tx: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
      date: Date.now(),
      profitBdt: 0, // Will be calculated dynamically in useMemo
      profitEur: 0  // Will be calculated dynamically in useMemo
    };

    setTransactions(prev => [tx, ...prev]);
    setIsFormOpen(false);

    if (tx.type === TransactionType.SELL) {
      setTimeout(() => {
        handleShare(tx);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50 font-['Hind_Siliguri']">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">রেমিটেন্স লেজার প্রো</h1>
            <p className="text-blue-100 text-[10px] md:text-xs">ইতালি - বাংলাদেশ কারেন্সি ব্যবসা অ্যাকাউন্ট্যান্ট</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={() => setIsFormOpen(true)} className="hidden md:flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-blue-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              নতুন এন্ট্রি
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">পারফরম্যান্স রিপোর্ট</h2>
                <div className="flex bg-gray-200 p-1 rounded-xl gap-1">
                   {[{id:'today',l:'আজ'},{id:'7days',l:'৭ দিন'},{id:'30days',l:'৩০ দিন'},{id:'total',l:'সব'}].map(r=>(
                     <button key={r.id} onClick={()=>setProfitTimeRange(r.id as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${profitTimeRange===r.id?'bg-white shadow-sm text-blue-600':'text-gray-500'}`}>{r.l}</button>
                   ))}
                </div>
             </div>
             <Dashboard summary={summary.summary} timeRange={profitTimeRange} />
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>লেনদেনের ইতিহাস</h2>
            <TransactionList 
              transactions={summary.transactions} 
              onDelete={(id)=>setTransactions(prev=>prev.filter(t=>t.id!==id))} 
              avgBuyingRate={summary.summary.avgBuyingRate} 
              onShare={handleShare} 
              onCopy={(tx) => copyToClipboard(getMessageText(tx)).then(() => alert('কপি হয়েছে!'))} 
            />
          </div>
        </div>
        <div className="space-y-6"><AIInput onParsed={addTransaction} /><ProfitAdvisor summary={summary.summary} /></div>
      </main>

      <button onClick={()=>setIsFormOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-blue-700 transition-transform active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-gray-800 mb-2 uppercase tracking-tight">প্রারম্ভিক ব্যালেন্স</h3>
            <p className="text-xs text-gray-400 mb-6">এজেন্টের কাছে আপনার আগের জমানো টাকা বা দেনা লিখুন।</p>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
              <input type="number" value={tempOpeningBdt} onChange={(e)=>setTempOpeningBdt(e.target.value)} className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl" />
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setIsSettingsOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">বাতিল</button>
              <button onClick={()=>{setOpeningBdt(parseFloat(tempOpeningBdt)||0);setIsSettingsOpen(false);}} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setIsFormOpen(false)}></div>
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h3 className="font-black text-gray-800 uppercase tracking-wider">নতুন লেনদেন</h3>
              <button onClick={()=>setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6"><TransactionForm onSubmit={addTransaction} avgBuyingRate={summary.summary.avgBuyingRate} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
