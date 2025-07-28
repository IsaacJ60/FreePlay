import { state } from "../stores/store.js";
import { renderQueueWrapper } from "../queue/queue.js";
import { addToHistory } from "../history/historyUtils.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { domElements } from "../ui/domElements.js";

export function playSong(song, fromQueue = false, audio, playButton, trackName) {
    state.currentFile = song.filePath;

    audio.src = window.electronAPI.toAudioSrc(song.filePath);
    audio.play();

    renderQueueWrapper();
    addToHistory(song);
    playButton.textContent = "⏸";
    state.isPlaying = true;

    if (!fromQueue) {
        state.queue = [song];
        state.queueIndex = 0;
        renderQueueWrapper();
    }

    trackName.textContent = `${song.title} by ${song.artist}`;
}

export function deleteSong(song) {
    console.log("Deleting song:", song);
    window.electronAPI.deleteSongFromPlaylist({ playlistName: state.visiblePlaylist.name, song: song });
}

export function playSongWrapper(song, fromQueue = false) {
    playSong(song, fromQueue, domElements.audio, domElements.playButton, domElements.trackName);
    updateCurrentlyPlayingUI();
}

