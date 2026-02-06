import React, { useState } from 'react';
import { parseTransactionText } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';

interface AIInputProps {
  // Corrected Omit to match the actual fields in the Transaction interface
  onParsed: (tx: Omit<Transaction, 'id' | 'date' | 'profitEur' | 'profitBdt'>) => void;
}

const AIInput: React.FC<AIInputProps> = ({ onParsed }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAISubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await parseTransactionText(inputText);
      
      // Basic validation of AI result
      if (result && result.type && result.eurAmount && result.rate) {
        onParsed({
          type: result.type as TransactionType,
          eurAmount: result.eurAmount,
          rate: result.rate,
          bdtAmount: result.bdtAmount || (result.eurAmount * result.rate),
          cashOutFee: result.cashOutFee || 0,
          note: result.note || inputText.substring(0, 50)
        });
        setInputText('');
      } else {
        setError('এন্ট্রিটি বুঝতে সমস্যা হচ্ছে। দয়া করে পরিষ্কার করে লিখুন।');
      }
    } catch (err) {
      console.error(err);
      setError('AI সার্ভারে সমস্যা হয়েছে। ম্যানুয়াল ট্রাই করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
        </svg>
        <h2 className="text-xl font-bold">AI কুইক এন্ট্রি</h2>
      </div>
      
      <p className="text-indigo-100 text-sm mb-4">
        সরাসরি চ্যাট এর মতো লিখুন: <br/>
        <span className="italic opacity-80">"১০০ ইউরো পাঠিয়ে ১২৫৫০ টাকা পেলাম"</span> অথবা <br/>
        <span className="italic opacity-80">"কাস্টমারকে ৫০ ইউরো দিলাম ১২৬ রেটে"</span>
      </p>

      <div className="space-y-3">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition min-h-[100px]"
          placeholder="এখানে লিখুন..."
        ></textarea>
        
        {error && <div className="text-red-200 text-xs font-semibold">{error}</div>}

        <button
          onClick={handleAISubmit}
          disabled={isLoading || !inputText.trim()}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
            isLoading ? 'bg-white/20' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-md'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              হিসাব হচ্ছে...
            </>
          ) : (
            'AI দিয়ে অ্যাড করুন'
          )}
        </button>
      </div>
    </div>
  );
};

export default AIInput;
