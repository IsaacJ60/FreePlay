# Project Roadmap

This document outlines the future direction of the FreePlay project. It serves as a guide for development, prioritizing features and improvements.

## Future Features

### v1.1 - Metadata Update

- [x] **Integrate Cover Art and Metadata:**
    - [x] Display the extracted cover art in the main player view.
    - [x] Show the song's title, artist, and album information prominently in the UI.
    - [x] Update the song list to display metadata instead of just the filename.
    - [x] Fix bug: playlist loading indicators disappear when one of the playlists are loaded
    - [ ] Fix bug: prevent duplicate playlist names

### v1.2 - Playlist Enhancements

- [ ] **Advanced Playlist Management:**
    - [x] Add songs to playlist from spotify or local
      - [x] add song given path
      - [x] yt dlp spotify download single songs
    - [ ] Looping playlists
      - [ ] legit just call playplaylist on whatever playlist is currently being played IF the last song is done
    - [ ] Reorder songs within a playlist.
      - [ ] look into drag and drop solutions, otherwise use buttons (similar to photoshop layers (bring forward, bring to top))
    - [ ] Edit playlist names.
      - [ ] simple menu item with modal for renaming
    - [ ] Add a "favorites" or "liked songs" playlist.
      - [ ] permanent playlist that app boots with empty if doesnt already exist (check if folder exists)
  
### v1.3 - Spotify Integration Update

- [ ] **Integrate Better Spotify Downloading System**   
    - [ ] Use https://github.com/Moosync/librespot-node to download songs from spotify as a client.

### v2.0 - UI/UX Overhaul

- [ ] **Modern UI Redesign:**
    - [ ] Implement a new, modern design system.
    - [ ] Improve the overall user experience with smoother animations and transitions.
    - [ ] Introduce customizable themes.

## Ideas for the Future (Unscheduled)

- [ ] **Audio Quality:** Switch to lossless audio playback.
- [ ] **Lyrics Support:** Fetch and display song lyrics.
- [ ] **Gapless Playback:** Implement seamless transitions between tracks.

1. Modularity and Single Responsibility Principle

   * `main.js` is doing too much. It handles window creation, menu setup, IPC communication, playlist downloading, and
     data persistence. This file could be broken down into smaller, more focused modules.
       * Create a `menu.js`: The menuTemplate and its related logic could be moved to a separate file. This would make
         main.js cleaner and the menu easier to manage.
       * Create a `spotify.js`: The download-spotify-playlist handler is quite large and contains complex logic. Moving
         this to its own module would improve readability and make it easier to test and maintain.
       * Create a `dataStore.js`: The logic for reading and writing playlistData.json could be abstracted into a simple
         data store module. This would centralize data access and make it easier to change the storage mechanism in the
         future (e.g., to a database).
   * `renderer.js` is a "God" file. It handles DOM manipulation, event listeners, and communication with the main process.
     This file is a prime candidate for refactoring.
       * Component-based approach: Even without a framework like React or Vue, you can adopt a more component-based
         approach. For example, you could create separate modules for the player controls, the playlist view, the queue
         view, etc. Each module would be responsible for its own DOM elements and event listeners.
       * Separate DOM manipulation: The DOM element selections at the top of renderer.js could be moved to a dom.js file
         or kept within their respective component modules.
   * `playlistUtils.js` has mixed responsibilities. It handles both data manipulation (e.g., playPlaylist) and DOM
     manipulation (e.g., renderPlaylistTracks, addPlaylistToView). These should be separated.
       * `playlistManager.js`: A module for managing playlist state (e.g., adding, deleting, shuffling).
       * `playlistRenderer.js`: A module for rendering the playlist UI.

  2. Code Duplication

   * `renderPlaylists` and `addPlaylistToView` in `playlistUtils.js` share a lot of similar code for creating playlist 
     list items. This could be extracted into a createPlaylistItemElement function to reduce duplication.
   * The logic for creating song list items in `renderPlaylistTracks` and `renderQueue` is very similar. This could also
     be extracted into a reusable function.

  3. Best Practices and Readability

   * Use of `const` and `let`: You're using const for most variables, which is good. However, in some places, let is used
     where const could be. For example, in main.js, menu is declared with let but never reassigned.
   * Error Handling: The error handling in download-spotify-playlist is good, but it could be more robust. For example,
     you could check for specific error codes from the Spotify API.
   * Comments: The code is generally well-commented, but some comments could be more descriptive. For example, instead of
     // region DOM, you could explain what that section of the code does.
   * Magic Strings: There are several "magic strings" in the code, such as CSS class names ("playing", "loading-playlist")
     and event names ("folder-selected"). These could be defined as constants to avoid typos and make the code easier to
     refactor.
   * Global State: The state object in store.js is a global singleton. While this is a simple way to manage state in a
     small application, it can become difficult to manage as the application grows. Consider using a more structured state
     management solution, or at least be very disciplined about how you modify the state.
   * IPC Channel Names: Use constants for IPC channel names to avoid typos and make them easier to manage. For example:

   1     // in a constants.js file
   2     export const IPC_CHANNELS = {
   3         GET_SAVED_PLAYLISTS: 'get-saved-playlists',
   4         SAVE_PLAYLISTS: 'save-playlists',
   5         // ...
   6     };

  4. Potential Bugs and Edge Cases

   * Race Conditions: In main.js, you're reading and writing to playlistData.json from multiple IPC handlers. This could
     lead to race conditions if multiple requests come in at the same time. You might want to use a locking mechanism or a
     more robust data storage solution.
   * Empty Playlists: The code generally handles empty playlists, but it's worth double-checking all the places where you
     iterate over playlist.tracks to make sure there are no errors if the array is empty.
   * Sanitizing File Names: The sanitize function in main.js is a good start, but it might not cover all possible invalid
     characters for all operating systems. You might want to use a more robust library for this.