import React, { useState, useEffect } from "react";
import { Transaction, Category, PaginatedResponse } from "../types";
import { formatCurrency } from "../utils/calculations";
import { format } from "date-fns";
import { Search, Trash2, Edit, CheckCircle, Clock } from "lucide-react";
import { api } from "../service/api";
import Pagination from "./Pagination";
import { useDebounce } from "../hooks/useDebounce";

interface TransactionListProps {
  transactionType: "income" | "expense";
  categories: Category[];
  onDelete: (id: number) => void;
  onEdit: (transaction: Transaction) => void;
  refreshTrigger: number;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactionType,
  categories,
  onDelete,
  onEdit,
  refreshTrigger,
}) => {
  const [transactions, setTransactions] =
    useState<PaginatedResponse<Transaction> | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(
    undefined
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchTransactions = async () => {
    const res = await api.getTransactions({
      page,
      pageSize: 10,
      type: transactionType,
      searchTerm: debouncedSearchTerm,
      category_id: categoryFilter,
    });
    setTransactions(res);
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    page,
    debouncedSearchTerm,
    categoryFilter,
    transactionType,
    refreshTrigger,
  ]);

  const handleDelete = async (id: number) => {
    await onDelete(id);
    fetchTransactions();
  };

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter || ""}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions && transactions.data.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No transactions found matching your criteria.
          </div>
        ) : (
          transactions?.data.map((transaction) => (
            <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                    {transaction.category && (
                      <span className="text-sm text-gray-600">
                        {transaction.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                  {transaction.paymentMethod === "check" && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>Check #{transaction.checkNumber}</span>
                      {transaction.status === "pending" ? (
                        <Clock size={12} className="text-orange-500" />
                      ) : (
                        <CheckCircle size={12} className="text-green-500" />
                      )}
                      <span>{transaction.status}</span>
                      {transaction.cashedDate && (
                        <span>
                          Cashed:{" "}
                          {format(
                            new Date(transaction.cashedDate),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      )}
                    </div>
                  )}
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
                    onClick={() => onEdit(transaction)}
                    className="text-blue-400 hover:text-blue-600 mr-2"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {transactions && (
        <Pagination
          currentPage={transactions.meta.page}
          pageCount={transactions.meta.pageCount}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default TransactionList;
