import React, { useState, useEffect } from 'react';
import { BusinessSummary } from '../types';
import { getBusinessAdvice } from '../services/geminiService';

interface ProfitAdvisorProps {
  summary: BusinessSummary;
}

const ProfitAdvisor: React.FC<ProfitAdvisorProps> = ({ summary }) => {
  const [advice, setAdvice] = useState<string>('');
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [aiSuggestedRate, setAiSuggestedRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fallback Profit Margin Logic: Suggest giving customer 3.0 Taka less than buying rate
  const targetProfitBdt = 3.0;
  const localSuggestedRate = summary.avgBuyingRate > 0 ? (summary.avgBuyingRate - targetProfitBdt) : 0;
  
  // Use AI suggested rate if available, otherwise fallback to local calculation
  const displayedSuggestedRate = aiSuggestedRate || localSuggestedRate;

  // Calculate profit in EUR (Profit per EUR in EUR = BDT Profit / Buying Rate)
  // We use the difference between Buying Rate and Suggested Rate
  const actualProfitBdt = summary.avgBuyingRate > 0 ? (summary.avgBuyingRate - displayedSuggestedRate) : 0;
  const profitPerEurInEur = summary.avgBuyingRate > 0 ? (actualProfitBdt / summary.avgBuyingRate) : 0;
  const profitFor10Eur = profitPerEurInEur * 10;

  const fetchAdvice = async () => {
    if (summary.avgBuyingRate === 0) return;
    setLoading(true);
    try {
      const result = await getBusinessAdvice(summary);
      if (result) {
        setAdvice(result.advice);
        setMarketRate(result.marketRate);
        setAiSuggestedRate(result.suggestedRate);
      }
    } catch (e) {
      setAdvice("সার্ভারে সমস্যা হচ্ছে, অনুগ্রহ করে ম্যানুয়ালি রেট যাচাই করুন।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [summary.avgBuyingRate]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-blue-900 font-black flex items-center gap-2 tracking-tight uppercase text-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          AI প্রফিট অ্যাডভাইজর
        </h3>
        <button 
          onClick={fetchAdvice}
          className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline"
          disabled={loading}
        >
          {loading ? 'লোড হচ্ছে...' : 'আপডেট করুন'}
        </button>
      </div>

      {summary.avgBuyingRate === 0 ? (
        <p className="text-xs text-blue-600 font-medium">প্রথমে কিছু ইনভেস্টমেন্ট (Buy) অ্যাড করুন তাহলেই AI সঠিক রেট সাজেস্ট করতে পারবে।</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/60 p-4 rounded-xl border border-white">
            <p className="text-xs text-blue-800 leading-relaxed font-semibold whitespace-pre-line">
              {advice || 'আপনার ডেটা বিশ্লেষণ করা হচ্ছে...'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {marketRate && (
              <div className="bg-white/40 p-3 rounded-xl border border-white/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">গুগল লাইভ রেট (EUR/BDT)</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <span className="text-sm font-black text-gray-700">৳{marketRate.toFixed(2)}</span>
              </div>
            )}

            <div className="bg-green-600 p-4 rounded-2xl text-center shadow-lg shadow-green-100">
              <span className="block text-[10px] text-white/70 font-black uppercase tracking-widest mb-1">কাস্টমারকে দেওয়ার জন্য সেরা রেট</span>
              <span className="text-2xl font-black text-white">৳{displayedSuggestedRate.toFixed(2)}</span>
              <p className="text-[9px] text-green-100 mt-1">* এটি আপনার কেনা রেট ({summary.avgBuyingRate.toFixed(2)}) থেকে {actualProfitBdt.toFixed(2)} টাকা কম যা আপনার প্রতি ১০ ইউরোতে €{profitFor10Eur.toFixed(2)} লাভ নিশ্চিত করবে।</p>
            </div>
            
            <div className="bg-blue-600/10 p-3 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">টার্গেট প্রফিট (প্রতি ১০ ইউরো)</span>
              <span className="text-sm font-black text-blue-800">€{profitFor10Eur.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAdvisor;
