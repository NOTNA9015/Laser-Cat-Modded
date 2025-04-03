import {defineCustomElement, createHTML} from "./util.js";
import {TOP_Z_INDEX} from "../config.js";

const template = document.createElement("template");
template.innerHTML = createHTML(`
	<style>
    :host {
      overflow: hidden;
			display: block;
			transform: translateX(-37%);
			overflow: hidden;
			display: block;
			width: 650px;
			z-index: ${TOP_Z_INDEX};
			position: fixed;
			bottom: 0;
    }

    :host([show]) #rainbow {
      transform: translateY(4px) rotate(180deg);
    }

    #rainbow {
      width: 100%;
      transform-origin: bottom center;
      transform: translateY(4px) rotate(-180deg);
      transition: transform linear 3000ms;
    }
  </style>
  <svg id="rainbow" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" version="1" viewBox="0 0 40 20">
    <g id="oval-group" fill="none" fill-rule="evenodd">
      <circle class="oval" cx="20" cy="20" r="14" stroke="#000083" stroke-width="2"/>
      <circle class="oval" cx="20" cy="20" r="19" stroke="#D00" />
      <circle class="oval" cx="20" cy="20" r="18" stroke="#FE6230"/>
      <circle class="oval" cx="20" cy="20" r="17" stroke="#FEF600"/>
      <circle class="oval" cx="20" cy="20" r="16" stroke="#0B0"/>
      <circle class="oval" cx="20" cy="20" r="15" stroke="#009BFE"/>
    </g>
  </svg>
`);

export class Rainbow extends HTMLElement {

    /** Whether the rainbow is shown */
    set show(value) {
        value ? this.setAttribute("show", "") : this.removeAttribute("show");
    }

    get show() {
        return this.hasAttribute("show");
    }

    connectedCallback() {
        // SHOULD BE IN THE CONSTRUCTOR (START)
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));

        // Listen for when the transition ends so we can redispatch it
        shadow.querySelector("#rainbow").addEventListener("transitionend", () => {
            this.dispatchEvent(new CustomEvent("transitionend"));
        });
        // SHOULD BE IN THE CONSTRUCTOR (END)
    }
}

defineCustomElement("laser-cat-rainbow", Rainbow);