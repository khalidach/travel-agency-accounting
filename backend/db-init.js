// backend/db-init.js
const path = require("node:path");
const Database = require("better-sqlite3");
const { app } = require("electron");

// Define the path for the database in the user's app data folder.
const dbPath = path.join(app.getPath("userData"), "travel-agency.db");
const db = new Database(dbPath);

console.log("Database initialized at:", dbPath);

// --- Database Migration ---
try {
  console.log("Running database migrations...");
  db.exec("PRAGMA foreign_keys = ON;");

  // --- Schema for 'credits' table ---
  const creditColumns = db.prepare("PRAGMA table_info(credits)").all();
  const creditColumnNames = creditColumns.map((col) => col.name);
  if (!creditColumnNames.includes("transaction_id")) {
    db.exec("ALTER TABLE credits ADD COLUMN transaction_id INTEGER");
    console.log("Added 'transaction_id' column to credits table.");
  }
  if (!creditColumnNames.includes("includeInTotals")) {
    db.exec(
      "ALTER TABLE credits ADD COLUMN includeInTotals INTEGER NOT NULL DEFAULT 1"
    );
    console.log("Added 'includeInTotals' column to credits table.");
  }

  // --- Schema for 'payments' table ---
  const paymentColumns = db.prepare("PRAGMA table_info(payments)").all();
  const paymentColumnNames = paymentColumns.map((col) => col.name);
  if (!paymentColumnNames.includes("transaction_id")) {
    db.exec("ALTER TABLE payments ADD COLUMN transaction_id INTEGER");
    console.log("Added 'transaction_id' column to payments table.");
  }

  console.log("Database migration check complete.");
} catch (error) {
  console.error("Failed to run database migrations:", error);
}

// --- Database Schema Setup ---
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER,
    date TEXT NOT NULL,
    paymentMethod TEXT NOT NULL DEFAULT 'cash',
    checkNumber TEXT,
    cashedDate TEXT,
    status TEXT NOT NULL DEFAULT 'cashed',
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personName TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    dueDate TEXT,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
    transaction_id INTEGER,
    includeInTotals INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
    transaction_id INTEGER,
    FOREIGN KEY (credit_id) REFERENCES credits (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
  );
`);

console.log("Database tables checked/created.");

module.exports = db;
