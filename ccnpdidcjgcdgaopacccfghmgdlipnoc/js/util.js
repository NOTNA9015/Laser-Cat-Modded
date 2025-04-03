import {INDESTRUCTIBLE_ATTRIBUTE_NAME, INDESTRUCTIBLE_TAG_NAMES, TOP_Z_INDEX} from "./../config.js";

const debounceMap = new Map();

/**
 * Debounces a callback for X ms.
 * @param {*} id
 * @param {*} cb
 * @param {*} ms
 */
export function debounce(id, cb, ms = 200) {
    // Clear existing timeout if necessary
    const existingTimeout = debounceMap.get(id);
    if (existingTimeout != null) {
        clearTimeout(existingTimeout);
    }

    // Start the debounce
    const timeout = setTimeout(cb, ms);
    debounceMap.set(id, timeout);
}

// Always use a trusted types policy when using inner html. This is because of an error that can
// occour when the site only allows trusted HTML assignments: https://stackoverflow.com/questions/61964265/getting-error-this-document-requires-trustedhtml-assignment-in-chrome
const laserCatHTMLTemplatePolicy =
    "trustedTypes" in window && window.trustedTypes != null
        ? window.trustedTypes.createPolicy("laserCatHTMLTemplatePolicy", {
            createHTML: (string) => string,
        })
        : null;

/**
 * Returns the string as trusted HTML.
 * @param {*} string
 * @returns
 */
export function createHTML(string) {
    return laserCatHTMLTemplatePolicy != null
        ? laserCatHTMLTemplatePolicy.createHTML(string)
        : string;
}

/**
 * Returns the center of an element.
 * @param {*} $elem
 */
export function getCenter($elem) {
    const rect = $elem.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

/**
 * Returns a random position on a element.
 * @param $elem
 * @returns {{x: number, y: number}}
 */
export function getRandomPositionOnElement($elem) {
    const rect = $elem.getBoundingClientRect();
    return {
        x: rect.left + (Math.random() * rect.width),
        y: rect.top + (Math.random() * rect.height),
    };
}

/**
 * Returns a random position on a element.
 * @param $elem
 * @returns {Promise<{{x: number, y: number}}>}
 */
export async function getRandomPositionOnElementIdle($elem) {
    return new Promise(res => requestIdleCallback(() => res(getRandomPositionOnElement($elem))));
}

/**
 * Returns length between points
 * @param {*} pointA
 * @param {*} pointB
 */
export function getDistanceBetweenPoints(pointA, pointB) {
    // sqrt((x2 - x1)^2 + (y2 - y1)^2))
    return Math.sqrt(
        Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
    );
}

/**
 * Converts radian to degrees.
 * @param {*} rad
 */
export function radianToDegrees(rad) {
    return rad * (180 / Math.PI);
}

/**
 * Returns angle between points in rad.
 * @param {*} pointA
 * @param {*} pointB
 */
export function getAngleBetweenPoints(pointA, pointB) {
    const dX = pointB.x - pointA.x;
    const dY = pointB.y - pointA.y;
    const rad = Math.atan2(dY, dX);
    return radianToDegrees(rad);
}

/**
 * Defines a custom element and support the ES5 custom elements shim.
 * @param {*} name
 * @param {*} clazz
 */
export function defineCustomElement(name, clazz) {
    try {
        if (window.HTMLElement.es5Shimmed) {
            // We know the site is using custom-elements-es5-adapter.js (looking a you, youtube..)
            // Therefore we need to turn our ES6 class into an ES5 class.
            // https://stackoverflow.com/questions/45747646/what-is-the-es5-way-of-writing-web-component-classes
            function CustomElement() {
                return Reflect.construct(clazz, [], CustomElement);
            }

            Object.setPrototypeOf(CustomElement.prototype, clazz.prototype);
            Object.defineProperty(CustomElement, "observedAttributes", {
                get: () => {
                    return clazz.observedAttributes || [];
                },
            });

            customElements.define(name, CustomElement);
        } else {
            customElements.define(name, clazz);
        }
    } catch (err) {
        // Something went wrong, but it should not stop of from continuing.
        console.error(err);
    }
}

/**
 * Waits an animation frame.
 */
export function waitForAnimationFrame() {
    return new Promise((res) => requestAnimationFrame(res));
}

/**
 * Turns an animation into a promise.
 * @param {*} animation
 */
export function promisifyAnimation(animation) {
    if (animation == null) return;
    return new Promise((res) => {
        animation.onfinish = res;
        animation.oncancel = res;
    });
}

/**
 * Returns a random item from a list.
 * @param {*} items
 */
export function getRandomItem(items) {
    if (items.length === 0) return null;
    const index = Math.round(Math.random() * (items.length - 1));
    return items[index];
}

/**
 * Prepares a node for animation.
 * Important if we want to move an item which is inside an overflow hidden parent.
 * @param {*} $node
 * @param {*} $container
 */
export function prepareNodeForAnimation($node, $container = document.body) {
    // Clone the target to make sure it is not inside overflow hidden or something like that.
    const {width, height, top, left} = $node.getBoundingClientRect();
    Object.assign($node.style, {
        width: `${width}px`,
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
        position: `fixed`,
        pointerEvents: `none`,

        // Increase the z-index of to make sure it
        // appears on the top of everything.
        zIndex: TOP_Z_INDEX + 1,
    });

    $container.appendChild($node);

    return $node;
}

/**
 * Collects all elements from a root node (recursively).
 * Its a little expensive to run :D
 * @param {*} $parent
 * @param {*} param1
 */
export function collectElements($parent, {filter, limit} = {}) {
    const elements = filter == null || filter($parent) ? [$parent] : [];
    for (const $child of Array.from($parent.querySelectorAll("*"))) {
        // Check whether we can allow this element
        if (filter != null && !filter($child)) {
            continue;
        }

        // Don't go over the limit
        if (limit != null && elements.length > limit) {
            break;
        }

        // Continue inside the shadow root if one exists
        if ($child.shadowRoot != null) {
            // Collect elements from inside the shadow root
            elements.push(
                ...collectElements($child.shadowRoot, {
                    filter,
                    limit: limit != null ? limit - elements.length : null,
                })
            );
        } else {
            elements.push($child);
        }
    }

    return elements;
}

/**
 * Stops the event.
 * @param {*} e
 */
export function stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
}

/**
 * Returns an element based on a point (works with shadow DOM).
 * @param x
 * @param y
 * @param $host
 * @param depth
 * @param maxDepth
 * @returns {*|Element|null}
 */
export function getElementFromPoint({x, y}, $host = document, depth = 0, maxDepth = 500) {
    const $elements = $host.elementsFromPoint(x, y);
    if ($elements.length > 0) {
        const $elem = $elements[0];
        if ($elem.shadowRoot != null && depth < maxDepth && $elem.shadowRoot != $host) {
            return getElementFromPoint({x, y}, $elem.shadowRoot, depth + 1, maxDepth);
        }

        return $elem;
    }

    return null;
}

/**
 * Returns some random elements on the page.
 * @returns {*|Element|null}
 */
export function getRandomElementOnPage() {
    return getElementFromPoint({
        x: window.innerWidth * Math.random(),
        y: window.innerHeight * Math.random()
    });
}

/**
 * Waits X ms.
 * @param ms
 * @returns {Promise<unknown>}
 */
export function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

/**
 * Determines if an element is destructible.
 * @param $elem
 * @param indestructibleTagNames
 * @returns {false|boolean|boolean}
 */
export function isDestructible($elem, indestructibleTagNames = INDESTRUCTIBLE_TAG_NAMES) {
    const $rootNode = $elem != null && "getRootNode" in $elem ? $elem.getRootNode() : null;
    return $elem != null && $elem.isConnected && $elem.tagName != null && !$elem.hasAttribute(INDESTRUCTIBLE_ATTRIBUTE_NAME) && !indestructibleTagNames.includes($elem.tagName) && ($rootNode != null && $rootNode.host != null ? !indestructibleTagNames.includes($rootNode.host.tagName) : true);
}

/**
 * Determines whether an element is visible in the viewport.
 * @param $elem
 * @returns {boolean}
 */
export function isVisibleInViewport($elem) {
    const {top, left, bottom, right} = $elem.getBoundingClientRect();
    return top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth;
}

/**
 * Spawns a rainbow.
 * @param leftOffset
 * @returns {Promise<void>}
 */
export async function spawnRainbow(leftOffset) {

    // Import the element and create an instance of it
    await import("./rainbow.js");
    const $rainbow = document.createElement("laser-cat-rainbow");

    // Make sure the rainbow appears below the character
    $rainbow.style.left = leftOffset;
    $rainbow.style.zIndex = `${TOP_Z_INDEX - 1}`;

    // Remove the rainbow after the animation has finished
    $rainbow.addEventListener("transitionend", () => {
        if ($rainbow.isConnected) {
            $rainbow.remove();
        }
    })

    // Append the rainbow and show it
    document.body.appendChild($rainbow);
    requestAnimationFrame(() => {
        $rainbow.show = true;
    });
}

/**
 * Updates the position of the head
 * @param {*} $elem
 * @param {*} targetCenter
 * @param offset
 */
export function setTransformTowardsTarget($elem, targetCenter, offset = 2) {
    requestAnimationFrame(() => {
        const center = getCenter($elem);
        const diffX = Math.max(
            Math.min((targetCenter.x - center.x) / 30, offset),
            -offset
        );
        const diffY = Math.max(
            Math.min((targetCenter.y - center.y) / 30, offset),
            -offset
        );

        $elem.style.setProperty(
            "--transform",
            `translate(${diffX}px, ${diffY}px)`
        );
    });
}

/**
 * Shakes an array of elements.
 * @param $elements
 * @param duration
 * @returns {Promise<Awaited<unknown>[]>}
 */
export function shakeElements($elements, duration = 500) {
    return Promise.all($elements.map($elem =>
        promisifyAnimation($elem.animate({
            transform: [
                ...[...(new Array(10))].map(() => `translate(${3 - (Math.random() * 6)}px, ${3 - (Math.random() * 6)}px) rotate(${1 - (Math.random() * 2)}deg)`),
                "translate(0, 0) rotate(0)"
            ]
        }, {
            duration: duration,
            easing: "ease-out"
        })))
    )
}

/**
 * Marks the elements as indestructible.
 * @param $elems
 */
export function markElementsAsIndestructible($elems) {
    for (const $elem of $elems) {
        $elem.toggleAttribute(INDESTRUCTIBLE_ATTRIBUTE_NAME, true);
    }
}