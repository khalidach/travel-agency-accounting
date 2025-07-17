import require$$0 from "electron";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var preload$1 = {};
var hasRequiredPreload;
function requirePreload() {
  if (hasRequiredPreload) return preload$1;
  hasRequiredPreload = 1;
  const { contextBridge, ipcRenderer } = require$$0;
  contextBridge.exposeInMainWorld("electronAPI", {
    // Categories
    getCategories: () => ipcRenderer.invoke("get-categories"),
    addCategory: (category) => ipcRenderer.invoke("add-category", category),
    deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),
    // Transactions
    getTransactions: () => ipcRenderer.invoke("get-transactions"),
    addTransaction: (transaction) => ipcRenderer.invoke("add-transaction", transaction),
    deleteTransaction: (id) => ipcRenderer.invoke("delete-transaction", id)
  });
  return preload$1;
}
var preloadExports = requirePreload();
const preload = /* @__PURE__ */ getDefaultExportFromCjs(preloadExports);
export {
  preload as default
};
