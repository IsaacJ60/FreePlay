export function updateCurrentlyPlayingUI(playlists, queue, queueIndex, visiblePlaylist, currentPlaylist) {
    const songItems = document.querySelectorAll("#song-list li");
    const visiblePlaylistName = playlists.find(
        (p) => p.name === visiblePlaylist
    );
    const isSamePlaylist = currentPlaylist === visiblePlaylist;

    songItems.forEach((li, index) => {
        if (!visiblePlaylistName) return;

        const songPath = visiblePlaylistName.tracks[index];

        if (!songPath) return;

        const fullPath = window.electronAPI.joinPath(
            visiblePlaylistName.path,
            songPath
        );
        const isCurrentSong = fullPath === queue[queueIndex];

        li.classList.toggle("playing", isCurrentSong && isSamePlaylist);
    });

    const playlistItems = document.querySelectorAll("#playlist-list li");
    playlistItems.forEach((li) => {
        const text = li.querySelector("span")?.textContent || li.textContent;
        li.classList.toggle("playing", text === visiblePlaylist);
    });
}