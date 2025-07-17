import React, { useState } from "react";
import { Credit } from "../types";
import { Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "../utils/calculations";

interface CreditManagementProps {
  credits: Credit[];
  onAddCredit: (credit: Omit<Credit, "id" | "createdAt" | "status">) => void;
  onUpdateCreditStatus: (id: number, status: "paid" | "unpaid") => void;
  onDeleteCredit: (id: number) => void;
}

const CreditManagement: React.FC<CreditManagementProps> = ({
  credits,
  onAddCredit,
  onUpdateCreditStatus,
  onDeleteCredit,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    personName: "",
    type: "lent" as "lent" | "borrowed",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount) {
      alert("Please fill in Person Name and Amount.");
      return;
    }
    onAddCredit({
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date),
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    });
    setShowForm(false);
    setFormData({
      personName: "",
      type: "lent",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
    });
  };

  const creditsGiven = credits.filter((c) => c.type === "lent");
  const creditsTaken = credits.filter((c) => c.type === "borrowed");

  const CreditList = ({
    title,
    creditItems,
  }: {
    title: string;
    creditItems: Credit[];
  }) => (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {creditItems.length > 0 ? (
          creditItems.map((credit) => (
            <div
              key={credit.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{credit.personName}</p>
                  <p className="text-sm text-gray-600">{credit.description}</p>
                  <p
                    className={`text-xl font-bold ${
                      credit.type === "lent" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(credit.amount)}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Date: {format(new Date(credit.date), "MMM dd, yyyy")}</p>
                    {credit.dueDate && (
                      <p>
                        Due: {format(new Date(credit.dueDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      credit.status === "paid"
                        ? "bg-green-200 text-green-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {credit.status}
                  </span>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() =>
                        onUpdateCreditStatus(
                          credit.id,
                          credit.status === "unpaid" ? "paid" : "unpaid"
                        )
                      }
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Mark as {credit.status === "unpaid" ? "Paid" : "Unpaid"}
                    </button>
                    <button
                      onClick={() => onDeleteCredit(credit.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No records found.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Credit Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credit/Debit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditList
          title="Credits Given (Debtors)"
          creditItems={creditsGiven}
        />
        <CreditList
          title="Credits Taken (Creditors)"
          creditItems={creditsTaken}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium">Add New Credit/Debit</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Form fields */}
              <input
                type="text"
                placeholder="Person Name"
                value={formData.personName}
                onChange={(e) =>
                  setFormData({ ...formData, personName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "lent" | "borrowed",
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value="lent">Credit Given (Lent)</option>
                <option value="borrowed">Credit Taken (Borrowed)</option>
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
