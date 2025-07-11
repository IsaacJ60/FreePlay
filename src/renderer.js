import { shuffleArray } from "./utils/arrayUtils.js";
import { updateCurrentlyPlayingUI } from "./utils/renderUtils.js";
import { state } from "./stores/store.js";

// region elements

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

// endregion elements

// region song menu

// open context menu at the right position
function openContextMenu(x, y, songPath) {
    state.contextMenuSongPath = songPath;

    contextMenu.classList.remove("hidden");
    contextMenu.style.visibility = "hidden"; // don't show flash
    contextMenu.style.left = "0px";
    contextMenu.style.top = "0px";

    requestAnimationFrame(() => {
        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;

        const padding = 20;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate left position — prefer left of button, fallback to right
        let left = x - menuWidth - padding;
        if (left < 0) {
            left = x + padding;
        }

        // Calculate top — clamp to stay on screen
        let top = y;
        if (top + menuHeight > windowHeight) {
            top = windowHeight - menuHeight - padding;
        }

        contextMenu.style.left = `${left}px`;
        contextMenu.style.top = `${top}px`;
        contextMenu.style.visibility = "visible";
        contextMenu.classList.remove("hidden");
    });
}

function closeContextMenu() {
    contextMenu.classList.add("hidden");
    state.contextMenuSongPath = null;
}

// Close context menu when clicking outside
document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) closeContextMenu();
});

// Add to queue button action
addToQueueBtn.onclick = () => {
    if (state.contextMenuSongPath) {
        addToQueue(state.contextMenuSongPath);
        closeContextMenu();
    }
};

// endregion song menu

// region playlists

// handle selecting local folder to use as playlist
window.electronAPI.onFolderSelected((playlist) => {
    console.log("Folder Selected:", playlist.name);
    const exists = state.playlists.some((p) => p.name === playlist.name);
    if (exists) {
        // TODO: display alert or message to user
        console.log(`Playlist "${playlist.name}" already exists. Skipping.`);
        return;
    }

    // Add the new playlist to the list and save changes to disk
    state.playlists.push(playlist);
    window.electronAPI.savePlaylists(state.playlists);

    renderPlaylists();
});

// render playlists in the playlist card
function renderPlaylists() {
    const playlistList = document.getElementById("playlist-list");
    playlistList.innerHTML = "";

    state.playlists.forEach((playlist) => {
        const li = document.createElement("li");
        li.classList.add("playlist-item");

        const title = document.createElement("span");
        title.textContent = playlist.name;

        const playBtn = document.createElement("button");
        playBtn.textContent = "▶";
        playBtn.classList.add("playlist-play-btn");
        playBtn.onclick = () => playPlaylist(playlist);

        li.addEventListener("click", () => {
            loadPlaylist(playlist.name);
        });

        li.appendChild(title);
        li.appendChild(playBtn);
        playlistList.appendChild(li);
    });
}

// Play a specific playlist starting from a given index
// If shuffle is enabled, it will randomize the order of the songs
function playPlaylist(playlist, startIndex = 0) {
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
    playSong(state.queue[state.queueIndex], true);
    updateCurrentlyPlayingUIWrapper();
}

// Load an existing playlist by name and render its songs
function loadPlaylist(name) {
    const playlist = state.playlists.find((p) => p.name === name);
    if (!playlist) {
        console.error("Playlist not found:", name);
        return;
    }

    const songs = playlist.tracks;
    if (!songs || songs.length === 0) {
        console.log("No songs in this playlist.");
        return;
    }

    const songList = document.getElementById("song-list");
    songList.innerHTML = "";

    state.visiblePlaylist = playlist.name;

    songs.forEach((songPath, i) => {
        const li = document.createElement("li");
        const fileName = songPath.split(/[\\/]/).pop();
        li.textContent = fileName;
        li.classList.add("playlist-item");

        if (state.queue[state.queueIndex] === songPath) {
            li.classList.add("playing");
        }

        li.addEventListener("click", () => {
            playPlaylist(playlist, i);
            updateCurrentlyPlayingUIWrapper();
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
                window.electronAPI.joinPath(playlist.path, songPath)
            );
        });

        li.appendChild(optionsBtn);
        songList.appendChild(li);
    });

    updateCurrentlyPlayingUIWrapper();
}

// endregion playlists

// region rendering

// custom slider stuff
function updateSliderFill(slider) {
    const percent =
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty("--progress", `${percent}%`);
}

// endregion rendering

function updateCurrentlyPlayingUIWrapper() {
    updateCurrentlyPlayingUI(
        state.playlists,
        state.queue,
        state.queueIndex,
        state.visiblePlaylist,
        state.currentPlaylist
    );
}

// region event listeners

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

    renderPlaylists();
});

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

// Handle the end of the song
audio.addEventListener("ended", () => {
    if (state.queueIndex + 1 < state.queue.length) {
        state.queueIndex += 1;
        playSong(state.queue[state.queueIndex], true);
    } else {
        state.isPlaying = false;
        playButton.textContent = "▶";
    }
});

window.electronAPI.toggleDarkMode(() => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// endregion event listeners

// region songs

// Handle file selection from the file dialog
window.electronAPI.onFileSelected((filePath) => {
    playSong(filePath, false);
    updateCurrentlyPlayingUIWrapper();
});

// Play a song from the file path
// If fromQueue is true, it means the song is being played from the queue
function playSong(filePath, fromQueue = false) {
    console.log("File Selected:", filePath);
    state.currentFile = filePath;

    audio.src = window.electronAPI.toAudioSrc(filePath);
    audio.play();

    renderQueue();
    addToHistory(filePath);
    playButton.textContent = "⏸";
    state.isPlaying = true;

    if (!fromQueue) {
        state.queue = [filePath];
        state.queueIndex = 0;
        renderQueue();
    }

    const currentFileName = state.queue[state.queueIndex]?.split(/[\\/]/).pop();
    trackName.textContent = currentFileName;
    updateCurrentlyPlayingUIWrapper();
}

// endregion songs

// region history

// Add a file path to the history
function addToHistory(filePath) {
    if (state.history[0] !== filePath) {
        state.history.unshift(filePath);
        if (state.history.length > 10) {
            state.history.pop();
        }
    }

    renderHistory();
}

// render the history of recently played tracks
// This will show the last 10 played tracks
function renderHistory() {
    const historyList = document.getElementById("recent-tracks");
    historyList.innerHTML = "";

    state.history.forEach((filePath) => {
        const fileName = filePath.split(/[\\/]/).pop();
        const li = document.createElement("li");
        li.textContent = fileName;

        li.addEventListener("click", () => {
            playSong(filePath, false);
            state.currentPlaylist = null;
        });

        historyList.appendChild(li);
    });

    updateCurrentlyPlayingUIWrapper();
}

// endregion history

// region queue

// Render the queue of upcoming tracks
// This will show the currently playing track and the next tracks in the queue
function renderQueue() {
    upcomingList.innerHTML = "";

    if (state.queue.length === 0) {
        currentTrackElement.textContent = "No track playing.";
        return;
    }

    // Show the currently playing track
    const currentFileName = state.queue[state.queueIndex]?.split(/[\\/]/).pop();
    currentTrackElement.textContent = `Now Playing: ${currentFileName}`;

    // Show upcoming tracks
    for (let i = state.queueIndex + 1; i < state.queue.length; i++) {
        const li = document.createElement("li");
        const fileName = state.queue[i].split(/[\\/]/).pop();
        li.textContent = fileName;
        upcomingList.appendChild(li);

        li.addEventListener("click", () => {
            state.queueIndex = i;
            playSong(state.queue[state.queueIndex], true);
        });
    }

    updateCurrentlyPlayingUIWrapper();
}

// add a song to the queue (previous queue items, selected song, and remaining queue items)
function addToQueue(selectedSongPath) {
    state.queue = [
        ...state.queue.slice(0, state.queueIndex + 1),
        selectedSongPath,
        ...state.queue.slice(state.queueIndex + 1),
    ];
    updateCurrentlyPlayingUIWrapper();
    renderQueue();
}

// endregion queue

// region controls

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
        playSong(state.queue[state.queueIndex], true); // Pass the full path
    }
});

nextButton.addEventListener("click", () => {
    if (!audio.src) return;

    if (state.queueIndex + 1 < state.queue.length) {
        state.queueIndex += 1;
        playSong(state.queue[state.queueIndex], true); // Pass the full path
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
            window.electronAPI.downloadSpotifyPlaylist(url); // <- your handler
            closeModal();
        }
    };
});

// Handle the event when a Spotify playlist is ready
// This will add the playlist to the list and save it
window.electronAPI.onPlaylistReady((playlist) => {
    state.playlists.push(playlist);
    window.electronAPI.savePlaylists(state.playlists);
    renderPlaylists();
    loadPlaylist(playlist.name);
});

// endregion Spotify download

// region debug

// setInterval(() => {
//   const fileNames = state.queue.map(q => q.split(/[\\/]/).pop());
//   console.log("Current queue:", fileNames);
// }, 1000);

// endregion debug
