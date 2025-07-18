// main.js - Place this in the root of your project

const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const db = require("./backend/db-init"); // Import the initialized db
const { applyDbIndexes } = require("./backend/utils/db-indexes"); // Import the indexer
const { setupCategoryRoutes } = require("./backend/routes/category.routes");
const {
  setupTransactionRoutes,
} = require("./backend/routes/transaction.routes");
const { setupCreditRoutes } = require("./backend/routes/credit.routes");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

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

// --- App Lifecycle ---
app.whenReady().then(() => {
  // Apply database indexes for performance
  applyDbIndexes();

  createWindow();

  // Setup all IPC routes
  setupCategoryRoutes();
  setupTransactionRoutes();
  setupCreditRoutes();
});

app.on("window-all-closed", () => {
  db.close();
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
