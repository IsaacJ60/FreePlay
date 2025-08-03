
import { addPlaylistToView } from '../playlists/playlistUtils.js';
import { state } from '../stores/store.js';
import { domElements } from '../ui/domElements.js';
import { renderPlaylistTracks } from '../playlists/playlistUtils.js';

export function setupSpotifyEventListeners() {
    // Handle Spotify download request
    // This will open a modal to input the Spotify URL for playlist or track
    window.electronAPI.onSpotifyDownload(() => {
        console.log("Spotify Download Requested");
        const modal = document.getElementById("spotify-modal");
        const input = document.getElementById("spotify-url");
        const submit = document.getElementById("submit-spotify-url");
        const cancel = document.getElementById("cancel-spotify-url");

        modal.style.display = "flex";
        input.value = "";

        const closeModal = () => {
            modal.style.display = "none";
        };
        cancel.onclick = closeModal;

        submit.onclick = () => {
            const url = input.value.trim();
            if (url) {
                window.electronAPI.downloadSpotifyPlaylist(url);
                closeModal();
            }
        };
    });

    // Handle the event when a Spotify playlist is ready
    // This will add the playlist to the list and save it
    window.electronAPI.onPlaylistReady((playlist) => {
        const safeId = `loading-${playlist.name
            .replace(/\s+/g, "-")
            .toLowerCase()}`;
        const loadingItem = document.getElementById(safeId);
        if (loadingItem) {
            loadingItem.remove();
        }
        state.playlists.push(playlist);
        window.electronAPI.savePlaylists(state.playlists);
        addPlaylistToView(playlist, domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
    });

    window.electronAPI.updatedPlaylistReady((updatedPlaylist) => {
        const index = state.playlists.findIndex(p => p.name === updatedPlaylist.name);
        if (index !== -1) {
            state.playlists[index].tracks = updatedPlaylist.tracks;
            if (state.visiblePlaylist && state.visiblePlaylist.name === updatedPlaylist.name) {
                renderPlaylistTracks(state.visiblePlaylist, domElements.contextMenu);
            }
        }
    })

    window.electronAPI.onPlaylistStartLoad((playlist) => {
        console.log(`[SpotifyRenderer] Started loading playlist: "${playlist.name}"`);

        const safeId = `loading-${playlist.name
            .replace(/\s+/g, "-")
            .toLowerCase()}`;
        if (document.getElementById(safeId)) return; // prevent duplicate loading entries

        const loadingItem = document.createElement("li");
        loadingItem.textContent = `Loading "${playlist.name}"...`;
        loadingItem.id = safeId;
        loadingItem.classList.add("loading-playlist");

        domElements.playlistList.appendChild(loadingItem);
    });

    window.electronAPI.onPlaylistLoadError(({ error }) => {
        alert(error);
    });
}
