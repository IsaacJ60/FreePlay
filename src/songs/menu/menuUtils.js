import { state } from "../../stores/store.js";

export function openContextMenu(x, y, song, contextMenu) {
    state.contextMenuSongPath = song;

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

export function closeContextMenu(contextMenu) {
    contextMenu.classList.add("hidden");
    state.contextMenuSongPath = null;
}