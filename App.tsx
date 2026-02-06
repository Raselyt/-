
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, BusinessSummary } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import AIInput from './components/AIInput';
import ProfitAdvisor from './components/ProfitAdvisor';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('remittance_ledger_txs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('remittance_ledger_txs', JSON.stringify(transactions));
  }, [transactions]);

  const summary = useMemo((): BusinessSummary => {
    let totalInvEur = 0;
    let totalInvBdt = 0;
    let totalProfitBdt = 0;
    let totalProfitEur = 0;
    let currentBdt = 0;
    let currentEur = 0;

    let totalBuyBdt = 0;
    let totalBuyEur = 0;

    transactions.forEach(tx => {
      if (tx.type === TransactionType.BUY) {
        totalInvEur += tx.eurAmount;
        totalInvBdt += tx.bdtAmount;
        currentBdt += tx.bdtAmount;
        currentEur -= tx.eurAmount; 
        
        totalBuyBdt += tx.bdtAmount;
        totalBuyEur += tx.eurAmount;
      } else {
        currentBdt -= tx.bdtAmount;
        totalProfitBdt += tx.profitBdt;
        totalProfitEur += tx.profitEur;
        currentEur += tx.eurAmount; 
      }
    });

    const avgBuyRate = totalBuyEur > 0 ? totalBuyBdt / totalBuyEur : 0;

    return {
      totalInvestmentEur: totalInvEur,
      totalInvestmentBdt: totalInvBdt,
      avgBuyingRate: avgBuyRate,
      totalProfitBdt,
      totalProfitEur,
      currentBdtBalance: currentBdt,
      currentEurBalance: currentEur
    };
  }, [transactions]);

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'date' | 'profitEur' | 'profitBdt'>) => {
    const buyingRate = summary.avgBuyingRate || 0;
    
    let profitBdt = 0;
    let profitEur = 0;

    if (newTx.type === TransactionType.SELL) {
      // Selling Logic: Profit = Cost Rate - Customer Rate
      // Example: Buying at 146, selling at 143. Profit is 3 BDT per EUR.
      const costInEur = buyingRate > 0 ? newTx.bdtAmount / buyingRate : 0;
      profitEur = newTx.eurAmount - costInEur;
      profitBdt = profitEur * (buyingRate || newTx.rate);
    }

    const tx: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
      date: Date.now(),
      profitBdt,
      profitEur
    };

    setTransactions(prev => [tx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    if (confirm('আপনি কি এই লেনদেনটি ডিলিট করতে চান?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-50 font-['Hind_Siliguri']">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">রেমিটেন্স লেজার প্রো</h1>
            <p className="text-blue-100 text-xs mt-1">ইতালি - বাংলাদেশ কারেন্সি ব্যবসা অ্যাকাউন্ট্যান্ট</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Dashboard summary={summary} />
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-6">লেনদেনের ইতিহাস</h2>
            <TransactionList 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              avgBuyingRate={summary.avgBuyingRate}
            />
          </div>
        </div>

        <div className="space-y-6">
          <AIInput onParsed={addTransaction} />
          <TransactionForm onSubmit={addTransaction} avgBuyingRate={summary.avgBuyingRate} />
          <ProfitAdvisor summary={summary} />
        </div>
      </main>
    </div>
  );
};

export default App;
