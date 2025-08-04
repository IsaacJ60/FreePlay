import { initializeApplication } from "./app/app.js";

// DOMContentLoaded event to initialize the app
window.addEventListener("DOMContentLoaded", async () => {
    console.log("[Renderer] DOM content loaded. Initializing application...");
    initializeApplication();
});