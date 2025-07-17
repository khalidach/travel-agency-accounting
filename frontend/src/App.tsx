import { useState, useEffect } from "react";
import { Transaction, Category } from "./types";
import { api } from "./service/api";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import IncomeManagement from "./components/IncomeManagement";
import ExpenseManagement from "./components/ExpenseManagement";
import CategoryManagement from "./components/CategoryManagement";
import Reports from "./components/Reports";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([
        api.getTransactions(),
        api.getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError(
        "Failed to load data. Please make sure the backend server or local database is available."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTransaction = async (
    transactionData: Omit<Transaction, "id" | "createdAt">
  ) => {
    try {
      const categoryObj = categories.find(
        (c) => c.name === transactionData.category
      );
      if (!categoryObj) {
        throw new Error("Category not found");
      }

      const newTransactionData = {
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        category_id: categoryObj.id,
        date: new Date(transactionData.date).toISOString().split("T")[0],
      };

      await api.addTransaction(newTransactionData);
      fetchData(); // Refetch all data to stay in sync
    } catch (err) {
      console.error("Failed to add transaction", err);
      setError("Failed to add transaction.");
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete transaction", err);
      setError("Failed to delete transaction.");
    }
  };

  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt">
  ) => {
    try {
      const newCategory = await api.addCategory(categoryData);
      setCategories((prev) => [...prev, newCategory]);
    } catch (err) {
      console.error("Failed to add category", err);
      setError("Failed to add category.");
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await api.deleteCategory(id);
      // Refetch data since deleting a category also deletes its transactions on the backend
      fetchData();
    } catch (err) {
      console.error("Failed to delete category", err);
      setError("Failed to delete category.");
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">Loading...</div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    switch (activeTab) {
      case "dashboard":
        return <Dashboard transactions={transactions} />;
      case "income":
        return (
          <IncomeManagement
            transactions={transactions.filter((t) => t.type === "income")}
            categories={categories.filter((c) => c.type === "income")}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "expenses":
        return (
          <ExpenseManagement
            transactions={transactions.filter((t) => t.type === "expense")}
            categories={categories.filter((c) => c.type === "expense")}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "categories":
        return (
          <CategoryManagement
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        );
      case "reports":
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
