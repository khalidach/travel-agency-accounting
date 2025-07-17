const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Categories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  addCategory: (category) => ipcRenderer.invoke("add-category", category),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),

  // Transactions
  getTransactions: () => ipcRenderer.invoke("get-transactions"),
  addTransaction: (transaction) =>
    ipcRenderer.invoke("add-transaction", transaction),
  deleteTransaction: (id) => ipcRenderer.invoke("delete-transaction", id),
});
