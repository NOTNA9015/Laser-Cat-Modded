export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min, max) {
    return Number((Math.random() * (max - min) + min).toFixed(4));
}

/**
 * Returns either a 1 or a 0.
 * @returns {number}
 */
export function coinToss() {
    return Math.round(Math.random());
}

const template = document.createElement("template");
template.innerHTML = `
<style>
    :host {
        --green: #41FFCF;
        --yellow: #FBFA39;
        --red: #E24E25;
        --pink: #EF45A4;
        --blue: #0EAEFB;
        --blue-dark: #3626F6;
        --colors: var(--green) var(--yellow) var(--red) var(--pink) var(--blue) var(--blue-dark);
        display: block;
        position: relative;
        overflow: hidden;
        will-change: transform, top, left;
    }
    .dot {
        border-radius: 100%;
        position: absolute;
        animation-duration: 60000ms;
    }
    .dot:after {
        content: "";
        width: 100%;
        height: 100%;
        border-radius: 100%;
        position: absolute;
        background: currentColor;
        animation-duration: inherit;
        animation-delay: inherit;
        animation-timing-function: ease-in-out;
    }
    .dot.type-1:after {
        animation-name: originAnimation1;
    }
    .dot.type-2:after {
        animation-name: originAnimation2;
    }
    
    @keyframes originAnimation1 {
        0% {
            transform: translate3d(0px, 0px, 0px);
        }
        10% {
            transform: translate3d(0px, -100%, 0px);
        }
        30% {
            transform: translate3d(-40%, 0px, 0px);
        }
        65% {
            transform: translate3d(30%, 0px, 0px);
        }
        100% {
            transform: translate3d(0px, 0px, 0px);
        }
    }
    
    @keyframes originAnimation2 {
        0% {
            transform: translate3d(0px, 0px, 0px) ;
        }
        15% {
            transform: translate3d(0px, -50%, 0px);
        }
        35% {
            transform: translate3d(40%, 0px, 0px);
        }
        75% {
            transform: translate3d(-70%, 0px, 0px);
        }
        100% {
            transform: translate3d(0px, 0px, 0px);
        }
    }
</style>
`;

export class ConfettiSpray extends HTMLElement {

    get width() {
        return this.shadowRoot.host.clientWidth;
    }

    get height() {
        return this.shadowRoot.host.clientHeight;
    }

    constructor() {
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        setTimeout(() => {
            this.spray(30);
        }, 100);

        setInterval(() => {
            if (document.hidden) return;
            this.spray(30);
        }, 1500);
    }

    spray(count) {
        for (let i = 0; i <= count; i++) {
            this.spawnRandomConfettiThing();
        }
    }

    spawnRandomConfettiThing() {
        const size = this.getRandomSize();
        const color = this.getRandomColor();
        const isDirectionRight = (coinToss() === 1);
        const startX = isDirectionRight ? 0 : (this.width - size);
        const startY = getRandomFloat(10, 80);
        const duration = 2500 + (100 * (size / 10));
        this.addConfettiThing({size, color, startX, startY, isDirectionRight, duration});
    }

    addConfettiThing({
                         size,
                         color,
                         startX,
                         startY,
                         isDirectionRight,
                         duration
                     }) {
        const dot = document.createElement("div");
        dot.className = `dot type-${coinToss()}`;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.color = `${color}`;
        dot.style.left = `${startX}px`;
        dot.style.top = `${startY}px`;
        dot.style.animationDuration = `${duration}ms`;
        this.shadowRoot.appendChild(dot);

        // const middleXOffsetMin = 30;
        const middleXOffset = this.width / 2.5;
        const halfWidth = this.width / 2;
        const middleX = getRandomFloat(halfWidth, halfWidth - middleXOffset);
        const middleYMaxOffsetTop = this.height / 10;
        const middleYMaxOffsetBottom = this.height / 3;
        const middleY = getRandomFloat(startY - middleYMaxOffsetTop, startY + middleYMaxOffsetBottom);

        const endXMaxOffsetRight = this.width / 10;
        const endXMaxOffsetLeft = this.width / 10;
        const endX = getRandomFloat(middleX - endXMaxOffsetLeft, middleX + endXMaxOffsetRight);
        const endY = this.height;

        const negatePrefix = `${isDirectionRight ? "" : "-"}`;

        const animation = dot.animate(
            [
                {transform: `translate3d(0, 0, 0)`, offset: 0},
                {transform: `translate3d(${negatePrefix}${middleX}px, ${middleY}px, 0)`, offset: 0.3},
                {transform: `translate3d(${negatePrefix}${endX}px, ${endY}px, 0)`, offset: 1}
            ],
            {
                duration,
                iterations: 1,
                easing: `cubic-bezier(0.045, 0.550, 1.000, 1.000)`,
            }
        );

        animation.onfinish = () => {
            dot.remove();
        };
    }

    getColors() {
        return getComputedStyle(this.shadowRoot.host).getPropertyValue("--colors").split(" ");
    }

    getRandomColor() {
        const colors = this.getColors().filter(color => color !== "");
        return colors[getRandomInt(0, colors.length - 1)];
    }

    getRandomSize() {
        return getRandomInt(5, 15);
    }
}

window.customElements.define("confetti-spray", ConfettiSpray);