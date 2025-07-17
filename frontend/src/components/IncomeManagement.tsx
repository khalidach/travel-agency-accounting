import React, { useState } from "react";
import { Transaction, Category } from "../types";
import { Plus } from "lucide-react";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

interface IncomeManagementProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => void;
  onDeleteTransaction: (id: number) => void;
}

const IncomeManagement: React.FC<IncomeManagementProps> = ({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [showForm, setShowForm] = useState(false);

  const incomeTransactions = transactions.filter((t) => t.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Income Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </button>
      </div>

      <TransactionList
        transactions={incomeTransactions}
        categories={categories}
        onDelete={onDeleteTransaction}
      />

      {showForm && (
        <TransactionForm
          type="income"
          categories={categories}
          onSubmit={onAddTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default IncomeManagement;
