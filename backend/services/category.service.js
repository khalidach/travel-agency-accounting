// backend/services/category.service.js
const db = require("../db-init");

const getCategories = () => {
  return db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
};

const addCategory = (category) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)"
    );
    const result = stmt.run(category.name, category.type, category.color);
    return db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(result.lastInsertRowid);
  } catch (error) {
    console.error("Failed to add category:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { error: "Category name must be unique." };
    }
    return { error: "An unexpected error occurred." };
  }
};

const deleteCategory = (id) => {
  const transaction = db.transaction((catId) => {
    db.prepare(
      "UPDATE transactions SET category_id = NULL WHERE category_id = ?"
    ).run(catId);
    db.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  });
  transaction(id);
  return { success: true };
};

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
};
