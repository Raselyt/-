
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Calendar, CalendarDays, Filter } from 'lucide-react';

interface DailyDetailsProps {
  transactions: Transaction[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  isBdtPrivate?: boolean;
  isEurPrivate?: boolean;
  isProfitPrivate?: boolean;
}

const DailyDetails: React.FC<DailyDetailsProps> = ({ 
  transactions, 
  selectedDate, 
  onDateChange,
  isBdtPrivate = false,
  isEurPrivate = false,
  isProfitPrivate = false
}) => {
  const [reportMode, setReportMode] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  const bdtBlur = isBdtPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';
  const eurBlur = isEurPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';
  const profitBlur = isProfitPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';

  // Helper to get local YYYY-MM-DD from transaction date
  const getLocalDateStr = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter transactions based on mode
  const filteredTxs = transactions.filter(tx => {
    const txDate = getLocalDateStr(tx.date);
    if (reportMode === 'single') {
      return txDate === (selectedDate || startDate);
    } else {
      const minDate = startDate <= endDate ? startDate : endDate;
      const maxDate = startDate <= endDate ? endDate : startDate;
      return txDate >= minDate && txDate <= maxDate;
    }
  });

  // Calculate totals for selected date/range
  const totalBdtSent = filteredTxs
    .filter(tx => tx.type === TransactionType.SELL)
    .reduce((sum, tx) => sum + tx.bdtAmount, 0);

  const totalEurTaken = filteredTxs
    .filter(tx => tx.type === TransactionType.SELL)
    .reduce((sum, tx) => sum + tx.eurAmount, 0);

  const totalProfitEur = filteredTxs
    .reduce((sum, tx) => sum + (tx.profitEur || 0), 0);

  const sellCount = filteredTxs.filter(tx => tx.type === TransactionType.SELL).length;

  // Preset helper for range selection
  const setMonthRangePreset = (startDay: number, endDay: number) => {
    const baseDateStr = startDate || selectedDate || new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth(); // 0-indexed

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualEndDay = Math.min(endDay, lastDayOfMonth);

    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedStartDay = String(startDay).padStart(2, '0');
    const formattedEndDay = String(actualEndDay).padStart(2, '0');

    const newStart = `${year}-${formattedMonth}-${formattedStartDay}`;
    const newEnd = `${year}-${formattedMonth}-${formattedEndDay}`;

    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const setFullMonthPreset = () => {
    const baseDateStr = startDate || selectedDate || new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const formattedMonth = String(month + 1).padStart(2, '0');

    setStartDate(`${year}-${formattedMonth}-01`);
    setEndDate(`${year}-${formattedMonth}-${String(lastDay).padStart(2, '0')}`);
  };

  const setLast7DaysPreset = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(getLocalDateStr(start));
    setEndDate(getLocalDateStr(end));
  };

  // Format date range for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-900 font-black flex items-center gap-2 tracking-tight uppercase text-xs">
            <Calendar className="w-4 h-4 text-blue-500" />
            তারিখ অনুযায়ী রিপোর্ট
          </h3>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setReportMode('single');
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                reportMode === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              এক দিন
            </button>
            <button
              onClick={() => {
                setReportMode('range');
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                reportMode === 'range' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              তারিখ সীমা (Range)
            </button>
          </div>
        </div>

        {/* Date Selection Inputs */}
        {reportMode === 'single' ? (
          <div className="flex items-center justify-between bg-blue-50/60 p-2 px-3 rounded-2xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700">তারিখ নির্বাচন:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => {
                onDateChange(e.target.value);
                setStartDate(e.target.value);
                setEndDate(e.target.value);
              }}
              className="text-xs font-bold bg-white text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer"
            />
          </div>
        ) : (
          <div className="space-y-3 bg-blue-50/40 p-3 rounded-2xl border border-blue-100/60">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-extrabold text-blue-600 uppercase mb-1">হতে (Start Date)</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-bold bg-white text-gray-800 px-2.5 py-1.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-blue-600 uppercase mb-1">পর্যন্ত (End Date)</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-bold bg-white text-gray-800 px-2.5 py-1.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Presets chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mr-1">দ্রুত পছন্দ:</span>
              <button 
                onClick={() => setMonthRangePreset(1, 10)}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 transition shadow-2xs"
              >
                ১-১০ তারিখ
              </button>
              <button 
                onClick={() => setMonthRangePreset(11, 20)}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 transition shadow-2xs"
              >
                ১১-২০ তারিখ
              </button>
              <button 
                onClick={() => setMonthRangePreset(21, 31)}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 transition shadow-2xs"
              >
                ২১-৩১ তারিখ
              </button>
              <button 
                onClick={setFullMonthPreset}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 transition shadow-2xs"
              >
                পুরো মাস
              </button>
              <button 
                onClick={setLast7DaysPreset}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 transition shadow-2xs"
              >
                গত ৭ দিন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Period Badge */}
      <div className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex items-center justify-between">
        <span className="text-gray-400 font-normal">নির্বাচিত সময়কাল:</span>
        <span className="font-extrabold text-blue-600">
          {reportMode === 'single' 
            ? formatDateDisplay(selectedDate || startDate)
            : `${formatDateDisplay(startDate)} — ${formatDateDisplay(endDate)}`
          }
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="space-y-3">
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
          <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
            {reportMode === 'single' ? 'মোট পাঠানো হয়েছে (বিকাশ)' : 'নির্বাচিত সময়ে মোট পাঠানো (বিকাশ)'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black text-blue-700 ${bdtBlur}`}>৳{Math.round(totalBdtSent).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
          <span className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">
            {reportMode === 'single' ? 'মোট সংগৃহীত ইউরো' : 'নির্বাচিত সময়ে সংগৃহীত ইউরো'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black text-green-700 ${eurBlur}`}>
              €{totalEurTaken.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 pt-1 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase">মোট নিট লাভ (EUR):</span>
          <span className={`text-xs font-black ${totalProfitEur >= 0 ? 'text-green-600' : 'text-red-500'} ${profitBlur}`}>
            {totalProfitEur >= 0 ? '+' : ''}€{totalProfitEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">মোট কাস্টমার / লেনদেন:</span>
          <span className="text-xs font-black text-gray-700">{sellCount} জন</span>
        </div>
      </div>
    </div>
  );
};

export default DailyDetails;

