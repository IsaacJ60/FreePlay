import { state } from "../stores/store.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { playSongWrapper } from "../renderer.js";

export function addToHistory(filePath) {
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
            state.playingSingleTrack = true;
            playSongWrapper(filePath, false);
            state.currentPlaylist = null;
        });

        historyList.appendChild(li);
    });

    updateCurrentlyPlayingUI();
}