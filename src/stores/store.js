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
    contextMenuSongPath: null,
    playingSingleTrack: false,
};

export const getters = {
    isPlaying: (state) => state.isPlaying,
    currentFile: (state) => state.currentFile,
    playlists: (state) => state.playlists,
    queue: (state) => state.queue,
    queueIndex: (state) => state.queueIndex,
    history: (state) => state.history,
    shuffle: (state) => state.shuffle,
    visiblePlaylist: (state) => state.visiblePlaylist,
    currentPlaylist: (state) => state.currentPlaylist,
    contextMenuSongPath: (state) => state.contextMenuSongPath,
};