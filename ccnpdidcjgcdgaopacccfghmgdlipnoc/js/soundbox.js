/**
 * A real soundbox!
 * The reason each sound ID has an array is to be able to have variations of the same sound eg a meow so it doesnt get too annoying.
 */
export class Soundbox {
    constructor(sounds) {
        this.sounds = sounds;
        this.preparedSounds = null;
        this.muted = false;
    }

    /**
     * Prepares the sounds:
     * @param sounds
     */
    prepare(sounds) {
        this.stopAll();
        sounds = sounds || {};
        this.preparedSounds = {};

        for (const [id, srcs] of Object.entries(sounds)) {
            for (const src of srcs) {
                this.prepareSound(id, src);
            }
        }
    }

    /**
     * Stops all audio.
     */
    stopAll() {
        for (const [_, prepared] of Object.entries(this.preparedSounds || {})) {
            for (const $audio of prepared) {
                $audio.pause();
                $audio.currentTime = 0;
            }
        }
    }

    /**
     * Prepares a sound with an ID.
     * @param id
     * @param src
     */
    prepareSound(id, src) {
        const $audio = new Audio();
        const $source = document.createElement("source");
        $source.type = "audio/mpeg";
        $source.src = src;
        $audio.appendChild($source);

        // Add it to the list
        const prepared = this.preparedSounds[id] || [];
        prepared.push($audio);
        this.preparedSounds[id] = prepared;
    }

    /**
     * Stops a sound with an ID.
     * @param {*} id
     */
    stop(id) {
        if (this.preparedSounds == null) {
            return;
        }

        const prepared = this.preparedSounds[id] || [];
        for (const $audio of prepared) {
            $audio.pause();
            $audio.currentTime = 0;
        }
    }

    /**
     * Determines if a sound is playing.
     * @param id
     * @returns {boolean}
     */
    isPlaying(id) {
        if (this.preparedSounds == null) {
            return;
        }

        const prepared = this.preparedSounds[id] || [];
        return prepared.find($audio => $audio.currentTime > 0 && !$audio.paused) != null;
    }

    /**
     * Plays a sound with an ID:
     * @param {*} id
     * @param {*} volume
     * @param loop
     */
    async play(id, volume = 1, loop = false) {

        // If muted, stop here
        if (this.muted) return;

        // Prepare the sounds just in time to avoid loading the sounds before we use them
        if (this.preparedSounds == null) {
            this.prepare(this.sounds);
        }

        // Play the sound
        const prepared = this.preparedSounds[id];
        if (prepared != null && prepared.length > 0) {
            const index = Math.round((Math.random() * (prepared.length - 1)));
            const $audio = prepared[index];

            // Reset the audio
            $audio.pause();
            $audio.currentTime = 0;

            // Set config
            $audio.volume = volume;
            $audio.loop = loop;

            // Play it!
            try {
                await $audio.play();
            } catch (err) {
                // THe user needs to interaction with the page first
            }

            return $audio;
        }

        return null;
    }
}