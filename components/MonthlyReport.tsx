
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download } from 'lucide-react';

interface MonthlyReportProps {
  transactions: Transaction[];
  userEmail?: string;
  isProfitPrivate?: boolean;
  isBdtPrivate?: boolean;
  isEurPrivate?: boolean;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ 
  transactions, 
  userEmail,
  isProfitPrivate = false,
  isBdtPrivate = false,
  isEurPrivate = false
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const profitBlur = isProfitPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';
  const bdtBlur = isBdtPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';
  const eurBlur = isEurPrivate ? 'blur-md select-none pointer-events-none' : 'transition-all duration-300';

  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const monthsEng = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthlyStats = useMemo(() => {
    const filtered = transactions.filter(tx => {
      const date = new Date(tx.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const bdtSent = filtered
      .filter(tx => tx.type === TransactionType.SELL)
      .reduce((sum, tx) => sum + tx.bdtAmount, 0);

    const eurCollected = filtered
      .filter(tx => tx.type === TransactionType.SELL)
      .reduce((sum, tx) => sum + tx.eurAmount, 0);

    const profitEur = filtered
      .reduce((sum, tx) => sum + (tx.profitEur || 0), 0);

    const expensesEur = filtered
      .filter(tx => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + tx.eurAmount, 0);

    const expensesBdt = filtered
      .filter(tx => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + tx.bdtAmount, 0);

    const txCount = filtered.filter(tx => tx.type === TransactionType.SELL).length;

    return { bdtSent, eurCollected, profitEur, expensesEur, expensesBdt, txCount, filtered };
  }, [transactions, selectedMonth, selectedYear]);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const monthName = monthsEng[selectedMonth];
      
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text(`Monthly Financial Report`, 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Period: ${monthName} ${selectedYear}`, 14, 30);
      doc.text(`User: ${userEmail || 'N/A'}`, 14, 37);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

      // Summary Box
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 255);
      doc.rect(14, 50, 182, 30, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Total BDT Sent:`, 20, 60);
      doc.setFont(undefined, 'bold');
      doc.text(`BDT ${Math.round(monthlyStats.bdtSent).toLocaleString()}`, 60, 60);
      
      doc.setFont(undefined, 'normal');
      doc.text(`EUR Collected:`, 20, 68);
      doc.setFont(undefined, 'bold');
      doc.text(`EUR ${Math.round(monthlyStats.eurCollected).toLocaleString()}`, 60, 68);
      
      doc.setFont(undefined, 'normal');
      doc.text(`Total Profit:`, 110, 60);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(22, 163, 74); // Green
      doc.text(`EUR ${monthlyStats.profitEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 140, 60);

      doc.setTextColor(0);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Expenses:`, 110, 68);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`EUR ${Math.round(monthlyStats.expensesEur).toLocaleString()}`, 140, 68);
      
      doc.setTextColor(0);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Transactions:`, 110, 76);
      doc.setFont(undefined, 'bold');
      doc.text(`${monthlyStats.txCount}`, 145, 76);

      const tableData = monthlyStats.filtered.map(tx => [
        new Date(tx.date).toLocaleDateString('en-GB'),
        tx.type,
        tx.eurAmount.toFixed(2),
        tx.rate.toFixed(2),
        Math.round(tx.bdtAmount).toString(),
        tx.profitEur ? tx.profitEur.toFixed(2) : '0.00',
        tx.customerPhoneNumber || '-'
      ]);

      autoTable(doc, {
        head: [['Date', 'Type', 'EUR', 'Rate', 'BDT', 'Profit', 'Phone']],
        body: tableData,
        startY: 90,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        styles: { fontSize: 8 },
        columnStyles: {
          5: { textColor: [22, 163, 74], fontStyle: 'bold' } // Profit column
        }
      });

      doc.save(`Monthly_Report_${monthName}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('Monthly PDF Error:', error);
      alert('পিডিএফ তৈরি করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-gray-900 font-black flex items-center gap-2 tracking-tight uppercase text-xs">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          মাসিক হিসাব রিপোর্ট
        </h3>
        <div className="flex gap-2">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 text-[11px] font-bold bg-purple-50 text-purple-600 px-3 py-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-[11px] font-bold bg-purple-50 text-purple-600 px-3 py-2 rounded-xl border-none outline-none appearance-none cursor-pointer"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">এ মাসের মোট বিকাশ পাঠানো</span>
          <span className={`text-xl font-black text-gray-900 ${bdtBlur}`}>৳{Math.round(monthlyStats.bdtSent).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">সংগৃহীত ইউরো</span>
            <span className={`text-xl font-black text-blue-600 ${eurBlur}`}>€{Math.round(monthlyStats.eurCollected).toLocaleString()}</span>
          </div>
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
            <span className="block text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">নীট লাভ (EUR)</span>
            <span className={`text-xl font-black text-green-600 ${profitBlur}`}>€{monthlyStats.profitEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {monthlyStats.expensesEur > 0 && (
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
            <span className="block text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">এ মাসের মোট খরচ</span>
            <div className="flex justify-between items-baseline">
              <span className={`text-xl font-black text-red-600 ${eurBlur}`}>€{Math.round(monthlyStats.expensesEur).toLocaleString()}</span>
              {monthlyStats.expensesBdt > 0 && (
                <span className={`text-xs font-bold text-red-400 ${bdtBlur}`}>৳{Math.round(monthlyStats.expensesBdt).toLocaleString()}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-2 pt-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase">মোট লেনদেন:</span>
            <span className="text-xs font-black text-gray-700">{monthlyStats.txCount} বার</span>
          </div>
          <button 
            onClick={downloadPDF}
            disabled={monthlyStats.txCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
          >
            <Download className="w-3 h-3" /> PDF ডাউনলোড
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
