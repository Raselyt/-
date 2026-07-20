
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, BusinessSummary, User } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import AIInput from './components/AIInput.tsx';
import ProfitAdvisor from './components/ProfitAdvisor.tsx';
import DailyDetails from './components/DailyDetails.tsx';
import MonthlyReport from './components/MonthlyReport.tsx';
import Auth from './components/Auth.tsx';
import { supabase } from './services/supabase';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Receipt from './components/Receipt.tsx';
import { Download, FileText, BarChart3, Users, Bell, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Default values
  const [openingBdt, setOpeningBdt] = useState<number>(-121720);
  const [openingEur, setOpeningEur] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isProfitPrivate, setIsProfitPrivate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isProfitPrivate') === 'true';
    }
    return false;
  });
  const [isBdtPrivate, setIsBdtPrivate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isBdtPrivate') === 'true';
    }
    return false;
  });
  const [isEurPrivate, setIsEurPrivate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isEurPrivate') === 'true';
    }
    return false;
  });

  // Function to update privacy in DB and State
  const updatePrivacySetting = async (key: 'is_profit_private' | 'is_bdt_private' | 'is_eur_private', value: boolean) => {
    // Update State immediately
    if (key === 'is_profit_private') {
      setIsProfitPrivate(value);
      localStorage.setItem('isProfitPrivate', value.toString());
    }
    if (key === 'is_bdt_private') {
      setIsBdtPrivate(value);
      localStorage.setItem('isBdtPrivate', value.toString());
    }
    if (key === 'is_eur_private') {
      setIsEurPrivate(value);
      localStorage.setItem('isEurPrivate', value.toString());
    }

    if (!currentUser) return;

    // Save to DB (optional sync)
    try {
      await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', currentUser.id);
    } catch (err) {
      // Silently fail if columns don't exist in DB, local storage still works
      console.warn(`Database sync failed for ${key}, falling back to local storage.`);
    }
  };

  const [tempOpeningBdt, setTempOpeningBdt] = useState('-121720');
  const [tempOpeningEur, setTempOpeningEur] = useState('0');
  
  const [profitTimeRange, setProfitTimeRange] = useState<'today' | '7days' | '30days' | 'total'>('total');
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [showNoPhoneOnly, setShowNoPhoneOnly] = useState(false);

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
        eurAmount: Number(t.eur_amount),
        bdtAmount: Number(t.bdt_amount),
        rate: Number(t.rate),
        cashOutFee: Number(t.cash_out_fee),
        profitEur: 0,
        profitBdt: 0,
        note: t.note,
        customerPhoneNumber: t.customer_phone_number
      }));
      
      setTransactions(mappedTxs);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('opening_bdt, opening_eur, is_profit_private, is_bdt_private, is_eur_private')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
         throw profileError;
      }
      
      if (profile) {
        setOpeningBdt(Number(profile.opening_bdt));
        setOpeningEur(Number(profile.opening_eur));
        setTempOpeningBdt(profile.opening_bdt.toString());
        setTempOpeningEur(profile.opening_eur.toString());
        
        // Load privacy settings (DB as source of truth if available)
        if (profile.is_profit_private !== undefined) setIsProfitPrivate(!!profile.is_profit_private);
        if (profile.is_bdt_private !== undefined) setIsBdtPrivate(!!profile.is_bdt_private);
        if (profile.is_eur_private !== undefined) setIsEurPrivate(!!profile.is_eur_private);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    let currentBdt = Number(openingBdt);
    let currentEur = Number(openingEur);
    
    let globalTotalBuyBdt = 0;
    let globalTotalBuyEur = 0;
    
    let periodTotalBuyBdt = 0;
    let periodTotalBuyEur = 0;

    let totalProfitBdt = 0;
    let totalProfitEur = 0;
    let periodProfitEur = 0;
    let periodProfitBdt = 0;
    let totalCustomerEur = 0; 
    let allTimeTotalSellBdt = 0;
    let allTimeTotalSellEur = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTimestamp = now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // Calculate overall average as a strict fallback for sells that happen before any buys
    let overallTotalBuyBdt = 0;
    let overallTotalBuyEur = 0;
    transactions.forEach(tx => {
      if (tx.type === TransactionType.BUY) {
        overallTotalBuyBdt += tx.bdtAmount;
        overallTotalBuyEur += tx.eurAmount;
      }
    });
    const overallAvgBuyingRate = overallTotalBuyEur > 0 ? overallTotalBuyBdt / overallTotalBuyEur : 0;

    // 1. Sort transactions chronologically to track the latest buying rate
    const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);

    let latestBuyingRate = 0;

    const processedTransactions = sortedTxs.map(tx => {
      let pEur = 0;
      let pBdt = 0;
      let usedRate = 0;

      const isToday = tx.date >= todayTimestamp;
      const isLast7Days = (Date.now() - tx.date) <= (7 * oneDay);
      const isLast30Days = (Date.now() - tx.date) <= (30 * oneDay);

      let isInPeriod = false;
      if (profitTimeRange === 'total') isInPeriod = true;
      else if (profitTimeRange === 'today' && isToday) isInPeriod = true;
      else if (profitTimeRange === '7days' && isLast7Days) isInPeriod = true;
      else if (profitTimeRange === '30days' && isLast30Days) isInPeriod = true;

      if (tx.type === TransactionType.BUY) {
        currentBdt += tx.bdtAmount; 
        currentEur -= tx.eurAmount;
        totalCustomerEur -= tx.eurAmount; 
        
        globalTotalBuyBdt += tx.bdtAmount;
        globalTotalBuyEur += tx.eurAmount;
        
        // Update the latest buying rate
        latestBuyingRate = tx.eurAmount > 0 ? tx.bdtAmount / tx.eurAmount : 0;
        
        if (isInPeriod) {
          periodTotalBuyBdt += tx.bdtAmount;
          periodTotalBuyEur += tx.eurAmount;
        }

        // Buying costs/fees are always deducted (minus) from the profit
        pEur = -tx.cashOutFee;
        pBdt = -tx.cashOutFee * tx.rate;

        totalProfitBdt += pBdt;
        totalProfitEur += pEur;

        if (isInPeriod) {
          periodProfitEur += pEur;
          periodProfitBdt += pBdt;
        }
      } else if (tx.type === TransactionType.SELL) {
        currentBdt -= tx.bdtAmount; 
        currentEur += tx.eurAmount;
        totalCustomerEur += tx.eurAmount; 
        allTimeTotalSellBdt += tx.bdtAmount;
        allTimeTotalSellEur += tx.eurAmount;

        // Selling profit is strictly the fee taken from the customer (cashOutFee)
        pEur = tx.cashOutFee;
        pBdt = tx.cashOutFee * tx.rate;

        totalProfitBdt += pBdt;
        totalProfitEur += pEur;

        if (isInPeriod) {
          periodProfitEur += pEur;
          periodProfitBdt += pBdt;
        }
      } else if (tx.type === TransactionType.EXPENSE) {
        // Expenses reduce balances. Assuming expenses are recorded in EUR.
        currentEur -= tx.eurAmount;
        // If BDT was also recorded for the expense
        currentBdt -= tx.bdtAmount;
      }
      return { ...tx, profitEur: pEur, profitBdt: pBdt, usedBuyingRate: usedRate };
    }).reverse();

    // Apply search and filter
    const filteredTransactions = processedTransactions.filter(tx => {
      // Filter for missing phone numbers (only for SELL transactions)
      if (showNoPhoneOnly) {
        if (tx.type !== TransactionType.SELL) return false;
        if (tx.customerPhoneNumber && tx.customerPhoneNumber.trim().length > 0) return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        const matchesType = filterType === 'ALL' || tx.type === filterType;
        return matchesType;
      }

      const matchesSearch = 
        (tx.customerPhoneNumber && tx.customerPhoneNumber.toLowerCase().includes(query)) || 
        (tx.note && tx.note.toLowerCase().includes(query)) ||
        (tx.bdtAmount && Math.round(tx.bdtAmount).toString().includes(query)) ||
        (tx.eurAmount && Math.round(tx.eurAmount).toString().includes(query)) ||
        (tx.rate && tx.rate.toString().includes(query)) ||
        (tx.type && tx.type.toLowerCase().includes(query));

      const matchesType = filterType === 'ALL' || tx.type === filterType;
      return matchesSearch && matchesType;
    });

    // Determine what to show in the dashboard cards
    const displayAvgBuyingRate = latestBuyingRate > 0 
      ? latestBuyingRate 
      : (globalTotalBuyEur > 0 ? globalTotalBuyBdt / globalTotalBuyEur : 0);

    const displayTotalInvestmentBdt = profitTimeRange === 'total' ? globalTotalBuyBdt : periodTotalBuyBdt;
    const displayTotalInvestmentEur = profitTimeRange === 'total' ? globalTotalBuyEur : periodTotalBuyEur;

    return {
      transactions: filteredTransactions,
      allTransactions: processedTransactions, // Keep all for reports if needed
      summary: {
        totalInvestmentEur: displayTotalInvestmentEur,
        totalInvestmentBdt: displayTotalInvestmentBdt,
        avgBuyingRate: displayAvgBuyingRate,
        totalProfitBdt,
        totalProfitEur,
        currentBdtBalance: currentBdt,
        currentEurBalance: currentEur,
        openingBalanceBdt: openingBdt,
        openingBalanceEur: openingEur,
        totalCustomerEur,
        periodProfitEur,
        periodProfitBdt,
        allTimeTotalSellBdt,
        allTimeTotalSellEur
      }
    };
  }, [transactions, openingBdt, openingEur, profitTimeRange, searchQuery, filterType, showNoPhoneOnly]);

  const handleUpdateOpeningBalances = async () => {
    if (!currentUser) return;
    const bdtVal = parseFloat(tempOpeningBdt);
    const eurVal = parseFloat(tempOpeningEur);
    if (isNaN(bdtVal) || isNaN(eurVal)) { 
      alert('দয়া করে সঠিক সংখ্যা লিখুন।'); 
      return; 
    }
    
    try {
      const { error } = await supabase.from('profiles').upsert({ 
        id: currentUser.id, 
        opening_bdt: bdtVal,
        opening_eur: eurVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) throw error;
      
      setOpeningBdt(bdtVal);
      setOpeningEur(eurVal);
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
    // User requested format: "01813333310 বিকাশ 2040 টাকা"
    const messageText = `${phone} বিকাশ ${amount} টাকা`;
    const encodedMessage = encodeURIComponent(messageText);
    const url = `https://wa.me/?text=${encodedMessage}`;
    
    // Attempt to open in new tab
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
          eurAmount: Number(data[0].eur_amount),
          bdtAmount: Number(data[0].bdt_amount),
          rate: Number(data[0].rate),
          cashOutFee: Number(data[0].cash_out_fee),
          profitEur: 0,
          profitBdt: 0,
          note: data[0].note,
          customerPhoneNumber: data[0].customer_phone_number
        };
        setTransactions(prev => [savedTx, ...prev]);
        setIsFormOpen(false);

        // Auto-share to WhatsApp for SELL transactions
        if (savedTx.type === TransactionType.SELL) {
          setTimeout(() => {
            sendToWhatsApp(savedTx);
          }, 400);
        }
      }
    } catch (error: any) { 
      alert('লেনদেন সেভ করতে সমস্যা হয়েছে: ' + error.message); 
    }
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

  const exportToExcel = () => {
    const data = transactions.map(tx => ({
      Date: new Date(tx.date).toLocaleDateString(),
      Type: tx.type,
      EUR: tx.eurAmount,
      Rate: tx.rate,
      BDT: tx.bdtAmount,
      Profit_EUR: tx.profitEur,
      Phone: tx.customerPhoneNumber || '',
      Note: tx.note || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Remittance_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Remittance Ledger Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`User: ${currentUser?.email}`, 14, 33);

      // Calculate current report totals (remittance sent)
      let filteredSellBdt = 0;
      let filteredSellEur = 0;
      summary.transactions.forEach(tx => {
        if (tx.type === TransactionType.SELL) {
          filteredSellBdt += tx.bdtAmount;
          filteredSellEur += tx.eurAmount;
        }
      });

      const allTimeSellBdt = summary.summary.allTimeTotalSellBdt || 0;
      const allTimeSellEur = summary.summary.allTimeTotalSellEur || 0;

      // 1. All-Time totals
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // Blue
      doc.text("ALL-TIME TOTAL REMITTANCE SENT (শুরু থেকে মোট পাঠানো):", 14, 42);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Total BDT: BDT ${Math.round(allTimeSellBdt).toLocaleString()}`, 14, 47);
      doc.text(`Total EUR: EUR ${allTimeSellEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 110, 47);

      // 2. Filtered/Current Report totals
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // Green
      doc.text("CURRENT REPORT REMITTANCE TOTAL (এই রিপোর্টের মোট পাঠানো):", 14, 55);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Report BDT: BDT ${Math.round(filteredSellBdt).toLocaleString()}`, 14, 60);
      doc.text(`Report EUR: EUR ${filteredSellEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 110, 60);

      const tableData = summary.transactions.map(tx => [
        new Date(tx.date).toLocaleDateString('en-GB'),
        tx.type,
        tx.eurAmount.toFixed(2),
        tx.rate.toFixed(2),
        Math.round(tx.bdtAmount).toString(),
        tx.customerPhoneNumber || ''
      ]);
      
      if (tableData.length === 0) {
        alert('কোনো লেনদেন নেই।');
        return;
      }

      autoTable(doc, {
        head: [['Date', 'Type', 'EUR', 'Rate', 'BDT', 'Phone']],
        body: tableData,
        startY: 68,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue color
        styles: { fontSize: 8 },
      });

      doc.save(`Remittance_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('PDF তৈরি করতে সমস্যা হয়েছে।');
    }
  };

  const [generatingReceiptTx, setGeneratingReceiptTx] = useState<Transaction | null>(null);
  const [receiptDownloadType, setReceiptDownloadType] = useState<'PNG' | 'PDF' | null>(null);

  // Dynamic receipt generation logic that runs when states are set
  useEffect(() => {
    if (!generatingReceiptTx || !receiptDownloadType) return;

    const processDownload = async () => {
      // Small timeout to guarantee DOM mounting of the single dynamic element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById(`receipt-${generatingReceiptTx.id}`);
      if (!element) {
        alert('রিসিট টেমপ্লেট পাওয়া যায়নি। দয়া করে আবার চেষ্টা করুন।');
        setGeneratingReceiptTx(null);
        setReceiptDownloadType(null);
        return;
      }
      
      let iframe: HTMLIFrameElement | null = null;
      try {
        // Create hidden iframe
        iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '400px';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error('Could not access iframe document');
        }

        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Receipt</title>
              <style>
                body { margin: 0; padding: 0; background: white; }
              </style>
            </head>
            <body>
            </body>
          </html>
        `);
        iframeDoc.close();

        // Copy styles
        const linksAndStyles = document.querySelectorAll('link[rel="stylesheet"], style');
        linksAndStyles.forEach((el) => {
          const clone = el.cloneNode(true);
          iframeDoc.head.appendChild(clone);
        });

        // Clone receipt element and append
        const receiptClone = element.cloneNode(true) as HTMLElement;
        // Ensure clone is visible inside iframe
        receiptClone.style.display = 'block';
        receiptClone.style.visibility = 'visible';
        receiptClone.style.opacity = '1';
        receiptClone.style.transform = 'none';
        receiptClone.style.position = 'static';
        iframeDoc.body.appendChild(receiptClone);

        // Wait a short bit to ensure styles are parsed and fonts are ready
        await new Promise(resolve => setTimeout(resolve, 150));

        const targetElement = iframeDoc.getElementById(element.id);
        if (!targetElement) {
          throw new Error('Cloned element not found in iframe');
        }

        if (receiptDownloadType === 'PNG') {
          const canvas = await html2canvas(targetElement, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 400,
            windowHeight: targetElement.offsetHeight || 600,
          });
          
          canvas.toBlob((blob) => {
            if (!blob) {
              alert('ছবি তৈরি করতে সমস্যা হয়েছে');
              return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Receipt_${generatingReceiptTx.customerPhoneNumber || 'TX'}_${generatingReceiptTx.id.slice(0, 5)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }, 'image/png', 1.0);
        } else if (receiptDownloadType === 'PDF') {
          const canvas = await html2canvas(targetElement, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            allowTaint: true,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 3, canvas.height / 3]
          });

          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
          pdf.save(`Receipt_${generatingReceiptTx.customerPhoneNumber || 'TX'}.pdf`);
        }
      } catch (error) {
        console.error('Receipt download error:', error);
        alert('রিসিট ডাউনলোড করতে সমস্যা হয়েছে।');
      } finally {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        setGeneratingReceiptTx(null);
        setReceiptDownloadType(null);
      }
    };

    processDownload();
  }, [generatingReceiptTx, receiptDownloadType]);

  const downloadReceipt = (tx: Transaction) => {
    setGeneratingReceiptTx(tx);
    setReceiptDownloadType('PNG');
  };

  const downloadReceiptPDF = (tx: Transaction) => {
    setGeneratingReceiptTx(tx);
    setReceiptDownloadType('PDF');
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
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
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
        
        <Dashboard 
          summary={summary.summary} 
          timeRange={profitTimeRange} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          transactions={summary.transactions}
          isProfitPrivate={isProfitPrivate}
          setIsProfitPrivate={(val) => updatePrivacySetting('is_profit_private', val)}
          isBdtPrivate={isBdtPrivate}
          setIsBdtPrivate={(val) => updatePrivacySetting('is_bdt_private', val)}
          isEurPrivate={isEurPrivate}
          setIsEurPrivate={(val) => updatePrivacySetting('is_eur_private', val)}
        />
        
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-100 transition">
            <Download className="w-3 h-3" /> Excel ডাউনলোড
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition">
            <FileText className="w-3 h-3" /> PDF রিপোর্ট
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    লেনদেন সমূহ
                  </h2>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-inner">{summary.transactions.length} টি রেকর্ড</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="ফোন বা নোট দিয়ে খুঁজুন..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-300 transition"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                   <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 flex-wrap gap-1">
                    {(['ALL', TransactionType.BUY, TransactionType.SELL] as const).map((type) => (
                      <button 
                        key={type} 
                        onClick={() => {
                          setFilterType(type);
                          setShowNoPhoneOnly(false);
                        }}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${filterType === type && !showNoPhoneOnly ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                      >
                        {type === 'ALL' ? 'সব' : type}
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        const nextValue = !showNoPhoneOnly;
                        setShowNoPhoneOnly(nextValue);
                        if (nextValue) {
                          setFilterType('ALL');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${showNoPhoneOnly ? 'bg-red-500 text-white shadow-sm' : 'text-red-500 hover:bg-red-50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showNoPhoneOnly ? 'bg-white' : 'bg-red-500 animate-pulse'}`}></span>
                      নাম্বার ছাড়া হিসাবসমূহ
                    </button>
                  </div>
                </div>
              </div>
              <TransactionList 
                transactions={summary.transactions} 
                onDelete={deleteTransaction} 
                onShare={sendToWhatsApp} 
                onCopy={handleCopy} 
                onDownloadReceipt={downloadReceipt}
                onDownloadPDF={downloadReceiptPDF}
                avgBuyingRate={summary.summary.avgBuyingRate} 
                isProfitPrivate={isProfitPrivate}
                isBdtPrivate={isBdtPrivate}
                isEurPrivate={isEurPrivate}
              />
            </div>
          </div>
          <div className="space-y-8">
            <DailyDetails 
              transactions={summary.transactions} 
              selectedDate={selectedReportDate} 
              onDateChange={setSelectedReportDate} 
              isBdtPrivate={isBdtPrivate}
              isEurPrivate={isEurPrivate}
            />
            <MonthlyReport 
              transactions={summary.transactions} 
              userEmail={currentUser?.email} 
              isProfitPrivate={isProfitPrivate}
              isBdtPrivate={isBdtPrivate}
              isEurPrivate={isEurPrivate}
            />
            <AIInput onParsed={addTransaction} />
            <ProfitAdvisor summary={summary.summary} />
          </div>
        </div>

        {/* Hidden Receipt Templates for generation - rendered dynamically on-demand for massive speedup */}
        <div className="fixed left-[-9999px] top-0 pointer-events-none overflow-hidden w-[400px] h-[800px]">
          {generatingReceiptTx && (
            <Receipt transaction={generatingReceiptTx} businessName="রেমিটেন্স LEDGER" userEmail={currentUser?.email || ''} />
          )}
        </div>
      </main>

      <button onClick={() => setIsFormOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-5 rounded-[28px] shadow-2xl shadow-blue-300 hover:bg-blue-700 active:scale-90 transition-all z-40 group border-4 border-white"><svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <TransactionForm onSubmit={addTransaction} avgBuyingRate={summary.summary.avgBuyingRate} transactions={summary.transactions} />
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 overflow-hidden">
            <h2 className="text-3xl font-black text-gray-900 mb-8 text-center tracking-tight">ব্যালেন্স সেটিংস</h2>
            <div className="space-y-8">
              <div className="bg-red-50/50 p-6 rounded-[30px] border border-red-100">
                <label className="block text-[11px] font-bold text-red-500 mb-4 ml-1 uppercase tracking-wider">শুরুতে বিকাশ এজেন্ট আপনার কাছে কত পেত?</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-red-300 font-bold group-focus-within:text-red-500 transition-colors text-xl">৳</span>
                  <input 
                    type="number" 
                    value={tempOpeningBdt} 
                    onChange={(e) => setTempOpeningBdt(e.target.value)} 
                    className="w-full pl-14 p-6 bg-white border-2 border-transparent rounded-[24px] focus:border-red-400 focus:bg-white outline-none transition font-black text-2xl text-red-600 placeholder-red-200 shadow-sm"
                    placeholder="যেমন: -121720"
                  />
                </div>
                <p className="text-[10px] text-red-400 mt-4 italic font-medium px-1">
                   * আপনি যদি ঋণ নিয়ে শুরু করেন, তবে সংখ্যার আগে মাইনাস (-) দিন।
                </p>
              </div>

              <div className="bg-orange-50/50 p-6 rounded-[30px] border border-orange-100">
                <label className="block text-[11px] font-bold text-orange-500 mb-4 ml-1 uppercase tracking-wider">শুরুতে আপনার কাছে কত ইউরো ক্যাশ ছিল?</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-300 font-bold group-focus-within:text-orange-500 transition-colors text-xl">€</span>
                  <input 
                    type="number" 
                    value={tempOpeningEur} 
                    onChange={(e) => setTempOpeningEur(e.target.value)} 
                    className="w-full pl-14 p-6 bg-white border-2 border-transparent rounded-[24px] focus:border-orange-400 focus:bg-white outline-none transition font-black text-2xl text-orange-600 placeholder-orange-200 shadow-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <button onClick={handleUpdateOpeningBalances} className="w-full py-6 bg-[#111827] text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95">ব্যালেন্স আপডেট করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
