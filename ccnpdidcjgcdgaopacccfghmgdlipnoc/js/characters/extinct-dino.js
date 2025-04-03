import {Character, sharedCharacterStyles} from "./character.js";
import {
    defineCustomElement,
    createHTML,
    promisifyAnimation,
    getCenter,
    getAngleBetweenPoints,
    getDistanceBetweenPoints,
    getElementFromPoint,
    isDestructible,
    prepareNodeForAnimation,
    waitForAnimationFrame, collectElements, isVisibleInViewport, shakeElements, getRandomElementOnPage
} from "../util.js";
import {CHARACTERS, TOP_Z_INDEX} from "../../config.js";
import "../eye.js";
import "../fire.js";
import "../asteroid.js";

const EXPLOSION_OFFSET = 40;
const EXPLOSION_DIRECTIONS = [
    [EXPLOSION_OFFSET, EXPLOSION_OFFSET],
    [-EXPLOSION_OFFSET, EXPLOSION_OFFSET],
    [EXPLOSION_OFFSET, -EXPLOSION_OFFSET],
    [-EXPLOSION_OFFSET, -EXPLOSION_OFFSET]
];

const ASTEROID_SIZE = 200;
const MAX_SHAKEABLE_ELEMENTS = 500;

/**
 * Creates an asteroid element.
 */
function createAsteroid(size = ASTEROID_SIZE) {
    const $asteroid = document.createElement("laser-cat-asteroid");
    $asteroid.classList.add("asteroid");
    Object.assign($asteroid.style, {
        width: `${size}px`,
        height: `${size}px`,
        transformOrigin: `${55 + (Math.random() * 10)}% ${55 - (Math.random() * 10)}%`,
        position: "relative",
    });

    return $asteroid;
}

/**
 * Creates a fire trail element.
 */
function createFireTrail(size = ASTEROID_SIZE) {
    const $fireTrail = document.createElement("laser-cat-fire");
    $fireTrail.classList.add("asteroid");
    $fireTrail.style.setProperty("--fire-duration", "400ms");
    Object.assign($fireTrail.style, {
        width: `${size}px`,
        height: `${size}px`,
        transformOrigin: `center center`,
        position: "absolute",
        top: "50%",
        left: "-60%",
        zIndex: "-1"
    });

    return $fireTrail;
}

/**
 * Creates the container for the asteroid.
 * @param startPosition
 * @param targetCenter
 * @param asteroidSize
 * @returns {HTMLDivElement}
 */
function createAsteroidContainer(startPosition, targetCenter, asteroidSize = ASTEROID_SIZE) {
    const $container = document.createElement("div");
    $container.classList.add("asteroid-container");
    Object.assign($container.style, {
        transform: `rotate(${getAngleBetweenPoints({
            x: startPosition.x,
            y: startPosition.y - (asteroidSize / 2)
        }, targetCenter)}deg)`,
        position: `fixed`,
        left: `${startPosition.x}px`,
        top: `${startPosition.y - asteroidSize}px`,
        zIndex: TOP_Z_INDEX,
        pointerEvents: `none`,
        transformOrigin: `left center`
    });

    return $container;
}

/** Template for the dino */
const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
		${sharedCharacterStyles}
		
		#dino {
			width: 170px;
		}
		
		:host([active]) {
		}
		
		.eye.left {
            left: 57px;
            top: 65px;
    	}
    	
		.eye.right {
            left: 132px;
            top: 74px;
            --eye-size: 18px;
      }
	</style>
    <div id="eyes">
        <laser-cat-eye class="eye left"></laser-cat-eye>
        <laser-cat-eye class="eye right"></laser-cat-eye>
    </div>
	<svg id="dino" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 522 640" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <path d="M465.006 576.513c8.105-23.653.566-107.41-5.786-185.314 44.19-21.25 63.41-62.684 57.66-124.299l-23.65-6.367C527.433 87.443 471.755.9 326.193.9 107.85.899 99.702 100.235 88.135 157.922c-11.566 57.687 16.082 153.673 11.567 288.38-.895 26.704-1.865 50.126-2.91 70.266-.735 14.185-49.222 14.178-92.121-136.256-16.01 127.442 14.697 198.59 92.121 213.441 52.875 4.397 90.79 6.288 113.748 5.675 77.534-2.072 137.949-5.675 179.784-5.675 41.836 0 66.577 6.413 74.682-17.24Z" id="path-1"/>
      </defs>
      <g id="head" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M331 46.243 306.066 2l-25.192 44.243-20.09-41.081-19.46 47.29-16.738-40.531-20.888 48.18-26.202-32.084-11.346 47.28-35.561-22.844 3.257 48.104-39.72-14.862 15.885 56.411-42.317-3.788 26.431 52.578L51 205.002c27.874 22.039 40.806 33.058 38.797 33.058-2.01 0-14.942 5.012-38.797 15.035l43.125 35.503L51 317.12l48.302 23.203L51 365.908l55.053 24.837-38.359 16.071 38.36 25.826-32.665 16.226L106.053 467 331 205.002V46.242Z" id="scale-body" stroke="#000" stroke-width="4" fill="#0C7D1D"/>
        <path id="scales-tail" stroke="#000" stroke-width="4" fill="#0C7D1D" d="m7 425 41.503 3.899L20.1 476.751l37.529-6.796-15.046 44.479L82 501.522 70.753 567l-57.791-65.478z"/>
        <g id="body" transform="translate(2 38)">
          <mask id="mask-2" fill="#fff">
            <use xlink:href="#path-1"/>
          </mask>
          <use id="body-mask" stroke="#000" stroke-width="4" fill="#77E788" xlink:href="#path-1"/>
          <path d="M542 264.59c-156.06 14.579-289.416 20.379-400.07 17.4 76.417-11.6 199.745-19.553 369.983-23.858L542 264.59Z" id="mouth" fill="#000" mask="url(#mask-2)"/>
          <g id="nose" mask="url(#mask-2)" fill="#000">
            <g transform="translate(307 214)">
              <circle id="nostril-left" cx="9" cy="9" r="9"/>
              <circle id="nostril-right" cx="35" cy="9" r="9"/>
            </g>
          </g>
          <g id="arms" mask="url(#mask-2)" stroke="#000" stroke-width="4">
            <g transform="translate(150 411)">
              <path d="M14.888 10.214C27.448 50.071 38.589 70 48.308 70c9.72 0 14.58-19.929 14.58-59.786" id="arm-left" transform="rotate(-43 38.888 40.107)"/>
              <path d="M219.994 8.785c12.56 39.857 23.7 59.786 33.42 59.786 9.72 0 14.58-19.929 14.58-59.786" id="arm-right" transform="scale(-1 1) rotate(-43 0 658.092)"/>
            </g>
          </g>
        </g>
      </g>
    </svg>
`);

export default class ExtinctDino extends Character {

    /**
     * Returns info about the character
     */
    get character() {
        return CHARACTERS.dino;
    }

    /**
     * Hooks up the element
     */
    connectedCallback() {
        super.connectedCallback(template);
    }

    /**
     * Handles that a target was clicked.
     * @param {*} e
     * @param {*} $target
     */
    handleDidClickTarget(e, $target) {
        super.handleDidClickTarget(e, $target);
        this.fireAsteroidAtTarget($target, {
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
        await this.fireAsteroidAtTarget($elem);
    }

    /**
     *  Shoots a horn at a position.
     * @param $target
     * @param mousePosition
     * @returns {Promise<void>}
     */
    async fireAsteroidAtTarget($target, mousePosition = undefined) {
        const targetCenter = mousePosition || getCenter($target);

        // Find all nearby targets that are destructible
        const $targets = [
            ...($target == null && mousePosition != null ? [getElementFromPoint(mousePosition)] : $target != null ? [$target] : null),
            ...EXPLOSION_DIRECTIONS.map(([offsetX, offsetY]) => getElementFromPoint({
                x: targetCenter.x + offsetX,
                y: targetCenter.y + offsetY
            }))
        ].filter($elem => isDestructible($elem));

        // Compute the trajectory of the asteroid
        const asteroidSize = ASTEROID_SIZE;
        const asteroidStartPosition = {
            y: 0,
            x: Math.random() * window.innerWidth
        };
        const asteroidDistance = getDistanceBetweenPoints(asteroidStartPosition, targetCenter) - (asteroidSize / 2);
        const asteroidDuration = 2000; // The duration of the falling sound

        // Create the asteroid (the container point the asteroid in the correct direction)
        const $asteroidContainer = createAsteroidContainer(asteroidStartPosition, targetCenter, asteroidSize);
        const $asteroid = createAsteroid(asteroidSize);
        const $fireTrail = createFireTrail(asteroidSize);

        $asteroidContainer.appendChild($asteroid);
        $asteroidContainer.appendChild($fireTrail);

        document.body.appendChild($asteroidContainer);

        // Play falling sound
        this.soundbox.play("falling", 0.4).then();

        // Animate the firetrail and move the asteroid to the target
        promisifyAnimation($fireTrail.animate({
            transform: [`translate(0, -50%) rotate(-90deg)`, `translate(${asteroidDistance}px, -50%) rotate(-90deg)`]
        }, {duration: asteroidDuration, fill: "both"})).then();

        await promisifyAnimation($asteroid.animate({
            transform: [`translateX(0) rotate(0)`, `translateX(${asteroidDistance}px) rotate(${100 + (Math.random() * 200)}deg)`]
        }, {duration: asteroidDuration, fill: "both"}));

        $asteroidContainer.remove();
        $fireTrail.remove();

        // Explode and remove all the targets
        for (const $elem of $targets) {
            prepareNodeForAnimation($elem);
            promisifyAnimation($elem.animate({
                transform: [`translate(0, 0) rotate(0)`, `translate(${150 - (Math.random() * 300)}px, ${150 - (Math.random() * 300)}px) rotate(${getAngleBetweenPoints(targetCenter, getCenter($elem))}deg)`],
                opacity: [1, 0]
            }, {
                duration: 300 + (Math.random() * 300),
                easing: "ease-out",
                fill: "both"
            })).then(() => {
                $elem.remove();

                // Add one point for each element that is sucked in
                this.addPoints(1);
            });
        }

        // Stop playing the falling sound and start playing the explosion sound
        this.soundbox.stop("falling");
        this.soundbox.play("explosion", 0.4);

        // Shaking the elements ia very expensive so make sure the asteroid is removed before
        await waitForAnimationFrame();
        await waitForAnimationFrame();
        await waitForAnimationFrame();

        // Find shakable elements
        const $shakeableElements =
            collectElements(document.body, {
                filter: $elem => isDestructible($elem) && isVisibleInViewport($elem)
            })
                .filter(() => Math.random() < 0.5)
                .slice(0, MAX_SHAKEABLE_ELEMENTS);

        // Shake the screen
        await shakeElements($shakeableElements);
    }


}

defineCustomElement("extinct-dino", ExtinctDino);