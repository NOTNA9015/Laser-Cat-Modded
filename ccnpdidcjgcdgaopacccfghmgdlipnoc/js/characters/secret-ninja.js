import {Character, sharedCharacterStyles} from "./character.js";
import {
    defineCustomElement,
    createHTML,
    promisifyAnimation,
    getCenter,
    getAngleBetweenPoints,
    getDistanceBetweenPoints,
    setTransformTowardsTarget,
    markElementsAsIndestructible
} from "../util.js";
import {CHARACTERS, TOP_Z_INDEX} from "../../config.js";
import "../eye.js";

const NINJA_STAR_SIZE = 50;
const NINJA_STAR_DURATION = 800;

/**
 * Creates a ninja star element.
 * @param startCenter
 * @param targetCenter
 * @param size
 */
function createNinjaStarElement(startCenter, targetCenter, size = NINJA_STAR_SIZE) {

    const $star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    $star.setAttribute("preserveAspectRatio", "none");
    $star.setAttribute("viewBox", "0 0 483 487");
    $star.innerHTML = createHTML(`
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <path d="M12.312 466.3c-36.958-113.014 16.417-224.34 98.8-280.22 82.382-55.88-45.248-148.746-98.8-173.222 171.69-53.516 266.606 78.263 306.79 122.257C359.286 179.11 445.245 75.34 472.104 22.474c47.776 169.99-80.351 259.07-116.677 295.142-36.325 36.072 75.226 139.514 109.822 153.86-157.62 59.718-267.426-75.52-295.797-107.494-28.37-31.975-101.389-3.802-157.14 102.317ZM242 291c26.51 0 48-21.49 48-48s-21.49-48-48-48-48 21.49-48 48 21.49 48 48 48Z" id="shuriken" fill="#000000"/>
          </g>
    `);

    Object.assign($star.style, {
        width: `${size}px`,
        height: `${size}px`,
        transformOrigin: `center`
    });

    const angle = getAngleBetweenPoints(startCenter, targetCenter);
    const $starContainer = document.createElement("div");
    $starContainer.appendChild($star);

    Object.assign($starContainer.style, {
        transform: `rotate(${angle - 90}deg)`,
        position: `fixed`,
        left: `${startCenter.x - (size / 2)}px`,
        top: `${startCenter.y - (size / 2)}px`,
        zIndex: TOP_Z_INDEX,
        pointerEvents: `none`,
        transformOrigin: `center`
    });


    markElementsAsIndestructible([$star, $starContainer]);
    return {$star, $starContainer};
}

/** Template for the ninja */
const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
		${sharedCharacterStyles}
		
		:host {
		    transition: transform ease-in-out 200ms, left 200ms ease;
		}
		
		:host([active]) {
		    transform: translateY(40%);
		}
		
		.eye {
            z-index: 1; 
		}
		
		.eye.left {
            left: 62px;
            top: 57px;
        }
    	
		.eye.right {
            left: 100px;
            top: 57px; 
        }

		#ninja {
			width: 180px;
			position: relative;
		}
		
		#body {
            transform-origin: center center;
            transform: var(--transform, unset);
		}
	</style>
	<laser-cat-eye class="eye left"></laser-cat-eye>
	<laser-cat-eye class="eye right"></laser-cat-eye>
    <svg id="ninja" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 374 483">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="body">
            <g transform="translate(2 170)">
              <g id="sword">
                <path d="M68 77.084c126.046 89.264 195.59 137.655 208.634 145.173 19.565 11.277 50.177 4.24 51.22-2.958C239.042 166.62 158.23 112.187 85.418 56L68 77.084Z" id="Path-5" fill="#8F9EA5"/>
                <path d="M4.361 5.213c-16.378 18.51 24.708 41.625 56.952 69.296-4.144 5.025-6.033 12.588-1.367 15.65C64.61 93.218 72.08 82.13 81.079 71.5c8.998-10.63 18.118-20.116 15.534-24.662-2.07-3.32-5.966-6.005-12.442 3.32C48.85 21.553 20.741-13.297 4.361 5.213Z" id="Path-6" stroke="#000000" stroke-width="4" fill="#252229"/>
                <g id="Group-3" transform="rotate(-6 150.527 -137.69)" fill="#FED4A0" stroke="#000000" stroke-width="4">
                  <path id="Rectangle" d="M-2-2H8V8H-2zM8 8h10v10H8zM18 18h10v10H18zM28 28h10v10H28z"/>
                </g>
              </g>
              <path d="M194.141 53.46c.109 0 .217-.002.325-.003 56.647.557 96.932 15.1 120.857 43.635 36.025 42.967 46.834 85.066 16.368 92.344-30.467 7.277-34.378-27.174-33.671-36.571-4.344-10.837-15.782-18.988-34.315-24.452 12.385 105.61 19.33 159.869 20.833 162.775 2.256 4.359 8.31 8.549 8.31 14.994 0 6.444-49.658 6.994-57.014-3.227-7.31-10.158-6.16-90.275-41.368-89.382v.026c-.108-.006-.217-.01-.325-.015l-.324.015v-.026c-35.208-.893-34.058 79.224-41.369 89.382-7.355 10.22-57.014 9.671-57.014 3.227 0-6.445 6.055-10.635 8.31-14.994 1.504-2.906 8.449-57.164 20.833-162.775-18.532 5.464-29.97 13.615-34.314 24.452.707 9.397-3.205 43.848-33.671 36.57-30.466-7.277-19.657-49.376 16.367-92.343 23.926-28.535 64.211-43.078 120.858-43.629a6.07 6.07 0 0 1 .324-.003Z" id="body-container" stroke="#000000" stroke-width="4" fill="#000000"/>
            </g>
        </g>
        <g id="head">
            <g transform="translate(69 2)">
              <path d="M237.096 139.18c19.096 15.789 29.75 39.935 39.011 39.935 9.262 0 26.218-18.154 23.475-29.635-1.83-7.654-14.69-16.376-38.582-26.164 23.432 2.467 37.239 1.861 41.42-1.818 6.273-5.518 0-28.649-9.112-31.4-9.112-2.751-47.122 5.508-64.362 15.634-17.241 10.126-10.946 17.657 8.15 33.447Z" id="head-bow" fill="#000000"/>
              <path d="M120.795 239.652c22.747 0 110.099-3.1 121.84-93.583C253.375 49.127 212.761.437 120.795 0 35.6 2.557-4.53 51.247.405 146.069c6.464 78.79 97.643 93.583 120.39 93.583Z" id="head-background" stroke="#000000" stroke-width="4" fill="#000000"/>
              <path d="M124.639 183.468c63.695 0 87.954-12.612 87.954-40.229C214.257 135.232 207.703 90 124.64 90s-94.044 39.319-93.628 53.24c-.127 32.848 29.932 40.228 93.628 40.228Z" id="head-face" stroke="#000000" stroke-width="4" fill="#FED4A0"/>
            </g>
        </g>
      </g>
    </svg>
`);

export default class SecretNinja extends Character {

    /**
     * Returns info about the character
     */
    get character() {
        return CHARACTERS.ninja;
    }

    /**
     * Hooks up the element
     */
    connectedCallback() {
        super.connectedCallback(template);
        this.$body = this.shadowRoot.querySelector("#body");
    }

    /**
     * Updates the position of the unicorn eye, head and body.
     * @param targetCenter
     */
    updateEyeAndHeadPosition(targetCenter) {
        super.updateEyeAndHeadPosition(targetCenter);
        if (this.$body != null) {
            setTransformTowardsTarget(this.$body, targetCenter, 1);
        }
    }

    /**
     * Handles that a target was clicked.
     * @param {*} e
     * @param {*} $target
     */
    handleDidClickTarget(e, $target) {
        super.handleDidClickTarget(e, $target);
        this.shootNinjaStarAtTarget($target, {
            x: e.clientX,
            y: e.clientY
        }).then();
    }

    /**
     * Handles the auto trigger.
     * @param $elem
     * @returns {Promise<void>}
     */
    async handleAutoTrigger($elem) {
        await this.shootNinjaStarAtTarget($elem);
    }

    /**
     * Shoots a ninja star at a position.
     * @param $target
     * @param mousePosition
     * @returns {Promise<void>}
     */
    async shootNinjaStarAtTarget($target, mousePosition = undefined) {


        // Find centers and distance
        const targetCenter = mousePosition || getCenter($target);
        const bodyCenter = getCenter(this.$body);
        const distance = getDistanceBetweenPoints(bodyCenter, targetCenter);

        // Create ninja star
        const {$star, $starContainer} = createNinjaStarElement(bodyCenter, targetCenter);
        document.body.appendChild($starContainer);

        // Play the throwing sound
        this.soundbox.play("throwing", 0.4).then();

        // Animate the ninja star to the target
        await promisifyAnimation($star.animate({
            transform: [`translateY(0) rotate(0deg)`, `translateY(${distance}px) rotate(${360 * 4}deg)`]
        }, {
            duration: NINJA_STAR_DURATION,
            easing: "linear",
            fill: "both"
        }));

        // Play sword sound instead of throwing sound
        this.soundbox.stop("throwing");
        this.soundbox.play("sword", 0.3).then();

        // Remove ninja star and target
        $starContainer.remove();
        await this.removeTarget($target);

        // Add one point
        this.addPoints(1);

        // Change position!
        this.soundbox.play("woosh", 0.4).then();
        this.setRandomPosition();
    }

}

defineCustomElement("secret-ninja", SecretNinja);