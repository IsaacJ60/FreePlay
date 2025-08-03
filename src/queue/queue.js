import { state } from "../stores/store.js";
import { playSongWrapper } from "../songs/songUtils.js";
import { truncateText } from "../playlists/playlistUtils.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { domElements } from "../ui/domElements.js";

export function addToQueue(song) {
    state.queue = [
        ...state.queue.slice(0, state.queueIndex + 1),
        song,
        ...state.queue.slice(state.queueIndex + 1),
    ];
}

export function renderQueue(upcomingList, currentTrackElement) {
    console.log("[UI] Rendering queue.");
    upcomingList.innerHTML = "";

    if (state.queue.length === 0) {
        currentTrackElement.textContent = "No track playing.";
        return;
    }

    // Show the currently playing track
    const currentFile = state.queue[state.queueIndex];
    currentTrackElement.textContent = `Now Playing: ${currentFile.title}`;

    // Show upcoming tracks
    for (let i = state.queueIndex + 1; i < state.queue.length; i++) {
        const song = state.queue[i];

        const li = document.createElement("li");
        li.classList.add("playlist-item");
        li.dataset.songPath = song.filePath;

        li.addEventListener("click", () => {
            state.queueIndex = i;
            state.playingSingleTrack = false;
            playSongWrapper(state.queue[state.queueIndex], true);
        });

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

        li.appendChild(albumArtImg);
        li.appendChild(textContainer);
        upcomingList.appendChild(li);
    }
}

export function addToQueueWrapper() {
    addToQueue(state.contextMenuSong);
    updateCurrentlyPlayingUI();
    renderQueueWrapper();
}

export function renderQueueWrapper() {
    renderQueue(domElements.upcomingList, domElements.currentTrackElement);
    updateCurrentlyPlayingUI();
}