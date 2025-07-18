// backend/routes/category.routes.js
const { ipcMain } = require("electron");
const categoryController = require("../controllers/category.controller");

const setupCategoryRoutes = () => {
  ipcMain.handle("get-categories", categoryController.getCategories);
  ipcMain.handle("add-category", categoryController.addCategory);
  ipcMain.handle("delete-category", categoryController.deleteCategory);
};

module.exports = {
  setupCategoryRoutes,
};
