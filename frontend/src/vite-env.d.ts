/// <reference types="vite/client" />

interface PaginationOptions {
  page?: number;
  pageSize?: number;
  type?: "income" | "expense" | "lent" | "borrowed";
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

interface ElectronAPI {
  // Categories
  getCategories: (
    options?: PaginationOptions
  ) => Promise<PaginatedResponse<any>>;
  addCategory: (category: any) => Promise<any>;
  deleteCategory: (id: number) => Promise<void>;

  // Transactions
  getTransactions: (
    options?: PaginationOptions
  ) => Promise<PaginatedResponse<any>>;
  addTransaction: (transaction: any) => Promise<any>;
  updateTransaction: (transaction: any) => Promise<any>;
  deleteTransaction: (id: number) => Promise<void>;
  getFinancialSummary: (dateRange: {
    start: string;
    end: string;
  }) => Promise<any>;
  getRecentTransactions: (limit?: number) => Promise<any[]>;

  // Credits
  getCredits: (options?: PaginationOptions) => Promise<PaginatedResponse<any>>;
  addCredit: (credit: any) => Promise<any>;
  updateCredit: (credit: any) => Promise<any>;
  deleteCredit: (id: number) => Promise<{ success: true }>;
  toggleCreditInclusion: (data: {
    credit_id: number;
    include: boolean;
  }) => Promise<any>;

  // Payments
  addPayment: (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }) => Promise<any>;
  deletePayment: (paymentData: { payment_id: number }) => Promise<any>;
}

interface Window {
  electronAPI: ElectronAPI;
}
