// backend/utils/db-indexes.js
const db = require("../db-init");

const applyDbIndexes = () => {
  console.log("Applying database indexes...");
  try {
    // Indexes for transactions table
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);"
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);"
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);"
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);"
    );

    // Indexes for credits table
    db.exec("CREATE INDEX IF NOT EXISTS idx_credits_date ON credits (date);");
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_credits_transaction_id ON credits (transaction_id);"
    );

    // Indexes for payments table
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_payments_credit_id ON payments (credit_id);"
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id);"
    );

    console.log("Database indexes applied successfully.");
  } catch (error) {
    console.error("Failed to apply database indexes:", error);
  }
};

module.exports = {
  applyDbIndexes,
};
