/**
 * Saves data globally across all browsers.
 * @param {*} key
 * @param {*} data
 */
function saveData(key, data) {
    return new Promise((res) => {
        chrome.storage.sync.set({[key]: data}, res);
    });
}

/**
 * Load data.
 * @param {*} key
 * @param {*} defaultValue
 */
function loadData(key, defaultValue = {}) {
    return new Promise((res) => {
        // Due to the weirdness of the storage API, it (for some reason) includes the key in the data.
        // We get rid of that by accessing the data at the key.
        chrome.storage.sync.get(key, (data) =>
            res(
                data != null && key in data ? data[key] || defaultValue : defaultValue
            )
        );
    });
}

/**
 * Removes data.
 * @param {*} key
 */
function removeData(key) {
    return new Promise((res) => {
        chrome.storage.sync.remove(key, res);
    });
}

/**
 * Loads the settings.
 */
function loadSettings() {
    return loadData("settings", {});
}

/**
 * Load current points.
 */
function loadPoints() {
    return loadData("points", 0);
}

/**
 * Adds X points with a debounce.
 * @param {*} points
 */
async function addPoints(points) {
    const newPoints = (await loadPoints()) + points;
    saveData("points", newPoints);
}

/**
 * Returns a Chrome URL.
 * @param {*} path
 */
function getURL(path) {
    return chrome.runtime.getURL(path);
}

/**
 * Load a script with a pat
 * @param {*} path
 * @param {*} setup
 */
function loadScript(path, setup) {
    return new Promise((res) => {
        const $script = document.createElement("script");
        $script.type = `module`;
        $script.src = path;
        $script.async = true;

        if (setup != null) {
            setup($script);
        }

        $script.onload = res;

        const $firstChild = document.head.firstChild;
        if ($firstChild != null) {
            $firstChild.parentNode.insertBefore($script, $firstChild);
        } else {
            document.head.appendChild($script);
        }
    });
}

/**
 * Since custom elements are not 100% working in chrome extensions we have to be creative!
 * This is the way we forward information to the laser cat app! (app.js).
 * @param {*} msg
 * @param {*} data
 */
function dispatchAppEvent(msg, data) {
    requestAnimationFrame(() => {
        window.dispatchEvent(
            new CustomEvent("appEvent", {detail: {msg, data}})
        );
    });
}

/**
 * Add points to the user.
 * @param {*} points
 */
async function onAddPoints(e) {
    const {points} = e.detail;
    addPoints(points);
}

/**
 * Returns the current app.
 */
function getCurrentApp() {
    return document.querySelector("laser-cat-app");
}

/**
 * Determines whether the app is visible.
 */
function isAppCurrentlyVisible() {
    return getCurrentApp() != null;
}

/**
 * Handles that the page was loaded.
 */
async function onPageLoaded() {
    const settings = await loadSettings();
    if (settings.alwaysVisible) {
        this.setupApp();
    }
}

/**
 * Tear down the curren tapp.
 */
function tearDownCurrentApp() {
    const $currentApp = getCurrentApp();
    if ($currentApp != null) {
        dispatchAppEvent("hide");
        $currentApp.removeEventListener("addPoints", onAddPoints);
        $currentApp.remove();
    }
}

/**
 * Sets up the app by adding a script so we can use custom elements..
 */
async function setupApp() {
    // Some pages dispatch TWO loads events (wtf? why guys?)
    // Abort mission if we already have a laser cat!
    if (isAppCurrentlyVisible()) {
        return null;
    }

    try {
        // Add extensions
        const laserCatUrl = getURL("js/app.js");
        await loadScript(laserCatUrl);

        // Create the app and set the resources
        const $app = document.createElement("laser-cat-app");

        // Add sound resources
        $app.setAttribute(
            "sounds",
            JSON.stringify({
                meow: [getURL("sounds/meow.mp3")],
                laser: [getURL("sounds/laser.mp3")],
                rainbow: [getURL("sounds/rainbow.mp3")],
                frog: [getURL("sounds/frog.mp3")],
                slime: [getURL("sounds/slime.mp3")],
                woop: [getURL("sounds/woop.mp3")],
                space: [getURL("sounds/space.mp3")],
                fire: [getURL("sounds/fire.mp3")],
                squeak: [getURL("sounds/squeak.mp3")],
                glimmer: [getURL("sounds/glimmer.mp3")],
                pling: [getURL("sounds/pling.mp3")],
                falling: [getURL("sounds/falling.mp3")],
                explosion: [getURL("sounds/explosion.mp3")],
                throwing: [getURL("sounds/throwing.mp3")],
                sword: [getURL("sounds/sword.mp3")],
                woosh: [getURL("sounds/woosh.mp3")],
            })
        );

        // Check whether the app is currently visible.
        // Since we are in an async context this is necessary.
        // Maybe two calls where made and they don't know both are adding an app.
        if (isAppCurrentlyVisible()) {
            return null;
        }

        // Add laser cat app!
        document.body.appendChild($app);

        // Listen for events
        $app.addEventListener("addPoints", onAddPoints);

        // Update the initial settings for the laser cat
        const settings = await loadSettings();
        dispatchAppEvent("updateSettings", settings);

        // Try to attach the version to the app
        try {
            const {version} = chrome.runtime.getManifest();
            $app.setAttribute("version", version);
        } catch (err) {
            // Ignore error
        }

        // Return the app
        return $app;
    } catch (e) {
        console.error(
            ">> Something went wrong while loading the 'content-script.js' script (laser cat extension, miaw!) <<",
            e
        );
    }

    return null;
}

/**
 * Handles that a new message was received from the popup.
 * @param {*} request
 */
async function onReceivePopupMessage(request) {
    const {msg, data} = request;
    switch (msg) {
        case "remove":
            tearDownCurrentApp();
            break;
        case "hide":
            dispatchAppEvent("hide", data);
            break;
        case "show":
            // Ensure we have an app in the DOM
            const $newApp = await setupApp();

            // Set active attribute on the new app (we need to do this because the character might still be loading..)
            if ($newApp != null) {
                $newApp.setAttribute("active", "");
            }

            // Show the character
            dispatchAppEvent("show", data);
            break;
        case "updateSettings":
            // Setup the app if always visible is now on
            // If a new app was created we don't need to dispatch the update settings event.
            if (data.alwaysVisible) {
                const $newApp = await setupApp();
                if ($newApp != null) {
                    return;
                }
            }

            dispatchAppEvent("updateSettings", data);
            break;
        case "heartbeat":
            // Send heartbeat back to the popup to indicate aliveness
            chrome.runtime.sendMessage({
                msg: "heartbeat",
            });
            break;
    }
}

// Listen for events from the popup
chrome.runtime.onMessage.addListener(onReceivePopupMessage);


// Setup the app instantly
onPageLoaded();

// Some pages clear everything after load. Try to setup the app again after load.
window.addEventListener("load", onPageLoaded);
