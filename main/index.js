const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("path");
const { createMenu } = require("./menu.js");
const { registerSpotifyHandlers } = require("./spotify.js");
const { registerDataStoreHandlers } = require("./dataStore.js");

const isDev = !app.isPackaged;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, "..", "assets", "favicon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            sandbox: false,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
    }

    createMenu(win);
};

app.whenReady().then(() => {
    createWindow();

    // Register IPC handlers
    registerSpotifyHandlers();
    registerDataStoreHandlers();

    ipcMain.handle("get-user-data-path", () => {
        return app.getPath("userData");
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});