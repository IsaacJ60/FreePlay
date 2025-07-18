const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");
const fs = require("fs");
const path = require("path");
const fetch = require("isomorphic-unfetch");
const { getData } = require("spotify-url-info")(fetch);
const ytdlp = require("youtube-dl-exec");

const isDev = !app.isPackaged;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, "assets", "favicon.ico"),
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
        win.loadFile(path.join(__dirname, "dist", "index.html"));
    }

    const menuTemplate = [
        {
            label: "File",
            submenu: [
                {
                    label: "Import Playlist/Folder",
                    click: async () => {
                        const result = await dialog.showOpenDialog(win, {
                            properties: ["openDirectory"],
                        });
                        if (!result.canceled) {
                            win.webContents.send(
                                "folder-selected",
                                result.filePaths[0]
                            );
                        }
                    },
                },
                {
                    label: "Play File",
                    click: async () => {
                        const result = await dialog.showOpenDialog(win, {
                            properties: ["openFile"],
                            filters: [
                                {
                                    extensions: ["mp3", "wav", "flac"],
                                },
                            ],
                        });
                        if (!result.canceled) {
                            win.webContents.send(
                                "file-selected",
                                result.filePaths[0]
                            );
                        }
                    },
                },
                {
                    label: "Download Playlist/Folder (Spotify)",
                    click: () => {
                        win.webContents.send("spotify-download");
                    },
                },
                { type: "separator" },
                { role: "quit" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "togglefullscreen" },
                {
                    label: "Toggle Dark Mode",
                    click: () => {
                        win.webContents.send("dark-mode");
                    },
                },
            ],
        },
        {
            label: "Window",
            submenu: [{ role: "minimize" }, { role: "close" }],
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        await shell.openExternal("https://www.electronjs.org");
                    },
                },
            ],
        },
    ];

    menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
    createWindow();

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

const dataPath = path.join(app.getPath("userData"), "playlistData.json");

ipcMain.handle("get-saved-playlists", () => {
    if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, "utf8");
        return JSON.parse(raw);
    }

    return [];
});

ipcMain.handle("save-playlists", (event, playlists) => {
    fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));
});

ipcMain.on("download-spotify-playlist", async (event, url) => {
    try {
        const data = await getData(url);
        if (!data) {
            event.sender.send("playlist-load-error");
            return;
        }

        const playlistsDir = path.join(app.getPath("userData"), "playlists");
        if (!fs.existsSync(playlistsDir)) {
            fs.mkdirSync(playlistsDir, { recursive: true });
        }

        const playlistName = sanitize(data.name);
        const savePath = path.join(playlistsDir, playlistName);
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true });
        }

        event.sender.send("playlist-start-load", {
            name: data.name,
        });

        console.log("SAVEPATH:", savePath);

        if (!savePath) return;

        for (const item of data.trackList) {
            const title = `${item.title} - ${item.subtitle}`;
            const searchQuery = `${item.title} ${item.subtitle}`;
            const outputPath = path.join(savePath, `${sanitize(title)}.mp3`);

            console.log("Song info:", title);

            await ytdlp(`ytsearch1:${searchQuery}`, {
                extractAudio: true,
                audioFormat: "mp3",
                output: outputPath,
                defaultSearch: "ytsearch",
            });
        }

        event.sender.send("playlist-folder-ready", {
            name: data.name,
            path: savePath,
            // TODO: ADD METADATA TO TRACKS
            tracks: fs.readdirSync(savePath).filter((f) => f.endsWith(".mp3")),
        });
    } catch (e) {
        console.log("Error downloading Spotify playlist:", e);

        let message = "Failed to download the playlist.";
        if (e?.message?.includes("Couldn't find any data") || e?.html?.includes("Page not found")) {
            message = "The playlist could not be loaded. Please make sure it is public.";
        }

        // Notify renderer of the error
        event.sender.send("playlist-load-error", {
            error: message,
        });
    }
});

function sanitize(filename) {
    return filename.replace(/[\\/:*?"<>|]/g, "");
}
