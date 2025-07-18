import { state } from "../stores/store.js";
import { renderQueueWrapper } from "../renderer.js";
import { addToHistory } from "../history/historyUtils.js";

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