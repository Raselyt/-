import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, BusinessSummary, User } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import AIInput from './components/AIInput.tsx';
import ProfitAdvisor from './components/ProfitAdvisor.tsx';
import Auth from './components/Auth.tsx';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingBdt, setOpeningBdt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempOpeningBdt, setTempOpeningBdt] = useState('0');
  const [profitTimeRange, setProfitTimeRange] = useState<'today' | '7days' | '30days' | 'total'>('total');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email! });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email! });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    
    try {
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txs || []);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('opening_bdt')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
         throw profileError;
      }
      
      const opening = profile?.opening_bdt || 0;
      setOpeningBdt(opening);
      setTempOpeningBdt(opening.toString());
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    let currentBdt = openingBdt;
    let currentEur = 0;
    let totalBuyBdt = 0;
    let totalBuyEur = 0;
    let totalProfitBdt = 0;
    let totalProfitEur = 0;
    let periodProfitEur = 0;
    let periodProfitBdt = 0;

    const buyTxs = transactions.filter(tx => tx.type === TransactionType.BUY);
    buyTxs.forEach(tx => {
      totalBuyBdt += tx.bdtAmount;
      totalBuyEur += tx.eurAmount;
    });

    const avgBuyingRate = totalBuyEur > 0 ? totalBuyBdt / totalBuyEur : 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTimestamp = now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const processedTransactions = transactions.map(tx => {
      let pEur = 0;
      let pBdt = 0;

      if (tx.type === TransactionType.BUY) {
        currentBdt += tx.bdtAmount;
        currentEur -= tx.eurAmount;
      } else {
        currentBdt -= tx.bdtAmount;
        currentEur += tx.eurAmount;

        if (avgBuyingRate > 0) {
          const costOfBdtInEur = tx.bdtAmount / avgBuyingRate;
          pEur = tx.eurAmount - costOfBdtInEur;
          pBdt = pEur * avgBuyingRate;
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
        totalInvestmentEur: totalBuyEur,
        totalInvestmentBdt: totalBuyBdt,
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

  const handleLogout = async () => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?')) {
      await supabase.auth.signOut();
      setCurrentUser(null);
    }
  };

  const handleUpdateOpeningBdt = async () => {
    if (!currentUser) return;
    const val = parseFloat(tempOpeningBdt);
    
    if (isNaN(val)) {
      alert('দয়া করে সঠিক সংখ্যা লিখুন।');
      return;
    }
    
    try {
      // Robust update/upsert logic
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: currentUser.id, 
          opening_bdt: val,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      
      setOpeningBdt(val);
      setIsSettingsOpen(false);
      alert('সফলভাবে আপডেট হয়েছে!');
    } catch (error: any) {
      console.error('Update Error Details:', error);
      alert(`ব্যালেন্স আপডেট করতে সমস্যা হয়েছে।\n\nকারন: ${error.message || 'ডাটাবেস কানেকশন সমস্যা'}`);
    }
  };

  const addTransaction = async (newTx: Omit<Transaction, 'id' | 'userId' | 'date' | 'profitEur' | 'profitBdt'>) => {
    if (!currentUser) return;

    const txToSave = {
      user_id: currentUser.id,
      date: Date.now(),
      type: newTx.type,
      eur_amount: newTx.eurAmount,
      bdt_amount: newTx.bdtAmount,
      rate: newTx.rate,
      cash_out_fee: newTx.cashOutFee,
      note: newTx.note,
      customer_phone_number: newTx.customerPhoneNumber
    };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([txToSave])
        .select();

      if (error) throw error;
      if (data) {
        // Map backend names to frontend types
        const savedTx: Transaction = {
          id: data[0].id,
          userId: data[0].user_id,
          date: data[0].date,
          type: data[0].type as TransactionType,
          eurAmount: data[0].eur_amount,
          bdtAmount: data[0].bdt_amount,
          rate: data[0].rate,
          cashOutFee: data[0].cash_out_fee,
          profitEur: 0,
          profitBdt: 0,
          note: data[0].note,
          customerPhoneNumber: data[0].customer_phone_number
        };
        setTransactions(prev => [savedTx, ...prev]);
        setIsFormOpen(false);
      }
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      alert('লেনদেন সেভ করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি ডিলিট করতে চান?')) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleCopy = (tx: Transaction) => {
    const text = `রেমিটেন্স কনফার্মেশন\n-----------------\nটাকা: ৳${tx.bdtAmount.toLocaleString()}\nরেট: ৳${tx.rate.toFixed(2)}\nমোট ইউরো: €${tx.eurAmount}\nতারিখ: ${new Date(tx.date).toLocaleDateString('bn-BD')}\n-----------------\nধন্যবাদ!`;
    navigator.clipboard.writeText(text);
    alert('মেসেজ কপি করা হয়েছে।');
  };

  const handleShare = (tx: Transaction) => {
    const text = `রেমিটেন্স কনফার্মেশন\n-----------------\nটাকা: ৳${tx.bdtAmount.toLocaleString()}\nরেট: ৳${tx.rate.toFixed(2)}\nমোট ইউরো: €${tx.eurAmount}\nতারিখ: ${new Date(tx.date).toLocaleDateString('bn-BD')}\n-----------------\nধন্যবাদ!`;
    const encodedText = encodeURIComponent(text);
    const url = tx.customerPhoneNumber 
      ? `https://wa.me/${tx.customerPhoneNumber}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-gray-900 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">রেমিটেন্স লেজার</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentUser.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex bg-white/50 p-1 rounded-2xl border border-gray-100 w-fit mx-auto md:mx-0">
          {(['today', '7days', '30days', 'total'] as const).map((range) => (
            <button key={range} onClick={() => setProfitTimeRange(range)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${profitTimeRange === range ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>
              {range === 'today' ? 'আজ' : range === '7days' ? '৭ দিন' : range === '30days' ? '৩০ দিন' : 'সব সময়'}
            </button>
          ))}
        </div>

        <Dashboard summary={summary.summary} timeRange={profitTimeRange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-black text-gray-800 uppercase text-xs tracking-widest">লেনদেন সমূহ</h2>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full">{summary.transactions.length} টি রেকর্ড</span>
              </div>
              <TransactionList transactions={summary.transactions} onDelete={deleteTransaction} onShare={handleShare} onCopy={handleCopy} avgBuyingRate={summary.summary.avgBuyingRate} />
            </div>
          </div>
          <div className="space-y-8">
            <AIInput onParsed={addTransaction} />
            <ProfitAdvisor summary={summary.summary} />
          </div>
        </div>
      </main>

      <button onClick={() => setIsFormOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all z-40 group">
        <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="flex justify-end mb-2">
               <button onClick={() => setIsFormOpen(false)} className="text-white hover:text-gray-200"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <TransactionForm onSubmit={addTransaction} avgBuyingRate={summary.summary.avgBuyingRate} />
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">সেটিংস</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">ওপেনিং বিকাশ ব্যালেন্স (বিডিটি)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                  <input type="number" value={tempOpeningBdt} onChange={(e) => setTempOpeningBdt(e.target.value)} className="w-full pl-10 p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-black text-xl" />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">* ব্যবসায় শুরুর ক্যাশ অথবা লোন হিসাব করতে এটি ব্যবহার করুন। আপনি চাইলে নেগেটিভ (যেমন: -৫০০০) সংখ্যাও দিতে পারেন।</p>
              </div>
              <button onClick={handleUpdateOpeningBdt} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">আপডেট করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;