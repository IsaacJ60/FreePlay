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

    let selectedFilePath = null;

    modal.classList.remove("hidden");
    selectedFilePathContainer.textContent = "";
    urlInput.value = "";

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

    addBtn.onclick = () => {
        const url = urlInput.value.trim();
        if (url) {
            // Placeholder for Spotify URL logic
            console.log("Adding song from URL:", url);
        } else if (selectedFilePath) {
            // Placeholder for local file logic
            console.log("Adding song from file:", selectedFilePath);
            const song = window.electronAPI.createSong(selectedFilePath);
            addSongToPlaylistFileWrapper(state.visiblePlaylist, song);
        }
        modal.classList.add("hidden");
        selectedFilePath = null;
        urlInput.disabled = false;
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