// backend/services/category.service.js
const db = require("../db-init");

// In-memory cache for categories
const categoryCache = {
  data: null,
  timestamp: null,
  // Cache will be valid for 5 minutes
  ttl: 5 * 60 * 1000,
};

const getCategories = (options = {}) => {
  const { page = 1, pageSize = 10, type } = options;
  const offset = (page - 1) * pageSize;

  // For paginated or filtered requests, bypass the cache and go to the DB
  if (page > 1 || pageSize !== 10 || type) {
    return getCategoriesFromDb(options);
  }

  // Check if cache is valid
  const now = Date.now();
  if (categoryCache.data && now - categoryCache.timestamp < categoryCache.ttl) {
    console.log("Returning categories from cache.");
    return categoryCache.data;
  }

  console.log("Fetching categories from DB and caching.");
  const freshData = getCategoriesFromDb(options);
  categoryCache.data = freshData;
  categoryCache.timestamp = now;
  return freshData;
};

// Helper function to fetch categories directly from the database
const getCategoriesFromDb = (options = {}) => {
  const { page = 1, pageSize = 10, type } = options;
  const offset = (page - 1) * pageSize;

  let whereClauses = [];
  let params = [];

  if (type) {
    whereClauses.push("type = ?");
    params.push(type);
  }

  const where =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const categories = db
    .prepare(
      `SELECT * FROM categories ${where} ORDER BY name ASC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM categories ${where}`)
    .get(...params).count;

  return {
    data: categories,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
  };
};

const addCategory = (category) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)"
    );
    const result = stmt.run(category.name, category.type, category.color);

    // Invalidate cache on add
    categoryCache.data = null;

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

  // Invalidate cache on delete
  categoryCache.data = null;

  return { success: true };
};

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
};
