import { domElements } from "../ui/domElements.js";
import { state } from "../stores/store.js";
import { playSongWrapper } from "../songs/songUtils.js";
import { playPlaylist } from "../playlists/playlistUtils.js";
import { updateSliderFill } from "../ui/ui.js";

function handlePlaylistRestart() {
    if (state.playlistLoop && state.currentPlaylist) {
        playPlaylist(getCurrentPlaylist());
    }
}

function getCurrentPlaylist() {
    return state.currentPlaylist;
}

export function setupPlayerControls() {
    console.log("[Player] Setting up player controls...");

    domElements.playButton.addEventListener("click", () => {
        if (!domElements.audio.src) {
            console.warn("[Player] WARNING: Play button clicked but no audio source is set.");
            return;
        }

        if (state.isPlaying) {
            domElements.audio.pause();
            domElements.playButton.textContent = "▶";
            console.log("[Player] Paused audio.");
        } else {
            domElements.audio.play();
            domElements.playButton.textContent = "⏸";
            console.log("[Player] Playing audio.");
        }

        state.isPlaying = !state.isPlaying;
    });

    domElements.prevButton.addEventListener("click", () => {
        if (!domElements.audio.src) return;

        if (state.queueIndex > 0) {
            console.log("[Player] Playing previous song.");
            state.queueIndex -= 1;
            playSongWrapper(state.queue[state.queueIndex], true);
        } else {
            console.log("[Player] Already at the first song. No previous song to play.");
        }
    });

    domElements.nextButton.addEventListener("click", () => {
        if (!domElements.audio.src) return;

        if (state.queueIndex + 1 < state.queue.length) {
            console.log("[Player] Playing next song.");
            playNextSong();
        } else {
            console.log("[Player] End of queue reached.");
            handlePlaylistRestart();
        }
    });

    domElements.shuffleButton.addEventListener("click", () => {
        state.shuffle = !state.shuffle;
        domElements.shuffleButton.style.opacity = state.shuffle ? "1" : "0.5";
        console.log(`[Player] Shuffle mode toggled: ${state.shuffle ? 'On' : 'Off'}`);
    });

    domElements.loopButton.addEventListener("click", () => {
        state.playlistLoop = !state.playlistLoop;
        domElements.loopButton.style.opacity = state.playlistLoop ? "1" : "0.5";
        console.log(`[Player] Loop playlist mode toggled: ${state.playlistLoop ? 'On' : 'Off'}`);
    });

    domElements.audio.addEventListener("timeupdate", () => {
        if (!isNaN(domElements.audio.duration) && !domElements.seekSlider.dragging) {
            domElements.seekSlider.value = (domElements.audio.currentTime / domElements.audio.duration) * 100;
            updateSliderFill(domElements.seekSlider);
        }
    });

    domElements.audio.addEventListener("ended", () => {
        if (state.queueIndex + 1 < state.queue.length) {
            playNextSong();
        } else {
            state.isPlaying = false;
            domElements.playButton.textContent = "▶";
            handlePlaylistRestart();
        }
    });

    domElements.audio.addEventListener("timeupdate", () => {
        const formatTime = (secs) => {
            const minutes = Math.floor(secs / 60);
            const seconds = Math.floor(secs % 60)
                .toString()
                .padStart(2, "0");
            return `${minutes}:${seconds}`;
        };

        domElements.duration.textContent = `${formatTime(domElements.audio.currentTime)} / ${formatTime(
            domElements.audio.duration || 0
        )}`;
    });

    domElements.seekSlider.addEventListener("input", () => updateSliderFill(domElements.seekSlider));

    domElements.seekSlider.addEventListener("mousedown", () => {
        domElements.seekSlider.dragging = true;
    });

    domElements.seekSlider.addEventListener("mouseup", () => {
        domElements.seekSlider.dragging = false;
    });

    domElements.seekSlider.addEventListener("change", () => {
        if (!isNaN(domElements.audio.duration)) {
            domElements.audio.currentTime = (domElements.seekSlider.value / 100) * domElements.audio.duration;
        }
    });

    domElements.volumeSlider.addEventListener("input", () => {
        domElements.audio.volume = domElements.volumeSlider.value;
    });
}

export function playNextSong() {
    state.queueIndex += 1;
    playSongWrapper(state.queue[state.queueIndex], true);
}