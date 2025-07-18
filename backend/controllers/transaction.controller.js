// backend/controllers/transaction.controller.js
const transactionService = require("../services/transaction.service");

const getTransactions = (event, options) => {
  return transactionService.getTransactions(options);
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

const getFinancialSummary = (event, dateRange) => {
  return transactionService.getFinancialSummary(dateRange);
};

const getRecentTransactions = (event, limit) => {
  return transactionService.getRecentTransactions(limit);
};

const getReportData = (event, dateRange) => {
  return transactionService.getReportData(dateRange);
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getRecentTransactions,
  getReportData,
};
