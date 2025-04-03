import {TOP_Z_INDEX} from "../../config.js";

const template = document.createElement("template");
template.innerHTML = `
	<style>
		* {
			box-sizing: border-box;
		}
	
		:host {
          position: fixed; 
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          padding: var(--spacing-l);
          background: rgba(0, 0, 0, 0.3);
          z-index: ${TOP_Z_INDEX};

          display: flex;
          align-items: center;
          justify-content: center;
		}

        #dialog {
			background: var(--background);
			color: var(--foreground);
            box-shadow: var(--shadow);
            overflow-y: auto;
            max-height: 100%;
            min-height: 450px;
            position: relative;
            border-radius: 12px;
        }

        ::slotted(button) {
          cursor: pointer;
          padding: var(--spacing-s) var(--spacing-m);
          transition: 80ms ease opacity;
          border: none;
        }
        
        ::slotted(p) {
		    line-height: 1.2;
        }
        
        #content-wrapper, #dialog {
            display: flex;
            flex-direction: column;
        }
        
        #content-wrapper {
            padding: var(--spacing-m);
        }
        
        #content, #content-wrapper {
            flex-grow: 1;
        }
        
        #header, #footer {
          flex-shrink: 0;
        }
        
        #footer {
          display: flex;
          justify-content: flex-start;
          flex-direction: row-reverse;
        }
        
        #close {
            position: absolute;
            background: transparent;
            z-index: 123;
            border: none;
            top: var(--spacing-s);
            right: var(--spacing-s);
            font-size: 18px;
            cursor: pointer;
        }
      
	</style>
    <div id="dialog">
        <div id="header">
            <slot name="header"></slot>
        </div>
        <div id="content-wrapper">
            <div id="content">
                <slot name="content"></slot>
            </div>
            <div id="footer">
                <slot name="footer"></slot>
            </div>
        </div>
        <slot></slot>
        <button id="close">&#x2715;</button>
    </div>
`;

export class PopupDialog extends HTMLElement {

    /**
     * Hooks up the element.
     */
    constructor() {
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));
        this.addEventListener("close", () => this.close());
        this.shadowRoot.querySelector("#close").addEventListener("click", () => this.close());
    }

    /**
     * Closes the dialog.
     */
    close() {
        this.remove();
    }
}

customElements.define("popup-dialog", PopupDialog);
