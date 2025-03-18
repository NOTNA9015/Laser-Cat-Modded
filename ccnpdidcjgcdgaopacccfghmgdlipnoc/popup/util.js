import {STORAGE_KEYS} from "../config.js";

/**
 * Gets the active tab.
 * Since we only have activeTab permission this will always just return the current active tab no matter the tab query.
 */
export function getCurrentTab() {
    return new Promise((res, rej) => {
        // Get the tab and send a message to that tab
        chrome.tabs.query({currentWindow: true, active: true}, tabs => {
            if (tabs.length > 0) {
                res(tabs[0]);
            } else {
                rej("Could not find any active tabs.");
            }
        });
    })
}

/**
 * Sends a message to content-script.js.
 */
export async function sendMessage(msg, data) {
    const tab = await getCurrentTab();
    if (tab != null) {
        // Skip the tab if its an extension tab to avoid the "Could not establish connection. Receiving end does not exist."" error.
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
            throw new Error(translate("cannotActivateChromeManaged"));
        }

        try {
            chrome.tabs.sendMessage(tab.id, {msg, data});
        } catch (err) {
            throw new Error(translate("cannotActivate"));
        }
    }
}


/**
 * Load data.
 * @param {*} key
 * @param {*} defaultValue
 */
export function loadData(key, defaultValue = null) {
    return new Promise((res, rej) => {
        try {
            // Due to the weirdness of the storage API, it (for some reason) includes the key in the data.
            // We get rid of that by accessing the data at the key.
            chrome.storage.sync.get(key, (data) =>
                res(
                    data != null && key in data ? data[key] || defaultValue : defaultValue
                )
            );
        } catch (err) {
            rej(err);
        }
    });
}

/**
 * Saves data globally across all browsers.
 * @param {*} key
 * @param {*} data
 */
export function saveData(key, data) {
    return new Promise((res, rej) => {
        try {
            chrome.storage.sync.set({[key]: data}, res);
        } catch (err) {
            rej(err);
        }
    });
}

/**
 * Listens for data changed.
 * @param {*} cb
 */
export function listenForDataChanged(cb) {
    chrome.storage.onChanged.addListener(cb);
}

/**
 * Loads the settings.
 */
export function loadSettings() {
    return loadData(STORAGE_KEYS.settings, null);
}

/**
 * Saves the settings.
 * @param {*} settings
 */
export function saveSettings(settings) {
    return saveData(STORAGE_KEYS.settings, settings);
}

/**
 * Load current points.
 */
export function loadPoints() {
    return loadData(STORAGE_KEYS.points, 0);
}

/**
 * Save points.
 * @param {*} points
 */
export function savePoints(points) {
    return saveData(STORAGE_KEYS.points, points);
}

/**
 * Load local characters.
 */
export function loadUnlockedCharacters() {
    return loadData(STORAGE_KEYS.unlockedCharacters, []);
}

/**
 * Load whether the user has all characters.
 */
export function loadHasAllCharacters() {
    return loadData(STORAGE_KEYS.hasAllCharacters, false);
}

/**
 * Load whether the user has unlocked the reward.
 */
export function loadHasUnlockedReward() {
    return loadData(STORAGE_KEYS.hasUnlockedReward, false);
}

/**
 * Save unlocked characters.
 * @param {*} characters
 */
export function saveUnlockedCharacters(characters) {
    return saveData(STORAGE_KEYS.unlockedCharacters, characters);
}

/**
 * Save bought products so we can figure out what has been bought when Google deprecated the webstore.
 * @param purchases
 * @returns {Promise<unknown>}
 */
export function saveWebStorePurchases(purchases) {
    return saveData(STORAGE_KEYS.webStorePurchases, purchases);
}

/**
 * Save whether the user has all characters.
 * @param v
 * @returns {Promise<unknown>}
 */
export function saveHasAllCharacters(v) {
    return saveData(STORAGE_KEYS.hasAllCharacters, v);
}

/**
 * Save whether the user has unlocked the reward dialog.
 * @param v
 * @returns {Promise<unknown>}
 */
export function saveHasUnlockedReward(v) {
    return saveData(STORAGE_KEYS.hasUnlockedReward, v);
}

/**
 * Updates the settings.
 * @param {*} updatedSettings
 */
export async function updateSettings(updatedSettings) {
    const currentSettings = await loadSettings();
    const newSettings = {...currentSettings, ...updatedSettings};
    await saveSettings(newSettings);

    try {
        await sendMessage("updateSettings", newSettings);
    } catch (err) {
        // Fail silently.
    }
}

/**
 * Reloads the extension (content-script.js and popup.js).
 */
export async function reloadExtension() {
    const tab = await getCurrentTab();
    if (tab != null) {
        chrome.tabs.reload(tab.id);
    }

    location.reload();
}

/**
 * Formats a currency.
 * @param {*} param0
 */
export function formatCurrency({regionCode, currencyCode, valueMicros}) {
    const formatter = new Intl.NumberFormat(regionCode, {
        style: "currency",
        currency: currencyCode,
    });

    return formatter.format(valueMicros / 1000 / 1000);
}

/**
 * Checks the background aliveness. We can only use the extension if a background script is attached.
 * @param {*} delay
 */
export function checkBackgroundAliveness(delay = 200) {
    return new Promise(async (res, rej) => {
        // Handle heartbeat response
        let isAlive = false;
        const listener = (req) => {
            const {msg} = req;
            switch (msg) {
                case "heartbeat":
                    isAlive = true;
                    break;
            }
        };

        try {
            // Receive messages from the background script
            chrome.runtime.onMessage.addListener(listener);

            // Resolve after the background have had a chance to respond
            setTimeout(() => {
                chrome.runtime.onMessage.removeListener(listener);
                res(isAlive);
            }, delay);

            // Send heartbeat message to active tab
            await sendMessage("heartbeat", null, {active: true, currentWindow: true});

        } catch (err) {
            rej(err);
        }
    });
}

/**
 * Buys the character using points.
 * @param {*} param0
 */
export async function buyCharacterWithPoints({pointsPrice, character}) {
    // Set the new amount of points
    const currentPoints = await loadPoints();
    const newPoints = currentPoints - pointsPrice;

    // Check if there's enough points
    if (newPoints < 0) {
        throw new Error("Not enough points");
    }

    savePoints(newPoints);

    // Add the new unlocked character to the array of unlocked characters
    const unlockedCharacters = await loadUnlockedCharacters();
    if (!unlockedCharacters.includes(character)) {
        unlockedCharacters.push(character);
        saveUnlockedCharacters(unlockedCharacters);
    }
}

/**
 * Removes all children from a container.
 * @param {*} $container
 */
export function removeChildren($container) {
    while ($container.firstChild != null) {
        $container.firstChild.remove();
    }
}

/**
 * Returns a translation for a given key.
 * https://developer.chrome.com/docs/extensions/reference/i18n/
 * @param {*} key
 * @param {*} data
 * @returns
 */
export function translate(key, data = undefined) {
    return chrome.i18n.getMessage(key, data);
}

/**
 * Capitalize the first letter.
 * @param string
 * @returns {string}
 */
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Sets the active icon for the popup.
 * @param path
 */
export function setActionIcon(path) {
    if (chrome.action != null) {
        chrome.action.setIcon({path: path ?? `/popup/assets/cat/icon.png`});
    }
}