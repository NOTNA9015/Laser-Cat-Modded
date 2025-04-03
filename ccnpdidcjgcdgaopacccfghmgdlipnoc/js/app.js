import {defineCustomElement, createHTML} from "./util.js";
import {CHARACTERS} from "../config.js";

// Always import laser cat to improve first time experience
import "./characters/laser-cat.js";

const template = document.createElement("template");
template.innerHTML = createHTML(``);

export class App extends HTMLElement {
    static get observedAttributes() {
        return ["sounds", "muted", "dark", "auto"];
    }

    /** Sounds map */
    set sounds(value) {
        this.setAttribute("sounds", JSON.stringify(value));
    }

    get sounds() {
        try {
            return JSON.parse(this.getAttribute("sounds"));
        } catch {
            return {};
        }
    }

    /** Whether sound is muted */
    set muted(value) {
        value ? this.setAttribute("muted", "") : this.removeAttribute("muted");
    }

    get muted() {
        return this.hasAttribute("muted");
    }

    /** Whether auto mode is on */
    set auto(value) {
        value ? this.setAttribute("auto", "") : this.removeAttribute("auto");
    }

    get auto() {
        return this.hasAttribute("auto");
    }

    /** Whether mode is dark */
    set dark(value) {
        value ? this.setAttribute("dark", "") : this.removeAttribute("dark");
    }

    get dark() {
        return this.hasAttribute("dark");
    }

    connectedCallback() {

        // The code below should be in the constructor. However, in order
        // for it to work with custom-elements-es5-adapter.js it needs to be
        // in the constructor instead.
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));
        // End code that can't be in the constructor..

        // Listen for events from the extension
        window.addEventListener("appEvent", async ({detail}) => {
            const {msg, data} = detail;
            switch (msg) {
                case "show":
                    this.show();
                    break;
                case "hide":
                    this.hide();
                    break;
                case "updateSettings":
                    this.updateSettings(data);
                    break;
            }
        });
    }

    /**
     * Updates the settings.
     * @param {*} settings
     */
    async updateSettings(settings) {
        const {muted, dark, auto} = settings;
        let characterId = settings.character;

        let $character = this.$character;

        // If the active attribute is present we show it
        let active = this.hasAttribute("active") ? true : null;

        // Check if a new character should be loaded
        if ($character == null || (characterId != null && characterId !== $character.character.id)) {

            // Remove the previous character and store the active value so we can restore it later.
            if ($character != null) {
                active = $character.active;
                $character.remove();
            }

            // Load the new character
            try {
                switch (characterId) {
                    case CHARACTERS.frog.id:
                        await import("./characters/hungry-frog.js");
                        $character = document.createElement("hungry-frog");
                        break;
                    case CHARACTERS.alien.id:
                        await import("./characters/angry-alien.js");
                        $character = document.createElement("angry-alien");
                        break;
                    case CHARACTERS.dog.id:
                        await import("./characters/calm-dog.js");
                        $character = document.createElement("calm-dog");
                        break;
                    case CHARACTERS.unicorn.id:
                        await import("./characters/fabulous-unicorn.js");
                        $character = document.createElement("fabulous-unicorn");
                        break;
                    case CHARACTERS.dino.id:
                        await import("./characters/extinct-dino.js");
                        $character = document.createElement("extinct-dino");
                        break;
                    case CHARACTERS.ninja.id:
                        await import("./characters/secret-ninja.js");
                        $character = document.createElement("secret-ninja");
                        break;
                    default:
                        await import("./characters/laser-cat.js");
                        $character = document.createElement("laser-cat");
                        characterId = CHARACTERS.cat.id;
                        break;
                }
            } catch (err) {
                console.error(`Something went wrong while loading laser cat extension`, err);
            }

            // Append the character
            if ($character != null) {
                this.clearChildren();
                this.shadowRoot.appendChild($character);
                this.$character = $character;
            }

            // Remove the active attribute since we only use it one time
            if (this.hasAttribute("active")) {
                this.removeAttribute("active");
            }
        }

        // Set the sounds attribute
        $character.setAttribute("sounds", JSON.stringify(this.sounds));

        // Set the muted property
        this.muted = muted;

        // Set the auto property
        this.auto = auto;

        // Set dark mode
        this.dark = dark;

        // Set active if it is defined
        if (active != null) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (active) {
                        this.show();
                    } else {
                        this.hide();
                    }
                }, 0);
            });
        }
    }

    /**
     * Remove all children from the DOM.
     */
    clearChildren() {
        while (this.shadowRoot != null && this.shadowRoot.firstChild != null) {
            this.shadowRoot.firstChild.remove();
        }
    }

    show() {
        if (this.$character != null) {
            this.$character.show();
        }
    }

    hide() {
        if (this.$character != null) {
            this.$character.hide();
        }
    }

    /** React to property changes */
    attributeChangedCallback(name) {
        const $character = this.$character;
        switch (name) {
            case "sounds":
                if ($character != null) {
                    $character.sounds = this.sounds;
                }
                break;
            case "muted":
                if ($character != null) {
                    $character.muted = this.muted;
                }
                break;
            case "auto":
                if ($character != null) {
                    $character.auto = this.auto;
                }
                break;
            case "dark":
                if ($character != null) {
                    $character.dark = this.dark;
                }
                break;
        }
    }
}

defineCustomElement("laser-cat-app", App);