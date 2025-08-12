import { setupPlayerControls } from "../player/playerControls.js";
import { setupSpotifyEventListeners } from "../spotify/spotifyRenderer.js";
import { setupUIEventListeners } from "../ui/ui.js";
import { setupElectronEventListeners } from "../electron/electronRenderer.js";
import { updateSliderFill } from "../ui/ui.js";
import { domElements } from "../ui/domElements.js";
import { state } from "../stores/store.js";
import { renderPlaylists } from "../playlists/playlistUtils.js";

export async function initializeApplication() {
    console.log("[App] Initializing application...");

    console.log("[App] Setting up event listeners...");
    setupPlayerControls();
    setupSpotifyEventListeners();
    setupUIEventListeners();
    setupElectronEventListeners();

    updateSliderFill(domElements.seekSlider);
    domElements.shuffleButton.style.opacity = "0.5";
    domElements.loopButton.style.opacity = "0.5";

    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
        console.log("[App] Dark mode found in local storage. Applying.");
        document.body.classList.add("dark");
    }

    const savedPlaylistLoop = localStorage.getItem("playlistLoop");
    if (savedPlaylistLoop === "true") {
        console.log("[App] Playlist loop mode found in local storage. Applying.");
        state.playlistLoop = true;
        domElements.loopButton.style.opacity = state.playlistLoop ? "1" : "0.5";
    }

    console.log("[App] Requesting saved playlists from main process...");
    state.playlists = await window.electronAPI.requestSavedPlaylists();
    console.log(`[App] Received ${state.playlists.length} playlists.`);

    renderPlaylists(domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
    console.log("[App] Application initialized.");
}