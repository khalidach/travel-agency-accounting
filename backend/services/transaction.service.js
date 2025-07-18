// backend/services/transaction.service.js
const db = require("../db-init");

const getTransactions = (options = {}) => {
  const { page = 1, pageSize = 10, type, searchTerm, category_id } = options;
  const offset = (page - 1) * pageSize;

  let whereClauses = [];
  let params = [];

  if (type) {
    whereClauses.push("t.type = ?");
    params.push(type);
  }

  if (category_id) {
    whereClauses.push("t.category_id = ?");
    params.push(category_id);
  }

  if (searchTerm) {
    whereClauses.push(
      "(t.description LIKE ? OR c.name LIKE ? OR t.checkNumber LIKE ?)"
    );
    const searchTermLike = `%${searchTerm}%`;
    params.push(searchTermLike, searchTermLike, searchTermLike);
  }

  const where =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const query = `
    SELECT t.*, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where}
    ORDER BY t.date DESC
    LIMIT ? OFFSET ?
  `;

  const transactions = db.prepare(query).all(...params, pageSize, offset);

  const countQuery = `
    SELECT COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where}
  `;
  const total = db.prepare(countQuery).get(...params).count;

  return {
    data: transactions,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
  };
};

const addTransaction = (transaction) => {
  const stmt = db.prepare(
    `INSERT INTO transactions (type, amount, description, category_id, date, paymentMethod, checkNumber, cashedDate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    transaction.type,
    transaction.amount,
    transaction.description,
    transaction.category_id,
    transaction.date,
    transaction.paymentMethod,
    transaction.checkNumber,
    transaction.cashedDate,
    transaction.status
  );
  const newTransactionStmt = db.prepare(
    "SELECT t.*, c.name as category FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?"
  );
  return newTransactionStmt.get(result.lastInsertRowid);
};

const updateTransaction = (transaction) => {
  const stmt = db.prepare(
    `UPDATE transactions
         SET type = ?, amount = ?, description = ?, category_id = ?, date = ?,
             paymentMethod = ?, checkNumber = ?, cashedDate = ?, status = ?
         WHERE id = ?`
  );
  stmt.run(
    transaction.type,
    transaction.amount,
    transaction.description,
    transaction.category_id,
    transaction.date,
    transaction.paymentMethod,
    transaction.checkNumber,
    transaction.cashedDate,
    transaction.status,
    transaction.id
  );
  const updatedTransactionStmt = db.prepare(
    "SELECT t.*, c.name as category FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?"
  );
  return updatedTransactionStmt.get(transaction.id);
};

const deleteTransaction = (id) => {
  const creditLink = db
    .prepare("SELECT id FROM credits WHERE transaction_id = ?")
    .get(id);
  const paymentLink = db
    .prepare("SELECT id FROM payments WHERE transaction_id = ?")
    .get(id);

  if (creditLink || paymentLink) {
    console.log(`Prevented deletion of linked transaction ID: ${id}`);
    return {
      error:
        "This transaction is linked to a credit and cannot be deleted directly.",
    };
  }

  db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  return { success: true };
};

const getFinancialSummary = (dateRange) => {
  const { start, end } = dateRange;

  const summary = db
    .prepare(
      `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
    FROM transactions
    WHERE date BETWEEN ? AND ? AND status = 'cashed'
  `
    )
    .get(start, end);

  const transactionCount = db
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM transactions
    WHERE date BETWEEN ? AND ? AND status = 'cashed'
  `
    )
    .get(start, end).count;

  return {
    totalIncome: summary.totalIncome || 0,
    totalExpenses: summary.totalExpenses || 0,
    netProfit: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
    transactionCount,
  };
};

const getRecentTransactions = (limit = 5) => {
  return db
    .prepare(
      `
    SELECT t.*, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC
    LIMIT ?
  `
    )
    .all(limit);
};

const getReportData = (dateRange) => {
  const { start, end } = dateRange;

  // 1. Financial Summary
  const summary = getFinancialSummary(dateRange);

  // 2. Income & Expense by Category
  const categoryData = db
    .prepare(
      `
    SELECT
      c.name as category,
      t.type,
      SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.date BETWEEN ? AND ? AND t.status = 'cashed'
    GROUP BY c.name, t.type
  `
    )
    .all(start, end);

  const incomeByCategory = categoryData
    .filter((d) => d.type === "income")
    .map(({ category, total }) => ({ category, total }));
  const expenseByCategory = categoryData
    .filter((d) => d.type === "expense")
    .map(({ category, total }) => ({ category, total }));

  // 3. All Transactions for CSV Export
  const transactions = db
    .prepare(
      `
    SELECT t.*, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC
  `
    )
    .all(start, end);

  return {
    summary,
    incomeByCategory,
    expenseByCategory,
    transactions,
  };
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
