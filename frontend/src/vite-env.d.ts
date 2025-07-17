/// <reference types="vite/client" />

interface ElectronAPI {
  // Categories
  getCategories: () => Promise<any[]>;
  addCategory: (category: any) => Promise<any>;
  deleteCategory: (id: number) => Promise<void>;

  // Transactions
  getTransactions: () => Promise<any[]>;
  addTransaction: (transaction: any) => Promise<any>;
  updateTransaction: (transaction: any) => Promise<any>;
  deleteTransaction: (id: number) => Promise<void>;

  // Credits
  getCredits: () => Promise<any[]>;
  addCredit: (credit: any) => Promise<any>;
  updateCredit: (credit: any) => Promise<any>;
  deleteCredit: (id: number) => Promise<void>;

  // Payments
  addPayment: (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }) => Promise<any>;
  deletePayment: (paymentData: {
    payment_id: number;
    credit_id: number;
  }) => Promise<any>;
}

interface Window {
  electronAPI: ElectronAPI;
}
