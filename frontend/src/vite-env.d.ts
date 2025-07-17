/// <reference types="vite/client" />

interface ElectronAPI {
  getCategories: () => Promise<any[]>;
  addCategory: (category: any) => Promise<any>;
  deleteCategory: (id: number) => Promise<void>;
  getTransactions: () => Promise<any[]>;
  addTransaction: (transaction: any) => Promise<any>;
  deleteTransaction: (id: number) => Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
