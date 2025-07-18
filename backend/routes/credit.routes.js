// backend/routes/credit.routes.js
const { ipcMain } = require("electron");
const creditController = require("../controllers/credit.controller");

const setupCreditRoutes = () => {
  ipcMain.handle("get-credits", creditController.getCredits);
  ipcMain.handle("add-credit", creditController.addCredit);
  ipcMain.handle("update-credit", creditController.updateCredit);
  ipcMain.handle("delete-credit", creditController.deleteCredit);
  ipcMain.handle(
    "toggle-credit-inclusion",
    creditController.toggleCreditInclusion
  );
  ipcMain.handle("add-payment", creditController.addPayment);
  ipcMain.handle("delete-payment", creditController.deletePayment);
};

module.exports = {
  setupCreditRoutes,
};
