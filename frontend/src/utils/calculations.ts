import { Transaction, FinancialSummary, DateRange } from "../types";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export const calculateSummary = (
  transactions: Transaction[]
): FinancialSummary => {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netProfit: income - expenses,
    transactionCount: transactions.length,
  };
};

export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  dateRange: DateRange
): Transaction[] => {
  return transactions.filter((transaction) =>
    isWithinInterval(new Date(transaction.date), {
      // Ensure date is a Date object
      start: dateRange.start,
      end: dateRange.end,
    })
  );
};

export const getCurrentMonthRange = (): DateRange => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const groupTransactionsByCategory = (transactions: Transaction[]) => {
  const grouped = transactions.reduce((acc, transaction) => {
    // Use 'Uncategorized' as a fallback if the category is not defined.
    const categoryKey = transaction.category || "Uncategorized";
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return Object.entries(grouped).map(([category, transactions]) => ({
    category,
    transactions,
    total: transactions.reduce((sum, t) => sum + t.amount, 0),
  }));
};
