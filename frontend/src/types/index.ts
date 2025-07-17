export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string; // Category is now optional
  category_id?: number;
  date: Date;
  paymentMethod: "cash" | "check";
  checkNumber?: string;
  cashedDate?: Date;
  status: "cashed" | "pending";
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  createdAt: Date;
}

export interface Credit {
  id: number;
  personName: string;
  type: "lent" | "borrowed"; // 'lent' is credit given, 'borrowed' is credit taken
  amount: number;
  description?: string;
  date: Date;
  dueDate?: Date;
  status: "unpaid" | "paid";
  createdAt: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}
