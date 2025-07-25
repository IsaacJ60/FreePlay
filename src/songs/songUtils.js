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

    const currentFileName = state.queue[state.queueIndex]?.filePath.split(/[\\/]/).pop();
    trackName.textContent = currentFileName;
}

export function deleteSong(song) {
    console.log("Deleting song:", song);
    window.electronAPI.deleteSongFromPlaylist({ playlistName: state.visiblePlaylist.name, song: song });
}

export function playSongWrapper(song, fromQueue = false) {
    playSong(song, fromQueue, domElements.audio, domElements.playButton, domElements.trackName);
    updateCurrentlyPlayingUI();
}

