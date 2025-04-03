// If you find this code, please don't share it with anyone :-) But since you took the time to look
// through my code you are welcome to upgrade for free! <3 Have a great day.
export const SUPER_SECRET_CODE_DO_NOT_SHARE = btoa("0C\x96");

export const POINTS_BEFORE_REWARD = 0;
export const UNLOCKED_CHARACTERS_BEFORE_REWARD = 0;
export const AUTO_PEEK_MS = 2000;
export const TOP_Z_INDEX = 2147483647;
export const ALIVENESS_CHECK_MAX_TRIES = 4;
export const CHARACTERS = {
    cat: {
        id: "cat",
        name: "catName",
        description: "catDesc",
        buyable: false,
    },
    ninja: {
        id: "ninja",
        name: "ninjaName",
        description: "ninjaDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
    frog: {
        id: "frog",
        name: "frogName",
        description: "frogDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
    dog: {
        id: "dog",
        name: "dogName",
        description: "dogDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
    unicorn: {
        id: "unicorn",
        name: "unicornName",
        description: "unicornDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
    alien: {
        id: "alien",
        name: "alienName",
        description: "alienDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
    dino: {
        id: "dino",
        name: "dinoName",
        description: "dinoDesc",
        buyable: true,
        pointsPrice: 0,
        reward: true, 
    },
};

export const DEFAULT_CHARACTER = CHARACTERS.cat;

export const INDESTRUCTIBLE_ATTRIBUTE_NAME = "data-laser-cat-indestructible";
export const INDESTRUCTIBLE_TAG_NAMES = [
    // Elements
    "HTML",
    "BODY",
    "HEAD",
    "STYLE",
    "SCRIPT",

    // Laser Cat elements
    "LASER-CAT-APP",
    "LASER-CAT-FIRE",
    "LASER-CAT-EYE",
    "LASER-CAT-RAINBOW",
    "LASER-CAT-ASTEROID",

    // Characters
    "LASER-CAT",
    "ANGRY-ALIEN",
    "HUNGRY-FROG",
    "CALM-DOG",
    "FABULOUS-UNICORN",
    "EXTINCT-DINO",
    "SECRET-NINJA",
]

export const STORAGE_KEYS = {
    settings: "settings",
    points: "points",
    unlockedCharacters: "unlockedCharacters",
    hasAllCharacters: "hasAllCharacters",
    hasUnlockedReward: "hasUnlockedReward",
    webStorePurchases: "webStorePurchases"
}
