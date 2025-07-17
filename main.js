// main.js - Place this in the root of your project

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const Database = require("better-sqlite3");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Define the path for the database in the user's app data folder.
// This is the correct place to store user data for a packaged application.
const dbPath = path.join(app.getPath("userData"), "travel-agency.db");
const db = new Database(dbPath);

console.log("Database initialized at:", dbPath);

// Create database tables if they don't exist
// This is the schema your application expects.
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
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER,
    date TEXT NOT NULL,
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );
`);

console.log("Database tables checked/created.");

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // The preload script is essential for secure communication between
      // the main process (this file) and the renderer process (your React app).
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the frontend.
  // In development, it loads from the Vite dev server for hot-reloading.
  // In production, it loads the built HTML file.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools automatically in development.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }
};

// This method will be called when Electron has finished initialization
// and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    db.close(); // Close the database connection
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers ---
// These are the functions that your React app will call.
// They handle all database interactions.

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
    // Return an error object to the frontend if the name is not unique
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { error: "Category name must be unique." };
    }
    return { error: "An unexpected error occurred." };
  }
});

ipcMain.handle("delete-category", (event, id) => {
  // Use a transaction to ensure both deletions succeed or fail together.
  const transaction = db.transaction((catId) => {
    db.prepare("DELETE FROM transactions WHERE category_id = ?").run(catId);
    db.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  });
  transaction(id);
  return { success: true };
});

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
    "INSERT INTO transactions (type, amount, description, category_id, date) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    transaction.type,
    transaction.amount,
    transaction.description,
    transaction.category_id,
    transaction.date
  );
  const newTransactionStmt = db.prepare(
    "SELECT * FROM transactions WHERE id = ?"
  );
  return newTransactionStmt.get(result.lastInsertRowid);
});

ipcMain.handle("delete-transaction", (event, id) => {
  const stmt = db.prepare("DELETE FROM transactions WHERE id = ?");
  return stmt.run(id);
});
