import React, { useState, useEffect } from "react";
import { Transaction, Category } from "../types";
import { X } from "lucide-react";

interface TransactionFormProps {
  type: "income" | "expense";
  categories: Category[];
  // Corrected the type of the onSubmit prop to be more flexible
  onSubmit: (transaction: Partial<Transaction>) => void;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  type,
  categories,
  onSubmit,
  onClose,
  transactionToEdit,
}) => {
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    amount: "",
    description: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as "cash" | "check",
    checkNumber: "",
    cashedDate: "",
    status: "cashed" as "cashed" | "pending",
  });

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        id: transactionToEdit.id,
        amount: transactionToEdit.amount.toString(),
        description: transactionToEdit.description,
        category_id: transactionToEdit.category_id?.toString() || "",
        date: new Date(transactionToEdit.date).toISOString().split("T")[0],
        paymentMethod: transactionToEdit.paymentMethod,
        checkNumber: transactionToEdit.checkNumber || "",
        cashedDate: transactionToEdit.cashedDate
          ? new Date(transactionToEdit.cashedDate).toISOString().split("T")[0]
          : "",
        status: transactionToEdit.status,
      });
    }
  }, [transactionToEdit]);

  const filteredCategories = categories.filter((cat) => cat.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      alert("Please fill in amount and description");
      return;
    }

    // This object is now correctly typed and assignable
    const submissionData: Partial<Transaction> = {
      id: formData.id,
      type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category_id: formData.category_id
        ? parseInt(formData.category_id)
        : undefined,
      date: new Date(formData.date),
      paymentMethod: formData.paymentMethod,
      checkNumber: formData.checkNumber || undefined,
      cashedDate: formData.cashedDate
        ? new Date(formData.cashedDate)
        : undefined,
      status:
        formData.paymentMethod === "check" &&
        formData.cashedDate &&
        new Date(formData.cashedDate) > new Date()
          ? "pending"
          : "cashed",
    };

    onSubmit(submissionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {transactionToEdit ? "Edit" : "Add New"}{" "}
            {type === "income" ? "Income" : "Expense"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a category (optional)</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  value="cash"
                  checked={formData.paymentMethod === "cash"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value as "cash" | "check",
                    })
                  }
                />{" "}
                Cash
              </label>
              <label>
                <input
                  type="radio"
                  value="check"
                  checked={formData.paymentMethod === "check"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value as "cash" | "check",
                    })
                  }
                />{" "}
                Check
              </label>
            </div>
          </div>

          {formData.paymentMethod === "check" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Number
                </label>
                <input
                  type="text"
                  value={formData.checkNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, checkNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cashed Date
                </label>
                <input
                  type="date"
                  value={formData.cashedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, cashedDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                type === "income"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {transactionToEdit ? "Update" : "Add"}{" "}
              {type === "income" ? "Income" : "Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
