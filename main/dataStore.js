const { ipcMain, app } = require("electron/main");
const fs = require("fs");
const path = require("path");

// Path to playlist data
const dataPath = path.join(app.getPath("userData"), "playlistData.json");

function registerDataStoreHandlers() {
    console.log("[DataStore] Registering data store IPC handlers.");

    ipcMain.handle("get-saved-playlists", () => {
        console.log("[DataStore] Received request for saved playlists.");
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, "utf8");
            console.log("[DataStore] Found playlist data file, returning contents.");
            return JSON.parse(raw);
        }
        console.log("[DataStore] No playlist data file found, returning empty array.");
        return [];
    });

    ipcMain.handle("save-playlists", (event, playlists) => {
        console.log(`[DataStore] Received request to save ${playlists.length} playlists.`);
        fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));
        console.log("[DataStore] Successfully saved playlists to disk.");
    });

    ipcMain.on("add-song-to-playlist", (event, { playlistName, song }) => {
        console.log(`[DataStore] Adding song "${song.title}" to playlist "${playlistName}"`);
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, "utf8");
            const playlists = JSON.parse(raw);
            const playlist = playlists.find((p) => p.name === playlistName);
            if (playlist) {
                playlist.tracks.push(song);
                fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));
                console.log(`[DataStore] Successfully added song and saved data. Notifying renderer.`);
                event.sender.send("updated-playlist-ready", {
                    name: playlistName,
                    path: playlist.path,
                    tracks: playlist.tracks,
                });
            } else {
                console.error(`[DataStore] ERROR: Could not find playlist "${playlistName}" to add song to.`);
            }
        } else {
            console.error("[DataStore] ERROR: playlistData.json does not exist. Cannot add song.");
        }
    });

    ipcMain.on("delete-song-from-playlist", (event, { playlistName, song }) => {
        if (!playlistName || !song) {
            console.error("[DataStore] ERROR: Invalid arguments for delete-song-from-playlist.");
            return;
        }

        console.log(`[DataStore] Deleting song "${song.title}" from playlist "${playlistName}"`);

        const raw = fs.readFileSync(dataPath, "utf8");
        const playlists = JSON.parse(raw);
        const playlist = playlists.find((p) => p.name === playlistName);

        if (!playlist) {
            console.error(`[DataStore] ERROR: Could not find playlist "${playlistName}" to delete song from.`);
            return;
        }

        const songIndex = playlist.tracks.findIndex(
            (s) => s.filePath === song.filePath
        );
        if (songIndex === -1) {
            console.warn(`[DataStore] WARNING: Song "${song.title}" not found in playlist "${playlistName}". Nothing to delete.`);
            return;
        }

        // Remove song from playlist
        playlist.tracks.splice(songIndex, 1);
        fs.writeFileSync(dataPath, JSON.stringify(playlists, null, 2));
        console.log(`[DataStore] Successfully deleted song. Notifying renderer.`);
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