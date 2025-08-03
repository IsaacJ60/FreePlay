import { domElements } from "./domElements.js";
import { closeContextMenu } from "../songs/menu/menuUtils.js";
import { state } from "../stores/store.js";
import { renderPlaylists, loadPlaylistWrapper, deletePlaylist } from "../playlists/playlistUtils.js";
import { updateCurrentlyPlayingUI } from "../utils/renderUtils.js";
import { addToQueueWrapper } from "../queue/queue.js";
import { deleteSong } from "../songs/songUtils.js";

export function updateSliderFill(slider) {
    const percent =
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty("--progress", `${percent}%`);
}

export function closeAllContextMenus() {
    closeContextMenu(domElements.contextMenu);
    closeContextMenu(domElements.playlistContextMenu);
}

export function openAddNewSongModal() {
    const modal = document.getElementById("add-new-song-modal");
    const urlInput = document.getElementById("new-song-url");
    const uploadBtn = document.getElementById("upload-local-file-btn");
    const cancelBtn = document.getElementById("cancel-add-new-song-btn");
    const addBtn = document.getElementById("submit-add-new-song-btn");
    const selectedFilePathContainer = document.getElementById("selected-file-path");
    const loader = modal.querySelector(".loader");

    let selectedFilePath = null;

    // Reset state
    modal.classList.remove("hidden");
    selectedFilePathContainer.textContent = "";
    urlInput.value = "";
    urlInput.disabled = false;
    addBtn.disabled = false;
    cancelBtn.disabled = false;
    loader.classList.add("hidden");


    uploadBtn.onclick = async () => {
        const filePath = await window.electronAPI.openFileDialog();
        if (filePath) {
            selectedFilePath = filePath;
            selectedFilePathContainer.textContent = `Selected: ${filePath}`;
            urlInput.value = "";
            urlInput.disabled = true;
        }
    };

    cancelBtn.onclick = () => {
        modal.classList.add("hidden");
        selectedFilePath = null;
        urlInput.disabled = false;
    };

    addBtn.onclick = async () => {
        const url = urlInput.value.trim();
        
        // Show loader and disable buttons
        loader.classList.remove("hidden");
        addBtn.disabled = true;
        cancelBtn.disabled = true;
        urlInput.disabled = true;
        uploadBtn.disabled = true;

        try {
            if (url) {
                console.log(`[UI] Attempting to download Spotify song from URL: ${url}`);
                const song = await window.electronAPI.downloadSpotifySong(url, state.visiblePlaylist.path);
                if (song) {
                    console.log(`[UI] Song downloaded successfully. Adding to playlist: "${state.visiblePlaylist.name}"`);
                    addSongToPlaylistFileWrapper(state.visiblePlaylist, song);
                } else {
                    console.error("[UI] ERROR: downloadSpotifySong returned no song object.");
                }
            } else if (selectedFilePath) {
                console.log(`[UI] Adding local song from path: ${selectedFilePath}`);
                const song = window.electronAPI.createSong(selectedFilePath);
                addSongToPlaylistFileWrapper(state.visiblePlaylist, song);
            }
        } catch (error) {
            console.error("[UI] ERROR: An error occurred while adding a new song:", error);
        } finally {
            // Hide loader and re-enable buttons
            loader.classList.add("hidden");
            addBtn.disabled = false;
            cancelBtn.disabled = false;
            urlInput.disabled = false;
            uploadBtn.disabled = false;
            modal.classList.add("hidden");
            selectedFilePath = null;
        }
    };
}

export function openAddToPlaylistModal() {
    const modal = document.getElementById("add-song-to-playlist-modal");
    const playlistListInModal = document.getElementById("playlist-list-in-modal");
    const searchInput = document.getElementById("playlist-search-in-modal");
    const cancelBtn = document.getElementById("cancel-add-song");
    const addBtn = document.getElementById("submit-add-song");

    let selectedPlaylist = null;

    function renderPlaylistsForModal(filter = "") {
        playlistListInModal.innerHTML = "";
        const filteredPlaylists = state.playlists.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) && 
            (!state.visiblePlaylist || p.name !== state.visiblePlaylist.name)
        );
        filteredPlaylists.forEach(playlist => {
            const li = document.createElement("li");
            li.textContent = playlist.name;
            li.addEventListener("click", () => {
                selectedPlaylist = playlist;
                const items = playlistListInModal.querySelectorAll("li");
                items.forEach(item => item.classList.remove("playing"));
                li.classList.add("playing");
            });
            playlistListInModal.appendChild(li);
        });
    }

    renderPlaylistsForModal();

    searchInput.addEventListener("input", (e) => {
        renderPlaylistsForModal(e.target.value);
    });

    modal.classList.remove("hidden");

    cancelBtn.onclick = () => {
        modal.classList.add("hidden");
    };

    addBtn.onclick = async () => {
        if (selectedPlaylist && state.modalMenuSong) {
            modal.classList.add("hidden");
            await addSongToPlaylistWrapper(selectedPlaylist);
        }
    };
}

async function addSongToPlaylistWrapper(selectedPlaylist) {
    window.electronAPI.addSongToPlaylist({ playlistName: selectedPlaylist.name, song: state.modalMenuSong });
    state.playlists = await window.electronAPI.requestSavedPlaylists();
    renderPlaylists(domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
}

async function addSongToPlaylistFileWrapper(selectedPlaylist, song) {
    window.electronAPI.addSongToPlaylist({ playlistName: selectedPlaylist.name, song: song });
    state.playlists = await window.electronAPI.requestSavedPlaylists();
    renderPlaylists(domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
}

export function setupUIEventListeners() {
    domElements.addSongBtn.addEventListener("click", () => {
        openAddNewSongModal();
    });

    domElements.songSearch.addEventListener("input", (e) => {
        if (state.visiblePlaylist) {
            loadPlaylistWrapper(state.visiblePlaylist, e.target.value);
            updateCurrentlyPlayingUI();
        }
    });

    domElements.playlistSearch.addEventListener("input", (e) => {
        renderPlaylists(
            domElements.contextMenu,
            domElements.playlistContextMenu,
            domElements.playlistList,
            e.target.value
        );
        updateCurrentlyPlayingUI();
    });

    document.addEventListener("click", (e) => {
        if (
            !domElements.contextMenu.contains(e.target) &&
            !domElements.playlistContextMenu.contains(e.target)
        ) {
            closeAllContextMenus();
        }
    });

    domElements.addToQueueBtn.onclick = () => {
        if (state.contextMenuSong) {
            addToQueueWrapper();
            closeAllContextMenus();
        }
    };

    domElements.addToPlaylistBtn.onclick = () => {
        if (state.contextMenuSong) {
            openAddToPlaylistModal();
            closeAllContextMenus();
        }
    };

    domElements.deleteSongBtn.onclick = () => {
        if (state.contextMenuSong) {      
            deleteSong(state.contextMenuSong);  
            closeAllContextMenus();
        }
    };

    domElements.deletePlaylistBtn.onclick = () => {
        if (state.contextMenuPlaylistName) {
            deletePlaylist(state.contextMenuPlaylistName);
            renderPlaylists(domElements.contextMenu, domElements.playlistContextMenu, domElements.playlistList);
            closeAllContextMenus();
        }
    };
}