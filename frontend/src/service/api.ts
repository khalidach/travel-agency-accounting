import { Transaction, Category } from "../types";

const isElectron = !!window.electronAPI;

// --- Electron API (Offline) ---
const electronAPI = {
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
  getTransactions: async (): Promise<Transaction[]> => {
    const transactions = await window.electronAPI.getTransactions();
    return transactions.map((t: any) => ({
      ...t,
      date: new Date(t.date),
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
      createdAt: new Date(newTransaction.createdAt),
    };
  },
  deleteTransaction: (id: number): Promise<void> =>
    window.electronAPI.deleteTransaction(id),
};

// --- Web API (Online) ---
const API_URL = "http://localhost:3001/api";

const webAPI = {
  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    const categories: Category[] = await response.json();
    return categories.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
  },
  addCategory: async (
    categoryData: Omit<Category, "id" | "createdAt">
  ): Promise<Category> => {
    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error("Failed to add category");
    const newCategory: Category = await response.json();
    return { ...newCategory, createdAt: new Date(newCategory.createdAt) };
  },
  deleteCategory: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");
  },
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/transactions`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    const transactions: any[] = await response.json();
    return transactions.map((t: any) => ({
      ...t,
      date: new Date(t.date),
      createdAt: new Date(t.created_at),
    }));
  },
  addTransaction: async (transactionData: any): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) throw new Error("Failed to add transaction");
    const newTransaction: any = await response.json();
    return {
      ...newTransaction,
      date: new Date(newTransaction.date),
      createdAt: new Date(newTransaction.createdAt),
    };
  },
  deleteTransaction: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  },
};

// Export the correct API based on the environment
export const api = isElectron ? electronAPI : webAPI;
