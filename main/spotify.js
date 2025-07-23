const { ipcMain, app } = require("electron/main");
const fs = require("fs");
const path = require("path");
const fetch = require("isomorphic-unfetch");
const { getData, getPreview } = require("spotify-url-info")(fetch);
const ytdlp = require("youtube-dl-exec");
const Song = require("../src/models/Song.js");
const { spawn } = require('child_process');

function enhanceAudio(filePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [path.join(__dirname, 'enhancer.py'), filePath]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Enhancement successful for ${filePath}`);
                resolve();
            } else {
                console.error(`Enhancement failed for ${filePath} with code ${code}`);
                reject(new Error(`Python process exited with code ${code}`));
            }
        });
    });
}

function sanitize(filename) {
    // Remove illegal characters and any other characters that are not standard letters, numbers, or basic punctuation.
    return filename.replace(/[\\/:*?"<>|,]/g, "").replace(/[^a-zA-Z0-9 ._-]/g, '');
}

function registerSpotifyHandlers() {
    ipcMain.on("download-spotify-playlist", async (event, url) => {
        try {
            const data = await getData(url);
            if (!data) {
                event.sender.send("playlist-load-error");
                return;
            }

            console.log("Playlist data:", data);

            const playlistsDir = path.join(
                app.getPath("userData"),
                "playlists"
            );
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

            const songList = [];
            for (const item of data.trackList) {
                const songUrl =
                    "https://open.spotify.com/track/" +
                    item.uri.replace("spotify:track:", "");
                let songData;

                try {
                    songData = await getPreview(songUrl);
                } catch (error) {
                    console.error("Error fetching song data:", error);
                    continue;
                }

                if (!songData) {
                    console.log("Failed to fetch song data for:", item.title);
                    continue;
                }

                const title = `${item.title} - ${item.subtitle}`;
                const searchQuery = `${item.title} ${item.subtitle}`;
                const outputPath = path.join(
                    savePath,
                    `${sanitize(title)}.wav`
                );

                console.log(`Searching for: "${searchQuery}"`);

                const ytdlpProcess = ytdlp.exec(`ytsearch1:${searchQuery} Official Audio`, {
                    extractAudio: true,
                    audioFormat: "wav",
                    output: outputPath,
                    defaultSearch: "ytsearch",
                });

                ytdlpProcess.stdout.on('data', (data) => {
                    console.log(`ytdlp stdout: ${data}`);
                });

                ytdlpProcess.stderr.on('data', (data) => {
                    console.error(`ytdlp stderr: ${data}`);
                });

                await ytdlpProcess;

                console.log(`Downloaded to: ${outputPath}`);

                // await enhanceAudio(outputPath);

                const song = new Song(songData, outputPath);
                songList.push(song);
            }

            event.sender.send("playlist-folder-ready", {
                name: data.name,
                path: savePath,
                tracks: songList,
            });
        } catch (e) {
            console.log("Error downloading Spotify playlist:", e);

            let message = "Failed to download the playlist.";
            if (
                e?.message?.includes("Couldn't find any data") ||
                e?.html?.includes("Page not found")
            ) {
                message =
                    "The playlist could not be loaded. Please make sure it is public.";
            }

            // Notify renderer of the error
            event.sender.send("playlist-load-error", {
                error: message,
            });
        }
    });
}

module.exports = {
    registerSpotifyHandlers,
};