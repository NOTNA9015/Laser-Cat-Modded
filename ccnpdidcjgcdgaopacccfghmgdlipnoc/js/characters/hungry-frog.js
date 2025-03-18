import {Character, sharedCharacterStyles} from "./character.js";
import {
    getCenter,
    defineCustomElement,
    getDistanceBetweenPoints,
    getAngleBetweenPoints,
    waitForAnimationFrame,
    promisifyAnimation,
    prepareNodeForAnimation,
    createHTML, wait
} from "../util.js";
import {AUTO_PEEK_MS, CHARACTERS, TOP_Z_INDEX} from "../../config.js";
import "../eye.js";

/**
 * Creates a tounge element.
 * @param {*} headCenter
 * @param {*} targetCenter
 */
function createToungeElement(mouthCenter, targetCenter) {
    const $tounge = document.createElement("div");

    const toungeSize = 15;

    Object.assign($tounge.style, {
        width: `${getDistanceBetweenPoints(mouthCenter, targetCenter)}px`,
        height: `${toungeSize}px`,
        background: `linear-gradient(to left, var(--frog-mouth-bg, #F5B7BD) 98%, rgba(0, 0, 0, 0))`,
        position: `fixed`,
        left: `${mouthCenter.x}px`,
        top: `${mouthCenter.y - (toungeSize / 2)}px`,
        zIndex: TOP_Z_INDEX,
        pointerEvents: `none`,
        transformOrigin: `0 center`,
        borderRadius: `10px 50px 50px 10px`,
        transform: `rotate(${getAngleBetweenPoints(mouthCenter, targetCenter)}deg)`,
    });

    return $tounge;
}

/** Template for the hungry frog */
const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
		${sharedCharacterStyles}

		#frog {
			width: 150px;
		}

		:host(:hover) {
			transform: translateY(50%);
		}

		:host([active]) {
			transform: translateY(17%);
		}

		.eye {
			top: 14px;
		}

		.eye.left {
			left: 16px;
		}

		.eye.right {
			right: 16px;
		}

		#mouth {
			opacity: 0;
		}

		#head-bg-1, #body-bg, #body-foot-left, #body-foot-right, #body-feet, #head-right-eye-area-1, #head-right-eye-area-1 {
			fill: var(--frog-bg, #82C35F);
		}

		#head-right-eye-area-2, #head-right-eye-area-2, #head-nostril-1, #head-nostril-2 {
			fill: var(--frog-bg-dark, #73AF55);
		}

		#head-bg-2, #body-area {
			fill: var(--frog-bg-light, #BEE178);
		}

		#body-highlight-1, #body-highlight-2 {
			fill: var(--frog-highlight, #D2F0A0);
		}

	</style>

	<laser-cat-eye class="eye left"></laser-cat-eye>
	<laser-cat-eye class="eye right"></laser-cat-eye>

	<svg id="frog" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 495 468">
		<g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
			<g id="body" fill-rule="nonzero" transform="translate(85.000000, 265.000000)">
				<path id="body-bg" fill="#82C35F" stroke="#000" stroke-width="4" d="M282,0 C305.333333,21.1158995 317,47.7825662 317,80 C317,112.217434 305.333333,134.998365 282,148.342794 L307,148.342794 L307,162.602598 L22,162.602598 L22,148.342794 L47,148.342794 C20.3333333,133.563584 7,110.478316 7,79.0869894 C7,47.6956631 20.3333333,21.4642917 47,0.39287499 L282,0 Z"/>
				<circle id="body-foot-right" cx="310" cy="155" r="14" fill="#82C35F" stroke="#000" stroke-width="4"/>
				<circle id="body-foot-left" cx="14" cy="155" r="14" fill="#82C35F" stroke="#000" stroke-width="4"/>
				<path id="body-area" fill="#BEE178" d="M244.541424,160.5 L239.65017,155.469208 C263.852117,104.175387 275.265043,55.8523172 273.88895,10.5 L44,10.5 C44,54.2032334 55.4129266,102.526303 78.2387797,155.469208 L73.3475255,160.5 L244.541424,160.5 Z"/>
				<path id="body-feet" fill="#82C35F" stroke="#000" stroke-width="4" d="M225.690837,158.304079 C226.603682,158.800441 227.824005,159.502541 229.359299,160.414004 C233.017305,162.585666 238.490315,165.962348 245.78411,170.547358 L251.65928,174.240596 L222.478111,174.240596 L227.502063,191.824101 L205.115517,181.874382 L200.682516,197.832082 L198.284211,193.869704 L182.807507,168.298415 C182.568975,167.926784 182.22856,167.351686 181.884756,166.680496 C181.712334,166.343885 181.556261,166.014095 181.420155,165.693397 C181.052173,164.826338 180.839002,164.069844 180.839002,163.342546 C180.839002,162.792086 180.992126,162.183813 181.278371,161.31032 C181.320193,161.182697 181.364426,161.05169 181.410783,160.917816 C181.518754,160.606001 181.633489,160.292031 181.748177,159.989771 C181.817286,159.807631 181.871739,159.668048 181.881455,159.646504 C190.03295,137.092848 196.818651,111.05539 198.195348,87.725112 C200.247491,52.9483411 189.432765,33.1337933 161.858249,33.1337933 C135.02309,33.1337933 124.434177,53.0745967 126.354544,88.0381401 C127.637633,111.398942 134.135378,137.390669 141.920943,159.789443 C142.04007,160.049621 142.19154,160.411562 142.343497,160.834485 C142.468755,161.1831 142.576161,161.5267 142.660445,161.862594 C142.797056,162.407027 142.870001,162.912307 142.855875,163.400723 C142.835142,164.105979 142.614372,164.850948 142.243932,165.718389 C142.119337,166.010148 141.978976,166.310518 141.825549,166.61746 C141.486757,167.295237 141.151314,167.88092 140.92679,168.244201 L123.018581,197.832153 L118.585561,181.874382 L96.1990153,191.824101 L101.222967,174.240596 L72.0416387,174.240596 L77.9169891,170.547345 C77.9580319,170.521546 77.9580319,170.521546 78.1508491,170.400513 C78.4146449,170.235035 78.5617369,170.142831 78.8105813,169.987009 C79.5213014,169.541969 80.3150138,169.046135 81.1720944,168.512187 C83.6211792,166.986443 86.0879014,165.460617 88.415622,164.035937 C88.6375813,163.90012 88.6375813,163.90012 88.8596693,163.764361 C91.9447501,161.878978 94.5172538,160.33681 96.4124471,159.244826 C97.0045914,158.903641 97.5277274,158.608068 97.9805917,158.359303 C79.1691538,125.373553 66.9968579,74.5711883 60.0135236,14.8256445 L59.7533933,12.6001135 L264.246929,11.9933239 L263.986603,14.2311062 C257.276042,71.9154793 245.034403,122.533386 225.690837,158.304079 Z"/>
				<path id="body-highlight-2" fill="#D2F0A0" d="M284.994375,123.581875 C283.8225,123.581875 282.6475,123.165 281.709375,122.31875 C279.696875,120.50375 279.5375,117.400625 281.3525,115.388125 C283.444375,113.069375 285.385625,110.5225 287.123125,107.818125 C288.58875,105.5375 291.62375,104.876875 293.90375,106.341875 C296.18375,107.80625 296.844375,110.8425 295.38,113.121875 C293.355,116.273125 291.0875,119.246875 288.64,121.960625 C287.670625,123.035625 286.335,123.581875 284.994375,123.581875 Z"/>
				<path id="body-highlight-1" fill="#D2F0A0" d="M300.82875,91.81875 C300.494375,91.81875 300.155625,91.784375 299.815,91.7125 C297.1625,91.155625 295.464375,88.554375 296.02125,85.901875 C299.0375,71.53375 297.340625,57.100625 291.244375,45.26125 C290.00375,42.851875 290.95125,39.893125 293.36,38.651875 C295.77,37.41125 298.729375,38.359375 299.969375,40.7675 C307.095,54.605 309.1025,71.35 305.625625,87.9175 C305.140625,90.230625 303.100625,91.81875 300.82875,91.81875 Z"/>
			</g>
			<g id="head-container" transform="translate(4.000000, -12.000000)">
				<g id="head">
					<path id="head-bg-2" fill="#BEE178" fill-rule="nonzero" stroke="#000" stroke-width="4" d="M29.5805313,195.417672 L456.419469,195.417672 L456.419469,197.417672 C456.419469,221.567645 436.916419,252.790229 404.222839,276.941606 C364.586364,306.221831 309.637841,323.35307 243,323.35307 C176.36224,323.35307 121.413724,306.221691 81.777158,276.941272 C49.0836506,252.789846 29.5805313,221.567245 29.5805313,197.417672 L29.5805313,195.417672 Z"/>
					<path id="head-bg-1" fill="#82C35F" fill-rule="nonzero" stroke="#000" stroke-width="4" d="M458.810578,163.891102 C425.258406,139.094664 354.032211,97.7022344 315.903539,82.2300625 C298.894391,75.3282344 286.742477,66.191125 243,66.191125 C199.257523,66.191125 187.105609,75.3273516 170.096461,82.2300625 C131.967789,97.7022344 60.7415937,139.094664 27.1894219,163.891102 C21.4246562,168.151555 17,174.984523 17,183.257359 C17,191.155 22.9583958,198.305193 34.8751875,204.707937 C98.2236746,228.843726 169.259921,240.911621 247.983928,240.911621 C326.707935,240.911621 394.421563,228.843726 451.124812,204.707937 C463.041604,198.305193 469,191.155 469,183.257359 C469,174.984523 464.576227,168.151555 458.810578,163.891102 Z"/>
					<g id="nose" fill="#5A9646" fill-rule="nonzero" transform="translate(199.000000, 176.000000)">
						<path id="head-nostril-2" d="M80.5928359,22.7253594 C76.5627969,22.7253594 73.3025703,19.4651328 73.3025703,15.4350937 L73.3025703,8.14482812 C73.3025703,4.11478906 76.5627969,0.8545625 80.5928359,0.8545625 C84.622875,0.8545625 87.8831016,4.11478906 87.8831016,8.14482812 L87.8831016,15.4350937 C87.8831016,19.46425 84.622875,22.7253594 80.5928359,22.7253594 Z"/>
						<path id="head-nostril-1" d="M7.68929688,22.7253594 C3.65925781,22.7253594 0.39903125,19.4651328 0.39903125,15.4350937 L0.39903125,8.14482812 C0.39903125,4.11478906 3.65925781,0.8545625 7.68929688,0.8545625 C11.7193359,0.8545625 14.9795625,4.11478906 14.9795625,8.14482812 L14.9795625,15.4350937 C14.9795625,19.46425 11.7193359,22.7253594 7.68929688,22.7253594 Z"/>
					</g>
					<g id="eye-left-bg" fill-rule="nonzero" stroke="#000" stroke-width="4" transform="translate(103.500000, 92.000000) scale(-1, 1) rotate(10.000000) translate(-103.500000, -92.000000) translate(12.000000, 15.000000)">
						<path id="head-right-eye-area-1" fill="#96CD78" d="M45.3664704,137.710882 C26.9701046,128.939446 15.9312451,114.856234 13.8463248,103.491319 C12.7147756,97.3232355 13.4390782,89.044419 15.6388734,83.0023948 C20.4080988,69.9030954 41.0278058,30.7519886 84.010776,29.8665054 L45.3664704,137.710882 Z" transform="translate(48.664170, 83.788694) rotate(-15.000000) translate(-48.664170, -83.788694)"/>
						<path id="head-right-eye-area-2" fill="#73AF55" d="M107.856542,139.07769 C141.316394,139.07769 168.440964,111.953121 168.440964,78.4932685 C168.440964,45.0334162 127.277099,13.5129349 85.9632386,14.9145989 C69.7783709,20.9746118 57.7078514,35.081905 49.7516802,57.2364786 C41.7955091,79.3910521 40.2255787,101.167752 45.0418891,122.566579 C64.6117559,133.573987 85.5499734,139.07769 107.856542,139.07769 Z" transform="translate(105.379308, 76.973614) rotate(-15.000000) translate(-105.379308, -76.973614)"/>
					</g>
					<g id="eye-right-bg" fill-rule="nonzero" stroke="#000" stroke-width="4" transform="translate(382.500000, 92.000000) rotate(10.000000) translate(-382.500000, -92.000000) translate(291.000000, 15.000000)">
						<path id="head-right-eye-area-1" fill="#96CD78" d="M45.3664704,137.710882 C26.9701046,128.939446 15.9312451,114.856234 13.8463248,103.491319 C12.7147756,97.3232355 13.4390782,89.044419 15.6388734,83.0023948 C20.4080988,69.9030954 41.0278058,30.7519886 84.010776,29.8665054 L45.3664704,137.710882 Z" transform="translate(48.664170, 83.788694) rotate(-15.000000) translate(-48.664170, -83.788694)"/>
						<path id="head-right-eye-area-2" fill="#73AF55" d="M107.856542,139.07769 C141.316394,139.07769 168.440964,111.953121 168.440964,78.4932685 C168.440964,45.0334162 127.277099,13.5129349 85.9632386,14.9145989 C69.7783709,20.9746118 57.7078514,35.081905 49.7516802,57.2364786 C41.7955091,79.3910521 40.2255787,101.167752 45.0418891,122.566579 C64.6117559,133.573987 85.5499734,139.07769 107.856542,139.07769 Z" transform="translate(105.379308, 76.973614) rotate(-15.000000) translate(-105.379308, -76.973614)"/>
					</g>
					<path id="mouth" fill="#000" fill-rule="nonzero" stroke="#000" stroke-width="4" d="M455,202.897382 C455,209.217769 418.210267,246 244,246 C69.7897326,246 33,209.217769 33,202.897382 C33,196.576994 117.143564,176 244,176 C370.856436,176 455,196.576994 455,202.897382 Z"/>				</g>
			</g>
		</g>
	</svg>
	
`);

export default class HungryFrog extends Character {

    /**
     * Returns info about the character
     */
    get character() {
        return CHARACTERS.frog;
    }

    /**
     * Hooks up the element
     */
    connectedCallback() {
        super.connectedCallback(template);

        // Get references to the relevant DOM elements.
        this.$mouth = this.shadowRoot.querySelector("#mouth");
        this.grabbing = false;
    }

    /**
     * Handles that a target was clicked.
     * @param {*} e
     * @param {*} $target
     */
    handleDidClickTarget(e, $target) {
        this.grabTarget($target, {
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
        await this.grabTarget($elem, undefined);
    }

    /**
     * Shoot laser at target
     * @param {*} $target
     * @param {*} mousePosition
     */
    async grabTarget($target, mousePosition) {

        // If the frog is current grabbing we just return
        if (this.grabbing) {
            return;
        }

        this.grabbing = true;

        // Open the mouth and wait for it to show so we can measure it.
        this.$mouth.style.opacity = `1`;
        await waitForAnimationFrame();

        // Compute the centers
        const targetCenter = mousePosition || getCenter($target);
        const mouthCenter = getCenter(this.$mouth);
        const {width: mouthWidth, height: mouthHeight} = this.$mouth.getBoundingClientRect();

        // Compute how fast the animation should be
        const distanceToTarget = getDistanceBetweenPoints(mouthCenter, targetCenter);
        const xDistanceToTarget = mouthCenter.x - targetCenter.x;
        const yDistanceToTarget = mouthCenter.y - targetCenter.y;
        const {
            width: targetWidth,
            height: targetHeight,
            left: targetLeft,
            top: targetTop
        } = $target.getBoundingClientRect();
        const targetMaxSize = Math.max(targetWidth, targetHeight);

        // The closer, the faster! (max 400ms)
        const toungeAnimationDurationMs = Math.min(distanceToTarget, 400) + Math.min(targetMaxSize, 400);

        // Create a tounge and add it to the DOM.
        const $tounge = createToungeElement(mouthCenter, targetCenter);
        document.body.appendChild($tounge);

        // Play the frog sound now when the mouth opens
        this.soundbox.play(`frog`);

        // Move tounge to the target
        const initialToungeTransform = $tounge.style.transform || "";
        await promisifyAnimation($tounge.animate({
            transform: [`${initialToungeTransform} scaleX(0)`, `${initialToungeTransform} scaleX(1)`]
        }, {
            easing: "linear",
            duration: 150,
            fill: "both"
        }));

        // Animate the tounge smaller and smaller on the X scale
        promisifyAnimation($tounge.animate({
            transform: [`${initialToungeTransform} scaleX(1)`, `${initialToungeTransform} scaleX(0)`]
        }, {
            easing: "linear",
            duration: toungeAnimationDurationMs,
            fill: "both"
        })).then(() => {
            // Remove tounge
            $tounge.remove();

            // Hide mouth
            this.$mouth.style.opacity = `0`;

            // Reset grabbing
            this.grabbing = false;
        });

        // We need to scale down the target relative to where on the element the user clicked.
        const targetTransformOrigin = {
            x: targetCenter.x - targetLeft,
            y: targetCenter.y - targetTop
        }
        // Prepares the node for animation
        prepareNodeForAnimation($target);
        Object.assign($target.style, {
            transformOrigin: `${targetTransformOrigin.x}px ${targetTransformOrigin.y}px`,
        });

        const endTargetScaleX = targetWidth != null ? Math.min(mouthWidth / targetWidth, 1) : 0.8;
        const endTargetScaleY = targetHeight != null ? Math.min(mouthHeight / targetHeight, 1) : 0.8;

        // Animate the target closer and closer
        promisifyAnimation($target.animate({
            transform: [
                `translate(0, 0) scale(1, 1)`,
                `translate(${xDistanceToTarget}px, ${yDistanceToTarget}px) scale(${endTargetScaleX}, ${endTargetScaleY})`],
        }, {
            easing: "linear",
            duration: toungeAnimationDurationMs,
            fill: "both"
        })).then(() => {
            $target.remove();
        });

        // Play slime sound when the item is dragged in
        this.soundbox.play(`slime`);

        // Add one more point
        this.addPoints(1);
    }
}

defineCustomElement("hungry-frog", HungryFrog);