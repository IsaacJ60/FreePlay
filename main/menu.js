const { Menu, dialog, shell } = require("electron/main");
const Song = require("./models/Song.js");

function createMenu(win) {
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

                        const song = new Song(result.filePaths[0]);

                        if (!result.canceled) {
                            win.webContents.send("file-selected", song);
                        }
                    },
                },
                {
                    label: "Download Playlist/Folder (Spotify)",
                    click: () => {
                        console.log("[Menu] Clicked 'Download Playlist/Folder (Spotify)'");
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

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

module.exports = {
    createMenu,
}