
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, BusinessSummary, User } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import AIInput from './components/AIInput.tsx';
import ProfitAdvisor from './components/ProfitAdvisor.tsx';
import DailyDetails from './components/DailyDetails.tsx';
import Auth from './components/Auth.tsx';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingBdt, setOpeningBdt] = useState<number>(0);
  const [openingEur, setOpeningEur] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempOpeningBdt, setTempOpeningBdt] = useState('0');
  const [profitTimeRange, setProfitTimeRange] = useState<'today' | '7days' | '30days' | 'total'>('total');
  
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);

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
      
      const mappedTxs = (txs || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        date: t.date,
        type: t.type as TransactionType,
        eurAmount: t.eur_amount,
        bdt_amount: t.bdt_amount, // note: backend might use bdt_amount
        bdtAmount: t.bdt_amount,
        rate: t.rate,
        cash_out_fee: t.cash_out_fee,
        cashOutFee: t.cash_out_fee,
        profitEur: 0,
        profitBdt: 0,
        note: t.note,
        customerPhoneNumber: t.customer_phone_number
      }));
      
      setTransactions(mappedTxs);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('opening_bdt, opening_eur')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
         throw profileError;
      }
      
      const bdt = profile?.opening_bdt || 0;
      const eur = profile?.opening_eur || 0;
      setOpeningBdt(bdt);
      setOpeningEur(eur);
      setTempOpeningBdt(bdt.toString());
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    let currentBdt = openingBdt;
    let currentEur = openingEur;
    
    let totalBuyBdt = 0;
    let totalBuyEur = 0;
    let totalProfitBdt = 0;
    let totalProfitEur = 0;
    let periodProfitEur = 0;
    let periodProfitBdt = 0;
    let totalCustomerEur = 0;

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

    const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);

    const processedTransactions = sortedTxs.map(tx => {
      let pEur = 0;
      let pBdt = 0;

      if (tx.type === TransactionType.BUY) {
        currentBdt += tx.bdtAmount;
        currentEur -= tx.eurAmount;
      } else {
        currentBdt -= tx.bdtAmount;
        currentEur += tx.eurAmount;
        totalCustomerEur += tx.eurAmount;

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
    }).reverse();

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
        openingBalanceEur: openingEur,
        totalCustomerEur,
        periodProfitEur,
        periodProfitBdt
      }
    };
  }, [transactions, openingBdt, openingEur, profitTimeRange]);

  const handleUpdateOpeningBalances = async () => {
    if (!currentUser) return;
    const bdtVal = Math.round(parseFloat(tempOpeningBdt));
    if (isNaN(bdtVal)) { alert('দয়া করে সঠিক সংখ্যা লিখুন।'); return; }
    try {
      const { error } = await supabase.from('profiles').upsert({ 
        id: currentUser.id, 
        opening_bdt: bdtVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      setOpeningBdt(bdtVal);
      setIsSettingsOpen(false);
      alert('ব্যালেন্স আপডেট হয়েছে!');
    } catch (error: any) {
      alert(`ব্যালেন্স আপডেট করতে সমস্যা হয়েছে।\n\nকারন: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?')) {
      await supabase.auth.signOut();
      setCurrentUser(null);
    }
  };

  const sendToWhatsApp = (tx: Transaction) => {
    const phone = tx.customerPhoneNumber || '';
    const amount = Math.round(tx.bdtAmount);
    const messageText = `${phone} বিকাশ ${amount} টাকা`;
    const encodedMessage = encodeURIComponent(messageText);
    const url = `https://wa.me/?text=${encodedMessage}`;
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        window.location.href = url;
    }
  };

  const addTransaction = async (newTx: Omit<Transaction, 'id' | 'userId' | 'date' | 'profitEur' | 'profitBdt'>) => {
    if (!currentUser) return;
    const txToSave = {
      user_id: currentUser.id,
      date: Date.now(),
      type: newTx.type,
      eur_amount: Math.round(newTx.eurAmount),
      bdt_amount: Math.round(newTx.bdtAmount),
      rate: newTx.rate,
      cash_out_fee: newTx.cashOutFee,
      note: newTx.note,
      customer_phone_number: newTx.customerPhoneNumber
    };
    try {
      const { data, error } = await supabase.from('transactions').insert([txToSave]).select();
      if (error) throw error;
      if (data) {
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
        if (savedTx.type === TransactionType.SELL) {
          setTimeout(() => { sendToWhatsApp(savedTx); }, 400);
        }
      }
    } catch (error: any) { alert('লেনদেন সেভ করতে সমস্যা হয়েছে: ' + error.message); }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (error) { console.error('Error deleting transaction:', error); }
  };

  const handleCopy = (tx: Transaction) => {
    const amount = Math.round(tx.bdtAmount);
    const text = `${tx.customerPhoneNumber || ''} বিকাশ ${amount} টাকা`;
    navigator.clipboard.writeText(text);
    alert('মেসেজ কপি করা হয়েছে।');
  };

  if (isLoading && !currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-gray-900 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div><h1 className="text-xl font-black text-gray-900 tracking-tight">রেমিটেন্স লেজার</h1><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentUser.email}</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex bg-white/50 p-1 rounded-2xl border border-gray-100 w-fit mx-auto md:mx-0 shadow-sm">
          {(['today', '7days', '30days', 'total'] as const).map((range) => (
            <button key={range} onClick={() => setProfitTimeRange(range)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profitTimeRange === range ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>{range === 'today' ? 'আজ' : range === '7days' ? '৭ দিন' : range === '30days' ? '৩০ দিন' : 'সব সময়'}</button>
          ))}
        </div>
        
        <Dashboard summary={summary.summary} timeRange={profitTimeRange} onOpenSettings={() => setIsSettingsOpen(true)} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <h2 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                   লেনদেন সমূহ
                </h2>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-inner">{summary.transactions.length} টি রেকর্ড</span>
              </div>
              <TransactionList transactions={summary.transactions} onDelete={deleteTransaction} onShare={sendToWhatsApp} onCopy={handleCopy} avgBuyingRate={summary.summary.avgBuyingRate} />
            </div>
          </div>
          <div className="space-y-8">
            <DailyDetails transactions={transactions} selectedDate={selectedReportDate} onDateChange={setSelectedReportDate} />
            <AIInput onParsed={addTransaction} />
            <ProfitAdvisor summary={summary.summary} />
          </div>
        </div>
      </main>

      <button onClick={() => setIsFormOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-5 rounded-[28px] shadow-2xl shadow-blue-300 hover:bg-blue-700 active:scale-90 transition-all z-40 group border-4 border-white"><svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="flex justify-end mb-2"><button onClick={() => setIsFormOpen(false)} className="text-white hover:text-gray-200 bg-black/20 p-2 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <TransactionForm onSubmit={addTransaction} avgBuyingRate={summary.summary.avgBuyingRate} />
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 overflow-hidden">
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">সেটিংস</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 ml-1">ওপেনিং বিকাশ ব্যালেন্স (বিডিটি)</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-blue-500 transition-colors">৳</span>
                  <input 
                    type="number" 
                    value={tempOpeningBdt} 
                    onChange={(e) => setTempOpeningBdt(e.target.value)} 
                    className="w-full pl-12 p-5 bg-gray-50 border-2 border-transparent rounded-[20px] focus:border-blue-500 focus:bg-white outline-none transition font-black text-2xl" 
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-3 italic px-1 font-medium leading-relaxed">
                  * ব্যবসায় শুরুর ক্যাশ অথবা লোন হিসাব করতে এটি ব্যবহার করুন।
                </p>
              </div>
              <button onClick={handleUpdateOpeningBalances} className="w-full py-5 bg-[#111827] text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">আপডেট করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
