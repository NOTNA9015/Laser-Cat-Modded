import {translate} from "../util.js";
import "./popup-dialog.js";

const RATE_URL = "https://chrome.google.com/webstore/detail/laser-cat/ccnpdidcjgcdgaopacccfghmgdlipnoc?hl=en";

const template = document.createElement("template");
template.innerHTML = `
	<style>
		* {
			box-sizing: border-box;
		}
		
		:host {
		    text-align: center;
		}
		
		#rate {
		   width: 100%;
           border-radius: 12px;
           color: var(--background);
           background: var(--foreground);
		}
		
		#head {
		    width: 50%;
		    z-index: 12;
		}
		
		#sun {
	        position: absolute;
	        animation: ninja-sun 10000ms linear infinite;
		}
		
		#header {
		    height: 200px;
		    display: flex;
		    align-items: center;
		    justify-content: center;
		    position: relative;
		    overflow: hidden;
		}
		
		#label {
		    text-align: center;
            position: relative;
            transform: translateY(-8px);
            color: var(--shade-600);
		}
		
		@keyframes ninja-sun {
            0% {
                transform: scale(2) rotate(0deg);
            }
            100% {
                transform: scale(2) rotate(360deg);
            }
		}
	</style>
    <popup-dialog id="dialog">
        <div id="header" slot="header">
           <svg id="sun" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 65 65">
            <path fill-rule="evenodd" d="M55.3 0c-8.9 15.7-23 32.2-23 32.2s16.5-14.1 32.2-23v8.8c-14.9 8.1-32.2 14.2-32.2 14.2s16.1-3 32.2-3.7v7.5c-16.1-.7-32.2-3.7-32.2-3.7s17.3 6.1 32.2 14.2v8.8c-15.7-8.9-32.2-23-32.2-23s14.1 16.5 23 32.2h-8.8c-8.1-14.9-14.2-32.1-14.2-32.2 0 0 3 16.1 3.7 32.2h-7.4c.7-16.1 3.7-32.1 3.7-32.2 0 0-6.1 17.3-14.2 32.2h-8.9c8.9-15.7 22.9-32.2 23-32.2 0 0-16.5 14.1-32.2 23v-8.8c14.9-8.1 32.1-14.2 32.2-14.2 0 0-16.1 3-32.2 3.7v-7.4c16.1.7 32.1 3.7 32.2 3.7 0 0-17.3-6.1-32.2-14.2v-8.8c15.7 8.9 32.2 22.9 32.2 23 0 0-14.1-16.5-23-32.2h8.8c8.1 14.9 14.2 32.2 14.2 32.2s-3-16.1-3.7-32.2h7.4c-.7 16.1-3.7 32.2-3.7 32.2s6.1-17.3 14.2-32.2h8.9z" clip-rule="evenodd" fill="#B8B8B8"/>
          </svg>
          <img id="head" slot="header" class="img" src="/popup/assets/ninja/head.svg" />
        </div>
        <h2 slot="content">${translate("rewardName")}</h2>
        <p slot="content">${translate("rewardDesc")}</p>
        <button id="rate" slot="footer">${translate("rewardCta")}!</button>
        <label id="label">${translate("rewardLabel")}</label>
    </popup-dialog>
`;

export class RewardDialog extends HTMLElement {
    static get observedAttributes() {
        return [];
    }

    /**
     * Hooks up the element.
     */
    constructor() {
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));

        this.$rate = this.shadowRoot.querySelector("#rate");
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
        this.$rate.addEventListener("click", this.rate.bind(this));
    }

    /**
     * Opens the rate page.
     */
    rate() {
        window.open(RATE_URL, "_blank");
        this.close();
    }

    /**
     * Closes the dialog.
     */
    close() {
        this.remove();
    }
}

customElements.define("reward-dialog", RewardDialog);
