import { updateCurrentlyPlayingUI } from "./utils/renderUtils.js";
import {
    deletePlaylist,
    renderPlaylistTracks,
    renderPlaylists,
} from "./playlists/playlistUtils.js";
import { state } from "./stores/store.js";
import { playSong } from "./songs/songUtils.js";
import { renderQueue } from "./queue/queue.js";
import { closeContextMenu } from "./songs/menu/menuUtils.js";
import { addToQueue } from "./queue/queue.js";

// region DOM

const currentTrackElement = document.getElementById("current-track");
const upcomingList = document.getElementById("upcoming-tracks");
const trackName = document.getElementById("track-name");
const duration = document.getElementById("duration");
const audio = document.getElementById("audio-player");
const playButton = document.getElementById("play");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const shuffleButton = document.getElementById("shuffle");
const contextMenu = document.getElementById("context-menu");
const addToQueueBtn = document.getElementById("add-to-front");
const playlistList = document.getElementById("playlist-list");
const playlistContextMenu = document.getElementById("playlist-context-menu");
const deletePlaylistBtn = document.getElementById("delete-playlist");
const songSearch = document.getElementById("song-search");
const playlistSearch = document.getElementById("playlist-search");

// endregion DOM

export function playSongWrapper(song, fromQueue = false) {
    //TODO: Refactor this to use the Song model
    playSong(song, fromQueue, audio, playButton, trackName);
    updateCurrentlyPlayingUI();
}

function closeAllContextMenus() {
    closeContextMenu(contextMenu);
    closeContextMenu(playlistContextMenu);
}

// region playlists

// handle selecting local folder to use as playlist
window.electronAPI.onFolderSelected((playlist) => {
    console.log("Folder Selected:", playlist.name);
    const exists = state.playlists.some((p) => p.name === playlist.name);
    if (exists) {
        console.log(`Playlist "${playlist.name}" already exists. Skipping.`);
        return;
    }

    // Add the new playlist to the list and save changes to disk
    state.playlists.push(playlist);
    window.electronAPI.savePlaylists(state.playlists);

    renderPlaylists(contextMenu, playlistContextMenu, playlistList);
});

// Load an existing playlist by name and render its songs
function loadPlaylistWrapper(name, searchTerm = "") {
    renderPlaylistTracks(name, contextMenu, searchTerm);
}

// endregion playlists

// region queue

// Render the queue of upcoming tracks
// This will show the currently playing track and the next tracks in the queue
export function renderQueueWrapper() {
    renderQueue(upcomingList, currentTrackElement);
    updateCurrentlyPlayingUI();
}

function addToQueueWrapper() {
    addToQueue(state.contextMenuSongPath);
    updateCurrentlyPlayingUI();
    renderQueueWrapper();
}

// endregion queue

// region event listeners

songSearch.addEventListener("input", (e) => {
    if (state.visiblePlaylist) {
        loadPlaylistWrapper(state.visiblePlaylist, e.target.value);
        updateCurrentlyPlayingUI();
    }
});

playlistSearch.addEventListener("input", (e) => {
    renderPlaylists(
        contextMenu,
        playlistContextMenu,
        playlistList,
        e.target.value
    );
    updateCurrentlyPlayingUI();
});

// DOMContentLoaded event to initialize the app
window.addEventListener("DOMContentLoaded", async () => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const volumeSlider = document.getElementById("volume-slider");
    const seekSlider = document.getElementById("seek-slider");

    updateSliderFill(seekSlider);
    if (savedDarkMode === "true") {
        document.body.classList.add("dark");
    }
    shuffleButton.style.opacity = "0.5";

    shuffleButton.addEventListener("click", () => {
        state.shuffle = !state.shuffle;
        shuffleButton.style.opacity = state.shuffle ? "1" : "0.5"; // optional visual cue
        console.log(`Shuffle: ${state.shuffle}`);
    });

    audio.addEventListener("timeupdate", () => {
        if (!isNaN(audio.duration) && !seekSlider.dragging) {
            seekSlider.value = (audio.currentTime / audio.duration) * 100;
            updateSliderFill(seekSlider);
        }
    });

    seekSlider.addEventListener("input", () => updateSliderFill(seekSlider));

    seekSlider.addEventListener("mousedown", () => {
        seekSlider.dragging = true;
    });

    seekSlider.addEventListener("mouseup", () => {
        seekSlider.dragging = false;
    });

    seekSlider.addEventListener("change", () => {
        if (!isNaN(audio.duration)) {
            audio.currentTime = (seekSlider.value / 100) * audio.duration;
        }
    });

    audio.volume = volumeSlider.value;

    volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
    });

    state.playlists = await window.electronAPI.requestSavedPlaylists();

    renderPlaylists(contextMenu, playlistContextMenu, playlistList);
});

document.addEventListener("click", (e) => {
    if (
        !contextMenu.contains(e.target) &&
        !playlistContextMenu.contains(e.target)
    ) {
        closeAllContextMenus();
    }
});

addToQueueBtn.onclick = () => {
    if (state.contextMenuSongPath) {
        addToQueueWrapper();
        closeAllContextMenus();
    }
};

deletePlaylistBtn.onclick = () => {
    if (state.contextMenuPlaylistName) {
        deletePlaylist(state.contextMenuPlaylistName);
        renderPlaylists(contextMenu, playlistContextMenu, playlistList);
        closeAllContextMenus();
    }
};

// Update the duration display as the song plays
audio.addEventListener("timeupdate", () => {
    const formatTime = (secs) => {
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    duration.textContent = `${formatTime(audio.currentTime)} / ${formatTime(
        audio.duration || 0
    )}`;
});

function playNextSong() {
    state.queueIndex += 1;
    playSongWrapper(state.queue[state.queueIndex], true);
}

// Handle the end of the song
audio.addEventListener("ended", () => {
    if (state.queueIndex + 1 < state.queue.length) {
        playNextSong();
    } else {
        state.isPlaying = false;
        playButton.textContent = "▶";
    }
});

window.electronAPI.toggleDarkMode(() => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// Handle file selection from the file dialog
window.electronAPI.onFileSelected((song) => {
    playSongWrapper(song, false);
    updateCurrentlyPlayingUI();
});

// endregion event listeners

// region controls

function updateSliderFill(slider) {
    const percent =
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty("--progress", `${percent}%`);
}

// Play/Pause button functionality
playButton.addEventListener("click", () => {
    if (!audio.src) return;

    if (state.isPlaying) {
        audio.pause();
        playButton.textContent = "▶";
    } else {
        audio.play();
        playButton.textContent = "⏸";
    }

    state.isPlaying = !state.isPlaying;
});

// Previous and Next buttons functionality
prevButton.addEventListener("click", () => {
    if (!audio.src) return;

    if (state.queueIndex > 0) {
        state.queueIndex -= 1;
        playSongWrapper(state.queue[state.queueIndex], true); // Pass the full path
    }
});

nextButton.addEventListener("click", () => {
    if (!audio.src) return;

    if (state.queueIndex + 1 < state.queue.length) {
        state.queueIndex += 1;
        playSongWrapper(state.queue[state.queueIndex], true); // Pass the full path
    }
});

// endregion controls

// region Spotify download

// Handle Spotify download request
// This will open a modal to input the Spotify URL for playlist or track
window.electronAPI.onSpotifyDownload(() => {
    console.log("Spotify Download Requested");
    const modal = document.getElementById("spotify-modal");
    const input = document.getElementById("spotify-url");
    const submit = document.getElementById("submit-spotify-url");
    const cancel = document.getElementById("cancel-spotify-url");

    modal.style.display = "flex";
    input.value = "";

    const closeModal = () => {
        modal.style.display = "none";
    };
    cancel.onclick = closeModal;

    submit.onclick = () => {
        const url = input.value.trim();
        if (url) {
            window.electronAPI.downloadSpotifyPlaylist(url);
            closeModal();
        }
    };
});

// Handle the event when a Spotify playlist is ready
// This will add the playlist to the list and save it
window.electronAPI.onPlaylistReady((playlist) => {
    const safeId = `loading-${playlist.name
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
    const loadingItem = document.getElementById(safeId);
    if (loadingItem) {
        loadingItem.remove();
    }
    state.playlists.push(playlist);
    window.electronAPI.savePlaylists(state.playlists);
    renderPlaylists(contextMenu, playlistContextMenu, playlistList);
    loadPlaylistWrapper(playlist.name);
});

window.electronAPI.onPlaylistStartLoad((playlist) => {
    console.log("Loading playlist:", playlist.name);

    const safeId = `loading-${playlist.name
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
    if (document.getElementById(safeId)) return; // prevent duplicate loading entries

    const loadingItem = document.createElement("li");
    loadingItem.textContent = `Loading "${playlist.name}"...`;
    loadingItem.id = safeId;
    loadingItem.classList.add("loading-playlist");

    playlistList.appendChild(loadingItem);
});

window.electronAPI.onPlaylistLoadError(({ error }) => {
    alert(error);
});

// endregion Spotify download

// region debug

// setInterval(() => {
//   const fileNames = state.queue.map(q => q.split(/[\\/]/).pop());
//   console.log("Current queue:", fileNames);
// }, 1000);

// endregion debug
