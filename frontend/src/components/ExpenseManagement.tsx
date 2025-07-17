import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { Plus } from 'lucide-react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

interface ExpenseManagementProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const [showForm, setShowForm] = useState(false);

  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Expense Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      <TransactionList
        transactions={expenseTransactions}
        categories={categories}
        onDelete={onDeleteTransaction}
      />

      {showForm && (
        <TransactionForm
          type="expense"
          categories={categories}
          onSubmit={onAddTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ExpenseManagement;