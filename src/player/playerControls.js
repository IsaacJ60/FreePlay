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
    domElements.playButton.addEventListener("click", () => {
        if (!domElements.audio.src) return;

        if (state.isPlaying) {
            domElements.audio.pause();
            domElements.playButton.textContent = "▶";
        } else {
            domElements.audio.play();
            domElements.playButton.textContent = "⏸";
        }

        state.isPlaying = !state.isPlaying;
    });

    domElements.prevButton.addEventListener("click", () => {
        if (!domElements.audio.src) return;

        if (state.queueIndex > 0) {
            state.queueIndex -= 1;
            playSongWrapper(state.queue[state.queueIndex], true);
        }
    });

    domElements.nextButton.addEventListener("click", () => {
        if (!domElements.audio.src) return;

        if (state.queueIndex + 1 < state.queue.length) {
            playNextSong();
        } else {
            handlePlaylistRestart();
        }
    });

    domElements.shuffleButton.addEventListener("click", () => {
        state.shuffle = !state.shuffle;
        domElements.shuffleButton.style.opacity = state.shuffle ? "1" : "0.5"; // optional visual cue
        console.log(`Shuffle: ${state.shuffle}`);
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