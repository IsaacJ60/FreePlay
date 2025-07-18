import { state } from "../stores/store.js";
import { playSongWrapper } from "../renderer.js";

export function addToQueue(selectedSongPath) {
    state.queue = [
        ...state.queue.slice(0, state.queueIndex + 1),
        selectedSongPath,
        ...state.queue.slice(state.queueIndex + 1),
    ];
}

export function renderQueue(upcomingList, currentTrackElement) {
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
            state.playingSingleTrack = false;
            playSongWrapper(state.queue[state.queueIndex], true);
        });
    }
}