
export enum TransactionType {
  BUY = 'BUY', // EUR -> BDT Investment
  SELL = 'SELL' // Customer Sent BDT (Profit calculation)
}

export interface Transaction {
  id: string;
  date: number;
  type: TransactionType;
  eurAmount: number;
  bdtAmount: number;
  rate: number; // Buying Rate for BUY, Customer Rate for SELL
  cashOutFee: number;
  profitEur: number; // Primary profit metric in EUR
  profitBdt: number; // Secondary for reference
  note: string;
}

export interface BusinessSummary {
  totalInvestmentEur: number;
  totalInvestmentBdt: number;
  avgBuyingRate: number;
  totalProfitBdt: number;
  totalProfitEur: number;
  currentBdtBalance: number;
  currentEurBalance: number;
}
