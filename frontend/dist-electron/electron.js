import require$$0 from "electron";
import require$$1 from "node:path";
import require$$2 from "better-sqlite3";
import require$$3 from "electron-squirrel-startup";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var electron$1 = {};
var hasRequiredElectron;
function requireElectron() {
  if (hasRequiredElectron) return electron$1;
  hasRequiredElectron = 1;
  const { app, BrowserWindow, ipcMain } = require$$0;
  const path = require$$1;
  const Database = require$$2;
  if (require$$3) {
    app.quit();
  }
  const dbPath = path.join(app.getPath("userData"), "travel-agency.db");
  const db = new Database(dbPath);
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
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
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
  return electron$1;
}
var electronExports = requireElectron();
const electron = /* @__PURE__ */ getDefaultExportFromCjs(electronExports);
export {
  electron as default
};
