// backend/routes/transaction.routes.js
const { ipcMain } = require("electron");
const transactionController = require("../controllers/transaction.controller");

const setupTransactionRoutes = () => {
  ipcMain.handle("get-transactions", transactionController.getTransactions);
  ipcMain.handle("add-transaction", transactionController.addTransaction);
  ipcMain.handle("update-transaction", transactionController.updateTransaction);
  ipcMain.handle("delete-transaction", transactionController.deleteTransaction);
};

module.exports = {
  setupTransactionRoutes,
};
