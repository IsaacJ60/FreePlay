class Song {
    constructor(trackInfoOrPath, maybeFilePath) {
        if (typeof trackInfoOrPath === 'string') {
            // Called with (filePath)
            this.date = new Date();
            this.title = trackInfoOrPath.split(/[\\/]/).pop();
            this.type = "local";
            this.track = null;
            this.description = "";
            this.artist = "";
            this.image = "";
            this.previewAudio = "";
            this.spotifyLink = "";
            this.embed = "";
            this.filePath = trackInfoOrPath;
        } else {
            // Called with (trackInfo, filePath)
            const trackInfo = trackInfoOrPath;
            const filePath = maybeFilePath;

            this.date = trackInfo?.date || new Date();
            this.title = trackInfo.title;
            this.type = trackInfo.type || "spotify";
            this.track = trackInfo.track;
            this.description = trackInfo.description;
            this.artist = trackInfo.artist;
            this.image = trackInfo.image;
            this.previewAudio = trackInfo.audio;
            this.spotifyLink = trackInfo.link;
            this.embed = trackInfo.embed;
            this.filePath = filePath;
        }
    }

    getDate() {
        return this.date;
    }

    getTitle() {
        return this.title;
    }

    getType() {
        return this.type;
    }

    getTrack() {
        return this.track;
    }

    getDescription() {
        return this.description;
    }

    getArtist() {
        return this.artist;
    }

    getImage() {
        return this.image;
    }

    getPreviewAudio() {
        return this.previewAudio;
    }

    getSpotifyLink() {
        return this.spotifyLink;
    }

    getEmbed() {
        return this.embed;
    }

    getFilePath() {
        return this.filePath;
    }
}

module.exports = Song;
