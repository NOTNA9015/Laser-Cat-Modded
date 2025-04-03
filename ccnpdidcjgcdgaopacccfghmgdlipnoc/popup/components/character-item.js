import {translate} from "../util.js";

const template = document.createElement("template");
template.innerHTML = `
	<style>
		* {
			box-sizing: border-box;
		}
	
		:host {
			display: block;
			position: relative;
			transition: 100ms ease background;
			user-select: none;
		}

		:host([purchased]:not([selected]):hover) {
			background: var(--shade-300);
			cursor: pointer;
		}

		#label {
			padding: var(--spacing-s) var(--spacing-m);
			display: flex;
			align-items: center;
			cursor: inherit;
		}
		
	 	#input {
			margin: 0 var(--spacing-m) 0 0;
		}
		 
		#img {
			width: 70px;
			height: 70px;
			margin: 0 var(--spacing-m) 0 0;
			background-color: var(--shade-300);
			position: relative;
		}
		
		#img:not([src])::after {
		    content: "";
		    width: 100%;
		    height: 100%;
		    position: absolute;
            left: 0;
            top: 0;
			background-color: var(--shade-300);
		}
		
		#info {
			flex-grow: 1;
		}
		
		#title {
			margin: 0;
		}
		
		#text {
		
		}
		
		#title:empty, #text:empty {
            height: 12px;
            background: var(--shade-300);
            display: block;
            width: 100%;
		}
		
		#title:empty {
		    width: 60%;
		}
		 
        #text:empty {
            margin-top: var(--spacing-s);	
        }
		

		#purchase-layer, #label {
			transition: 100ms ease opacity;
		}

		#purchase-layer {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;

			/* Hide as default */
			display: none;
			opacity: 0;
		}

		.button {
			color: var(--foreground);
			background: var(--background);
			border-radius: var(--spacing-s);
			padding: var(--spacing-s) var(--spacing-m);
			border: none;
			outline: none;
			transition: 100ms ease transform;
			cursor: pointer;
		}

		.button.inverted {
			color: var(--background);
			background: var(--foreground);
		}

		.button.bordered {
			border: 1px solid currentColor;
		}

		.button[disabled] {
			opacity: 0.5;
			pointer-events: none;
			cursor: default;
		}

		.button:not(:last-child) {
			margin: 0 0 var(--spacing-xs);
		}

		.button:hover {
			transform: scale(1.1);
		}

		#lock {
			position: absolute;
			width: 12px;
			filter: var(--character-item-lock-filter, unset);
			
			/* Hide as default */ 
			display: none;
		}

		:host(:not([purchased])) #lock  {
			display: block;
		}

		:host(:not([purchased])) #input  {
			opacity: 0;
		}

		:host(:not([purchased]):hover) #label  {
			opacity: 0.3;
		}

		:host(:not([purchased])) #purchase-layer {
			display: flex;
		}

		:host(:not([purchased]):hover) #purchase-layer {
			opacity: 1;
		}

		#buy-with-code:empty, #buy-with-points:empty {
			display: none;
		}
	</style>
	<label id="label" for="input">
		<input type="radio" id="input" name="character">
		<img id="lock" src="/popup/assets/lock.svg" />
		<div>
			<img id="img" />
		</div>
			<div id="info">
				<h3 id="title"></h3>
				<span id="text"></span>
			</div>
	</label>
	<div id="purchase-layer">
		<button id="buy-with-code" class="button inverted">${translate(
    "unlockWithCode"
)}</button>
		<button id="buy-with-points" class="button bordered"></button>
	</div>
`;

export class CharacterItem extends HTMLElement {
    static get observedAttributes() {
        return ["character", "headline", "text", "selected", "purchased"];
    }

    /** The character ID */
    set character(value) {
        this.setAttribute("character", value);
    }

    get character() {
        return this.getAttribute("character");
    }

    /** The title */
    set headline(value) {
        this.setAttribute("headline", value);
    }

    get headline() {
        return this.getAttribute("headline");
    }

    /** The description */
    set text(value) {
        this.setAttribute("text", value);
    }

    get text() {
        return this.getAttribute("text");
    }

    /** Whether the item is selected */
    set selected(value) {
        value
            ? this.setAttribute("selected", "")
            : this.removeAttribute("selected");
    }

    get selected() {
        return this.hasAttribute("selected");
    }

    /** Whether the item is purchased */
    set purchased(value) {
        value
            ? this.setAttribute("purchased", "")
            : this.removeAttribute("purchased");
    }

    get purchased() {
        return this.hasAttribute("purchased");
    }

    /**
     * Hooks up the element.
     */
    constructor() {
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));

        this.$input = this.shadowRoot.querySelector("#input");
        this.$img = this.shadowRoot.querySelector("#img");
        this.$title = this.shadowRoot.querySelector("#title");
        this.$text = this.shadowRoot.querySelector("#text");
        this.$buyWithCodeButton = this.shadowRoot.querySelector("#buy-with-code");
        this.$buyWithPointsButton =
            this.shadowRoot.querySelector("#buy-with-points");

        this.pointsPrice = 0;
        this.totalPoints = 0;
    }

    /**
     * Setup the element after connected.
     */
    connectedCallback() {
        this.setup();
    }

    /**
     * Sets up the character.
     */
    setup() {
        this.$input.addEventListener("click", (e) => {
            // If the item is not purchased we don't allow it to be selected
            if (!this.purchased) {
                e.preventDefault();
                e.stopPropagation();
                this.selected = false;
                return;
            }

            this.dispatchEvent(new CustomEvent("select"));
        });

        this.$buyWithPointsButton.innerText = translate(
            "unlockWithPoints",
            this.pointsPrice.toString()
        );

        this.$buyWithCodeButton.addEventListener("click", () => {
            this.buyWithCode().then();
        });

        this.$buyWithPointsButton.disabled = this.totalPoints < this.pointsPrice;
        this.$buyWithPointsButton.addEventListener("click", () => {
            this.buyWithPoints();
        });
    }

    /**
     * Buy the character for points.
     */
    async buyWithPoints() {
        // Make sure the user has enough points
        if (this.totalPoints < this.pointsPrice) {
            alert(translate("notEnoughPoints"));
            return;
        }

        this.dispatchEvent(new CustomEvent("buy-with-points"));
    }

    /**
     * Buy the character for money.
     */
    async buyWithCode() {
        this.dispatchEvent(new CustomEvent("buy-with-code"));
    }

    /**
     * React to property changes
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "headline":
                this.$title.innerText = this.headline;
                break;
            case "text":
                this.$text.innerText = this.text;
                break;
            case "character":
                this.$img.src = `/popup/assets/${this.character}/preview.svg`;
                break;
            case "selected":
                this.$input.checked = this.selected;
                break;
            case "purchased":
                break;
        }
    }
}

customElements.define("character-item", CharacterItem);
