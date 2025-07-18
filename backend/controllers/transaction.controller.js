// backend/controllers/transaction.controller.js
const transactionService = require("../services/transaction.service");

const getTransactions = (event) => {
  return transactionService.getTransactions();
};

const addTransaction = (event, transaction) => {
  return transactionService.addTransaction(transaction);
};

const updateTransaction = (event, transaction) => {
  return transactionService.updateTransaction(transaction);
};

const deleteTransaction = (event, id) => {
  return transactionService.deleteTransaction(id);
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
