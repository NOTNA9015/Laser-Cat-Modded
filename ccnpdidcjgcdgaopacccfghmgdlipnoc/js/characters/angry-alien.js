import {Character, sharedCharacterStyles} from "./character.js";
import {
    getCenter,
    defineCustomElement,
    prepareNodeForAnimation,
    promisifyAnimation,
    collectElements,
    getRandomItem,
    createHTML, isDestructible
} from "../util.js";
import {CHARACTERS, TOP_Z_INDEX} from "../../config.js";
import "../eye.js";

const RESERVED_FOR_BLACKHOLE_ATTRIBUTE = `data-black-hole`;
const MAX_ELEMENTS_COLLECTION_LIMIT = 3000;
const MAX_BLACK_HOLES_COUNT = 10;

/**
 * Creates a black hole.
 * @param {*} position
 */
function createBlackHole(position) {
    //$const $blackHole = document.createElement("div");
    const $blackHole = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    $blackHole.setAttribute("preserveAspectRatio", "none");
    $blackHole.setAttribute("viewBox", "0 0 162 162");
    $blackHole.setAttribute(RESERVED_FOR_BLACKHOLE_ATTRIBUTE, "");
    $blackHole.innerHTML = createHTML(`
		<g ${RESERVED_FOR_BLACKHOLE_ATTRIBUTE} fill="none" fill-rule="nonzero">
			<path ${RESERVED_FOR_BLACKHOLE_ATTRIBUTE} d="M161.896 65.852c-6.894-27.42-31.822-46.962-60.615-46.962-15.728 0-30.767 5.844-42.345 16.455a62.705 62.705 0 00-8.483 9.555c.327-2.57.889-5.14 1.711-7.68C57.96 19.306 74.602 7.27 93.575 7.27c.397 0 .796.005 1.193.016a3.528 3.528 0 003.596-3.127l.012-.105c.228-1.986-1.247-3.793-3.257-3.923C93.771.043 92.42 0 91.075 0c-27.27 0-51.193 17.304-59.526 43.06-4.81 14.864-3.805 30.866 2.831 45.053.105.225.223.442.33.664-.296-.207-.591-.41-.88-.627C18.374 76.666 12.5 56.228 19.167 38.496c.652-1.736-.09-3.681-1.777-4.48l-.097-.047c-1.814-.86-4.014-.068-4.792 1.772C1.467 61.797 9.627 92.27 32.675 109.4c9.51 7.067 20.59 11.22 32.304 12.15a43.087 43.087 0 01-12.314 3.7c-2.06.296-4.15.444-6.214.444-17.069 0-32.583-10.064-39.564-25.35-.754-1.655-2.68-2.439-4.404-1.833l-.099.035c-1.9.668-2.887 2.778-2.126 4.63 9.541 23.202 32.32 38.548 57.799 38.548 2.967 0 5.971-.214 8.928-.637 15.568-2.221 29.615-10.13 39.553-22.268a62.496 62.496 0 002.984-3.976 42.282 42.282 0 01-4.187 15.187c-7.228 14.72-22.591 24.231-39.139 24.231-2.458 0-4.913-.208-7.332-.622-1.802-.308-3.534.833-3.998 2.589l-.028.104c-.51 1.931.687 3.927 2.654 4.34A62.5 62.5 0 0070.322 162c23.78 0 45.86-13.676 56.252-34.839 6.893-14.035 8.192-30.016 3.657-44.997a62.272 62.272 0 00-3.213-8.376c.58.518 1.15 1.05 1.707 1.6 13.65 13.554 16.535 34.612 7.395 51.221-.896 1.626-.439 3.657 1.115 4.685l.09.06c1.674 1.107 3.963.633 4.998-1.077 14.658-24.23 10.95-55.547-9.41-75.757-8.455-8.392-18.924-14.062-30.334-16.606a43.108 43.108 0 0110.604-1.328c19.341 0 36.407 12.912 41.742 31.124.51 1.743 2.304 2.787 4.096 2.43l.107-.02c1.975-.389 3.255-2.33 2.768-4.268z" fill="#454545"/>
			<path ${RESERVED_FOR_BLACKHOLE_ATTRIBUTE} d="M114.966 80.983c0 18.769-15.214 33.984-33.983 33.984S47 99.752 47 80.983C47 62.215 62.214 47 80.983 47s33.983 15.215 33.983 33.983z" fill="#000"/>
		</g>`);

    const size = 100;

    Object.assign($blackHole.style, {
        width: `${size}px`,
        height: `${size}px`,
        position: `fixed`,
        left: `${position.x - (size / 2)}px`,
        top: `${position.y - (size / 2)}px`,
        zIndex: TOP_Z_INDEX,
        pointerEvents: `none`,
        transformOrigin: `center`
    });

    return $blackHole;
}

/** Template for alien */
const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
		${sharedCharacterStyles}

		#alien {
			width: 150px;
		}

		:host {
			transform: translateY(80%);
		}

		:host(:hover) {
			transform: translateY(45%);
		}

		:host([active]) {
			transform: translateY(10%);
		}

		#eyes {
			position: absolute;
			left: 42px;
			top: 21px;
		}

		.eye:nth-child(1) {
			top: 2px;
			left: 0px;
		}

		.eye:nth-child(2) {
			--eye-size: 15px;
			top: 5px;
			left: 30px;
		}

		.eye:nth-child(3) {
			--eye-size: 30px;
			top: 25px;
			left: 18px;
		}

		.eye:nth-child(4) {
			--eye-size: 25px;
			top: 10px;
			left: 50px;
		}

		.eye:nth-child(5) {
			top: 29px;
			left: -5px;
			--eye-size: 20px;
		}

		.eye:nth-child(6) {
			top: 47px;
			left: 73px;
			--eye-size: 12px;;
		}

		:host(.happy) #mouth {
			transform: rotate(175deg) translate(40px, -160px);
			transform-origin: center;
		}

		#head-mask {
			fill: var(--alien-bg, #65DDB9);
		}

		#slime {
			fill: var(--alien-slime-bg, #84FFDA);
		}

		#right-mark-1, #right-mark-2, #right-mark-3,
		#left-mark-1, #left-mark-2, #left-mark-3, 
		#top-mark-1, #top-mark-2, #top-mark-3 {
			fill: var(--alien-mark-bg, #46B29D);
		}
	</style>

	<div id="eyes">
		<laser-cat-eye class="eye"></laser-cat-eye>
		<laser-cat-eye class="eye"></laser-cat-eye>
		<laser-cat-eye class="eye"></laser-cat-eye>
		<laser-cat-eye class="eye"></laser-cat-eye>
		<laser-cat-eye class="eye"></laser-cat-eye>
		<laser-cat-eye class="eye"></laser-cat-eye>
	</div>
	<svg id="alien" preserveAspectRatio="none" viewBox="0 0 486 452" width="100%" height="100% xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
		<defs>
			<path d="M397.173 390.081c56.6-51.637 66.096-106.171 43.673-221.984C418.424 52.285 369.28-13.419 195.648 2.307 54.91 15.053 0 139.627 0 238.284c0 24.75 9.463 134.692 79.76 169.545 70.298 34.852 260.811 33.889 317.413-17.748z" id="path-1"/>
			<path d="M2.931 92.074c20.64 39.3 89.014 24.311 123.98 0 34.966-24.312 56.918-91.062 18.742-91.062-38.177 0-163.361 51.762-142.722 91.062z" id="path-3"/>
			<path d="M125.624 2.901c-1.189 16.094-3.895 24.653-8.117 25.678-3.958.96-11.21-3-21.754-11.882l29.871-13.796z" id="path-4"/>
			<path d="M78.889 20.944c1.09 17.277.168 26.494-2.767 27.65-2.72 1.073-10.3-3.416-22.736-13.465l25.503-14.185z" id="path-5"/>
			<path d="M39.91 45.453c-.714 16.572-2.567 25.388-5.56 26.448-2.477.877-9.402-2.38-20.777-9.771L39.91 45.453z" id="path-6"/>
		</defs>
		<g id="alien-(final)" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
			<g id="head-container" transform="translate(17 16)">
				<g id="head">
					<mask id="mask-2" fill="#fff">
						<use xlink:href="#path-1"/>
					</mask>
					<g id="head-mask" fill-rule="nonzero" fill="#65DDB9">
						<use xlink:href="#path-1"/>
						<path stroke="#000" stroke-width="4" d="M398.52 391.559c-26.87 24.513-85.195 39.262-154.844 41.828-65.622 2.417-130.21-6.615-164.804-23.767-31.864-15.797-53.78-47.524-67.258-89.744C2.425 291.094-2 259.153-2 238.284c0-53.566 15.703-108.605 45.405-151.347C77.975 37.191 129.275 6.31 195.468.315 279.993-7.34 337.593 3.95 376.187 34.303c34.448 27.093 54.105 68.76 66.623 133.414 22.79 117.714 12.313 172.204-44.29 223.842z" fill-rule="evenodd"/>
					</g>
					<g id="top-marks" mask="url(#mask-2)" fill="#46B29D" fill-rule="nonzero" stroke="#000">
						<g transform="translate(191 -9)">
							<path d="M14.312 6.323C5.26 8.549.734 11.149.734 14.122c0 2.973 5.987 5.617 17.96 7.933L14.312 6.323z" id="top-mark-1" transform="scale(-1 1) rotate(-80 0 25.765)"/>
							<path d="M39.394 4.323c-9.052 2.226-13.578 4.826-13.578 7.799 0 2.973 5.987 5.617 17.96 7.933L39.394 4.323z" id="top-mark-2" transform="scale(-1 1) rotate(-80 0 53.657)"/>
							<path d="M62.464 3.323c-9.052 2.226-13.578 4.826-13.578 7.799 0 2.973 5.987 5.617 17.96 7.933L62.464 3.323z" id="top-mark-3" transform="scale(1 -1) rotate(79 71.439 0)"/>
						</g>
					</g>
					<g id="right-marks" mask="url(#mask-2)" fill="#46B29D" fill-rule="nonzero" stroke="#000">
						<g transform="rotate(81 124.757 350.695)">
							<path d="M16 7.55c-.61 9.106-2.357 13.912-5.24 14.417C7.878 22.473 4.291 17.15 0 6l16 1.55z" id="right-mark-1"/>
							<path d="M41 5.55c-.61 9.106-2.357 13.912-5.24 14.417C32.878 20.473 29.291 15.15 25 4l16 1.55z" id="right-mark-2"/>
							<path d="M66 7.228c-4.018 8.374-7.525 12.28-10.522 11.72C52.48 18.385 50.988 12.07 51 0l15 7.228z" id="right-mark-3"/>
						</g>
					</g>
					<g id="left-marks" mask="url(#mask-2)" fill="#46B29D" fill-rule="nonzero" stroke="#000">
						<g transform="rotate(-85 124.367 125.925)">
							<path d="M16 7.55c-.61 9.106-2.357 13.912-5.24 14.417C7.878 22.473 4.291 17.15 0 6l16 1.55z" id="left-mark-1"/>
							<path d="M41 5.55c-.61 9.106-2.357 13.912-5.24 14.417C32.878 20.473 29.291 15.15 25 4l16 1.55z" id="left-mark-2"/>
							<path d="M66 7.228c-4.018 8.374-7.525 12.28-10.522 11.72C52.48 18.385 50.988 12.07 51 0l15 7.228z" id="left-mark-3"/>
						</g>
					</g>
					<g id="slime" mask="url(#mask-2)" fill="#84FFDA" fill-rule="nonzero" stroke="#000">
						<g transform="translate(183 336)">
							<path d="M70.09 9.087C66.288 23.06 51.956 20.022 45.934 26.884c-6.022 6.861-5.946 19.86-14.953 17.126-9.007-2.734-2.617-14.876-6.773-23.265-4.157-8.39-14.18-2.514-14.18-19.026L70.09 9.087z" id="slime-3" transform="rotate(-3 40.059 23.05)"/>
							<path d="M9.952 33.06c7.906-.895 8.462 8.567 6.669 13.332-1.793 4.764-7.314 11.63-13.805 5.628-6.492-6.003-.77-18.067 7.136-18.96z" id="slime-2"/>
							<path d="M58.138 32.38c5.884-.665 6.298 6.378 4.963 9.924-1.335 3.546-5.443 8.656-10.275 4.189-4.832-4.468-.572-13.447 5.312-14.113z" id="slime-1" transform="rotate(-14 57.23 40.287)"/>
						</g>
					</g>
					<g id="mouth" mask="url(#mask-2)" fill-rule="nonzero">
						<g transform="scale(1 -1) rotate(23 1063.804 224.934)">
							<g id="mouth-bg" fill="#000">
								<use xlink:href="#path-3"/>
								<use xlink:href="#path-3"/>
							</g>
							<g id="tooth-3" transform="rotate(8 110.689 15.81)" fill="#FFF">
								<use xlink:href="#path-4"/>
								<use xlink:href="#path-4"/>
							</g>
							<g id="tooth-2" transform="rotate(4 66.359 34.847)" fill="#FFF">
								<use xlink:href="#path-5"/>
								<use xlink:href="#path-5"/>
							</g>
							<g id="tooth-1" transform="rotate(-8 26.741 58.747)" fill="#FFF">
								<use xlink:href="#path-6"/>
								<use xlink:href="#path-6"/>
							</g>
						</g>
					</g>
				</g>
			</g>
		</g>
	</svg>
`);

export default class AngryAlien extends Character {

    /**
     * Returns info about the character
     */
    get character() {
        return CHARACTERS.alien;
    }

    /**
     * Hooks up the element
     */
    connectedCallback() {
        super.connectedCallback(template);
        this.$blackHoles = [];
    }


    /**
     * Detach the alien.
     */
    detach() {
        super.detach();
        this.removeBlackHoles();
        this.soundbox.stop("space");
    }

    /**
     * Handles that the page was clicked.
     * @param {*} e
     */
    handleDidClickTarget(e) {
        this.attachBlackHole({
            x: e.clientX,
            y: e.clientY
        });
    }

    /**
     * Handles the auto trigger.
     * @param $elem
     * @returns {Promise<void>}
     */
    async handleAutoTrigger($elem) {
        await this.attachBlackHole(getCenter($elem));
    }

    /**
     * Attaches a black hole.
     * @param {*} mousePosition
     */
    async attachBlackHole(mousePosition) {

        // Don't allow too many black holes
        if (this.$blackHoles.length >= MAX_BLACK_HOLES_COUNT) {
            return;
        }

        // Play sounds
        if (!this.soundbox.isPlaying("woop")) {
            this.soundbox.play("woop").then();
        }

        // Play some spacy space music
        if (!this.soundbox.isPlaying("space")) {
            this.soundbox.play("space", 0.4, true).then();
        }

        // Create the black hole and add it
        const blackHoleCenter = mousePosition || getCenter($target);
        const $blackHole = createBlackHole(blackHoleCenter);
        $blackHole.setAttribute(RESERVED_FOR_BLACKHOLE_ATTRIBUTE, "");

        // Add the black hole
        document.body.appendChild($blackHole);
        this.$blackHoles.push($blackHole);

        // Flash the eye
        this.flashEyes();

        // Animate the black hole into its location
        const alienCenter = getCenter(this);
        const xDistanceToBlackHoleLocation = alienCenter.x - blackHoleCenter.x;
        const yDistanceToBlackHoleLocation = alienCenter.y - blackHoleCenter.y;

        await promisifyAnimation($blackHole.animate({
            transform: [
                `translate(${xDistanceToBlackHoleLocation}px, ${yDistanceToBlackHoleLocation}px)`,
                `translate(0, 0)`
            ]
        }, {
            easing: "ease-out",
            duration: 1700,
            fill: "both"
        }));


        // Rotate the blackhole and add it
        promisifyAnimation($blackHole.animate({
            transform: [
                `rotate(0)`,
                `rotate(-360deg)`
            ]
        }, {
            easing: "linear",
            duration: (Math.random() * 3000) + 3000,
            iterations: Infinity,
            fill: "both"
        })).then();

        /**
         * Returns an array of suckable elements.
         */
        const collectSuckableElements = () => {
            // Get ALL elements on the page and filter the elements to find the one we are going to consume!
            return collectElements(document.body, {
                limit: MAX_ELEMENTS_COLLECTION_LIMIT,
                // Only allow the $elem if it is destructible and not a black hole.
                filter: $elem => isDestructible($elem) && !$elem.hasAttribute(RESERVED_FOR_BLACKHOLE_ATTRIBUTE) && $elem.parentNode != null && $elem.isConnected
            });
        }

        /**
         * Sucks in  random element.
         */
        const suckInRandomElement = () => {
            const elements = collectSuckableElements();

            // If there are no elements left we make everything black
            if (elements.length === 0) {
                document.body.style.background = `black`;
                this.classList.add("happy");
                this.removeBlackHoles();
                return;
            }

            // Select a random element from the last half of the array and consume it
            const $elem = getRandomItem(elements.slice(Math.floor(elements.length / 2)));
            if ($elem != null && $blackHole.isConnected) {

                // Tell the rest of the world that the element is reserved for the black hole
                $elem.setAttribute(RESERVED_FOR_BLACKHOLE_ATTRIBUTE, "");

                // Compute necessary things we are going to use for the animation
                const elemCenter = getCenter($elem);
                const xDistanceToElem = blackHoleCenter.x - elemCenter.x;
                const yDistanceToElem = blackHoleCenter.y - elemCenter.y;

                // Random rotation between -180 and 180
                const randomRotation = (Math.random() * 360) - 180;

                // Prepare the node for animation
                prepareNodeForAnimation($elem);

                // Animate the cloned target closer and closer to the black hole
                promisifyAnimation($elem.animate({
                    transform: [
                        `translate(0, 0) scale(1) rotate(0)`,
                        `translate(${xDistanceToElem}px, ${yDistanceToElem}px) scale(0) rotate(${randomRotation}deg)`],
                }, {
                    easing: "ease-out",
                    duration: (Math.random() * 7000) + 1000,
                    fill: "both"
                })).then(() => {
                    $elem.remove();

                    // Add one point for each element that is sucked in
                    this.addPoints(1);
                });

                setTimeout(() => suckInRandomElement(), Math.random() * 1000);
            }
        }

        suckInRandomElement();
    }

    /**
     * Flash all eyes.
     */
    flashEyes() {
        for (const $eye of this.eyes) {
            $eye.flash();
        }
    }

    /**
     * Removes all  current black holes.
     */
    removeBlackHoles() {
        // Remove all current black holes
        for (const $blackHole of this.$blackHoles) {
            promisifyAnimation($blackHole.animate({
                transform: [
                    `scale(1)`,
                    `scale(0)`
                ]
            }, {
                duration: 400,
                easing: "ease-out",
                fill: "both"
            })).then(() => $blackHole.remove());
        }

        this.$blackHoles = [];
    }
}

defineCustomElement("angry-alien", AngryAlien);