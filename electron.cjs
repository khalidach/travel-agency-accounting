const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const Database = require("better-sqlite3");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Database setup
const dbPath = path.join(app.getPath("userData"), "travel-agency.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );
`);

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    db.close();
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC handlers for database operations

// Categories
ipcMain.handle("get-categories", () => {
  const stmt = db.prepare("SELECT * FROM categories ORDER BY createdAt DESC");
  return stmt.all();
});

ipcMain.handle("add-category", (event, category) => {
  const stmt = db.prepare(
    "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)"
  );
  const result = stmt.run(category.name, category.type, category.color);
  const newCategoryStmt = db.prepare("SELECT * FROM categories WHERE id = ?");
  return newCategoryStmt.get(result.lastInsertRowid);
});

ipcMain.handle("delete-category", (event, id) => {
  const deleteTransactionsStmt = db.prepare(
    "DELETE FROM transactions WHERE category_id = ?"
  );
  deleteTransactionsStmt.run(id);
  const deleteCategoryStmt = db.prepare("DELETE FROM categories WHERE id = ?");
  return deleteCategoryStmt.run(id);
});

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
