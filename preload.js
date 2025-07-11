const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

contextBridge.exposeInMainWorld("electronAPI", {
    onFolderSelected: (callback) =>
        ipcRenderer.on("folder-selected", (e, folderPath) => {
            try {
                const files = fs.readdirSync(folderPath);
                const mp3s = files.filter((f) => f.endsWith(".mp3"));
                const name = path.basename(folderPath);
                console.log("Folder contains these .mp3 files:", mp3s); // Debugging line

                callback({
                    name,
                    path: folderPath,
                    tracks: mp3s,
                });
            } catch (err) {
                console.error("Error reading folder:", err);
            }
        }),
    onFileSelected: (callback) =>
        ipcRenderer.on("file-selected", (e, filePath) => callback(filePath)),
    onSpotifyDownload: (callback) =>
        ipcRenderer.on("spotify-download", (e) => {
            callback();
        }),
    downloadSpotifyPlaylist: (url) => {
        ipcRenderer.send("download-spotify-playlist", url);
    },
    onPlaylistReady: (callback) => ipcRenderer.on("playlist-folder-ready", (_, data) => callback(data)),
    requestSavedPlaylists: () => ipcRenderer.invoke("get-saved-playlists"),
    savePlaylists: (playlists) =>
        ipcRenderer.invoke("save-playlists", playlists),
    toFileUrl: (filePath) => {
        return pathToFileURL(filePath).href;
    },
    joinPath: (...args) => path.join(...args),
    toggleDarkMode: (callback) => ipcRenderer.on("dark-mode", callback),
    toAudioSrc: (filePath) => {
        const audioData = fs.readFileSync(filePath);
        const blob = new Blob([audioData], { type: "audio/mpeg" });
        return URL.createObjectURL(blob);
    }
});
