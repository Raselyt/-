
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setError('');
    setMessage('');
  }, [isLoginTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password.trim()) {
      setError('দয়া করে ইমেইল এবং পাসওয়ার্ড সঠিকভাবে দিন।');
      setIsLoading(false);
      return;
    }

    try {
      if (isLoginTab) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('ভুল ইমেইল বা পাসওয়ার্ড! আপনার কি একাউন্ট খোলা আছে? না থাকলে "নতুন একাউন্ট" বাটনে ক্লিক করে রেজিস্ট্রেশন করুন।');
          }
          throw authError;
        }

        if (data.user) {
          onLogin({ id: data.user.id, email: data.user.email! });
        }
      } else {
        if (password.length < 6) {
          setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
          setIsLoading(false);
          return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
        });

        if (authError) throw authError;

        if (data.user) {
          // If a session exists, log them in immediately
          if (data.session) {
             onLogin({ id: data.user.id, email: data.user.email! });
          } else {
            // If email confirmation is required
            setMessage('রেজিস্ট্রেশন সফল হয়েছে! আপনার ইমেইল ইনবক্স চেক করুন এবং একাউন্টটি কনফার্ম করুন। এরপর লগইন করুন।');
            setIsLoginTab(true);
            setPassword('');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-8 md:p-10 border border-gray-50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[#111827]">রেমিটেন্স লেজার প্রো</h2>
          <p className="text-sm text-gray-400 mt-1">আপনার ব্যবসার সঠিক হিসাব রাখুন</p>
        </div>

        <div className="flex bg-[#F1F4FA] p-1.5 rounded-[22px] mb-8">
          <button 
            type="button"
            onClick={() => setIsLoginTab(true)}
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all ${isLoginTab ? 'bg-white text-[#1A1F36] shadow-sm scale-100' : 'text-[#697386] scale-95'}`}
          >
            লগইন
          </button>
          <button 
            type="button"
            onClick={() => setIsLoginTab(false)}
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all ${!isLoginTab ? 'bg-white text-[#1A1F36] shadow-sm scale-100' : 'text-[#697386] scale-95'}`}
          >
            নতুন একাউন্ট
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">ইমেইল এড্রেস</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                type="email" 
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border-2 border-[#E0E5F2] rounded-[24px] focus:border-[#422AFB] focus:bg-white outline-none transition-all placeholder-[#A3AED0] text-[#1B2559] font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">পাসওয়ার্ড</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                autoComplete={isLoginTab ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-14 pr-14 py-4 bg-gray-50/50 border-2 border-[#E0E5F2] rounded-[24px] focus:border-[#422AFB] focus:bg-white outline-none transition-all placeholder-[#A3AED0] text-[#1B2559] font-medium"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A3AED0] hover:text-[#422AFB]"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-red-600 text-xs font-bold text-center leading-relaxed">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-green-700 text-xs font-bold text-center leading-relaxed">{message}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#111827] text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-gray-200 hover:bg-[#000] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70"
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : isLoginTab ? 'অ্যাপে প্রবেশ করুন' : 'অ্যাকাউন্ট খুলুন'}
            {!isLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>}
          </button>
        </form>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 opacity-40">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Secure Accounting & Cloud Database</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
