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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const categoriesData = await api.getCategories({
        page: 1,
        pageSize: 1000,
      }); // Fetch all for dropdowns
      setCategories(categoriesData.data);
      setError(null);
    } catch (err) {
      setError("Failed to load data. Please make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
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
    } catch (err) {
      console.error("Failed to save transaction", err);
      setError("Failed to save transaction.");
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
    } catch (err) {
      console.error("Failed to delete transaction", err);
      setError("Failed to delete transaction.");
    }
  };

  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt">
  ) => {
    try {
      await api.addCategory(categoryData);
      fetchInitialData(); // Refetch all categories
    } catch (err) {
      console.error("Failed to add category", err);
      setError("Failed to add category.");
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await api.deleteCategory(id);
      fetchInitialData(); // Refetch all categories
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
    } catch (err) {
      console.error("Failed to save credit", err);
      setError("Failed to save credit.");
    }
  };

  const deleteCredit = async (id: number) => {
    try {
      await api.deleteCredit(id);
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
      await api.addPayment(paymentData);
    } catch (err) {
      console.error("Failed to add payment", err);
      setError("Failed to add payment.");
    }
  };

  const deletePayment = async (payment_id: number) => {
    try {
      await api.deletePayment({ payment_id });
    } catch (err) {
      console.error("Failed to delete payment", err);
      setError("Failed to delete payment.");
    }
  };

  const handleToggleInclusion = async (credit_id: number, include: boolean) => {
    try {
      await api.toggleCreditInclusion({
        credit_id,
        include,
      });
    } catch (err) {
      console.error("Failed to toggle credit inclusion", err);
      setError("Failed to toggle credit inclusion.");
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
        return <Dashboard />;
      case "income":
        return (
          <IncomeManagement
            categories={categories.filter((c) => c.type === "income")}
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "expenses":
        return (
          <ExpenseManagement
            categories={categories.filter((c) => c.type === "expense")}
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case "credits":
        return (
          <CreditManagement
            onSaveCredit={saveCredit}
            onDeleteCredit={deleteCredit}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
            onToggleInclusion={handleToggleInclusion}
          />
        );
      case "categories":
        return (
          <CategoryManagement
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        );
      case "reports":
        return <Reports categories={categories} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
