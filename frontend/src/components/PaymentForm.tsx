import React, { useState } from "react";
import { Credit } from "../types";
import { X } from "lucide-react";
import { formatCurrency } from "../utils/calculations";

interface PaymentFormProps {
  credit: Credit;
  onClose: () => void;
  onAddPayment: (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  credit,
  onClose,
  onAddPayment,
}) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    if (paymentAmount > credit.remainingBalance) {
      alert(
        `Payment amount cannot exceed the remaining balance of ${formatCurrency(
          credit.remainingBalance
        )}.`
      );
      return;
    }

    onAddPayment({
      credit_id: credit.id,
      amount: paymentAmount,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Add Payment for {credit.personName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p>
              Total Amount:{" "}
              <span className="font-semibold">
                {formatCurrency(credit.amount)}
              </span>
            </p>
            <p>
              Remaining Balance:{" "}
              <span className="font-semibold text-red-600">
                {formatCurrency(credit.remainingBalance)}
              </span>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
