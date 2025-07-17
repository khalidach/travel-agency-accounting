import React, { useState, useEffect } from "react";
import { Credit } from "../types";
import { X } from "lucide-react";

interface CreditFormProps {
  onClose: () => void;
  onSubmit: (
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
  ) => void;
  creditToEdit?: Credit | null;
}

const CreditForm: React.FC<CreditFormProps> = ({
  onClose,
  onSubmit,
  creditToEdit,
}) => {
  const [formData, setFormData] = useState({
    personName: "",
    type: "lent" as "lent" | "borrowed",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
  });

  const isEditing = !!creditToEdit;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        personName: creditToEdit.personName,
        type: creditToEdit.type,
        amount: creditToEdit.amount.toString(),
        description: creditToEdit.description || "",
        date: new Date(creditToEdit.date).toISOString().split("T")[0],
        dueDate: creditToEdit.dueDate
          ? new Date(creditToEdit.dueDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [creditToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount) {
      alert("Please fill in Person Name and Amount.");
      return;
    }

    const submissionData = {
      ...creditToEdit, // a new credit won't have this, an existing one will carry over its properties
      personName: formData.personName,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date(formData.date),
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    };

    onSubmit(submissionData, isEditing);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit Credit/Debit" : "Add New Credit/Debit"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditForm;
