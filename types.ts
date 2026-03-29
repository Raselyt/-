
export enum TransactionType {
  BUY = 'BUY', // EUR -> BDT Investment
  SELL = 'SELL', // Customer Sent BDT (Profit calculation)
  EXPENSE = 'EXPENSE' // Business Expenses
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
}

export interface Transaction {
  id: string;
  userId: string; // Associated with a user
  date: number;
  type: TransactionType;
  eurAmount: number;
  bdtAmount: number;
  rate: number; // Buying Rate for BUY, Customer Rate for SELL
  cashOutFee: number;
  profitEur: number; // Primary profit metric in EUR
  profitBdt: number; // Secondary for reference
  usedBuyingRate?: number; // The buying rate used to calculate profit
  note: string;
  customerPhoneNumber?: string; // Optional customer phone for WhatsApp
}

export interface BusinessSummary {
  totalInvestmentEur: number;
  totalInvestmentBdt: number;
  avgBuyingRate: number;
  totalProfitBdt: number;
  totalProfitEur: number;
  currentBdtBalance: number;
  currentEurBalance: number;
  openingBalanceBdt: number; 
  openingBalanceEur: number; // Added to track initial EUR cash
  totalCustomerEur: number; // Total EUR received from customers
  periodProfitEur: number;
  periodProfitBdt: number;
}
