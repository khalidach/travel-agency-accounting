// backend/services/transaction.service.js
const db = require("../db-init");

const getTransactions = () => {
  const stmt = db.prepare(`
    SELECT t.*, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC
  `);
  return stmt.all();
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

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
