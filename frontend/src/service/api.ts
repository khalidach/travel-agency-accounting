import {
  Transaction,
  Category,
  Credit,
  PaginatedResponse,
  PaginationOptions,
  FinancialSummary,
  ReportData,
} from "../types";

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

const parseTransactionDates = (t: any): Transaction => ({
  ...t,
  date: new Date(t.date),
  cashedDate: t.cashedDate ? new Date(t.cashedDate) : undefined,
  createdAt: new Date(t.createdAt),
});

// --- Electron API (Offline) ---
const electronAPI = {
  // Categories
  getCategories: async (
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Category>> => {
    const response = await window.electronAPI.getCategories(options);
    return {
      ...response,
      data: response.data.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
    };
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
  getTransactions: async (
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await window.electronAPI.getTransactions(options);
    return {
      ...response,
      data: response.data.map(parseTransactionDates),
    };
  },
  addTransaction: async (transactionData: any): Promise<Transaction> => {
    const newTransaction = await window.electronAPI.addTransaction(
      transactionData
    );
    return parseTransactionDates(newTransaction);
  },
  updateTransaction: async (transactionData: any): Promise<Transaction> => {
    const updatedTransaction = await window.electronAPI.updateTransaction(
      transactionData
    );
    return parseTransactionDates(updatedTransaction);
  },
  deleteTransaction: (id: number): Promise<void> =>
    window.electronAPI.deleteTransaction(id),
  getFinancialSummary: (dateRange: {
    start: string;
    end: string;
  }): Promise<FinancialSummary> =>
    window.electronAPI.getFinancialSummary(dateRange),
  getRecentTransactions: async (limit?: number): Promise<Transaction[]> => {
    const transactions = await window.electronAPI.getRecentTransactions(limit);
    return transactions.map(parseTransactionDates);
  },
  getReportData: async (dateRange: {
    start: string;
    end: string;
  }): Promise<ReportData> => {
    const reportData = await window.electronAPI.getReportData(dateRange);
    return {
      ...reportData,
      transactions: reportData.transactions.map(parseTransactionDates),
    };
  },

  // Credits
  getCredits: async (
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Credit>> => {
    const response = await window.electronAPI.getCredits(options);
    return {
      ...response,
      data: response.data.map(parseCreditDates),
    };
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
