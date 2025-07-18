import React, { useState } from "react";
import { Transaction, Category } from "../types";
import { Plus } from "lucide-react";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

interface IncomeManagementProps {
  categories: Category[];
  onSaveTransaction: (
    transaction: Partial<Transaction>,
    isEditing: boolean
  ) => void;
  onDeleteTransaction: (id: number) => void;
}

const IncomeManagement: React.FC<IncomeManagementProps> = ({
  categories,
  onSaveTransaction,
  onDeleteTransaction,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  const handleSubmit = async (transactionData: Partial<Transaction>) => {
    await onSaveTransaction(transactionData, !!transactionToEdit);
    handleCloseForm();
    setRefreshTrigger((prev) => prev + 1); // Trigger a refresh
  };

  const handleDelete = async (id: number) => {
    await onDeleteTransaction(id);
    setRefreshTrigger((prev) => prev + 1); // Trigger a refresh
  };

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
        transactionType="income"
        categories={categories}
        onDelete={handleDelete}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
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
