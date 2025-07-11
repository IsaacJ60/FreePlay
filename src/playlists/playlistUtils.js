// Load an existing playlist by name and render its songs
export function loadPlaylist(name, playlists, queue, queueIndex) {
    const playlist = playlists.find((p) => p.name === name);
    if (!playlist) {
        console.error("Playlist not found:", name);
        return;
    }

    const songs = playlist.tracks;
    if (!songs || songs.length === 0) {
        console.log("No songs in this playlist.");
        return;
    }

    const songList = document.getElementById("song-list");
    songList.innerHTML = "";

    visiblePlaylist = playlist.name;

    songs.forEach((songPath, i) => {
        const li = document.createElement("li");
        const fileName = songPath.split(/[\\/]/).pop();
        li.textContent = fileName;
        li.classList.add("playlist-item");

        if (queue[queueIndex] === songPath) {
            li.classList.add("playing");
        }

        li.addEventListener("click", () => {
            playPlaylist(playlist, i);
            updateCurrentlyPlayingUI();
        });

        // Add options button to access song options/menu
        const optionsBtn = document.createElement("button");
        optionsBtn.textContent = "⋯";
        optionsBtn.className = "options-btn";
        optionsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            openContextMenu(
                rect.right,
                rect.bottom,
                window.electronAPI.joinPath(playlist.path, songPath)
            );
        });

        li.appendChild(optionsBtn);
        songList.appendChild(li);
    });

    updateCurrentlyPlayingUI();
}