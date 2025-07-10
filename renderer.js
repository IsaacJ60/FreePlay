// region elements

const currentTrackElement = document.getElementById("current-track");
const upcomingList = document.getElementById("upcoming-tracks");
const trackName = document.getElementById("track-name");
const duration = document.getElementById("duration");
const audio = document.getElementById("audio-player");
const playButton = document.getElementById("play");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const shuffleButton = document.getElementById("shuffle");
const contextMenu = document.getElementById("context-menu");
const addToQueueBtn = document.getElementById("add-to-front");

// region global vars

let isPlaying = false;
let currentFile = null;
let playlists = [];
let queue = [];
let queueIndex = -1;
let history = [];
let shuffle = false;
let currentPlaylist = null;
let visiblePlaylist = null;
let contextMenuSongPath = null;

//region song menu

// open context menu at the right position
function openContextMenu(x, y, songPath) {
  contextMenuSongPath = songPath;

  contextMenu.classList.remove("hidden");
  contextMenu.style.visibility = "hidden"; // don't show flash
  contextMenu.style.left = "0px";
  contextMenu.style.top = "0px";

  requestAnimationFrame(() => {
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;

    const padding = 20;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate left position — prefer left of button, fallback to right
    let left = x - menuWidth - padding;
    if (left < 0) {
      left = x + padding;
    }

    // Calculate top — clamp to stay on screen
    let top = y;
    if (top + menuHeight > windowHeight) {
      top = windowHeight - menuHeight - padding;
    }

    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    contextMenu.style.visibility = "visible";
    contextMenu.classList.remove("hidden");
  });
}

function closeContextMenu() {
  contextMenu.classList.add("hidden");
  contextMenuSongPath = null;
}

// Close context menu when clicking outside
document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});

// Add to queue button action
addToQueueBtn.onclick = () => {
  if (contextMenuSongPath) {
    addToQueue(contextMenuSongPath);
    closeContextMenu();
  }
};

// region playlists

// handle selecting local folder to use as playlist
window.electronAPI.onFolderSelected((playlist) => {
  console.log("Folder Selected:", playlist.name);
  const exists = playlists.some((p) => p.name === playlist.name);
  if (exists) {
    // TODO: display alert or message to user
    console.log(`Playlist "${playlist.name}" already exists. Skipping.`);
    return;
  }

  playlists.push(playlist);
  window.electronAPI.savePlaylists(playlists);

  renderPlaylists();
});

function renderPlaylists() {
  const playlistList = document.getElementById("playlist-list");
  playlistList.innerHTML = "";

  playlists.forEach((playlist) => {
    const li = document.createElement("li");
    li.classList.add("playlist-item");

    const title = document.createElement("span");
    title.textContent = playlist.name;

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶";
    playBtn.classList.add("playlist-play-btn");
    playBtn.onclick = () => playPlaylist(playlist);

    li.addEventListener("click", () => {
      loadPlaylist(playlist.name);
    });

    li.appendChild(title);
    li.appendChild(playBtn);
    playlistList.appendChild(li);
  });
}

function playPlaylist(playlist, startIndex = 0) {
  const songs = playlist.tracks;
  if (!songs || songs.length === 0) {
    console.warn("No songs to play in playlist:", playlist.name);
    return;
  }

  const selectedFilePath = window.electronAPI.joinPath(
    playlist.path,
    songs[startIndex]
  );

  if (shuffle) {
    queue = songs
      .map((song) => window.electronAPI.joinPath(playlist.path, song))
      .filter((path) => path !== selectedFilePath);
    queue = shuffleArray(queue);
    queue = [selectedFilePath, ...queue];
    queueIndex = 0;
  } else {
    queue = songs.map((song) =>
      window.electronAPI.joinPath(playlist.path, song)
    );
    queueIndex = startIndex;
  }

  visiblePlaylist = playlist.name;
  currentPlaylist = playlist.name;
  console.log("VISIBLE PLAYLIST AND CURRENT PLAYLIST:", playlist.name);
  playSong(queue[queueIndex], true);
  updateCurrentlyPlayingUI();
}

function loadPlaylist(name) {
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
  console.log(
    `VISIBLE PLAYLIST: ${playlist.name}, CURRENT PLAYLIST: ${currentPlaylist}`
  );

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

    // Add options button
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

function addToQueue(selectedSongPath) {
  queue = [
    ...queue.slice(0, queueIndex + 1),
    selectedSongPath,
    ...queue.slice(queueIndex + 1),
  ];
  updateCurrentlyPlayingUI();
  renderQueue();
  console.log(`Added to queue: ${selectedSongPath}`);
  console.log("QUEUE:", queue);
}

function updateCurrentlyPlayingUI() {
  const songItems = document.querySelectorAll("#song-list li");
  const visiblePlaylistName = playlists.find((p) => p.name === visiblePlaylist);
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

function updateSliderFill(slider) {
  const percent =
    ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty("--progress", `${percent}%`);
}

window.addEventListener("DOMContentLoaded", async () => {
  const savedDarkMode = localStorage.getItem("darkMode");
  const volumeSlider = document.getElementById("volume-slider");
  const seekSlider = document.getElementById("seek-slider");

  updateSliderFill(seekSlider); // Initialize on load
  if (savedDarkMode === "true") {
    document.body.classList.add("dark");
  }
  shuffleButton.style.opacity = "0.5";

  shuffleButton.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleButton.style.opacity = shuffle ? "1" : "0.5"; // optional visual cue
    console.log(`Shuffle: ${shuffle}`);
  });

  audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration) && !seekSlider.dragging) {
      seekSlider.value = (audio.currentTime / audio.duration) * 100;
      updateSliderFill(seekSlider);
    }
  });

  seekSlider.addEventListener("input", () => updateSliderFill(seekSlider));

  seekSlider.addEventListener("mousedown", () => {
    seekSlider.dragging = true;
  });

  seekSlider.addEventListener("mouseup", () => {
    seekSlider.dragging = false;
  });

  seekSlider.addEventListener("change", () => {
    if (!isNaN(audio.duration)) {
      audio.currentTime = (seekSlider.value / 100) * audio.duration;
    }
  });

  audio.volume = volumeSlider.value;

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  playlists = await window.electronAPI.requestSavedPlaylists();

  renderPlaylists();
});

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

window.electronAPI.onFileSelected((filePath) => {
  playSong(filePath, false);
  updateCurrentlyPlayingUI();
});

window.electronAPI.toggleDarkMode(() => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

function playSong(filePath, fromQueue = false) {
  console.log("File Selected:", filePath);
  currentFile = filePath;

  audio.src = window.electronAPI.toFileUrl(filePath);
  audio.play();

  renderQueue();
  addToHistory(filePath);
  playButton.textContent = "⏸";
  isPlaying = true;

  if (!fromQueue) {
    queue = [filePath];
    queueIndex = 0;
    renderQueue();
  }

  const currentFileName = queue[queueIndex]?.split(/[\\/]/).pop();
  trackName.textContent = currentFileName;
  updateCurrentlyPlayingUI();
}

function addToHistory(filePath) {
  if (history[0] !== filePath) {
    history.unshift(filePath);
    if (history.length > 10) {
      history.pop();
    }
  }

  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById("recent-tracks");
  historyList.innerHTML = "";

  history.forEach((filePath) => {
    const fileName = filePath.split(/[\\/]/).pop();
    const li = document.createElement("li");
    li.textContent = fileName;

    li.addEventListener("click", () => {
      playSong(filePath, false);
      currentPlaylist = null;
    });

    historyList.appendChild(li);
  });

  updateCurrentlyPlayingUI();
}

function renderQueue() {
  upcomingList.innerHTML = "";

  if (queue.length === 0) {
    currentTrackElement.textContent = "No track playing.";
    return;
  }

  // Show the currently playing track
  const currentFileName = queue[queueIndex]?.split(/[\\/]/).pop();
  currentTrackElement.textContent = `Now Playing: ${currentFileName}`;

  // Show upcoming tracks
  for (let i = queueIndex + 1; i < queue.length; i++) {
    const li = document.createElement("li");
    const fileName = queue[i].split(/[\\/]/).pop();
    li.textContent = fileName;
    upcomingList.appendChild(li);

    li.addEventListener("click", () => {
      queueIndex = i;
      playSong(queue[queueIndex], true);
    });
  }

  updateCurrentlyPlayingUI();
}

playButton.addEventListener("click", () => {
  if (!audio.src) return;

  if (isPlaying) {
    audio.pause();
    playButton.textContent = "▶";
  } else {
    audio.play();
    playButton.textContent = "⏸";
  }

  isPlaying = !isPlaying;
});

prevButton.addEventListener("click", () => {
  if (!audio.src) return;

  if (queueIndex > 0) {
    queueIndex -= 1;
    playSong(queue[queueIndex], true); // Pass the full path
  }
});

nextButton.addEventListener("click", () => {
  if (!audio.src) return;

  if (queueIndex + 1 < queue.length) {
    queueIndex += 1;
    playSong(queue[queueIndex], true); // Pass the full path
  }
});

audio.addEventListener("timeupdate", () => {
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  duration.textContent = `${formatTime(audio.currentTime)} / ${formatTime(
    audio.duration || 0
  )}`;
});

audio.addEventListener("ended", () => {
  if (queueIndex + 1 < queue.length) {
    queueIndex += 1;
    playSong(queue[queueIndex], true);
  } else {
    isPlaying = false;
    playButton.textContent = "▶";
  }
});

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
      window.electronAPI.downloadSpotifyPlaylist(url); // <- your handler
      closeModal();
    }
  };
});

window.electronAPI.onPlaylistReady((playlist) => {
  playlists.push(playlist);
  window.electronAPI.savePlaylists(playlists);
  renderPlaylists();
  loadPlaylist(playlist.name);
});

// setInterval(() => {
//   const fileNames = queue.map(q => q.split(/[\\/]/).pop());
//   console.log("Current queue:", fileNames);
// }, 1000);
