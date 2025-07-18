import React, { useState, useEffect } from "react";
import { Category, ReportData } from "../types";
import { formatCurrency } from "../utils/calculations";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Download, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "../service/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportsProps {
  categories: Category[];
}

const Reports: React.FC<ReportsProps> = ({ categories }) => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.getReportData({
        start: dateRange.start,
        end: dateRange.end,
      });
      setReportData(data);
    };
    fetchData();
  }, [dateRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Financial Overview",
      },
    },
  };

  const incomeChartData = {
    labels: reportData?.incomeByCategory.map((item) => item.category) || [],
    datasets: [
      {
        label: "Income",
        data: reportData?.incomeByCategory.map((item) => item.total) || [],
        backgroundColor:
          reportData?.incomeByCategory.map((item) => {
            const category = categories.find((c) => c.name === item.category);
            return category?.color || "#3B82F6";
          }) || [],
      },
    ],
  };

  const expenseChartData = {
    labels: reportData?.expenseByCategory.map((item) => item.category) || [],
    datasets: [
      {
        label: "Expenses",
        data: reportData?.expenseByCategory.map((item) => item.total) || [],
        backgroundColor:
          reportData?.expenseByCategory.map((item) => {
            const category = categories.find((c) => c.name === item.category);
            return category?.color || "#EF4444";
          }) || [],
      },
    ],
  };

  const exportData = () => {
    if (!reportData) return;
    const csvContent = [
      [
        "Date",
        "Type",
        "Category",
        "Description",
        "Amount",
        "Payment Method",
        "Check Number",
        "Cashed Date",
        "Status",
      ],
      ...reportData.transactions.map((t) => [
        format(new Date(t.date), "yyyy-MM-dd"),
        t.type,
        t.category || "N/A",
        t.description,
        t.amount.toString(),
        t.paymentMethod,
        t.checkNumber || "",
        t.cashedDate ? format(new Date(t.cashedDate), "yyyy-MM-dd") : "",
        t.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!reportData) {
    return <div>Loading...</div>;
  }

  const { summary } = reportData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Financial Reports
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p
                className={`text-2xl font-semibold ${
                  summary.netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Income by Category
          </h3>
          {reportData.incomeByCategory.length > 0 ? (
            <div className="h-64">
              <Doughnut data={incomeChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No income data for selected period
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Expenses by Category
          </h3>
          {reportData.expenseByCategory.length > 0 ? (
            <div className="h-64">
              <Doughnut data={expenseChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data for selected period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
