import React, { useState, useEffect } from 'react';
import { BusinessSummary } from '../types';
import { getBusinessAdvice } from '../services/geminiService';

interface ProfitAdvisorProps {
  summary: BusinessSummary;
}

const ProfitAdvisor: React.FC<ProfitAdvisorProps> = ({ summary }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Profit Margin Logic: Suggest giving customer 2.5 to 3.5 Taka less than buying rate
  const suggestedRate = summary.avgBuyingRate > 0 ? (summary.avgBuyingRate - 3.0) : 0;

  const fetchAdvice = async () => {
    if (summary.avgBuyingRate === 0) return;
    setLoading(true);
    try {
      const result = await getBusinessAdvice(summary);
      setAdvice(result);
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
            <div className="bg-green-600 p-4 rounded-2xl text-center shadow-lg shadow-green-100">
              <span className="block text-[10px] text-white/70 font-black uppercase tracking-widest mb-1">কাস্টমারকে দেওয়ার জন্য সেরা রেট</span>
              <span className="text-2xl font-black text-white">৳{suggestedRate.toFixed(2)}</span>
              <p className="text-[9px] text-green-100 mt-1">* এটি আপনার কেনা রেট ({summary.avgBuyingRate.toFixed(2)}) থেকে ৩ টাকা কম যা আপনার লাভ নিশ্চিত করবে।</p>
            </div>
            
            <div className="bg-blue-600/10 p-3 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">টার্গেট প্রফিট (প্রতি ইউরো)</span>
              <span className="text-sm font-black text-blue-800">৳৩.০০ +</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAdvisor;
