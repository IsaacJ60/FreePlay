import { state } from "../stores/store.js";
import { addPlaylistToView } from "../playlists/playlistUtils.js";
import { domElements } from "../ui/domElements.js";
import { playSongWrapper } from "../songs/songUtils.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";

export function setupElectronEventListeners() {
    console.log("[ElectronRenderer] Setting up Electron event listeners.");

    // handle selecting local folder to use as playlist
    window.electronAPI.onFolderSelected((playlist) => {
        console.log(`[ElectronRenderer] Received folder selection: "${playlist.name}"`);
        const exists = state.playlists.some((p) => p.name === playlist.name);
        if (exists) {
            console.warn(`[ElectronRenderer] WARNING: Playlist "${playlist.name}" already exists. Skipping.`);
            return;
        }

        // Add the new playlist to the list and save changes to disk
        state.playlists.push(playlist);
        window.electronAPI.savePlaylists(state.playlists);

        addPlaylistToView(playlist, domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
    });

    window.electronAPI.toggleDarkMode(() => {
        console.log("[ElectronRenderer] Toggling dark mode.");
        document.body.classList.toggle("dark");
        localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    });

    // Handle file selection from the file dialog
    window.electronAPI.onFileSelected((song) => {
        console.log(`[ElectronRenderer] Received file selection: "${song.title}"`);
        playSongWrapper(song, false);
        updateCurrentlyPlayingUI();
    });
}