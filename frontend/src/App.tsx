import React, { useState, useEffect } from 'react';
import { Transaction, Category } from './types';
import { generateId } from './utils/calculations';
import { createDefaultCategories } from './data/defaultCategories';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IncomeManagement from './components/IncomeManagement';
import ExpenseManagement from './components/ExpenseManagement';
import CategoryManagement from './components/CategoryManagement';
import Reports from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load data from localStorage on component mount
    const savedTransactions = localStorage.getItem('transactions');
    const savedCategories = localStorage.getItem('categories');

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Initialize with default categories
      const defaultCategories = createDefaultCategories();
      setCategories(defaultCategories);
      localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }
  }, []);

  useEffect(() => {
    // Save transactions to localStorage whenever they change
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    // Save categories to localStorage whenever they change
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateId(),
      createdAt: new Date()
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      createdAt: new Date()
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} />;
      case 'income':
        return (
          <IncomeManagement
            transactions={transactions}
            categories={categories}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case 'expenses':
        return (
          <ExpenseManagement
            transactions={transactions}
            categories={categories}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case 'categories':
        return (
          <CategoryManagement
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        );
      case 'reports':
        return <Reports transactions={transactions} categories={categories} />;
      default:
        return <Dashboard transactions={transactions} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;