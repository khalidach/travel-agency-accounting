import { useState, useEffect } from "react";
import { Transaction, Category, Credit } from "./types";
import { api } from "./service/api";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import IncomeManagement from "./components/IncomeManagement";
import ExpenseManagement from "./components/ExpenseManagement";
import CategoryManagement from "./components/CategoryManagement";
import Reports from "./components/Reports";
import CreditManagement from "./components/CreditManagement";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, creditsData] = await Promise.all(
        [api.getTransactions(), api.getCategories(), api.getCredits()]
      );
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setCredits(creditsData);
      setError(null);
    } catch (err) {
      setError("Failed to load data. Please make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveTransaction = async (
    transactionData: Partial<Transaction>,
    isEditing: boolean
  ) => {
    try {
      const payload = {
        ...transactionData,
        date: new Date(transactionData.date!).toISOString().split("T")[0],
        cashedDate: transactionData.cashedDate
          ? new Date(transactionData.cashedDate).toISOString().split("T")[0]
          : null,
      };

      if (isEditing) {
        await api.updateTransaction(payload);
      } else {
        await api.addTransaction(payload);
      }
      fetchData(); // Refetch all data to keep everything in sync
    } catch (err) {
      console.error("Failed to save transaction", err);
      setError("Failed to save transaction.");
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
      fetchData(); // Refetch to update transactions with null category_id
    } catch (err) {
      console.error("Failed to delete category", err);
      setError("Failed to delete category.");
    }
  };

  // --- Credit and Payment Handlers ---

  const saveCredit = async (
    creditData:
      | Omit<
          Credit,
          | "id"
          | "createdAt"
          | "status"
          | "payments"
          | "totalPaid"
          | "remainingBalance"
        >
      | Credit,
    isEditing: boolean
  ) => {
    try {
      const payload = {
        ...creditData,
        date: new Date(creditData.date!).toISOString().split("T")[0],
        dueDate: creditData.dueDate
          ? new Date(creditData.dueDate).toISOString().split("T")[0]
          : null,
      };

      if (isEditing) {
        await api.updateCredit(payload);
      } else {
        await api.addCredit(payload);
      }
      fetchData(); // Refetch all data to reflect changes
    } catch (err) {
      console.error("Failed to save credit", err);
      setError("Failed to save credit.");
    }
  };

  const deleteCredit = async (id: number) => {
    try {
      await api.deleteCredit(id);
      setCredits((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete credit", err);
      setError("Failed to delete credit.");
    }
  };

  const addPayment = async (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }) => {
    try {
      const updatedCredit = await api.addPayment(paymentData);
      setCredits((prev) =>
        prev.map((c) => (c.id === updatedCredit.id ? updatedCredit : c))
      );
      // Also refetch transactions to show the new payment transaction
      const transactionsData = await api.getTransactions();
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Failed to add payment", err);
      setError("Failed to add payment.");
    }
  };

  const deletePayment = async (payment_id: number, credit_id: number) => {
    try {
      const updatedCredit = await api.deletePayment({ payment_id, credit_id });
      setCredits((prev) =>
        prev.map((c) => (c.id === updatedCredit.id ? updatedCredit : c))
      );
      // Refetch transactions as a payment-related transaction was likely deleted
      fetchData();
    } catch (err) {
      console.error("Failed to delete payment", err);
      setError("Failed to delete payment.");
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
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "expenses":
        return (
          <ExpenseManagement
            transactions={transactions.filter((t) => t.type === "expense")}
            categories={categories.filter((c) => c.type === "expense")}
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "credits":
        return (
          <CreditManagement
            credits={credits}
            onSaveCredit={saveCredit}
            onDeleteCredit={deleteCredit}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
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
