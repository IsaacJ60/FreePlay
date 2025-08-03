const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const Song = require("./models/Song.js");

contextBridge.exposeInMainWorld("electronAPI", {
    createSong: (trackInfoOrPath, maybeFilePath) => new Song(trackInfoOrPath, maybeFilePath),
    downloadSpotifySong: (url, visiblePlaylistPath) => 
        ipcRenderer.invoke("download-spotify-song", url, visiblePlaylistPath),
    getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
    onFolderSelected: (callback) =>
        ipcRenderer.on("folder-selected", async (e, folderPath) => {
            try {
                const files = fs.readdirSync(folderPath);
                const mp3s = files.filter((f) => f.endsWith(".mp3"));

                const userDataPath = await ipcRenderer.invoke(
                    "get-user-data-path"
                );

                const playlistsDir = path.join(userDataPath, "playlists");
                if (!fs.existsSync(playlistsDir)) {
                    fs.mkdirSync(playlistsDir, { recursive: true });
                }

                const name = path.basename(folderPath);
                const savePath = path.join(playlistsDir, name);
                if (!fs.existsSync(savePath)) {
                    fs.mkdirSync(savePath, { recursive: true });
                }

                const songList = [];

                for (const fileName of mp3s) {
                    const originalPath = path.join(folderPath, fileName);
                    const outputPath = path.join(savePath, fileName);

                    fs.copyFileSync(originalPath, outputPath);

                    const song = new Song(outputPath);
                    songList.push(song);
                }

                callback({
                    name,
                    path: savePath,
                    tracks: songList,
                });
            } catch (err) {
                console.error("[Preload] ERROR: Error reading folder:", err);
            }
        }),
    onFileSelected: (callback) =>
        ipcRenderer.on("file-selected", (e, song) => callback(song)),
    onSpotifyDownload: (callback) =>
        ipcRenderer.on("spotify-download", (e) => {
            callback();
        }),
    downloadSpotifyPlaylist: (url) => {
        ipcRenderer.send("download-spotify-playlist", url);
    },
    onPlaylistReady: (callback) =>
        ipcRenderer.on("playlist-folder-ready", (_, data) => callback(data)),
    updatedPlaylistReady: (callback) =>
    ipcRenderer.on("updated-playlist-ready", (event, data) => {
        callback(data);
    }),
    deleteSongFromPlaylist: (data) => ipcRenderer.send("delete-song-from-playlist", data),
    onPlaylistStartLoad: (callback) =>
        ipcRenderer.on("playlist-start-load", (_, data) => callback(data)),
    requestSavedPlaylists: () => ipcRenderer.invoke("get-saved-playlists"),
    savePlaylists: (playlists) =>
        ipcRenderer.invoke("save-playlists", playlists),
    addSongToPlaylist: (data) => ipcRenderer.send("add-song-to-playlist", data),
    toFileUrl: (filePath) => {
        return pathToFileURL(filePath).href;
    },
    joinPath: (...args) => path.join(...args),
    toggleDarkMode: (callback) => ipcRenderer.on("dark-mode", callback),
    toAudioSrc: (filePath) => {
        const audioData = fs.readFileSync(filePath);
        const blob = new Blob([audioData], { type: "audio/mpeg" });
        return URL.createObjectURL(blob);
    },
    onPlaylistLoadError: (callback) =>
        ipcRenderer.on("playlist-load-error", (_, error) => callback(error)),
    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
});
