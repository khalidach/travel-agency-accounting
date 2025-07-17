import React, { useState } from "react";
import { Transaction, Category } from "../types";
import { formatCurrency } from "../utils/calculations";
import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "" || transaction.category === categoryFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedTransactions = filteredTransactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "income" | "expense")
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedTransactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No transactions found matching your criteria.
          </div>
        ) : (
          sortedTransactions.map((transaction) => (
            <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "income" ? "Income" : "Expense"}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {transaction.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center ml-4">
                  <p
                    className={`text-lg font-semibold mr-4 ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
