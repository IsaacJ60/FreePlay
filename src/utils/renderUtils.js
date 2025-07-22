import { state } from "../stores/store.js";

export function updateCurrentlyPlayingUI() {
    const songItems = document.querySelectorAll("#song-list li");
    const isSamePlaylist = state.currentPlaylist?.name === state.visiblePlaylist?.name;

    songItems.forEach((li) => {
        const fullPath = li.dataset.songPath;
        if (!fullPath) return;

        const isCurrentSong = fullPath === state.queue[state.queueIndex]?.filePath;

        li.classList.toggle("playing", isCurrentSong && isSamePlaylist && !state.playingSingleTrack);
    });

    const playlistItems = document.querySelectorAll("#playlist-list li");
    playlistItems.forEach((li) => {
        const text = li.querySelector("span")?.textContent || li.textContent;
        li.classList.toggle("playing", text === state.visiblePlaylist?.name);
        li.classList.toggle("current-playlist", text === state.currentPlaylist?.name);
    });
}