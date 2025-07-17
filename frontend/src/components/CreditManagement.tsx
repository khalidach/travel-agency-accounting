import React, { useState } from "react";
import { Credit } from "../types";
import { Plus, Trash2, Edit, MoreVertical, X } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "../utils/calculations";
import CreditForm from "./CreditForm";
import PaymentForm from "./PaymentForm";
import PaymentsList from "./PaymentsList";

interface CreditManagementProps {
  credits: Credit[];
  onSaveCredit: (
    credit:
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
  onDeleteCredit: (id: number) => void;
  onAddPayment: (paymentData: {
    credit_id: number;
    amount: number;
    date: string;
  }) => void;
  onDeletePayment: (payment_id: number, credit_id: number) => void;
}

const CreditManagement: React.FC<CreditManagementProps> = ({
  credits,
  onSaveCredit,
  onDeleteCredit,
  onAddPayment,
  onDeletePayment,
}) => {
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [creditToEdit, setCreditToEdit] = useState<Credit | null>(null);
  const [creditForPayment, setCreditForPayment] = useState<Credit | null>(null);

  const handleOpenCreditForm = (credit?: Credit) => {
    setCreditToEdit(credit || null);
    setShowCreditForm(true);
  };

  const handleCloseCreditForm = () => {
    setCreditToEdit(null);
    setShowCreditForm(false);
  };

  const handleOpenPaymentForm = (credit: Credit) => {
    setCreditForPayment(credit);
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setCreditForPayment(null);
    setShowPaymentForm(false);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-200 text-green-800";
      case "partially-paid":
        return "bg-yellow-200 text-yellow-800";
      case "unpaid":
      default:
        return "bg-red-200 text-red-800";
    }
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
                  <div className="text-xs mt-2">
                    <p>
                      Paid:{" "}
                      <span className="font-semibold text-green-700">
                        {formatCurrency(credit.totalPaid)}
                      </span>
                    </p>
                    <p>
                      Balance:{" "}
                      <span className="font-semibold text-red-700">
                        {formatCurrency(credit.remainingBalance)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                      credit.status
                    )}`}
                  >
                    {credit.status.replace("-", " ")}
                  </span>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleOpenPaymentForm(credit)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Manage Payments
                    </button>
                    <button
                      onClick={() => handleOpenCreditForm(credit)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit size={16} />
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
              <PaymentsList
                payments={credit.payments}
                credit_id={credit.id}
                onDeletePayment={onDeletePayment}
              />
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
          onClick={() => handleOpenCreditForm()}
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

      {showCreditForm && (
        <CreditForm
          onClose={handleCloseCreditForm}
          onSubmit={onSaveCredit}
          creditToEdit={creditToEdit}
        />
      )}
      {showPaymentForm && creditForPayment && (
        <PaymentForm
          credit={creditForPayment}
          onClose={handleClosePaymentForm}
          onAddPayment={onAddPayment}
        />
      )}
    </div>
  );
};

export default CreditManagement;
