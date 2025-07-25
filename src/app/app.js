import { setupPlayerControls } from "../player/playerControls.js";
import { setupSpotifyEventListeners } from "../spotify/spotifyRenderer.js";
import { setupUIEventListeners } from "../ui/ui.js";
import { setupElectronEventListeners } from "../electron/electronRenderer.js";
import { updateSliderFill } from "../ui/ui.js";
import { domElements } from "../ui/domElements.js";
import { state } from "../stores/store.js";
import { renderPlaylists } from "../playlists/playlistUtils.js";

export async function initializeApplication() {
    const savedDarkMode = localStorage.getItem("darkMode");

    setupPlayerControls();
    setupSpotifyEventListeners();
    setupUIEventListeners();
    setupElectronEventListeners();

    updateSliderFill(domElements.seekSlider);
    if (savedDarkMode === "true") {
        document.body.classList.add("dark");
    }
    domElements.shuffleButton.style.opacity = "0.5";

    state.playlists = await window.electronAPI.requestSavedPlaylists();

    renderPlaylists(domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
}