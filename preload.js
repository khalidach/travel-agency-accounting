// preload.js - Place this in the root of your project

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process (React app)
// to use the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld("electronAPI", {
  // Categories
  getCategories: (options) => ipcRenderer.invoke("get-categories", options),
  addCategory: (category) => ipcRenderer.invoke("add-category", category),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),

  // Transactions
  getTransactions: (options) => ipcRenderer.invoke("get-transactions", options),
  addTransaction: (transaction) =>
    ipcRenderer.invoke("add-transaction", transaction),
  updateTransaction: (transaction) =>
    ipcRenderer.invoke("update-transaction", transaction),
  deleteTransaction: (id) => ipcRenderer.invoke("delete-transaction", id),
  getFinancialSummary: (dateRange) =>
    ipcRenderer.invoke("get-financial-summary", dateRange),
  getRecentTransactions: (limit) =>
    ipcRenderer.invoke("get-recent-transactions", limit),

  // Credits
  getCredits: (options) => ipcRenderer.invoke("get-credits", options),
  addCredit: (credit) => ipcRenderer.invoke("add-credit", credit),
  updateCredit: (credit) => ipcRenderer.invoke("update-credit", credit),
  deleteCredit: (id) => ipcRenderer.invoke("delete-credit", id),
  toggleCreditInclusion: (data) =>
    ipcRenderer.invoke("toggle-credit-inclusion", data),

  // Payments
  addPayment: (paymentData) => ipcRenderer.invoke("add-payment", paymentData),
  deletePayment: (paymentData) =>
    ipcRenderer.invoke("delete-payment", paymentData),
});
