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
  db.exec("PRAGMA foreign_keys = ON;"); // Enable foreign key support

  // Get current columns for the transactions table
  const transactionColumns = db
    .prepare("PRAGMA table_info(transactions)")
    .all();
  const transactionColumnNames = transactionColumns.map((col) => col.name);

  // Add new columns if they don't exist
  if (!transactionColumnNames.includes("paymentMethod")) {
    db.exec(
      "ALTER TABLE transactions ADD COLUMN paymentMethod TEXT NOT NULL DEFAULT 'cash'"
    );
    console.log("Added 'paymentMethod' column to transactions table.");
  }
  if (!transactionColumnNames.includes("checkNumber")) {
    db.exec("ALTER TABLE transactions ADD COLUMN checkNumber TEXT");
    console.log("Added 'checkNumber' column to transactions table.");
  }
  if (!transactionColumnNames.includes("cashedDate")) {
    db.exec("ALTER TABLE transactions ADD COLUMN cashedDate TEXT");
    console.log("Added 'cashedDate' column to transactions table.");
  }
  if (!transactionColumnNames.includes("status")) {
    db.exec(
      "ALTER TABLE transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'cashed'"
    );
    console.log("Added 'status' column to transactions table.");
  }

  // Migration for Credits table - remove status
  const creditColumns = db.prepare("PRAGMA table_info(credits)").all();
  const creditColumnNames = creditColumns.map((col) => col.name);
  if (creditColumnNames.includes("status")) {
    // SQLite doesn't support dropping columns directly in older versions.
    // The common workaround is to rename the table, create a new one, and copy data.
    console.log("Migrating 'credits' table: removing 'status' column.");
    db.exec("ALTER TABLE credits RENAME TO credits_old;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        personName TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        dueDate TEXT,
        createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
      );
    `);
    db.exec(`
      INSERT INTO credits (id, personName, type, amount, description, date, dueDate, createdAt)
      SELECT id, personName, type, amount, description, date, dueDate, createdAt FROM credits_old;
    `);
    db.exec("DROP TABLE credits_old;");
    console.log("'credits' table migrated successfully.");
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
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
    FOREIGN KEY (credit_id) REFERENCES credits (id) ON DELETE CASCADE
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
  // Set category_id to NULL for associated transactions before deleting the category
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
const getCreditWithDetails = (creditId) => {
  const creditStmt = db.prepare("SELECT * FROM credits WHERE id = ?");
  const credit = creditStmt.get(creditId);

  if (!credit) return null;

  const paymentsStmt = db.prepare(
    "SELECT * FROM payments WHERE credit_id = ? ORDER BY date DESC"
  );
  credit.payments = paymentsStmt.all(credit.id);

  const totalPaidStmt = db.prepare(
    "SELECT SUM(amount) as total FROM payments WHERE credit_id = ?"
  );
  credit.totalPaid = totalPaidStmt.get(credit.id)?.total || 0;
  credit.remainingBalance = credit.amount - credit.totalPaid;

  if (credit.totalPaid >= credit.amount) {
    credit.status = "paid";
  } else if (credit.totalPaid > 0) {
    credit.status = "partially-paid";
  } else {
    credit.status = "unpaid";
  }

  return credit;
};

ipcMain.handle("get-credits", () => {
  const creditsStmt = db.prepare("SELECT * FROM credits ORDER BY date DESC");
  const credits = creditsStmt.all();
  return credits.map((credit) => getCreditWithDetails(credit.id));
});

ipcMain.handle("add-credit", (event, credit) => {
  const addCreditAndTransaction = db.transaction((cr) => {
    // Add the credit
    const creditStmt = db.prepare(
      "INSERT INTO credits (personName, type, amount, description, date, dueDate) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const creditResult = creditStmt.run(
      cr.personName,
      cr.type,
      cr.amount,
      cr.description,
      cr.date,
      cr.dueDate
    );
    const creditId = creditResult.lastInsertRowid;

    // Add corresponding transaction
    const transactionType = cr.type === "lent" ? "expense" : "income";
    const transactionDescription =
      cr.type === "lent"
        ? `Credit given to ${cr.personName}`
        : `Credit taken from ${cr.personName}`;

    const transactionStmt = db.prepare(
      `INSERT INTO transactions (type, amount, description, date, paymentMethod, status)
           VALUES (?, ?, ?, ?, 'cash', 'cashed')`
    );
    transactionStmt.run(
      transactionType,
      cr.amount,
      transactionDescription,
      cr.date
    );

    return creditId;
  });

  const newCreditId = addCreditAndTransaction(credit);
  return getCreditWithDetails(newCreditId);
});

ipcMain.handle("update-credit", (event, credit) => {
  const stmt = db.prepare(
    `UPDATE credits
     SET personName = ?, type = ?, amount = ?, description = ?, date = ?, dueDate = ?
     WHERE id = ?`
  );
  stmt.run(
    credit.personName,
    credit.type,
    credit.amount,
    credit.description,
    credit.date,
    credit.dueDate,
    credit.id
  );
  // Note: This does not update the initial transaction. This might be desired behavior.
  return getCreditWithDetails(credit.id);
});

ipcMain.handle("delete-credit", (event, id) => {
  // This will also delete all associated payments due to "ON DELETE CASCADE"
  const stmt = db.prepare("DELETE FROM credits WHERE id = ?");
  return stmt.run(id);
});

// --- IPC Handlers for Payments ---
ipcMain.handle("add-payment", (event, { credit_id, amount, date }) => {
  const addPaymentAndTransaction = db.transaction((p) => {
    // Get credit details to determine transaction type
    const creditStmt = db.prepare("SELECT * FROM credits WHERE id = ?");
    const credit = creditStmt.get(p.credit_id);

    if (!credit) {
      throw new Error("Credit not found");
    }

    // Add the payment
    const paymentStmt = db.prepare(
      "INSERT INTO payments (credit_id, amount, date) VALUES (?, ?, ?)"
    );
    paymentStmt.run(p.credit_id, p.amount, p.date);

    // Add corresponding transaction
    const transactionType = credit.type === "lent" ? "income" : "expense";
    const transactionDescription =
      credit.type === "lent"
        ? `Payment received from ${credit.personName}`
        : `Payment made to ${credit.personName}`;

    const transactionStmt = db.prepare(
      `INSERT INTO transactions (type, amount, description, date, paymentMethod, status)
           VALUES (?, ?, ?, ?, 'cash', 'cashed')`
    );
    transactionStmt.run(
      transactionType,
      p.amount,
      transactionDescription,
      p.date
    );
  });

  addPaymentAndTransaction({ credit_id, amount, date });
  return getCreditWithDetails(credit_id);
});

ipcMain.handle("delete-payment", (event, { payment_id, credit_id }) => {
  // Deleting payments and their associated transactions is complex.
  // For now, we will just delete the payment record.
  // A more robust solution would involve linking payments and transactions.
  const stmt = db.prepare("DELETE FROM payments WHERE id = ?");
  stmt.run(payment_id);
  return getCreditWithDetails(credit_id);
});
