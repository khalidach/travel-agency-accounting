// backend/controllers/category.controller.js
const categoryService = require("../services/category.service");

const getCategories = (event) => {
  return categoryService.getCategories();
};

const addCategory = (event, category) => {
  return categoryService.addCategory(category);
};

const deleteCategory = (event, id) => {
  return categoryService.deleteCategory(id);
};

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
};
