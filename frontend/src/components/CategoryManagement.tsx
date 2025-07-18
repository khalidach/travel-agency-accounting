import React, { useState, useEffect } from "react";
import { Category, PaginatedResponse } from "../types";
import { Plus, Trash2, X } from "lucide-react";
import { api } from "../service/api";
import Pagination from "./Pagination";

interface CategoryManagementProps {
  onAddCategory: (category: Omit<Category, "id" | "createdAt">) => void;
  onDeleteCategory: (id: number) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  onAddCategory,
  onDeleteCategory,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "income" as "income" | "expense",
    color: "#3B82F6",
  });
  const [incomeCategories, setIncomeCategories] =
    useState<PaginatedResponse<Category> | null>(null);
  const [expenseCategories, setExpenseCategories] =
    useState<PaginatedResponse<Category> | null>(null);
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  const fetchCategories = async () => {
    const incomeRes = await api.getCategories({
      page: incomePage,
      pageSize: 5,
      type: "income",
    });
    setIncomeCategories(incomeRes);

    const expenseRes = await api.getCategories({
      page: expensePage,
      pageSize: 5,
      type: "expense",
    });
    setExpenseCategories(expenseRes);
  };

  useEffect(() => {
    fetchCategories();
  }, [incomePage, expensePage]);

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#EC4899",
    "#6B7280",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a category name");
      return;
    }

    await onAddCategory({
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
    });

    setFormData({
      name: "",
      type: "income",
      color: "#3B82F6",
    });

    setShowForm(false);
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    await onDeleteCategory(id);
    fetchCategories();
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
        <button
          onClick={() => handleDelete(category.id)}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Category Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Income Categories
          </h3>
          <div className="space-y-3">
            {incomeCategories?.data.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
            {incomeCategories?.data.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No income categories yet
              </p>
            )}
          </div>
          {incomeCategories && (
            <Pagination
              currentPage={incomeCategories.meta.page}
              pageCount={incomeCategories.meta.pageCount}
              onPageChange={setIncomePage}
            />
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Expense Categories
          </h3>
          <div className="space-y-3">
            {expenseCategories?.data.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
            {expenseCategories?.data.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No expense categories yet
              </p>
            )}
          </div>
          {expenseCategories && (
            <Pagination
              currentPage={expenseCategories.meta.page}
              pageCount={expenseCategories.meta.pageCount}
              onPageChange={setExpensePage}
            />
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Category
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "income" | "expense",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color
                          ? "border-gray-800"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
