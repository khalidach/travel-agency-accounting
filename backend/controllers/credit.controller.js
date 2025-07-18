// backend/controllers/credit.controller.js
const creditService = require("../services/credit.service");

const getCredits = (event, options) => {
  return creditService.getCredits(options);
};

const addCredit = (event, credit) => {
  return creditService.addCredit(credit);
};

const updateCredit = (event, credit) => {
  return creditService.updateCredit(credit);
};

const deleteCredit = (event, id) => {
  return creditService.deleteCredit(id);
};

const toggleCreditInclusion = (event, data) => {
  return creditService.toggleCreditInclusion(data);
};

const addPayment = (event, paymentData) => {
  return creditService.addPayment(paymentData);
};

const deletePayment = (event, paymentData) => {
  return creditService.deletePayment(paymentData);
};

module.exports = {
  getCredits,
  addCredit,
  updateCredit,
  deleteCredit,
  toggleCreditInclusion,
  addPayment,
  deletePayment,
};
