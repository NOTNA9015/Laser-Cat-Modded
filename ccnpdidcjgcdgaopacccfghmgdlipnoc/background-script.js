/**
 * Handles that the app was installed or updated.
 * @param request
 * @returns {Promise<void>}
 */
async function onInstalledEvent(details) {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        const onboardingUrl = "https://lasercat.app/hello";
        chrome.tabs.create({url:onboardingUrl});
        //chrome.runtime.setUninstallURL('https://example.com/extension-survey');
    }
}

// Listen for install events
chrome.runtime.onInstalled.addListener(onInstalledEvent);
