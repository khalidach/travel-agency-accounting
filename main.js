// main.js - Place this in the root of your project

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const Database = require("better-sqlite3");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Define the path for the database in the user's app data folder.
const dbPath = path.join(app.getPath("userData"), "travel-agency.db");
const db = new Database(dbPath);

console.log("Database initialized at:", dbPath);

// --- Database Migration ---
// This section ensures the database schema is up-to-date.
try {
  console.log("Running database migrations...");

  // Get current columns for the transactions table
  const columns = db.prepare("PRAGMA table_info(transactions)").all();
  const columnNames = columns.map((col) => col.name);

  // Add new columns if they don't exist
  if (!columnNames.includes("paymentMethod")) {
    db.exec(
      "ALTER TABLE transactions ADD COLUMN paymentMethod TEXT NOT NULL DEFAULT 'cash'"
    );
    console.log("Added 'paymentMethod' column to transactions table.");
  }
  if (!columnNames.includes("checkNumber")) {
    db.exec("ALTER TABLE transactions ADD COLUMN checkNumber TEXT");
    console.log("Added 'checkNumber' column to transactions table.");
  }
  if (!columnNames.includes("cashedDate")) {
    db.exec("ALTER TABLE transactions ADD COLUMN cashedDate TEXT");
    console.log("Added 'cashedDate' column to transactions table.");
  }
  if (!columnNames.includes("status")) {
    db.exec(
      "ALTER TABLE transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'cashed'"
    );
    console.log("Added 'status' column to transactions table.");
  }

  console.log("Database migration check complete.");
} catch (error) {
  console.error("Failed to run database migrations:", error);
}

// --- Database Schema Setup ---
// These CREATE statements will only run if the tables do not already exist.
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
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
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
    status TEXT NOT NULL DEFAULT 'unpaid',
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
  );
`);

console.log("Database tables checked/created.");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    db.close();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers for Transactions ---

ipcMain.handle("get-transactions", () => {
  const stmt = db.prepare(`
    SELECT t.*, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC
  `);
  return stmt.all();
});

ipcMain.handle("add-transaction", (event, transaction) => {
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
});

ipcMain.handle("update-transaction", (event, transaction) => {
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
});

ipcMain.handle("delete-transaction", (event, id) => {
  const stmt = db.prepare("DELETE FROM transactions WHERE id = ?");
  return stmt.run(id);
});

// --- IPC Handlers for Categories ---

ipcMain.handle("get-categories", () => {
  const stmt = db.prepare("SELECT * FROM categories ORDER BY name ASC");
  return stmt.all();
});

ipcMain.handle("add-category", (event, category) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)"
    );
    const result = stmt.run(category.name, category.type, category.color);
    const newCategoryStmt = db.prepare("SELECT * FROM categories WHERE id = ?");
    return newCategoryStmt.get(result.lastInsertRowid);
  } catch (error) {
    console.error("Failed to add category:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { error: "Category name must be unique." };
    }
    return { error: "An unexpected error occurred." };
  }
});

ipcMain.handle("delete-category", (event, id) => {
  const transaction = db.transaction((catId) => {
    db.prepare(
      "UPDATE transactions SET category_id = NULL WHERE category_id = ?"
    ).run(catId);
    db.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  });
  transaction(id);
  return { success: true };
});

// --- IPC Handlers for Credits ---
ipcMain.handle("get-credits", () => {
  const stmt = db.prepare("SELECT * FROM credits ORDER BY date DESC");
  return stmt.all();
});

ipcMain.handle("add-credit", (event, credit) => {
  const stmt = db.prepare(
    "INSERT INTO credits (personName, type, amount, description, date, dueDate) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    credit.personName,
    credit.type,
    credit.amount,
    credit.description,
    credit.date,
    credit.dueDate
  );
  const newCreditStmt = db.prepare("SELECT * FROM credits WHERE id = ?");
  return newCreditStmt.get(result.lastInsertRowid);
});

ipcMain.handle("update-credit-status", (event, { id, status }) => {
  const stmt = db.prepare("UPDATE credits SET status = ? WHERE id = ?");
  stmt.run(status, id);
  const updatedCreditStmt = db.prepare("SELECT * FROM credits WHERE id = ?");
  return updatedCreditStmt.get(id);
});

ipcMain.handle("delete-credit", (event, id) => {
  const stmt = db.prepare("DELETE FROM credits WHERE id = ?");
  return stmt.run(id);
});
