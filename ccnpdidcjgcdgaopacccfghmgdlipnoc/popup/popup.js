import {
    ALIVENESS_CHECK_MAX_TRIES,
    CHARACTERS, UNLOCKED_CHARACTERS_BEFORE_REWARD,
    DEFAULT_CHARACTER, POINTS_BEFORE_REWARD,
} from "../config.js";
import {
    sendMessage,
    loadData,
    saveData,
    loadSettings,
    updateSettings,
    translate,
    checkBackgroundAliveness,
    loadPoints,
    loadUnlockedCharacters,
    removeChildren,
    listenForDataChanged,
    loadHasAllCharacters,
    saveHasAllCharacters,
    saveWebStorePurchases,
    capitalizeFirstLetter,
    setActionIcon,
    buyCharacterWithPoints, reloadExtension, loadHasUnlockedReward, saveHasUnlockedReward
} from "./util.js";
import {CharacterItem} from "./components/character-item.js";
import {UnlockDialog} from "./components/unlock-dialog.js";
import {wait} from "../js/util.js";

const APP_STATUS = {
    ready: "ready",
    alive: "alive",
    dead: "dead"
}

const template = document.createElement("template");
template.innerHTML = `
<style>
    * {
        box-sizing: border-box;
    }
    
    :host {
        display: block;
        background: var(--background);
        color: var(--foreground);

        --spacing-xs: 4px;
        --spacing-s: 8px;
        --spacing-m: 12px;
        --spacing-l: 20px;

        --shade-300: #F2F6F7;
        --shade-400: #c5cacc;
        --shade-500: #acb1b3;
        --shade-600: #949899;

        --shade-300-contrast: #191919;
        --shade-400-contrast: #191919;
        --shade-500-contrast: #191919;
        --shade-600-contrast: #ffffff;

        --foreground: #191919;
        --background: #ffffff;
        --shadow: 0px 5px 30px -20px rgb(0, 0, 0);

        --character-theme-color: var(--shade-300);
        --character-theme-color-contrast: #191919;
        --error-color: #f44336;
        --error-color-contrast: #ffffff;
    }

    :host([character="cat"]) {
        --character-theme-color: #FFE07B;
    }

    :host([character="alien"]) {
        --character-theme-color: #65DDB9;
    }

    :host([character="frog"]) {
        --character-theme-color: #BEE178;
    }
    
    :host([character="dog"]) {
        --character-theme-color: #FFCC7C;
    }
    
    :host([character="unicorn"]) {
        --character-theme-color: #FFA8AF;
    }
    
    :host([character="dino"]) {
        --character-theme-color: #B5EABD;
    }
    
    :host([character="ninja"]) {
        --character-theme-color: #B8B8B8;
    }
    
    :host([dark]) {
        filter: grayscale(1);
    }

    :host([status="alive"]) #activate,
    :host([status="dead"]) #reload { 
        display: block;
    }

    :host([status="dead"]) #activate {
        display: none;
    }

    :host([status]) #points-container {
        display: flex;
    }
    
    :host([dark]) {
    
        /* Reverse foreground and background */
        --background: #191919;
        --foreground: #ffffff;
        --shadow: 0px 5px 30px -20px rgb(255, 255, 255);
    
        /* Reverse greys */
        --shade-600: #edf3f4;
        --shade-500: #c5cacc;
        --shade-400: #acb1b3;
        --shade-300: #949899;
        
        --character-theme-color: var(--shade-300);

        /* Set filter */
        --character-item-lock-filter: invert(1);
    }
    
    #sun {
        fill: var(--character-theme-color, #FFE07B);	
        contain: strict;
    }
    
    body {
        margin: 0;
        background: var(--background);
        color: var(--foreground);
    }
    
    /***********************
     ** CUTE CAT
    ***********************/
    
    #head-container {
        height: 300px;
        width: 320px;
        position: relative;
        overflow: hidden;
        user-select: none;
    }
    
    #sun-blur {
        background: radial-gradient(circle at center, var(--character-theme-color) 0%, var(--character-theme-color) 50%, transparent 100%);
        filter: blur(50px);
        width: 250px;
        height: 250px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
    }
    
    #sun {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        animation: rotate 10000s linear infinite;
        transform-origin: center center;
    }
    
    #head {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150px;
        animation: scale 4s ease-in-out infinite;
    }

    #interaction {
        position: absolute;
        bottom: var(--spacing-l);
        left: 50%;
        text-align: center;
        transform: translateX(-50%);
        max-width: 250px;
        width: 100%;
    }

    #activate {
        background: var(--background);
        color: var(--foreground);
        padding: var(--spacing-s) var(--spacing-m);
        border-radius: 12px;
        font-size: 18px;
        width: 100%;
        display: none;
        box-shadow: 0px 2px 20px -5px rgba(0, 0, 0, 0.2);
    }
    
    #activate, #reload {
        transition: 80ms ease background, 80ms ease color, 80ms ease transform;
        border: none;
        cursor: pointer;
        outline: none;
    }

    #points-container, #reload {
        display: none;
        border-radius: 200px;
        position: absolute;
        font-size: inherit;
        top: var(--spacing-s);
        padding: var(--spacing-xs) var(--spacing-s);
    }
    
    #points-container {
        left: var(--spacing-s);
        background: var(--background);
        color: var(--foreground);
        border: 2px solid var(--character-theme-color);
        align-items: center;
    }
    
    #reload {
        right: var(--spacing-s);
        background: var(--foreground);
        color: var(--background);
    }
    
    #points {
        font-weight: bold;
        margin: 0 var(--spacing-xs) 0 0;
    }

    #message {
        display: block;
        margin: var(--spacing-xs) 0 0 0;
        background: var(--background);
        padding: var(--spacing-s) var(--spacing-xs);
        border-radius: 12px;
    }

    #message:empty {
        display: none;
    }

    #activate:empty {
        display: none;
    }

    #activate:hover, #reload:hover {
        background: var(--foreground);
        color: var(--background);
        transform: scale(1.1);
    }

    #activate[disabled] {
        pointer-events: none;
        background: var(--shade-400);
    }
    
    #head-face-mouth-angry {
        display: none;
    }
    
    @keyframes rotate {
        0% {
            transform: rotate(0deg) scale(2);
        }
        100% {
            transform: rotate(360000deg) scale(2);
        }
    }
    
    @keyframes scale {
        0% {
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            transform: translate(-50%, -50%) scale(1.05);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);;
        }
    }
    
    /***********************
     ** HELP CONTENT & CHARACTERS
    ***********************/
    
    #help-content {
    }
    
    .step {
        padding: var(--spacing-s) var(--spacing-m);
        display: flex;
        align-items: center;
    }
    
    .step .img {
        width: 70px;
        margin: 0 var(--spacing-m) 0 0;
    }
    
    .step .info {
        flex-grow: 1;
    }
    
    .step .title {
        margin: 0;
    }
    
    .step .text {
    
    }
    
    /***********************
     ** TABS
    ***********************/
    
    #tabs {
        display: flex;
        align-items: center;
    }
    
    .tab {
        padding: var(--spacing-m) var(--spacing-l);
        cursor: pointer;
        flex-grow: 1;
        text-align: center;
        color: var(--shade-500);
        user-select: none;
    }
    
    .tab:not(.active):hover {
        color: var(--shade-600);
    }
    
    .tab.active {
        color: var(--foreground);
        background: var(--shade-300);
        font-weight: bold;
        cursor: default;
    }
    
    .tab-content {
        display: none;
        border-top: 1px solid var(--shade-400);
    }
    
    hr {
        margin: 0;
        border: none;
        height: 1px;
        width: 100%;
        background: var(--shade-400);
    }
    
    
    /***********************
     ** SETTINGS CONTENT
    ***********************/
    
    #settings-content {
    
    }
    
    .setting, .link {
        padding: var(--spacing-s) var(--spacing-m);
    }

    .link {
        color: inherit;
        text-decoration: none;
        display: block;
        position: relative;
        transform: translateX(0);
        transition: transform ease 120ms;
    }

    .link::after {
      content: "→";
      position: absolute;
      right: var(--spacing-m);
    }

    .link:hover {
    }

    .link:hover {
      transform: translateX(5px);
    }

    .setting {
        display: flex;
        align-items: center;
        user-select: none;
    }
    
    .grower {
        flex-grow: 1;
    }
    
    input[type="checkbox"] {
        margin: 0 var(--spacing-s) 0 0;
    }
    
    /***********************
     ** CHARACTER CONTENT
    ***********************/
    
    #characters-content {
        height: 260px;
        overflow-y: auto; 
    }
    
    .character.skeleton {
        pointer-events: none;
    }
    
    .character .character-input[checked]  {
    
    }
    
    .character .img {
    
    }
</style>
  <div id="head-container">

    <!-- Sun -->
    <svg id="sun" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 65 65">
      <path fill-rule="evenodd" d="M55.3 0c-8.9 15.7-23 32.2-23 32.2s16.5-14.1 32.2-23v8.8c-14.9 8.1-32.2 14.2-32.2 14.2s16.1-3 32.2-3.7v7.5c-16.1-.7-32.2-3.7-32.2-3.7s17.3 6.1 32.2 14.2v8.8c-15.7-8.9-32.2-23-32.2-23s14.1 16.5 23 32.2h-8.8c-8.1-14.9-14.2-32.1-14.2-32.2 0 0 3 16.1 3.7 32.2h-7.4c.7-16.1 3.7-32.1 3.7-32.2 0 0-6.1 17.3-14.2 32.2h-8.9c8.9-15.7 22.9-32.2 23-32.2 0 0-16.5 14.1-32.2 23v-8.8c14.9-8.1 32.1-14.2 32.2-14.2 0 0-16.1 3-32.2 3.7v-7.4c16.1.7 32.1 3.7 32.2 3.7 0 0-17.3-6.1-32.2-14.2v-8.8c15.7 8.9 32.2 22.9 32.2 23 0 0-14.1-16.5-23-32.2h8.8c8.1 14.9 14.2 32.2 14.2 32.2s-3-16.1-3.7-32.2h7.4c-.7 16.1-3.7 32.2-3.7 32.2s6.1-17.3 14.2-32.2h8.9z" clip-rule="evenodd"/>
    </svg>
    
    <div id="sun-blur"></div>

    <!-- Cat-->
    <img id="head"/>

		<!-- Activate button-->
		<div id="interaction">
			<button id="activate">${translate("activate")}</button>
			<span id="message">${translate("loading")}...</span>
		</div>

		<!-- Points -->
		<div id="points-container" title="${translate("pointsDesc")}">
			<div id="points"></div>
			<span>${translate("points")}</span>
		</div>
		
		<!-- Reload -->
		<button id="reload">${translate("reload")}</button>

  </div>

  <div id="tabs-container">

    <div id="tabs">
      <div data-tab-id="help-content" id="help-tab" class="tab">
        <span>${translate("howTo")}</span>
      </div>
      <div data-tab-id="characters-content" id="characters-tab" class="tab">
        <span>${translate("characters")}</span>
      </div>
      <div data-tab-id="settings-content" id="settings-tab" class="tab">
        <span>${translate("settings")}</span>
      </div>
    </div>

    <!-- Settings -->
    <div id="settings-content" class="tab-content">
      <label class="setting">
         <input id="mute-checkbox" type="checkbox" />
         <span>${translate("muteSounds")}</span>
      </label>
      <hr />
      <label class="setting">
         <input id="dark-checkbox" type="checkbox" />
         <span>${translate("darkMode")}</span>
      </label>
      <hr />
      <label class="setting">
         <input id="always-visible-checkbox" type="checkbox" />
         <span>${translate("alwaysVisible")}</span>
      </label>
      <hr />
      <div id="auto-container">
          <label class="setting">
             <input id="auto-checkbox" type="checkbox" />
             <span>${translate("autoMode")}</span>
          </label>
          <hr />
      </div>
      <a class="link" href="https://lasercat.app#privacy" target='_blank'>${translate(
    "privacyLink"
)}</a>
      <hr />
      <a class="link" href="https://lasercat.app#faq" target='_blank'>${translate(
    "faqLink"
)}</a>
      <hr />
      <a class="link" href="https://lasercat.app/hello" target='_blank'>${translate(
    "onboardingLink"
)}</a>
      <hr />
      <a class="link" href="https://www.buymeacoffee.com/AndreasMehlsen/e/76384" target='_blank'>${translate(
    "supportLink"
)}</a>
    </div>

    <!-- Characters -->
    <div id="characters-content" class="tab-content">
        <character-item class="character skeleton" purchased></character-item>
        <character-item class="character skeleton" purchased></character-item>
        <character-item class="character skeleton" purchased></character-item>
        <character-item class="character skeleton" purchased></character-item>
        <!-- Added through code... -->
    </div>

    <!-- Help -->
    <div id="help-content" class="tab-content">

      <!-- Step 1-->
      <div class="step">
        <img id="step-1-img" class="img" src="/popup/assets/how-to-step-1.svg" />
        <div class="info">
            <h3 class="title">${translate("stepOne")}</h3>
            <span class="text">${translate("howToStepOneDesc")}</span>
        </div>
      </div>

      <hr />

      <!-- Step 2 -->
      <div class="step">
        <img id="step-2-img" class="img" src="/popup/assets/cat/how-to-step-2.svg" />
        <div class="info">
            <h3 class="title">${translate("stepTwo")}</h3>
            <span class="text">${translate("howToStepTwoDesc")}</span>
        </div>
      </div>

      <hr />

      <!-- Step 3 -->
      <div class="step">
        <img id="step-3-img" class="img" src="/popup/assets/cat/how-to-step-3.svg" />
        <div class="info">
            <h3 class="title">${translate("stepThree")}</h3>
            <span id="step-3-text" class="text">${translate("howToStepThreeCatDesc")}</span>
        </div>
      </div>
    </div>

  </div>
`;

export class PopupApp extends HTMLElement {
    static get observedAttributes() {
        return ["character", "muted", "dark", "always-visible", "auto"];
    }

    /** Whether the app is muted */
    set muted(value) {
        this.toggleAttribute("muted", Boolean(value));
    }

    get muted() {
        return this.hasAttribute("muted");
    }

    /** The status of the app */
    set status(value) {
        this.setAttribute("status", value);
    }

    get status() {
        return this.hasAttribute("status");
    }

    /** Whether the auto mode is on */
    set auto(value) {
        this.toggleAttribute("auto", Boolean(value));
    }

    get auto() {
        return this.hasAttribute("auto");
    }

    /** The current character */
    set character(value) {
        this.setAttribute("character", value);
    }

    get character() {
        return this.getAttribute("character") || DEFAULT_CHARACTER.id;
    }

    /** Whether the app is always visible */
    set alwaysVisible(value) {
        this.toggleAttribute("always-visible", Boolean(value));
    }

    get alwaysVisible() {
        return this.hasAttribute("always-visible");
    }

    /** Whether the app is dark mode */
    set dark(value) {
        this.toggleAttribute("dark", value ?? false);
    }

    get dark() {
        return this.hasAttribute("dark");
    }

    constructor() {
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));

        this.$muteCheckbox = this.shadowRoot.querySelector("#mute-checkbox");
        this.$darkCheckbox = this.shadowRoot.querySelector("#dark-checkbox");
        this.$autoCheckbox = this.shadowRoot.querySelector("#auto-checkbox");
        this.$alwaysVisibleCheckbox = this.shadowRoot.querySelector(
            "#always-visible-checkbox"
        );
        this.$points = this.shadowRoot.querySelector("#points");
        this.$charactersContent = this.shadowRoot.querySelector(
            "#characters-content"
        );
        this.$head = this.shadowRoot.querySelector("#head");
        this.$activate = this.shadowRoot.querySelector("#activate");
        this.$message = this.shadowRoot.querySelector("#message");
        this.$reload = this.shadowRoot.querySelector("#reload");

        this.$step2Image = this.shadowRoot.querySelector("#step-2-img");
        this.$step3Image = this.shadowRoot.querySelector("#step-3-img");
        this.$step3Text = this.shadowRoot.querySelector("#step-3-text");

        this.setup().then();

        // Maybe show the reward dialog
        this.tryShowRewardDialog().then();
    }

    /**
     * Sets up the popup.
     */
    async setup() {
        // Load settings
        const settings = (await loadSettings()) || {};

        // Set the settings
        this.setCharacter(settings.character);
        this.setIsDark(settings.dark);
        this.setIsMuted(settings.muted);
        this.setIsAuto(settings.auto);
        this.setIsAlwaysVisible(settings.alwaysVisible);

        // Setup the characters
        this.setupCharacters().then();

        // Attach listeners
        this.attachListeners();

        // Figure out what tab to show
        const firstLoad = !(await loadData("hasLoaded"));
        if (firstLoad) {
            this.openTab(this.shadowRoot.querySelector("#help-tab"));
            saveData("hasLoaded", true).then();
        } else {
            this.openTab(this.shadowRoot.querySelector("#characters-tab"));
        }

        // Set the ready class
        this.status = APP_STATUS.ready;

        // Setup points
        this.updatePointsLabel().then();

        // Setup the how to images
        this.updateHowTo();

        // Make sure the background script exists
        this.checkBackgroundAliveness(ALIVENESS_CHECK_MAX_TRIES).then();
    }

    /**
     * Recursively checks for background aliveness.
     * Sometimes the background script is still loading when we do the initial check.
     * Therefore we do a few until we get a response.
     * @param tries
     * @param timeout
     * @returns {Promise<void>}
     */
    async checkBackgroundAliveness(tries = 1, timeout = 500) {
        let isAlive = false;
        let message = undefined;
        for (let i = 0; i < tries; i++) {

            // Check if theres a heartbeat
            try {
                isAlive = await checkBackgroundAliveness();
            } catch (err) {
                message = err.message;
                break;
            }

            // If it is alive, stop already now!
            if (isAlive) {
                break;
            }

            await wait(timeout);
        }

        this.setIsAlive(isAlive, message);
    }

    /**
     * Syncs the UI with changes in the stored data.
     */
    setupListenForDataChanges() {
        listenForDataChanged((changes) => {
            if (changes.points != null) {
                this.updatePointsLabel(changes.points.newValue).then();
            }

            if (changes.settings != null) {
                this.setIsAlwaysVisible(changes.settings.newValue.alwaysVisible);
                this.setIsMuted(changes.settings.newValue.muted);
                this.setIsDark(changes.settings.newValue.dark);
                this.setCharacter(changes.settings.newValue.character);
            }

            if (changes.hasAllCharacters != null || changes.unlockedCharacters != null || changes.hasSeenReward) {
                this.setupCharacters().then();
            }
        });
    }

    /**
     * Updates the points label.
     */
    async updatePointsLabel(points = undefined) {
        points = points || (await loadPoints());
        this.$points.innerText = Math.max(points, 0);
    }

    /**
     * Shows the reward dialog.
     */
    async tryShowRewardDialog() {
        await wait(300);

        const hasUnlockedReward = await loadHasUnlockedReward();
        const hasAllCharacters = await loadHasAllCharacters();
        const unlockedCharacters = await loadUnlockedCharacters();
        const points = await loadPoints();

        // Make sure the user haven't seen the reward and doesn't have all characters/the ninja
        if (hasUnlockedReward || hasAllCharacters || unlockedCharacters.includes(CHARACTERS.ninja) || unlockedCharacters.length < UNLOCKED_CHARACTERS_BEFORE_REWARD || points < POINTS_BEFORE_REWARD) return;

        // Show the reward dialog
        const {RewardDialog} = await import("./components/reward-dialog.js");
        this.shadowRoot.appendChild(new RewardDialog());

        // Unlock the reward
        saveHasUnlockedReward(true);
        this.setupCharacters();
    }

    /**
     * Sets up elements.
     */
    attachListeners() {

        // Each time the head container is clicked we open the character on the page
        this.$activate.addEventListener("click", async () => {
            window.close();
            try {
                await sendMessage("show", null, {active: true, currentWindow: true});
            } catch (err) {
                // Fail silently
            }
        });

        // Listen for clicks on the tab
        const $tabs = Array.from(this.shadowRoot.querySelectorAll(".tab"));
        for (const $tab of $tabs) {
            $tab.addEventListener("click", () => this.openTab($tab));
        }

        this.$muteCheckbox.addEventListener("input", (e) => {
            const muted = e.target.checked;
            updateSettings({muted: e.target.checked}).then();
            this.setIsMuted(muted);
        });

        this.$darkCheckbox.addEventListener("input", (e) => {
            const dark = e.target.checked;
            updateSettings({dark}).then();
            this.setIsDark(dark);
        });

        this.$autoCheckbox.addEventListener("input", (e) => {
            const auto = e.target.checked;
            updateSettings({auto}).then();
            this.setIsAuto(auto);
        });

        this.$alwaysVisibleCheckbox.addEventListener("input", async (e) => {
            const alwaysVisible = e.target.checked;
            updateSettings({alwaysVisible}).then();
            this.setIsAlwaysVisible(alwaysVisible);

            // Hide the character if always visible was removed
            if (!alwaysVisible) {
                try {
                    await sendMessage("remove", null, {active: true, currentWindow: true});
                } catch (err) {
                    // Fail silently
                }
            }
        });

        this.$reload.addEventListener("click", () => reloadExtension());

        // Makes sure that the page syncs when data changes async.
        this.setupListenForDataChanges();
    }

    async setupCharacters() {

        // Load product information
        const totalPoints = await loadPoints();
        const unlockedCharacters = await loadUnlockedCharacters();
        const hasAllCharacters = await loadHasAllCharacters();
        const hasUnlockedReward = await loadHasUnlockedReward();

        // Clears container to make sure we dont get duplicate content
        removeChildren(this.$charactersContent);

        // Add each character to the list
        for (const [_, {buyable, name, description, id, pointsPrice, reward}] of Object.entries(CHARACTERS)) {

            // Check whether we should render the reward character
            if (reward && id !== this.character && !hasAllCharacters && !hasUnlockedReward) {
                continue;
            }

            const $character = new CharacterItem();
            $character.headline = translate(name);
            $character.text = translate(description);
            $character.character = id;

            // If its not buyable mark it as purchased
            if (!buyable || hasAllCharacters || reward) {
                $character.purchased = true;
            } else {
                $character.purchased = unlockedCharacters.includes(id);
                $character.totalPoints = totalPoints;
                $character.pointsPrice = pointsPrice;
                $character.addEventListener("buy-with-code", () =>
                    this.openUnlockDialog()
                );
                $character.addEventListener("buy-with-points", async () => {
                    // Buy the character with points
                    try {
                        await buyCharacterWithPoints({
                            character: id,
                            pointsPrice,
                        });

                        // If the item could be bought we mark it as purchased
                        $character.purchased = true;

                        // Notify the rest of the world
                        this.updatePointsLabel().then();
                    } catch (err) {
                        alert(translate("unexpectedError", "unknown"));
                        console.error(err);
                    }
                });
            }

            $character.addEventListener("select", (e) => this.selectCharacter(id));
            this.$charactersContent.appendChild($character);
        }

        this.updateCharactersSelection();

        // Save purchases for when webstore is deprecated
        if (purchases.length > 0) {
            saveWebStorePurchases(purchases).then();
        }
    }

    /**
     * Update UI based on aliveness.
     * @param {*} isAlive
     * @param message
     */
    setIsAlive(isAlive, message = undefined) {
        this.$activate.disabled = !isAlive;
        this.$message.innerText = message || (isAlive ? "" : translate("cannotActivate"));
        this.status = isAlive ? APP_STATUS.alive : APP_STATUS.dead;
    }

    /**
     * Selects a character, updating the settings.
     * @param {*} character
     */
    selectCharacter(character) {
        updateSettings({character}).then();
        this.setCharacter(character);
        this.updateCharactersSelection();
        this.updateHowTo();
    }

    /**
     * Sets the character.
     * @param {*} character
     */
    setCharacter(character) {
        this.character = character || this.character;
    }

    setIsMuted(muted) {
        this.muted = muted;
    }

    setIsAuto(auto) {
        this.auto = auto;
    }

    setIsDark(dark) {
        this.dark = dark;
    }

    setIsAlwaysVisible(alwaysVisible) {
        this.alwaysVisible = alwaysVisible;
    }

    /**
     * Opens a tab.
     * @param {*} $activeTab
     */
    openTab($activeTab) {
        // Set active class on the correct tab
        const activeTabId = $activeTab.getAttribute("data-tab-id");
        const $tabs = Array.from(this.shadowRoot.querySelectorAll(".tab"));
        for (const $tab of $tabs) {
            const isActive = $tab === $activeTab;
            if (isActive) {
                $tab.classList.add("active");
            } else {
                $tab.classList.remove("active");
            }
        }

        // Show the content
        const $tabsContent = Array.from(
            this.shadowRoot.querySelectorAll(".tab-content")
        );
        for (const $tabContent of $tabsContent) {
            const isActive = $tabContent.id === activeTabId;
            $tabContent.style.display = isActive ? `block` : `none`;
        }
    }

    /**
     * React to property changes
     * @param {*} name
     * @param {*} newValue
     * @param {*} olValue
     */
    attributeChangedCallback(name, newValue, olValue) {
        switch (name) {
            case "always-visible":
                // TODO: Do something
                break;
            case "character":
                this.updateCharacter();
                // TODO: Update character stuff
                break;
            case "muted":
                // TODO: Update muted stuff
                break;
            case "dark":
                this.updateCharacter();
                // TODO: Update dark stuff
                break;
        }

        this.render();
    }

    /**
     * Updates the image of the selected character.
     */
    updateCharacter() {
        // Update the head
        const characterId = this.character;
        this.$head.src = `/popup/assets/${characterId}/head.svg`;
        setActionIcon(`/popup/assets/${characterId}/icon.png`);
    }

    /**
     * Updates the how to images to reflect the selected character.
     */
    updateHowTo() {
        const characterId = this.character;
        this.$step2Image.src = `/popup/assets/${characterId}/how-to-step-2.svg`;
        this.$step3Image.src = `/popup/assets/${characterId}/how-to-step-3.svg`;
        this.$step3Text.innerText = translate(`howToStepThree${capitalizeFirstLetter(characterId)}Desc`);
    }

    /**
     * Makes sure the correct selected state is reflected.
     */
    updateCharactersSelection() {
        for (const $character of Array.from(
            this.$charactersContent.querySelectorAll("character-item")
        )) {
            const character = $character.character;
            const selected =
                character === this.character ||
                (this.character == null && character === DEFAULT_CHARACTER.id);
            $character.selected = selected;
        }
    }

    /**
     * Opens the unlock dialog.
     */
    openUnlockDialog() {
        const $unlockDialog = new UnlockDialog();
        this.shadowRoot.appendChild($unlockDialog);

        $unlockDialog.addEventListener("unlock", async () => {
            try {
                saveHasAllCharacters(true).then();
                $unlockDialog.showSuccess();
            } catch (err) {
                alert(translate("unexpectedError", "unknown"));
                $unlockDialog.hideSuccess();
            }
        });
    }

    /**
     * Renders the component.
     */
    render() {
        this.$muteCheckbox.checked = this.muted;
        this.$darkCheckbox.checked = this.dark;
        this.$autoCheckbox.checked = this.auto;
        this.$alwaysVisibleCheckbox.checked = this.alwaysVisible;
        this.updateCharactersSelection();
    }
}

customElements.define("popup-app", PopupApp);
