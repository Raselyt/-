
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('দয়া করে ইমেইল এবং পাসওয়ার্ড দিন।');
      return;
    }

    const savedUsersStr = localStorage.getItem('rlp_users') || '[]';
    const users: User[] = JSON.parse(savedUsersStr);

    if (isLoginTab) {
      // Login Logic
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin({ id: user.id, email: user.email });
      } else {
        setError('ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।');
      }
    } else {
      // Signup Logic
      if (users.find(u => u.email === email)) {
        setError('এই ইমেইল দিয়ে ইতিপূর্বে অ্যাকাউন্ট খোলা হয়েছে।');
        return;
      }
      const newUser: User = { id: crypto.randomUUID(), email, password };
      users.push(newUser);
      localStorage.setItem('rlp_users', JSON.stringify(users));
      onLogin({ id: newUser.id, email: newUser.email });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-8 md:p-10 border border-gray-50">
        
        {/* Tabs */}
        <div className="flex bg-[#F1F4FA] p-1.5 rounded-[22px] mb-10">
          <button 
            onClick={() => setIsLoginTab(true)}
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all ${isLoginTab ? 'bg-white text-[#1A1F36] shadow-sm' : 'text-[#697386]'}`}
          >
            লগইন
          </button>
          <button 
            onClick={() => setIsLoginTab(false)}
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all ${!isLoginTab ? 'bg-white text-[#1A1F36] shadow-sm' : 'text-[#697386]'}`}
          >
            নতুন একাউন্ট
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ইমেইল এড্রেস"
                className="w-full pl-14 pr-5 py-4 bg-white border-2 border-[#E0E5F2] rounded-[24px] focus:border-[#422AFB] outline-none transition-all placeholder-[#A3AED0] text-[#1B2559] font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড"
                className="w-full pl-14 pr-14 py-4 bg-white border-2 border-[#E0E5F2] rounded-[24px] focus:border-[#422AFB] outline-none transition-all placeholder-[#A3AED0] text-[#1B2559] font-medium"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A3AED0] hover:text-[#422AFB]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-[#111827] text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-gray-200 hover:bg-[#000] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isLoginTab ? 'অ্যাপে প্রবেশ করুন' : 'অ্যাকাউন্ট খুলুন'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </form>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 flex items-center gap-3 opacity-40">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Secure Online Database</span>
      </div>
    </div>
  );
};

export default Auth;
