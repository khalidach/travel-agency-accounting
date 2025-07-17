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
  updateCreditStatus: (data: {
    id: number;
    status: "paid" | "unpaid";
  }) => Promise<any>;
  deleteCredit: (id: number) => Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
