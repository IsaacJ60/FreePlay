const { ipcMain, app } = require("electron/main");
const fs = require("fs");
const path = require("path");

// Path to playlist data
const dataPath = path.join(app.getPath("userData"), "playlistData.json");

function registerDataStoreHandlers() {
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

    ipcMain.on("add-song-to-playlist", (event, { playlistName, song }) => {
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, "utf8");
            const playlists = JSON.parse(raw);
            const playlist = playlists.find((p) => p.name === playlistName);
            if (playlist) {
                playlist.tracks.push(song);
                fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));

                event.sender.send("updated-playlist-ready", {
                    name: playlistName,
                    path: playlist.path,
                    tracks: playlist.tracks,
                });
            }
        }
    });

    ipcMain.on("delete-song-from-playlist", (event, { playlistName, song }) => {
        if (!playlistName || !song) return;

        console.log("Deleting song from playlist:", playlistName, song);

        const raw = fs.readFileSync(dataPath, "utf8");
        const playlists = JSON.parse(raw);
        const playlist = playlists.find((p) => p.name === playlistName);

        const songIndex = playlist.tracks.findIndex(
            (s) => s.filePath === song.filePath
        );
        if (songIndex === -1) return;

        // Remove song from playlist
        playlist.tracks.splice(songIndex, 1);
        fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));
        event.sender.send("updated-playlist-ready", {
            name: playlistName,
            path: playlist.path,
            tracks: playlist.tracks,
        });
    });
}

module.exports = {
    registerDataStoreHandlers,
};