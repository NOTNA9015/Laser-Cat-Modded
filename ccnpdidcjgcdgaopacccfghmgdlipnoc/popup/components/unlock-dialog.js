import {SUPER_SECRET_CODE_DO_NOT_SHARE} from "../../config.js";
import {translate} from "../util.js";
import "./popup-dialog.js";

const template = document.createElement("template");
template.innerHTML = `
	<style>
		* {
			box-sizing: border-box;
		}
		
        #input, #error {
          margin: 0 0 var(--spacing-s);
        }

        #cancel {
          background: none;
          border: none;
          color: inherit;
        }

        a {
          color: inherit;
        }

        #input {
            padding: var(--spacing-s) var(--spacing-m);
        }

        #input-container {
          display: flex;
          flex-direction: column;
        }

        #unlock, #amazing {
          color: var(--character-theme-color-contrast);
          background: var(--character-theme-color);
        }

        #cancel:hover, #unlock:hover, #amazing:hover {
          opacity: 0.8;
        }
        
        #title {
            margin: 0;
        }

		hr {
			margin: 0;
			border: none;
			height: 1px;
			width: 100%;
			background: var(--shade-400);
		}

		.step {
			padding: var(--spacing-m) 0;
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

        #error {
          background: var(--error-color);
          color: var(--error-color-contrast);
          padding: var(--spacing-m);
          display: none;
        }

        #success {
          display: none;
          padding: var(--spacing-m);
          text-align: center;
        }

        #amazing {
          width: 100%;
        }

        #party {
          width: 50%;
          height: 250px;
        }
        
        #confetti {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
	</style>
    <popup-dialog id="success">
        <img id="party" slot="header" class="img" src="/popup/assets/cat/party.svg" />
        <div slot="content">
          <h2>${translate("unlockedName")}</h2>
          <p>${translate("unlockedDesc")}</p>
        </div>
        <button id="amazing" slot="footer">${translate("amazing")}!</button>
        <confetti-spray id="confetti"></confetti-spray>
    </popup-dialog>

    <form id="form" >
        <popup-dialog>
          <div id="content" slot="content">
              <div class="step">
                <h2 id="title">${translate("howToUnlock")}</h2>
              </div>

              <!-- Step 1-->
              <div class="step">
                <img class="img" src="/popup/assets/unlock-step-1.svg" />
                <div class="info">
                    <h3 class="title">${translate("stepOne")}</h3>
                    <span class="text">${translate("unlockStepOneDesc")}</span>
                </div>
              </div>

              <hr />

              <!-- Step 2 -->
              <div class="step">
                <img class="img" src="/popup/assets/unlock-step-2.svg" />
                <div class="info">
                    <h3 class="title">${translate("stepTwo")}</h3>
                    <span class="text">${translate("unlockStepTwoDesc")}</span>
                </div>
              </div>

              <hr />

              <!-- Step 3 -->
              <div class="step">
                <img class="img" src="/popup/assets/unlock-step-3.svg" />
                <div class="info">
                    <h3 class="title">${translate("stepThree")}</h3>
                    <span class="text">${translate("unlockStepThreeDesc")}</span>
                </div>
              </div>
              <div id="input-container">
                  <input id="input" placeholder="${translate(
    "enterCode"
)}" autofocus required />
                  <div id="error">
                    ${translate("wrongCode")}
                  </div>
              </div>
          </div>
            <button id="unlock" type="submit" slot="footer">${translate("unlock")}</button>
            <button id="cancel" type="button" slot="footer">${translate("cancel")}</button>
        </popup-dialog>
    </form>
`;

export class UnlockDialog extends HTMLElement {
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

        this.$cancel = this.shadowRoot.querySelector("#cancel");
        this.$input = this.shadowRoot.querySelector("#input");
        this.$form = this.shadowRoot.querySelector("#form");
        this.$error = this.shadowRoot.querySelector("#error");
        this.$success = this.shadowRoot.querySelector("#success");
        this.$amazing = this.shadowRoot.querySelector("#amazing");
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
        this.$cancel.addEventListener("click", this.close.bind(this));
        this.$amazing.addEventListener("click", this.close.bind(this));
        this.$form.addEventListener("submit", this.submitForm.bind(this));
        this.$input.addEventListener("input", this.inputChanged.bind(this));
        this.$input.focus();
    }

    /**
     * Closes the dialog.
     */
    close() {
        this.remove();
    }

    /**
     * Submits the form and unlocks everything if the code is correct.
     * @param {*} e
     */
    submitForm(e) {
        e.preventDefault();
        const code = (this.$input.value || "").trim();

        // If the code is not the right one stop here
        if (code.toUpperCase() !== SUPER_SECRET_CODE_DO_NOT_SHARE) {
            this.$error.style.display = "block";
            this.$input.focus();
            return;
        }

        this.dispatchEvent(new CustomEvent("unlock"));
    }

    /**
     * Shows the success screen.
     */
    showSuccess() {
        this.$form.style.display = "none";
        this.$success.style.display = "flex";
        import("../components/confetti-spray.js");
    }

    /**
     * Hides the success screen.
     */
    hideSuccess() {
        this.$form.style.display = "block";
        this.$success.style.display = "none";
    }

    /**
     * Each time the input changes this function is called.
     */
    inputChanged() {
        this.$error.style.display = "none";
    }
}

customElements.define("unlock-dialog", UnlockDialog);
