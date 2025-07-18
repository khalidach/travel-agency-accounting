import React, { useState, useEffect } from "react";
import { Transaction, FinancialSummary } from "../types";
import { formatCurrency } from "../utils/calculations";
import { TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { api } from "../service/api";

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const summaryData = await api.getFinancialSummary({
        start: monthStart.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      });
      setSummary(summaryData);

      const recentData = await api.getRecentTransactions(5);
      setRecentTransactions(recentData);
    };
    fetchData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (!summary) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income (This Month)"
          value={formatCurrency(summary.totalIncome)}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Expenses (This Month)"
          value={formatCurrency(summary.totalExpenses)}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Net Profit (This Month)"
          value={formatCurrency(summary.netProfit)}
          icon={DollarSign}
          color={summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}
          bgColor={summary.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}
        />
        <StatCard
          title="Total Transactions (This Month)"
          value={summary.transactionCount.toString()}
          icon={FileText}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Transactions (All)
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No transactions yet.
            </div>
          ) : (
            recentTransactions.map((transaction) => (
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
                        {transaction.type}
                      </span>
                      {transaction.category && (
                        <span className="ml-2 text-sm text-gray-600">
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
                  </div>
                  <div className="ml-4">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
