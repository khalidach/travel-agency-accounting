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

// --- Helper Functions ---
const createTransaction = (type, amount, description, date) => {
  const stmt = db.prepare(
    `INSERT INTO transactions (type, amount, description, date, paymentMethod, status)
     VALUES (?, ?, ?, ?, 'cash', 'cashed')`
  );
  const result = stmt.run(type, amount, description, date);
  return result.lastInsertRowid;
};

const deleteTransactionHelper = (id) => {
  if (id) {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  }
};

const getCreditWithDetails = (creditId) => {
  const credit = db.prepare("SELECT * FROM credits WHERE id = ?").get(creditId);
  if (!credit) return null;

  credit.payments = db
    .prepare("SELECT * FROM payments WHERE credit_id = ? ORDER BY date DESC")
    .all(credit.id);
  const totalPaidResult = db
    .prepare("SELECT SUM(amount) as total FROM payments WHERE credit_id = ?")
    .get(credit.id);
  credit.totalPaid = totalPaidResult?.total || 0;
  credit.remainingBalance = credit.amount - credit.totalPaid;
  credit.includeInTotals = credit.includeInTotals === 1;

  if (credit.totalPaid >= credit.amount) {
    credit.status = "paid";
  } else if (credit.totalPaid > 0) {
    credit.status = "partially-paid";
  } else {
    credit.status = "unpaid";
  }

  return credit;
};

// --- Window Creation ---
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets/icon.ico"), // <-- Use .ico for best results
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
  db.close();
  app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers ---

// Transactions
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
  // This handler prevents deleting transactions linked to credits.
  // Those should be deleted by deleting the credit/payment itself.
  const creditLink = db
    .prepare("SELECT id FROM credits WHERE transaction_id = ?")
    .get(id);
  const paymentLink = db
    .prepare("SELECT id FROM payments WHERE transaction_id = ?")
    .get(id);

  if (creditLink || paymentLink) {
    // Optionally, return an error to the frontend.
    // For now, we just prevent deletion.
    console.log(`Prevented deletion of linked transaction ID: ${id}`);
    return {
      error:
        "This transaction is linked to a credit and cannot be deleted directly.",
    };
  }

  deleteTransactionHelper(id);
  return { success: true };
});

// Categories
ipcMain.handle("get-categories", () => {
  return db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
});
ipcMain.handle("add-category", (event, category) => {
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

// --- Credits ---
ipcMain.handle("get-credits", () => {
  const credits = db.prepare("SELECT * FROM credits ORDER BY date DESC").all();
  return credits.map((credit) => getCreditWithDetails(credit.id));
});

ipcMain.handle("add-credit", (event, credit) => {
  const {
    personName,
    type,
    amount,
    description,
    date,
    dueDate,
    includeInTotals,
  } = credit;
  const addCreditAndTransaction = db.transaction(() => {
    let transactionId = null;
    if (includeInTotals) {
      const transactionType = type === "lent" ? "expense" : "income";
      const transactionDescription =
        type === "lent"
          ? `Credit given to ${personName}`
          : `Credit taken from ${personName}`;
      transactionId = createTransaction(
        transactionType,
        amount,
        transactionDescription,
        date
      );
    }

    const creditStmt = db.prepare(
      `INSERT INTO credits (personName, type, amount, description, date, dueDate, includeInTotals, transaction_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const creditResult = creditStmt.run(
      personName,
      type,
      amount,
      description,
      date,
      dueDate,
      includeInTotals ? 1 : 0,
      transactionId
    );
    return creditResult.lastInsertRowid;
  });

  const newCreditId = addCreditAndTransaction();
  return getCreditWithDetails(newCreditId);
});

ipcMain.handle("update-credit", (event, credit) => {
  const stmt = db.prepare(
    `UPDATE credits
     SET personName = ?, type = ?, amount = ?, description = ?, date = ?, dueDate = ?, includeInTotals = ?
     WHERE id = ?`
  );
  stmt.run(
    credit.personName,
    credit.type,
    credit.amount,
    credit.description,
    credit.date,
    credit.dueDate,
    credit.includeInTotals ? 1 : 0,
    credit.id
  );
  return getCreditWithDetails(credit.id);
});

ipcMain.handle("delete-credit", (event, id) => {
  const deleteCreditAndTransactions = db.transaction(() => {
    const credit = db
      .prepare("SELECT transaction_id FROM credits WHERE id = ?")
      .get(id);
    if (credit) {
      deleteTransactionHelper(credit.transaction_id);
    }
    const payments = db
      .prepare("SELECT transaction_id FROM payments WHERE credit_id = ?")
      .all(id);
    payments.forEach((p) => deleteTransactionHelper(p.transaction_id));

    db.prepare("DELETE FROM credits WHERE id = ?").run(id);
  });

  deleteCreditAndTransactions();
  return { success: true };
});

ipcMain.handle("toggle-credit-inclusion", (event, { credit_id, include }) => {
  const toggleInclusion = db.transaction(() => {
    const credit = db
      .prepare("SELECT * FROM credits WHERE id = ?")
      .get(credit_id);
    if (!credit) return;

    db.prepare("UPDATE credits SET includeInTotals = ? WHERE id = ?").run(
      include ? 1 : 0,
      credit_id
    );

    if (include) {
      if (!credit.transaction_id) {
        const transactionType = credit.type === "lent" ? "expense" : "income";
        const desc =
          credit.type === "lent"
            ? `Credit given to ${credit.personName}`
            : `Credit taken from ${credit.personName}`;
        const transId = createTransaction(
          transactionType,
          credit.amount,
          desc,
          credit.date
        );
        db.prepare("UPDATE credits SET transaction_id = ? WHERE id = ?").run(
          transId,
          credit_id
        );
      }
      const payments = db
        .prepare(
          "SELECT * FROM payments WHERE credit_id = ? AND transaction_id IS NULL"
        )
        .all(credit_id);
      for (const p of payments) {
        const transType = credit.type === "lent" ? "income" : "expense";
        const desc =
          credit.type === "lent"
            ? `Payment received from ${credit.personName}`
            : `Payment made to ${credit.personName}`;
        const transId = createTransaction(transType, p.amount, desc, p.date);
        db.prepare("UPDATE payments SET transaction_id = ? WHERE id = ?").run(
          transId,
          p.id
        );
      }
    } else {
      deleteTransactionHelper(credit.transaction_id);
      db.prepare("UPDATE credits SET transaction_id = NULL WHERE id = ?").run(
        credit_id
      );
      const payments = db
        .prepare("SELECT * FROM payments WHERE credit_id = ?")
        .all(credit_id);
      for (const p of payments) {
        deleteTransactionHelper(p.transaction_id);
      }
      db.prepare(
        "UPDATE payments SET transaction_id = NULL WHERE credit_id = ?"
      ).run(credit_id);
    }
  });

  toggleInclusion();
  return getCreditWithDetails(credit_id);
});

// --- Payments ---
ipcMain.handle("add-payment", (event, { credit_id, amount, date }) => {
  const addPaymentAndTransaction = db.transaction(() => {
    const credit = db
      .prepare("SELECT * FROM credits WHERE id = ?")
      .get(credit_id);
    if (!credit) throw new Error("Credit not found");

    let transactionId = null;
    if (credit.includeInTotals) {
      const transactionType = credit.type === "lent" ? "income" : "expense";
      const desc =
        credit.type === "lent"
          ? `Payment received from ${credit.personName}`
          : `Payment made to ${credit.personName}`;
      transactionId = createTransaction(transactionType, amount, desc, date);
    }

    const paymentStmt = db.prepare(
      "INSERT INTO payments (credit_id, amount, date, transaction_id) VALUES (?, ?, ?, ?)"
    );
    paymentStmt.run(credit_id, amount, date, transactionId);
  });

  addPaymentAndTransaction();
  return getCreditWithDetails(credit_id);
});

ipcMain.handle("delete-payment", (event, { payment_id }) => {
  const deletePaymentAndTransaction = db.transaction(() => {
    const payment = db
      .prepare("SELECT * FROM payments WHERE id = ?")
      .get(payment_id);
    if (payment) {
      deleteTransactionHelper(payment.transaction_id);
      db.prepare("DELETE FROM payments WHERE id = ?").run(payment_id);
      return payment.credit_id;
    }
    return null;
  });

  const creditId = deletePaymentAndTransaction();
  if (creditId) {
    return getCreditWithDetails(creditId);
  }
  return null;
});
