import { Transaction, Category, Credit, Payment } from "../types";

const isElectron = !!window.electronAPI;

// Helper to parse dates in credit objects
const parseCreditDates = (credit: any): Credit => ({
  ...credit,
  date: new Date(credit.date),
  dueDate: credit.dueDate ? new Date(credit.dueDate) : undefined,
  createdAt: new Date(credit.createdAt),
  payments: credit.payments.map((p: any) => ({
    ...p,
    date: new Date(p.date),
    createdAt: new Date(p.createdAt),
  })),
});

// --- Electron API (Offline) ---
const electronAPI = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const categories = await window.electronAPI.getCategories();
    return categories.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
    }));
  },
  addCategory: async (
    categoryData: Omit<Category, "id" | "createdAt">
  ): Promise<Category> => {
    const newCategory = await window.electronAPI.addCategory(categoryData);
    return { ...newCategory, createdAt: new Date(newCategory.createdAt) };
  },
  deleteCategory: (id: number): Promise<void> =>
    window.electronAPI.deleteCategory(id),

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const transactions = await window.electronAPI.getTransactions();
    return transactions.map((t: any) => ({
      ...t,
      date: new Date(t.date),
      cashedDate: t.cashedDate ? new Date(t.cashedDate) : undefined,
      createdAt: new Date(t.createdAt),
    }));
  },
  addTransaction: async (transactionData: any): Promise<Transaction> => {
    const newTransaction = await window.electronAPI.addTransaction(
      transactionData
    );
    return {
      ...newTransaction,
      date: new Date(newTransaction.date),
      cashedDate: newTransaction.cashedDate
        ? new Date(newTransaction.cashedDate)
        : undefined,
      createdAt: new Date(newTransaction.createdAt),
    };
  },
  updateTransaction: async (transactionData: any): Promise<Transaction> => {
    const updatedTransaction = await window.electronAPI.updateTransaction(
      transactionData
    );
    return {
      ...updatedTransaction,
      date: new Date(updatedTransaction.date),
      cashedDate: updatedTransaction.cashedDate
        ? new Date(updatedTransaction.cashedDate)
        : undefined,
      createdAt: new Date(updatedTransaction.createdAt),
    };
  },
  deleteTransaction: (id: number): Promise<void> =>
    window.electronAPI.deleteTransaction(id),

  // Credits
  getCredits: async (): Promise<Credit[]> => {
    const credits = await window.electronAPI.getCredits();
    return credits.map(parseCreditDates);
  },
  addCredit: async (creditData: any): Promise<Credit> => {
    const newCredit = await window.electronAPI.addCredit(creditData);
    return parseCreditDates(newCredit);
  },
  updateCredit: async (creditData: any): Promise<Credit> => {
    const updatedCredit = await window.electronAPI.updateCredit(creditData);
    return parseCreditDates(updatedCredit);
  },
  deleteCredit: (id: number): Promise<{ success: true }> =>
    window.electronAPI.deleteCredit(id),
  toggleCreditInclusion: async (data: {
    credit_id: number;
    include: boolean;
  }): Promise<Credit> => {
    const updatedCredit = await window.electronAPI.toggleCreditInclusion(data);
    return parseCreditDates(updatedCredit);
  },

  // Payments
  addPayment: async (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }): Promise<Credit> => {
    const updatedCredit = await window.electronAPI.addPayment(paymentData);
    return parseCreditDates(updatedCredit);
  },
  deletePayment: async (paymentData: {
    payment_id: number;
  }): Promise<Credit | null> => {
    const updatedCredit = await window.electronAPI.deletePayment(paymentData);
    if (updatedCredit) {
      return parseCreditDates(updatedCredit);
    }
    return null;
  },
};

// For simplicity, this example assumes Electron environment.
// The webAPI part would need to be built out on a real server.
export const api = electronAPI;
