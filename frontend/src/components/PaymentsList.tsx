import React from "react";
import { Payment } from "../types";
import { format } from "date-fns";
import { formatCurrency } from "../utils/calculations";
import { Trash2 } from "lucide-react";

interface PaymentsListProps {
  payments: Payment[];
  credit_id: number;
  onDeletePayment: (payment_id: number, credit_id: number) => void;
}

const PaymentsList: React.FC<PaymentsListProps> = ({
  payments,
  credit_id,
  onDeletePayment,
}) => {
  if (payments.length === 0) {
    return <p className="text-xs text-gray-500 mt-2">No payments made yet.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="font-semibold text-sm text-gray-800">Payment History:</h4>
      <ul className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="py-2 flex justify-between items-center"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(payment.date), "MMM dd, yyyy")}
              </p>
            </div>
            <button
              onClick={() => onDeletePayment(payment.id, credit_id)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentsList;
