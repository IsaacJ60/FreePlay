import { state } from "../stores/store.js";
import { renderQueueWrapper } from "../renderer.js";
import { addToHistory } from "../history/historyUtils.js";

export function playSong(filePath, fromQueue = false, audio, playButton, trackName) {
    console.log("File Selected:", filePath);
    state.currentFile = filePath;

    audio.src = window.electronAPI.toAudioSrc(filePath);
    audio.play();

    renderQueueWrapper();
    addToHistory(filePath);
    playButton.textContent = "⏸";
    state.isPlaying = true;

    if (!fromQueue) {
        state.queue = [filePath];
        state.queueIndex = 0;
        renderQueueWrapper();
    }

    const currentFileName = state.queue[state.queueIndex]?.split(/[\\/]/).pop();
    trackName.textContent = currentFileName;
}