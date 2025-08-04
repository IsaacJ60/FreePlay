console.log("[Store] Initializing application state.");

export const state = {
    isPlaying: false,
    currentFile: null,
    playlists: [],
    queue: [],
    queueIndex: -1,
    history: [],
    shuffle: false,
    visiblePlaylist: null,
    currentPlaylist: null,
    contextMenuSong: null,
    modalMenuSong: null,
    playingSingleTrack: false,
    playlistLoop: false,
};