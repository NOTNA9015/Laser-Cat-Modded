import {Character, sharedCharacterStyles} from "./character.js";
import {
    defineCustomElement,
    createHTML,
    promisifyAnimation,
    getCenter, getAngleBetweenPoints, getDistanceBetweenPoints, spawnRainbow, setTransformTowardsTarget
} from "../util.js";
import {CHARACTERS, TOP_Z_INDEX} from "../../config.js";
import "../eye.js";

const MIN_DISTANCE_PX = 60;
const HORN_COLOR_INTERVAL_MS = 3000;
const STAR_MOVE_LENGTH = 50;
const STAR_COUNT = 10;

/**
 * Creates a star explosion element.
 * @param {*} targetCenter
 * @param color
 */
function createStarElement(targetCenter, color) {

    const $star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    $star.setAttribute("viewBox", `0 0 48 48`);
    $star.setAttribute("preserveAspectRatio", "none");

    const $path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    $path.setAttribute("d", `m1.507 21.683 11.47-5.414a2.595 2.595 0 0 0 1.479-1.947l1.84-12.106c.322-2.12 3.046-2.967 4.61-1.433l8.928 8.76a2.78 2.78 0 0 0 2.392.743L44.834 8.22c2.208-.363 3.891 1.854 2.85 3.75L41.73 22.797a2.488 2.488 0 0 0 0 2.406l5.952 10.828c1.043 1.896-.641 4.113-2.85 3.75l-12.607-2.067a2.78 2.78 0 0 0-2.392.743l-8.929 8.76c-1.564 1.534-4.288.687-4.61-1.433l-1.84-12.106a2.595 2.595 0 0 0-1.478-1.947l-11.47-5.414a2.535 2.535 0 0 1 0-4.634Z`);
    $path.setAttribute("fill", color);
    $path.setAttribute("fill-rule", "nonzero");

    $star.appendChild($path);

    const size = 10 + (Math.random() * 20);
    Object.assign($star.style, {
        height: `${size}px`,
        width: `${size}px`,
        position: `fixed`,
        left: `${targetCenter.x - (size / 2)}px`,
        top: `${targetCenter.y - (size / 2)}px`,
        zIndex: TOP_Z_INDEX,
        pointerEvents: `none`,
        transformOrigin: `center`,
        boxSizing: "content-box"
    });

    return $star;
}

/** Template for the unicorn */
const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
		${sharedCharacterStyles}
		
		:host([active]) {
		}
		
		.eye.left {
            left: 57px;
            top: 86px;
    	}
    	
		.eye.right {
            left: 102px;
            top: 86px;
        }
        
        #head, #head-front {
            position: absolute;
            z-index: 1234;
        }
        
        #head {
            top: 0;
            left: 0; 
            display: flex;
        }

		#unicorn {
			width: 180px;
			position: relative;
		}
		
		#body {
            transform-origin: center center;
            transform: var(--transform, unset);
		}

        #hair-background {
            transform: rotate(0deg);
            animation: hair-wave infinite 10s linear alternate-reverse;
        }
        
        @keyframes hair-wave {
            0% {
                transform: rotate(0deg) scale(1);
                
            }
            100% {
                transform: rotate(3deg) scale(1.05, 0.95);
            }
        }
        
        #horn {
            position: absolute;
            width: 28px;
            top: -45px;
            left: 76px;
            z-index: 12345;
            transform-origin: bottom center;
            transform: var(--horn-transform, unset);
        }
        
        #horn-projectile {
        }
        
        
        #horn-path, .star {
            transition: fill ease 400ms;
            fill: var(--horn-color, #D4F582);
        }
        
        #starfire {
            position: absolute;
            width: 39px;
            left: -6px;
            top: 66px;
            z-index: -1;
            display: none;
        }
        
        :host([shooting]) #starfire {
            display: block; 
        }
        
        .star {
            animation: starfire infinite 300ms linear;;
        }
        
        .star:nth-child(1) { animation-duration: 400ms;}
        .star:nth-child(2) { animation-duration: 300ms;}
        .star:nth-child(3) { animation-duration: 350ms;}
        .star:nth-child(4) { animation-duration: 500ms;}
        .star:nth-child(5) { animation-duration: 200ms;}
        .star:nth-child(6) { animation-duration: 250ms;}
        .star:nth-child(7) { animation-duration: 300ms;}
        .star:nth-child(8) { animation-duration: 600ms;}
        .star:nth-child(9) { animation-duration: 310ms;}
        
        @keyframes starfire {
            0% {
                transform: translateY(0);
                opacity: 1;
            }
            100% {
                transform: translateY(10px);
                opacity: 0;
            }
        }
        
	</style>
	<div id="unicorn">
        <div id="head">
            <div id="horn">
                <div id="horn-projectile">
                    <svg preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 71 246" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path id="horn-path" stroke="#0B0F12" fill="#D4F582" stroke-width="4" d="M35.051 244c-9.52 0-16.911-1.652-22.54-5.765C5.626 233.205 2 224.786 2 212.508c0-16.825 10.344-86.284 31.08-208.842l1.943-11.49 1.999 11.481C58.357 126.221 69 195.678 69 212.507c0 12.26-3.818 20.704-10.988 25.75-5.809 4.086-13.396 5.743-22.96 5.743Z"/>
                    </svg>
                    <svg id="starfire" viewBox="0 0 139 276" width="100%" height="100%">
                      <g stroke="none" stroke-width="1" fill="#E6646E" fill-rule="nonzero">
                        <path class="star" d="m69.794 213.777 1.53 3.244a.734.734 0 0 0 .551.418l3.424.52c.6.091.84.862.405 1.304l-2.477 2.525a.786.786 0 0 0-.21.677l.584 3.565c.103.625-.524 1.101-1.06.806l-3.063-1.683a.704.704 0 0 0-.68 0l-3.062 1.683c-.537.295-1.164-.181-1.061-.806l.585-3.565a.786.786 0 0 0-.21-.677l-2.478-2.525c-.434-.443-.195-1.213.405-1.304l3.424-.52a.734.734 0 0 0 .55-.418l1.532-3.244a.717.717 0 0 1 1.31 0Z" id="star-9" transform="rotate(168 69.138 220.138)"/>
                        <path class="star" d="m82.417 186.596 2.143 4.54c.15.317.437.536.77.586l4.793.728c.84.128 1.174 1.206.567 1.825l-3.468 3.534a1.1 1.1 0 0 0-.294.947l.819 4.99c.143.875-.734 1.541-1.485 1.129l-4.286-2.356a.985.985 0 0 0-.952 0l-4.286 2.356c-.75.412-1.628-.254-1.485-1.128l.819-4.99a1.1 1.1 0 0 0-.294-.948l-3.468-3.534c-.607-.62-.272-1.698.567-1.825l4.792-.728c.334-.05.622-.27.77-.585l2.144-4.54a1.004 1.004 0 0 1 1.834 0Z" id="star-8" transform="rotate(-169 81.5 195.5)"/>
                        <path class="star" d="m55.9 178.91 3.27 6.93c.228.483.668.817 1.177.894l7.314 1.111c1.281.195 1.792 1.84.866 2.785l-5.293 5.395a1.68 1.68 0 0 0-.449 1.445l1.25 7.617c.219 1.334-1.12 2.351-2.267 1.722l-6.541-3.596a1.503 1.503 0 0 0-1.454 0l-6.541 3.596c-1.146.63-2.486-.388-2.267-1.722l1.25-7.617a1.68 1.68 0 0 0-.45-1.445l-5.292-5.395c-.926-.945-.415-2.59.866-2.785l7.314-1.111a1.568 1.568 0 0 0 1.176-.893l3.27-6.93a1.532 1.532 0 0 1 2.801 0Z" id="star-7" transform="rotate(-89 54.5 192.5)"/>
                        <path class="star" d="m92.997 145.973 3.496 7.408c.243.516.713.873 1.257.955l7.819 1.188c1.37.208 1.916 1.968.925 2.977l-5.657 5.767c-.394.4-.573.979-.48 1.545l1.335 8.142c.234 1.426-1.197 2.513-2.422 1.84l-6.993-3.843a1.607 1.607 0 0 0-1.554 0l-6.993 3.844c-1.225.673-2.656-.415-2.422-1.841l1.335-8.142a1.796 1.796 0 0 0-.48-1.545l-5.657-5.767c-.99-1.01-.444-2.77.925-2.977l7.819-1.188a1.676 1.676 0 0 0 1.257-.955l3.496-7.408a1.637 1.637 0 0 1 2.994 0Z" id="star-6" transform="rotate(-180 91.5 160.5)"/>
                        <path class="star" d="m55.835 135.193 4.286 9.08c.298.632.874 1.07 1.54 1.171l9.585 1.456c1.678.256 2.348 2.412 1.134 3.65l-6.935 7.068a2.201 2.201 0 0 0-.588 1.894l1.637 9.981c.286 1.748-1.468 3.081-2.97 2.256l-8.572-4.712a1.97 1.97 0 0 0-1.904 0l-8.572 4.712c-1.502.826-3.256-.508-2.97-2.256l1.637-9.98a2.201 2.201 0 0 0-.588-1.895l-6.935-7.068c-1.214-1.238-.544-3.395 1.134-3.65l9.585-1.456a2.055 2.055 0 0 0 1.54-1.17l4.286-9.081a2.007 2.007 0 0 1 3.67 0Z" id="star-5" transform="rotate(-142 54 153)"/>
                        <path class="star" d="m41.062 106.69 2.481 5.258c.173.366.507.619.893.678l5.548.843c.972.147 1.36 1.396.657 2.113l-4.015 4.092a1.274 1.274 0 0 0-.34 1.096l.947 5.779c.166 1.012-.85 1.783-1.719 1.306l-4.963-2.728a1.14 1.14 0 0 0-1.102 0l-4.963 2.728c-.87.478-1.885-.294-1.72-1.306l.949-5.779a1.274 1.274 0 0 0-.341-1.096l-4.015-4.092c-.703-.717-.315-1.966.657-2.113l5.548-.843a1.19 1.19 0 0 0 .893-.678l2.48-5.257c.435-.921 1.69-.921 2.125 0Z" id="star-4" transform="rotate(142 40 117)"/>
                        <path class="star" d="m84.317 87.507 5.414 11.47a2.595 2.595 0 0 0 1.947 1.479l12.106 1.84c2.12.322 2.967 3.046 1.433 4.61l-8.76 8.928a2.78 2.78 0 0 0-.743 2.392l2.067 12.608c.363 2.208-1.854 3.891-3.75 2.85l-10.828-5.953a2.488 2.488 0 0 0-2.406 0l-10.828 5.952c-1.896 1.043-4.113-.641-3.75-2.85l2.067-12.607a2.78 2.78 0 0 0-.743-2.392l-8.76-8.929c-1.534-1.564-.687-4.288 1.433-4.61l12.106-1.84a2.595 2.595 0 0 0 1.947-1.478l5.414-11.47a2.535 2.535 0 0 1 4.634 0Z" id="star-3" transform="rotate(-58 82 110)"/>
                        <path class="star" d="m50.348 40.852 6.655 14.1c.463.98 1.357 1.66 2.392 1.817l14.881 2.26c2.607.397 3.647 3.746 1.761 5.667L65.27 75.67a3.418 3.418 0 0 0-.914 2.94l2.542 15.497c.445 2.714-2.28 4.783-4.61 3.503l-13.31-7.316a3.058 3.058 0 0 0-2.957 0L32.712 97.61c-2.33 1.282-5.055-.789-4.61-3.503l2.542-15.497a3.418 3.418 0 0 0-.914-2.94L18.963 64.696c-1.886-1.923-.846-5.271 1.761-5.666l14.88-2.261c1.036-.157 1.93-.837 2.393-1.818l6.655-14.099a3.116 3.116 0 0 1 5.696 0Z" id="star-2" transform="rotate(-38 47.5 68.5)"/>
                        <path class="star" d="m99.576 35.35 4.85 10.276c.337.714.99 1.21 1.744 1.324l10.845 1.648c1.9.289 2.657 2.73 1.283 4.13l-7.847 7.998a2.49 2.49 0 0 0-.666 2.143l1.852 11.294c.325 1.978-1.66 3.487-3.36 2.553l-9.7-5.332a2.229 2.229 0 0 0-2.155 0l-9.7 5.332c-1.698.935-3.684-.575-3.36-2.553l1.853-11.294a2.49 2.49 0 0 0-.666-2.143l-7.847-7.999c-1.374-1.4-.616-3.841 1.283-4.13L88.83 46.95a2.325 2.325 0 0 0 1.744-1.324l4.85-10.276a2.271 2.271 0 0 1 4.152 0Z" id="star-1" transform="rotate(175 97.5 55.5)"/>
                      </g>
                    </svg>
                </div>
            </div>
            <svg id="head-front" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 499 545" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#000" stroke-width="4" fill="none" fill-rule="evenodd">
                <path d="M249.83 522.362c-29.261 0-47.67-6.66-58.907-20.233-4.913-5.934-8.472-13.162-11.236-22.244-2.169-7.123-3.636-14.244-5.831-27.145-4.695-27.592-6.598-36.498-11.838-50.68-1.526-4.127-9.518-24.74-10.915-28.399-5.616-14.707-10.407-27.879-15.002-41.524-11.971-35.553-20.676-68.81-25.361-100.187-7.687-51.47-3.886-94.062 14.145-125.49C146.334 69.071 187.186 49 249.83 49c61.77 0 101.933 19.946 122.797 57.078 17.553 31.24 20.937 73.588 12.844 124.62-5.002 31.54-14.146 65.037-26.532 100.322-5.04 14.36-10.347 28.267-16.286 42.977-2.898 7.177-10.645 25.868-11.547 28.116-2.847 7.094-4.971 14.734-6.647 23.44-1.392 7.228-2.057 12.077-3.774 26.26-1.595 13.17-2.586 19.696-4.298 26.732-2.23 9.168-5.312 16.515-9.77 22.605-10.363 14.154-28.162 21.212-56.787 21.212Z" id="head-outline"/>
                <path d="M282.823 276.902c-8.793-21.046-17.082-23.942-24.21-32.865 33.257 15.915 47.892 15.915 85.97 15.915-28.604-22.438-39.673-29.486-41.477-59.727 15.715 29.115 54.407 38.428 89.008 33.731 6.495.833-53.974-8.07-63.19-39.45-8.218-30.565 9.432-37.117 15.659-41.04-.32 43.747 39.266 46.669 44.26 43.457-40.468-33.328-20.595-67.068-14.833-88.427-19.87-36.826-56.835-58.023-115.396-59.551-58.562-1.53-101.907 16.393-118.791 38.004 3.377 68.99 16.884 113.442 37.687 135.764 39.684 42.581 52.662 17.745 105.313 54.19Z" id="hair-front" fill="#E6646E"/>
              </g>
            </svg>
            <div id="eyes">
                <laser-cat-eye class="eye left"></laser-cat-eye>
                <laser-cat-eye class="eye right"></laser-cat-eye>
            </div>
            <svg id="head-back" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 499 545" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                <path d="M140.83 469.362c85.98 0 57.733-64.965 79.421-118.995C241.94 296.337 377.791 0 140.831 0-96.13 0 32.572 289.964 54.894 350.367c22.321 60.404-.043 118.995 85.937 118.995Z" id="path-1"/>
              </defs>
              <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <g id="ears" transform="translate(131 8)" stroke="#000" stroke-width="4">
                  <g id="ear-left">
                    <path d="M4.007 99.439c-7.178-52.615-7.178-84.67.278-96.79 2.303-3.742 5.6-4.73 9.071-2.767 2.662 1.506 5.457 4.737 8.62 9.69 4.782 7.482 8.68 15.387 18.597 36.782.379.818.67 1.448.955 2.06 7.806 16.824 12.078 25.414 16.447 32.47l1.34 2.166-2.421.789c-20.605 6.714-37.344 12.45-50.212 17.205l-2.338.864-.337-2.47Z" id="ear-left-outer" fill="#D9D9D9"/>
                    <path d="M16.362 88.863c-4.843-26.722-6.627-46.632-5.352-59.73 1.275-13.097 11.967 3.862 32.076 50.877l-26.724 8.853Z" id="ear-left-inner" fill="#E6646E"/>
                  </g>
                  <g id="ear-right" transform="matrix(-1 0 0 1 236 0)">
                    <path d="M4.007 99.439c-7.178-52.615-7.178-84.67.278-96.79 2.303-3.742 5.6-4.73 9.071-2.767 2.662 1.506 5.457 4.737 8.62 9.69 4.782 7.482 8.68 15.387 18.597 36.782.379.818.67 1.448.955 2.06 7.806 16.824 12.078 25.414 16.447 32.47l1.34 2.166-2.421.789c-20.605 6.714-37.344 12.45-50.212 17.205l-2.338.864-.337-2.47Z" id="ear-right-outer" fill="#D9D9D9"/>
                    <path d="M16.362 88.863c-4.843-26.722-6.627-46.632-5.352-59.73 1.275-13.097 11.967 3.862 32.076 50.877l-26.724 8.853Z" id="ear-right-inner" fill="#E6646E"/>
                  </g>
                </g>
                <path d="M165.104 500.24c-28.139-90 49.136-142.036 68.955-151.16 92.596 51.847 135.84 114.42 129.733 187.721 39.188-75.754-9.503-127.006-6.668-167.641 11.32 28.125 9.509 33.47 27.27 52.547 17.763 19.075 23.181 22.332 20.23 54.715 3.762-7.397 17.604-31.656 0-61.922-11.737-20.177-12.667-46.794-2.79-79.849 6.582 15.032 13.418 25.173 20.51 30.423 10.636 7.876 27.26 4.086 33.453 4.086 12.005 0 21.377 11.007 28.117 33.022 3.545-30.3-8.833-49.357-37.136-57.17-18.602-5.135-31.415-20.214-31.415-115.35 0-63.425-22.718-112.413-68.154-146.964H228.408c-42.202 75.618-63.304 144.088-63.304 205.407 0 29.28-35.686 119.563-36.923 126.395-5.493 30.348 7.26 62.82 36.923 85.74Z" id="hair-background" stroke="#000" stroke-width="4" fill="#E6646E"/>
                <g transform="translate(109 51)">
                  <mask id="mask-2" fill="#fff">
                    <use xlink:href="#path-1"/>
                  </mask>
                  <path stroke="#000" stroke-width="4" d="M140.83 471.362c-29.261 0-47.67-6.66-58.907-20.233-4.913-5.934-8.472-13.162-11.236-22.244-2.169-7.123-3.636-14.244-5.831-27.145-4.695-27.592-6.598-36.498-11.838-50.68-1.526-4.127-9.518-24.74-10.915-28.399-5.616-14.707-10.407-27.879-15.002-41.524C15.13 245.584 6.425 212.327 1.74 180.95c-7.687-51.47-3.886-94.062 14.145-125.49C37.334 18.071 78.186-2 140.83-2c61.77 0 101.933 19.946 122.797 57.078 17.553 31.24 20.937 73.588 12.844 124.62-5.002 31.54-14.146 65.037-26.532 100.322-5.04 14.36-10.347 28.267-16.286 42.977-2.898 7.177-10.645 25.868-11.547 28.116-2.847 7.094-4.971 14.734-6.647 23.44-1.392 7.228-2.057 12.077-3.774 26.26-1.595 13.17-2.586 19.696-4.298 26.732-2.23 9.168-5.312 16.515-9.77 22.605-10.363 14.154-28.162 21.212-56.787 21.212Z"/>
                  <g id="head-mask-group" mask="url(#mask-2)">
                    <g transform="translate(-68)">
                      <path d="M208.83 469.362c85.98 0 57.733-64.965 79.421-118.995C309.94 296.337 445.791 0 208.831 0c-236.96 0-108.259 289.964-85.937 350.367 22.321 60.404-.043 118.995 85.937 118.995Z" id="head-background" stroke="none" fill="#D9D9D9"/>
                      <g id="nostrils" stroke="none" stroke-width="1" fill="#000" transform="translate(153 390)">
                        <path d="M84.5 41.26c-2.57-3.65-5.988-21.682 9.873-35.181 15.862-13.5 19.943.465 10.07 14.3-9.871 13.834-17.373 24.53-19.943 20.88Z" id="nostril-right"/>
                        <path d="M2.203 41.67c-2.57-3.65-5.988-21.682 9.873-35.181 15.862-13.5 19.943.465 10.07 14.3-9.871 13.835-17.373 24.53-19.943 20.88Z" id="nostril-left" transform="matrix(-1 0 0 1 27.486 0)"/>
                      </g>
                      <path d="M208.939 422.291c24.876 0 24.876-54.186 34.35-80.139 9.472-25.953 27.458-46.895 27.458-62.986 0-4.477-17.504-37.917-8.818-59.42 8.687-21.502 48.262-25.544 43.578-44.245C298.97 149.409 277.332 61 208.939 61s-92.462 95.585-99.214 114.501c-6.753 18.916 35.738 16.065 42.223 44.245 6.485 28.181-9.235 40.457-9.235 59.42 0 1.033 24.546 43.032 30.515 62.986 6.312 21.103 10.834 80.14 35.71 80.14Z" id="head-glare" stroke="none" fill="#ECECEC"/>
                      <path d="M65.394 162.764S107.308 28.342 172.964 42.17C131.4 3.239 73.758-5.646.042 15.512l65.353 147.252Z" id="hair-background" stroke="#000" stroke-width="4" fill="#E6646E"/>
                    </g>
                  </g>
                  <g id="stars" mask="url(#mask-2)" fill="#E6646E" fill-rule="nonzero">
                    <g transform="translate(63 315)">
                      <path d="m12.966 2.628 2.255 4.78c.157.332.46.562.811.615l5.045.767c.883.134 1.236 1.27.597 1.92l-3.65 3.72c-.254.26-.37.632-.31.997l.862 5.254c.15.92-.773 1.621-1.563 1.187l-4.512-2.48a1.037 1.037 0 0 0-1.002 0l-4.512 2.48c-.79.435-1.714-.267-1.563-1.187l.862-5.254a1.159 1.159 0 0 0-.31-.996l-3.65-3.72c-.639-.652-.286-1.787.597-1.921l5.045-.767c.35-.053.654-.283.81-.616l2.256-4.78a1.056 1.056 0 0 1 1.932 0Z" id="star-left" transform="rotate(-98 12 12)"/>
                      <path d="m142.966 2.628 2.255 4.78c.157.332.46.562.811.615l5.045.767c.883.134 1.236 1.27.597 1.92l-3.65 3.72c-.254.26-.37.632-.31.997l.862 5.254c.15.92-.773 1.621-1.563 1.187l-4.512-2.48a1.037 1.037 0 0 0-1.002 0l-4.512 2.48c-.79.435-1.714-.267-1.563-1.187l.862-5.254a1.159 1.159 0 0 0-.31-.996l-3.65-3.72c-.639-.652-.286-1.787.597-1.921l5.045-.767c.35-.053.654-.283.81-.616l2.256-4.78a1.056 1.056 0 0 1 1.932 0Z" id="star-right" transform="rotate(-98 142 12)"/>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
        </div>
        <svg id="body" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 499 652" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs>
            <path d="M0 334.202C13.124 111.401 81.533 0 205.225 0c123.693 0 187.702 111.4 192.027 334.202H0Z" id="path-1"/>
            <path d="M0 334.202C13.124 111.401 81.533 0 205.225 0c123.693 0 187.702 111.4 192.027 334.202H0Z" id="path-3"/>
          </defs>
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g transform="translate(37 318)">
              <mask id="mask-2" fill="#fff">
                <use xlink:href="#path-1"/>
              </mask>
              <path stroke="#000" stroke-width="4" d="M-1.997 334.084C11.182 110.362 80.181-2 205.225-2 330.316-2 394.91 110.416 399.252 334.163l.04 2.039H-2.121l.124-2.118Z"/>
              <mask id="mask-4" fill="#fff">
                <use xlink:href="#path-3"/>
              </mask>
              <use id="body-background" fill="#D9D9D9" xlink:href="#path-3"/>
              <path d="M38.522 333.514c9.572-15.869 15.892-29.36 18.962-40.473C30.616 234.032-45.567 16 213.197 16s175.902 206.036 154.387 277.041c4.912 12.666 9.12 26.157 12.626 40.473H38.522Z" id="body-glare" fill="#ECECEC" mask="url(#mask-4)"/>
              <path d="M256.787 334.036c-9.957-54.705-9.957-91.872 0-111.5 14.936-29.442 48.865-52.14 25.237-62.34-23.628-10.2-127.307-8.97-144.647 0-17.34 8.97 11.73 41.358 24.131 62.34 8.267 13.988 6.4 51.155-5.603 111.5h100.882Z" id="body-middle" fill="#D9D9D9" mask="url(#mask-4)"/>
            </g>
          </g>
        </svg>	
    </div>
`);

export default class FabulousUnicorn extends Character {

    /**
     * Returns info about the character
     */
    get character() {
        return CHARACTERS.unicorn;
    }

    set isShooting(v) {
        this.toggleAttribute("shooting", v);

    }

    get isShooting() {
        return this.hasAttribute("shooting");
    }

    /**
     * Hooks up the element
     */
    connectedCallback() {
        super.connectedCallback(template);
        this.$body = this.shadowRoot.querySelector("#body");
        this.$horn = this.shadowRoot.querySelector("#horn");
        this.$hornProjectile = this.shadowRoot.querySelector("#horn-projectile");
        this.$starfire = this.shadowRoot.querySelector("#starfire");
        this.isShooting = false;
        this.shootCount = 0;

        this.setRandomHornColor();

        // Start updating the horn color every X ms
        this.updateHornColorInterval = setInterval(() => {
            this.setRandomHornColor();
        }, HORN_COLOR_INTERVAL_MS);
    }

    /**
     * Tears down the element
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // Stop the horn color interval
        if (this.updateHornColorInterval != null) {
            window.clearInterval(this.updateHornColorInterval);
        }
    }


    /**
     * Updates the position of the unicorn eye, head and body.
     * @param targetCenter
     */
    updateEyeAndHeadPosition(targetCenter) {
        if (this.isShooting) return;

        super.updateEyeAndHeadPosition(targetCenter);
        if (this.$body != null) {
            setTransformTowardsTarget(this.$body, targetCenter, 1);
        }

        if (this.$horn != null) {
            this.updateHornPosition(targetCenter);
        }
    }

    /**
     * Updates the position of the horn to point at the target center.
     * @param targetCenter
     */
    updateHornPosition(targetCenter) {
        requestAnimationFrame(() => {
            const hornCenter = getCenter(this.$horn);
            const angle = getAngleBetweenPoints(targetCenter, hornCenter);
            const distance = getDistanceBetweenPoints(targetCenter, hornCenter);
            if (distance > MIN_DISTANCE_PX) {
                this.setHornAngle(angle);
            }
        });
    }

    /**
     * Sets the horn angle.
     * @param angle
     */
    setHornAngle(angle) {
        this.$horn.style.setProperty(
            "--horn-transform",
            `rotate(${angle - 90}deg)`
        );
    }

    /**
     * Handles that a target was clicked.
     * @param {*} e
     * @param {*} $target
     */
    handleDidClickTarget(e, $target) {
        super.handleDidClickTarget(e, $target);
        this.shootHornAtTarget($target, {
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
        await this.shootHornAtTarget($elem);
    }

    /**
     *  Shoots a horn at a position.
     * @param $target
     * @param mousePosition
     * @returns {Promise<void>}
     */
    async shootHornAtTarget($target, mousePosition = undefined) {
        if (this.isShooting) return;

        // Find centers
        const targetCenter = mousePosition || getCenter($target);

        this.isShooting = true;
        const hornCenter = getCenter(this.$horn);
        const distance = getDistanceBetweenPoints(targetCenter, hornCenter);

        // Make sure the target is far enough away
        if (distance <= MIN_DISTANCE_PX) return;

        // Make sure the horn is pointing at the correct point
        const angle = getAngleBetweenPoints(targetCenter, hornCenter);
        this.setHornAngle(angle);

        // Start fire
        promisifyAnimation(this.$starfire.animate({
            opacity: [0, 1],
            transform: [`scale(0) rotate(180deg)`, `scale(1) rotate(180deg)`]
        }, {
            duration: 200,
        })).then();

        this.soundbox.play("glimmer").then();

        // Get random angles for the projectile to make it look more real
        const randomProjectileAngleOne = (Math.random() * 20) - 10
        const randomProjectileAngleTwo = (Math.random() * 10) - 5

        // Animate the projectile to the target
        await promisifyAnimation(this.$hornProjectile.animate({
            transform: [`translateY(0) rotate(0deg)`, `translateY(-20px) rotate(${randomProjectileAngleOne}deg)`, `translateY(-${distance}px) rotate(${randomProjectileAngleTwo}deg)`]
        }, {
            duration: (distance / 100) * 200,
            easing: "ease-in"
        }));

        // Add stars
        for (let i = 0; i < STAR_COUNT; i++) {
            const $star = createStarElement(targetCenter, this.currentHornColor ?? "#D4F582");
            document.body.appendChild($star);

            promisifyAnimation($star.animate({
                transform: [`translate(0, 0)`, `translate(${(STAR_MOVE_LENGTH / 2) - (STAR_MOVE_LENGTH * Math.random())}px, ${(STAR_MOVE_LENGTH / 2) - (STAR_MOVE_LENGTH * Math.random())}px)`],
                opacity: [1, 0]
            }, {
                duration: 500 + (Math.random() * 500),
                easing: "ease-out"
            })).then(() => $star.remove());
        }

        // Play a little pling sound
        this.soundbox.play("pling", 0.4);

        // Remove the target
        this.removeTarget($target).then();

        // Add one more point
        this.addPoints(1);

        // Reset the shooting state
        this.isShooting = false;
        this.setRandomHornColor();

        this.soundbox.stop("glimmer");

        // Every fifth time a shot has been fired theres a 30% chance that a rainbow will spawn.
        if (this.shootCount % 5 === 0) {
            if (Math.random() > 0.7) {
                spawnRainbow(this.style.left).then();
                this.soundbox.play("rainbow", 0.4);
            }
        }

        // Increment the shoot count
        this.shootCount += 1;

        // Animate the horn in again
        await promisifyAnimation(this.$hornProjectile.animate({
            opacity: [0, 1],
            transform: [`scale(0)`, `scale(1)`]
        }, {
            duration: 200,
        }));

    }

    /**
     * Sets a random color on the horn.
     */
    setRandomHornColor() {
        const randomDeg = Math.random() * 360;
        const hornColor = `hsl(${randomDeg}deg 85% 74%)`;
        this.currentHornColor = hornColor;
        this.$hornProjectile.style.setProperty("--horn-color", hornColor);
    }


}

defineCustomElement("fabulous-unicorn", FabulousUnicorn);