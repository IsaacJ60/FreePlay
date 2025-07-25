import { state } from "../stores/store.js";
import { addPlaylistToView } from "../playlists/playlistUtils.js";
import { domElements } from "../ui/domElements.js";
import { playSongWrapper } from "../songs/songUtils.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";

export function setupElectronEventListeners() {
    // handle selecting local folder to use as playlist
    window.electronAPI.onFolderSelected((playlist) => {
        console.log("Folder Selected:", playlist.name);
        const exists = state.playlists.some((p) => p.name === playlist.name);
        if (exists) {
            console.log(`Playlist "${playlist.name}" already exists. Skipping.`);
            return;
        }

        // Add the new playlist to the list and save changes to disk
        state.playlists.push(playlist);
        window.electronAPI.savePlaylists(state.playlists);

        addPlaylistToView(playlist, domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
    });

    window.electronAPI.toggleDarkMode(() => {
        document.body.classList.toggle("dark");
        localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    });

    // Handle file selection from the file dialog
    window.electronAPI.onFileSelected((song) => {
        playSongWrapper(song, false);
        updateCurrentlyPlayingUI();
    });
}