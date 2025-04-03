import {Soundbox} from "./../soundbox.js";
import {
    getCenter,
    stopEvent,
    createHTML,
    debounce, isDestructible, getRandomElementOnPage, wait, promisifyAnimation, setTransformTowardsTarget,
} from "../util.js";
import {AUTO_PEEK_MS, TOP_Z_INDEX} from "../../config.js";

// Points added during debounce to avoid reaching the MAX_WRITE_OPERATIONS_PER_MINUTE quota.
let pointsAddedDuringDebounce = 0;

// The percentage chance that the auto will trigger
const AUTO_CHANCE = 0.3;

// The ms between the auto interval
const AUTO_INTERVAL_MS = 1000 * 10;

export const sharedCharacterStyles = `
	:host {
		display: inline-flex;
		position: fixed;
		bottom: 0;
		left: 12px;
		z-index: ${TOP_Z_INDEX};
		cursor: pointer;

		transform: translateY(90%);
		transition: transform ease-in-out 200ms;
	}
	
    :host([dark]) {
        filter: grayscale(1);
    }

	:host(:hover), :host(.peek) {
		transform: translateY(43%);
	}

	:host([active]) {
		transform: translateY(13%);
	}

	.eye {
		position: absolute;
		top: 66px;
		--transform: rotate(0deg);
	}

	.eye.left {
		left: 38px;
	}

	.eye.right {
		right: 38px;
	}

	#head {
		transform-origin: center center;
		transform: var(--transform, unset);
	}
`;

export class Character extends HTMLElement {
    static get observedAttributes() {
        return ["active", "sounds", "muted", "auto"];
    }

    get character() {
        return null;
    }

    /** Whether the character is active */
    set active(value) {
        value ? this.setAttribute("active", "") : this.removeAttribute("active");
    }

    get active() {
        return this.hasAttribute("active");
    }

    /** Whether the character is dark */
    set dark(value) {
        value ? this.setAttribute("dark", "") : this.removeAttribute("dark");
    }

    get dark() {
        return this.hasAttribute("dark");
    }

    /** Whether the character is in auto mode */
    set auto(value) {
        value ? this.setAttribute("auto", "") : this.removeAttribute("auto");
    }

    get auto() {
        return this.hasAttribute("auto");
    }

    /** Sounds map */
    set sounds(value) {
        this.setAttribute("sounds", JSON.stringify(value));
    }

    get sounds() {
        try {
            return JSON.parse(this.getAttribute("sounds"));
        } catch (err) {
            return {};
        }
    }

    /** Whether the sound is muted */
    set muted(value) {
        value ? this.setAttribute("muted", "") : this.removeAttribute("muted");
    }

    get muted() {
        return this.hasAttribute("muted");
    }

    /** Whether the character is currently peeking */
    get peeking () {
        return this.classList.contains("peek");
    }

    /**
     * Hooks up the element
     */
    connectedCallback(template) {
        // The code below should be in the constructor. However, in order
        // for it to work with custom-elements-es5-adapter.js it needs to be
        // in the constructor instead.
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));

        this.$crosshairStyle = document.createElement("style");
        this.$crosshairStyle.innerHTML = createHTML(`
			* {
				cursor: crosshair !important;
			}
		`);
        // End code that can't be in the constructor..

        this.soundbox = new Soundbox(this.sounds);

        this.toggle = this.toggle.bind(this);
        this.addEventListener("click", this.toggle);

        this.setRandomPosition();

        this.eyes = Array.from(this.shadowRoot.querySelectorAll(".eye"));
        this.$head = this.shadowRoot.querySelector("#head");

        // Never play audio in the background
        window.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.soundbox.stopAll();
            }
        });
    }

    /**
     * Hide the cat when it is disconneted
     */
    disconnectedCallback() {
        // When hiding, the detach function is called
        this.hide();
        this.stopAutoMode();
    }

    /**
     * Sets a random X position.
     */
    setRandomPosition() {
        const left = Math.max(10, Math.min(Math.random() * 100, 70));
        this.style.left = `${left}%`;
    }

    /**
     * React to property changes
     * @param {*} name
     * @param {*} newValue
     * @param oldValue
     */
    attributeChangedCallback(name, newValue, oldValue) {
        switch (name) {
            case "active":
                if (this.active) {
                    this.attach();
                } else {
                    this.detach();
                }
                break;
            case "sounds":
                if (this.soundbox == null) {
                    this.soundbox = new Soundbox(this.sounds);
                } else {
                    this.soundbox.prepare(this.sounds);
                }
                break;
            case "muted":
                this.soundbox.stopAll();
                this.soundbox.muted = this.muted;
                break;
            case "auto":
                if (this.auto) {
                    this.startAutoMode();
                } else {
                    this.stopAutoMode();
                }
                break;
        }
    }

    /**
     * Starts the auto mode.
     */
    startAutoMode() {
        this.stopAutoMode();
        this.autoInterval = setInterval(() => {
            if (this.active || document.hidden || !this.isConnected || this.peeking) return;

            // Throw dice
            if (Math.random() > (1 - AUTO_CHANCE)) {

                // Find a random element on the page that is destructible
                const $elem = getRandomElementOnPage();
                this.onAutoTrigger($elem).then();
            }

        }, AUTO_INTERVAL_MS);
    }

    /**
     * Stops the auto mode.
     */
    stopAutoMode() {
        if (this.autoInterval != null) {
            clearInterval(this.autoInterval)
        }
    }

    /**
     * Toggles the active property of the character.
     */
    toggle() {
        if (this.active) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Shows the character.
     */
    show() {
        this.active = true;
    }

    /**
     * Hides the character.
     */
    hide() {
        this.active = false;
    }

    /**
     * Attaches the active listener.
     */
    attach() {
        this.stopAutoMode();
        this.detach();

        this.didClickPage = this.didClickPage.bind(this);
        this.didMoveMouse = this.didMoveMouse.bind(this);
        this.didPressKey = this.didPressKey.bind(this);

        window.addEventListener("click", this.didClickPage, {capture: true});
        window.addEventListener("keydown", this.didPressKey, {capture: true});
        window.addEventListener("mousemove", this.didMoveMouse, {
            capture: true,
            passive: true,
        });

        if (this.$crosshairStyle != null) {
            document.body.appendChild(this.$crosshairStyle);
        }
    }

    /**
     * Detaches the active listeners.
     */
    detach() {
        window.removeEventListener("click", this.didClickPage, {capture: true});
        window.removeEventListener("keydown", this.didPressKey, {capture: true});
        window.removeEventListener("mousemove", this.didMoveMouse, {
            capture: true,
            passive: true,
        });

        if (this.$crosshairStyle != null && this.$crosshairStyle.isConnected) {
            this.$crosshairStyle.remove();
        }

        // Start auto mode if necessary
        if (this.auto) {
            this.startAutoMode();
        }
    }

    /**
     * Returns a target if it is a valid target.
     * @param {*} e
     */
    getTargetFromClickPageEvent(e) {
        // Check if we should interact with the element
        const {target, path} = e;
        if (target == null || !isDestructible(target)) {
            return null;
        }

        // Find the first target that is destructible (we want to pick the target that was actually clicked, not the parent (etc. if its a web component))
        return Array.from(path || e.composedPath() || []).find($elem => isDestructible($elem)) ?? target;
    }

    /**
     * Start shooting!
     * @param {*} e
     */
    didClickPage(e) {
        const $target = this.getTargetFromClickPageEvent(e);

        if ($target != null && this.isConnected) {
            stopEvent(e);

            // Do something with the target if one was found
            this.handleDidClickTarget(e, $target);
        }
    }

    /**
     * Handles that a key was pressed.
     * @param {*} e
     */
    didPressKey(e) {
        switch (e.code) {
            case "Escape":
                this.hide();
                stopEvent(e);
                break;
        }
    }

    /**
     * Handle that the mouse moved.
     * Update the eye position when the mouse moves
     * @param {*} e
     */
    didMoveMouse(e) {
        this.updateEyeAndHeadPosition({x: e.clientX, y: e.clientY});

    }

    /**
     * Updates the eye and head position to look at a coordinate.
     * @param x
     * @param y
     */
    updateEyeAndHeadPosition(targetCenter) {

        // Update position of eyes
        for (const $eye of this.eyes || []) {
            $eye.updatePosition(targetCenter);
        }

        // Update position of head
        if (this.$head != null) {
            setTransformTowardsTarget(this.$head, targetCenter);
        }
    }

    /**
     * Looks at en element.
     * @param $target
     */
    lookAtElement($target) {
        const targetCenter = getCenter($target);
        this.updateEyeAndHeadPosition(targetCenter);
    }


    /**
     * Add points to the user with a debounce to avoid the MAX_WRITE_OPERATIONS_PER_MINUTE quota.
     * @param {*} points
     */
    addPoints(points) {
        pointsAddedDuringDebounce += points;

        // Debounce setting the points.
        debounce("addPoints", () => {
            this.dispatchEvent(
                new CustomEvent("addPoints", {
                    detail: {points: pointsAddedDuringDebounce},
                    bubbles: true,
                    composed: true,
                })
            );
            pointsAddedDuringDebounce = 0;
        });
    }

    /**
     * Starts peeking.
     */
    startPeeking() {
        this.classList.add("peek");
    }

    /**
     * Stops peeking.
     */
    stopPeeking() {
        this.classList.remove("peek");
    }

    /**
     * Handles that a target was clicked.
     * @param {*} e
     * @param {*} $target
     */
    handleDidClickTarget(e, $target) {
        // TODO: Implement
    }

    /**
     * Handles the automatic action.
     */
    async handleAutoTrigger($elem) {
        // TODO: Implement
    }

    /**
     * Called when the auto triggers.
     * @returns {Promise<void>}
     */
    async onAutoTrigger($elem) {
        this.lookAtElement($elem);
        this.startPeeking();
        await wait(AUTO_PEEK_MS);

        // Handle trigger if the character is not yet active
        if (!this.active && $elem != null && isDestructible($elem)) {
            await this.handleAutoTrigger($elem);
        }

        await wait(AUTO_PEEK_MS);
        this.stopPeeking();
    }

    /**
     * Removes a target with a random animation.
     * @param {*} $target
     */
    async removeTarget($target) {
        if (!$target.isConnected) return;

        const randomX = (Math.random() * 20) - 10; /* Between -10 and +10 */
        const randomY = (Math.random() * 20) - 10; /* Between -10 and +10 */
        const randomRotation = (Math.random() * 20) - 10; /* Between -10 and +10) */
        const randomDuration = (Math.random() * 100) + 100; /* Between 100 and 200 */

        await promisifyAnimation($target.animate({
            transform: [`translate(0, 0) rotate(0)`, `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`],
            opacity: [1, 0]
        }, {
            duration: randomDuration,
            easing: "ease-out",
            fill: "both"
        }));
        $target.remove();
    }
}
