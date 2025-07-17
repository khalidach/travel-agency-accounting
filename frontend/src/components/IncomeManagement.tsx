import React, { useState } from "react";
import { Transaction, Category } from "../types";
import { Plus } from "lucide-react";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

interface IncomeManagementProps {
  transactions: Transaction[];
  categories: Category[];
  onSaveTransaction: (
    transaction: Partial<Transaction>, // Corrected type to match child component
    isEditing: boolean
  ) => void;
  onDeleteTransaction: (id: number) => void;
}

const IncomeManagement: React.FC<IncomeManagementProps> = ({
  transactions,
  categories,
  onSaveTransaction,
  onDeleteTransaction,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  const handleSubmit = (transactionData: Partial<Transaction>) => {
    // Corrected type here
    onSaveTransaction(transactionData, !!transactionToEdit);
    handleCloseForm();
  };

  const incomeTransactions = transactions.filter((t) => t.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Income Management
        </h2>
        <button
          onClick={() => {
            setTransactionToEdit(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </button>
      </div>

      <TransactionList
        transactions={incomeTransactions}
        categories={categories}
        onDelete={onDeleteTransaction}
        onEdit={handleEdit}
      />

      {showForm && (
        <TransactionForm
          type="income"
          categories={categories}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          transactionToEdit={transactionToEdit}
        />
      )}
    </div>
  );
};

export default IncomeManagement;
