import { openContextMenu } from "../songs/menu/menuUtils.js";
import { state } from "../stores/store.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { shuffleArray } from "../utils/arrayUtils.js";
import { playSongWrapper } from "../renderer.js";

// Load an existing playlist by name and render its songs
export function renderPlaylistTracks(name, contextMenu, searchTerm = "") {
    const playlist = state.playlists.find((p) => p.name === name);
    if (!playlist) {
        console.error("Playlist not found:", name);
        return;
    }

    let songs = playlist.tracks;
    if (!songs || songs.length === 0) {
        console.log("No songs in this playlist.");
        return;
    }

    if (searchTerm) {
        songs = songs.filter((song) =>
            song.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    const songList = document.getElementById("song-list");
    songList.innerHTML = "";

    state.visiblePlaylist = playlist.name;

    songs.forEach((songPath) => {
        const li = document.createElement("li");
        const fileName = songPath.split(/[\\/]/).pop();
        const fullPath = window.electronAPI.joinPath(playlist.path, songPath);
        li.textContent = fileName;
        li.classList.add("playlist-item");
        li.dataset.songPath = fullPath;

        if (state.queue[state.queueIndex] === fullPath) {
            li.classList.add("playing");
        }

        li.addEventListener("click", () => {
            const originalIndex = playlist.tracks.findIndex(
                (track) => track === songPath
            );
            playPlaylist(playlist, originalIndex);
            updateCurrentlyPlayingUI();
        });

        // Add options button to access song options/menu
        const optionsBtn = document.createElement("button");
        optionsBtn.textContent = "⋯";
        optionsBtn.className = "options-btn";
        optionsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            openContextMenu(
                rect.right,
                rect.bottom,
                window.electronAPI.joinPath(playlist.path, songPath),
                contextMenu
            );
        });

        li.appendChild(optionsBtn);
        songList.appendChild(li);
    });

    updateCurrentlyPlayingUI();
}

export function playPlaylist(playlist, startIndex = 0) {
    const songs = playlist.tracks;
    if (!songs || songs.length === 0) {
        console.warn("No songs to play in playlist:", playlist.name);
        return;
    }

    if (state.shuffle) {
        const selectedFilePath = window.electronAPI.joinPath(
            playlist.path,
            songs[startIndex]
        );
        state.queue = songs
            .map((song) => window.electronAPI.joinPath(playlist.path, song))
            .filter((path) => path !== selectedFilePath);
        state.queue = shuffleArray(state.queue);
        state.queue = [selectedFilePath, ...state.queue];
        state.queueIndex = 0;
    } else {
        state.queue = songs.map((song) =>
            window.electronAPI.joinPath(playlist.path, song)
        );
        state.queueIndex = startIndex;
    }

    state.visiblePlaylist = playlist.name;
    state.currentPlaylist = playlist.name;
    state.playingSingleTrack = false;
    playSongWrapper(state.queue[state.queueIndex], true);
    updateCurrentlyPlayingUI();
}

export function renderPlaylists(
    contextMenu,
    playlistContextMenu,
    playlistList,
    playlistSearchTerm = ""
) {
    let playlistDisplay = state.playlists;

    if (playlistSearchTerm) {
        playlistDisplay = state.playlists.filter((playlist) =>
            playlist.name.toLowerCase().includes(playlistSearchTerm.toLowerCase())
        );
    }

    playlistList.innerHTML = "";

    playlistDisplay.forEach((playlist) => {
        const li = document.createElement("li");
        li.classList.add("playlist-item");

        const title = document.createElement("span");
        title.textContent = playlist.name;

        const playBtn = document.createElement("button");
        playBtn.textContent = "▶";
        playBtn.classList.add("playlist-play-btn");
        playBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById("song-search").value = "";
            renderPlaylistTracks(playlist.name, contextMenu);
            playPlaylist(playlist);
        };

        const optionsBtn = document.createElement("button");
        optionsBtn.textContent = "⋯";
        optionsBtn.className = "options-btn";
        optionsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            openPlaylistContextMenu(
                rect.right,
                rect.bottom,
                playlist.name,
                playlistContextMenu
            );
        });

        li.addEventListener("click", () => {
            document.getElementById("song-search").value = "";
            renderPlaylistTracks(playlist.name, contextMenu);
        });

        const leftSide = document.createElement("div");
        leftSide.appendChild(playBtn);
        leftSide.appendChild(title);
        leftSide.style.display = "flex";
        leftSide.style.alignItems = "center";
        leftSide.style.gap = "10px";

        li.appendChild(leftSide);
        li.appendChild(optionsBtn);
        playlistList.appendChild(li);
    });
}

export function openPlaylistContextMenu(x, y, playlistName, contextMenu) {
    contextMenu.classList.remove("hidden");
    const menuWidth = contextMenu.offsetWidth;
    contextMenu.style.left = `${x - menuWidth}px`;
    contextMenu.style.top = `${y}px`;
    state.contextMenuPlaylistName = playlistName;
}

export function deletePlaylist(playlistName) {
    state.playlists = state.playlists.filter((p) => p.name !== playlistName);
    window.electronAPI.savePlaylists(state.playlists);
    if (state.visiblePlaylist === playlistName) {
        document.getElementById("song-list").innerHTML = "";
        state.visiblePlaylist = null;
    }
}
