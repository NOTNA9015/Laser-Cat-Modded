import {createHTML, defineCustomElement,} from "./util.js";

const template = document.createElement("template");
template.innerHTML = createHTML(`
  <style>
    :host {
       width: 80px;
       contain: layout style paint;
    }
    
    .flame {
       animation: wobble var(--fire-duration, 2s) linear infinite;
    }
    
    #flame-1 {
      animation-duration: calc(var(--fire-duration, 2s) * 2);
    }
    
    #flame-2 {
      animation-duration: calc(var(--fire-duration, 2s) * 1.7);
    }
    
    #flame-3 {
      animation-duration: calc(var(--fire-duration, 2s) * 1.2);
    }
    
    #flame-4 {
      animation-duration: calc(var(--fire-duration, 2s) * 1.5);
    }
    
    #flame-5 {
      animation-duration: calc(var(--fire-duration, 2s) * 0.8);
    }
    
    @keyframes fly {
        0% {
            transform: translate(0) rotate(180deg);
        }
        50% {
            opacity: 1;
        }
        100% {
            transform: translate(-20px, -100px) rotate(180deg);
            opacity: 0;
        }
    }
    
    @keyframes wobble {
        50% {
            transform: scale(1, 1.15) translate(0, -28px) rotate(-2deg);
        }
    }
  </style>
  <div class="spark"></div>
<svg id="fire" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 440 627" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(92 54)" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <path class="flame" d="M112.936 519.08C241.955 506.296 302.37 365.173 217.95 219.126 161.67 121.761 91.29 48.938 6.81.658c65.023 105.849 84.394 184.624 58.115 236.325-18.119 35.648-81.01 294.883 48.01 282.098Z" id="flame-1" fill="#F36E22"/>
    <path class="flame" d="M50.868 499.58c45.405 0 51.47-156.024 32.758-230.105-12.474-49.387-34.186-95.44-65.133-138.161 14.713 61.564 12.86 115.18-5.561 160.85C-14.7 360.666 5.462 499.58 50.868 499.58Z" id="flame-2" fill="#F36E22"/>
    <path class="flame" d="M107.19 422.775c-5.691-62.75 9.385-91.046 37.659-149.884 18.849-39.225 15.54-85.856-9.924-139.891 60.37 107.282 91.739 183.896 94.104 229.842 2.366 45.946-22.309 88.762-74.024 128.449-28.082-3.844-44.02-26.682-47.815-68.516Z" id="flame-3" fill="#FFD04A"/>
    <path class="flame" d="M118.456 493.078c24.067-26.982-29.498-160.55-30.167-162.468-7.628-21.89-21.652-62.614-42.07-122.17-16.007 85.046-20.567 149.504-13.683 193.373 10.327 65.803 55.523 125.345 85.92 91.265Z" id="flame-4" fill="#FEBA17"/>
    <path class="flame" d="M173.363 470.424c-9.028-61.514-11.527-110.744-7.498-147.692 4.03-36.947 17.813-91.19 41.351-162.732-.714 25.506-.714 40.201 0 44.085 1.072 5.825 20.572 54.94 23.89 82.867 3.32 27.928 9.995 40.314-14.81 94.07-16.537 35.837-30.847 65.638-42.933 89.402Z" id="flame-5" fill="#FEBA17"/>
  </g>
</svg>


`);

export class Fire extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));
    }
}

defineCustomElement("laser-cat-fire", Fire);
