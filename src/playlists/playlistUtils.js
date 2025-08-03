import { openContextMenu } from "../songs/menu/menuUtils.js";
import { state } from "../stores/store.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { shuffleArray } from "../utils/arrayUtils.js";
import { playSongWrapper } from "../songs/songUtils.js";
import { domElements } from "../ui/domElements.js";

// Load an existing playlist by name and render its songs
export function renderPlaylistTracks(playlist, contextMenu, searchTerm = "") {

    console.log(playlist);
    let songs = playlist.tracks;

    if (!songs || songs.length === 0) {
        console.log("No songs in this playlist.");
        return;
    }

    if (searchTerm) {
        songs = songs.filter((song) =>
            (song.title.toLowerCase() + song.artist.toLowerCase()).includes(
                searchTerm.toLowerCase()
            )
        );
    }

    const songList = document.getElementById("song-list");
    songList.innerHTML = "";

    state.visiblePlaylist = playlist;

    songs.forEach((song) => {
        const li = document.createElement("li");
        li.classList.add("playlist-item");
        li.dataset.songPath = song.filePath;

        if (state.queue[state.queueIndex] === song.filePath) {
            li.classList.add("playing");
        }

        const albumArtImg = document.createElement("img");
        albumArtImg.classList.add("album-art");
        albumArtImg.src = song.image || "https://placehold.co/100x100";
        albumArtImg.alt = song.title;

        const titleDiv = document.createElement("div");
        titleDiv.textContent = truncateText(song.title, 30);
        titleDiv.classList.add("song-title");
        titleDiv.title = song.title;

        const artistDiv = document.createElement("div");
        artistDiv.textContent = truncateText(
            song.artist || "Unknown Artist",
            30
        );
        artistDiv.classList.add("song-artist");
        artistDiv.title = song.artist || "Unknown Artist";

        const textContainer = document.createElement("div");
        textContainer.classList.add("song-info");
        textContainer.appendChild(titleDiv);
        textContainer.appendChild(artistDiv);

        li.addEventListener("click", () => {
            const originalIndex = playlist.tracks.findIndex(
                (track) => track.filePath === song.filePath
            );
            playPlaylist(playlist, originalIndex);
            updateCurrentlyPlayingUI();
        });

        const optionsBtn = document.createElement("button");
        optionsBtn.textContent = "⋯";
        optionsBtn.className = "options-btn";
        optionsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            openContextMenu(rect.right, rect.bottom, song, contextMenu);
        });

        li.appendChild(albumArtImg);
        li.appendChild(textContainer);
        li.appendChild(optionsBtn);
        songList.appendChild(li);
    });

    updateCurrentlyPlayingUI();
}

export function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
}

export function playPlaylist(playlist, startIndex = 0) {
    const songs = playlist.tracks;
    if (!songs || songs.length === 0) {
        console.warn("No songs to play in playlist:", playlist.name);
        return;
    }

    if (state.shuffle) {
        const selectedSong = songs[startIndex];

        state.queue = songs.filter(
            (song) => song.filePath !== selectedSong.filePath
        );
        state.queue = shuffleArray(state.queue);
        state.queue = [selectedSong, ...state.queue];
        state.queueIndex = 0;
    } else {
        state.queue = songs;
        state.queueIndex = startIndex;
    }

    state.visiblePlaylist = playlist;
    state.currentPlaylist = playlist;
    state.playingSingleTrack = false;
    playSongWrapper(state.queue[state.queueIndex], true);
    updateCurrentlyPlayingUI();
}

export function addPlaylistToView(playlist, contextMenu, playlistContextMenu, playlistList) {
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
        renderPlaylistTracks(playlist, contextMenu);
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
        renderPlaylistTracks(playlist, contextMenu);
    });

    const leftSide = document.createElement("div");
    leftSide.appendChild(playBtn);
    leftSide.appendChild(title);
    leftSide.style.display = "flex";
    leftSide.style.alignItems = "center";
    leftSide.style.gap = "10px";

    li.appendChild(leftSide);
    li.appendChild(optionsBtn);

    const firstLoadingItem = playlistList.querySelector(".loading-playlist");
    if (firstLoadingItem) {
        playlistList.insertBefore(li, firstLoadingItem);
    } else {
        playlistList.appendChild(li);
    }
}

export function renderPlaylists(
    contextMenu,
    playlistContextMenu,
    playlistList,
    playlistSearchTerm = ""
) {
    console.log("Rendering playlists with search term:", state.playlists);
    let playlistDisplay = state.playlists;

    if (playlistSearchTerm) {
        playlistDisplay = state.playlists.filter((playlist) =>
            playlist.name
                .toLowerCase()
                .includes(playlistSearchTerm.toLowerCase())
        );
    }

    const loadingItems = Array.from(playlistList.querySelectorAll('.loading-playlist'));
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
            renderPlaylistTracks(playlist, contextMenu);
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
            renderPlaylistTracks(playlist, contextMenu);
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

    loadingItems.forEach(item => playlistList.appendChild(item));
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
    if (state.visiblePlaylist && state.visiblePlaylist.name === playlistName) {
        document.getElementById("song-list").innerHTML = "";
        state.visiblePlaylist = null;
    }
}

export function loadPlaylistWrapper(playlist, searchTerm = "") {
    renderPlaylistTracks(playlist, domElements.contextMenu, searchTerm);
}
