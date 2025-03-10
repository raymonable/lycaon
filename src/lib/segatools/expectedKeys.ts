/*

Put down expected keys here in their respective column.
If wrapped in an array, it signifies it is optional.

Some keys may be missing! Please help out by adding them.

*/

export type SegatoolsValue = "path" | "number" | "string" | "boolean" | "keycode"; // boolean is 0 or 1

export const expectedKeys = {
    vfs: {
        "amfs": ["path"],
        "option": ["path"],
        "appdata": ["path"]
    },
    aime: {
        "enable": "boolean",
        "aimePath": ["path"],
        "highBaud": ["boolean"],
        "felicaGen": ["boolean"]
    },
    vfd: {
        "enable": "boolean"
    },
    dns: {
        "default": "string"
    },
    keychip: {
        "enable": "boolean",
        "id": ["string"],
        "subnet": ["string"] // not adding a type for ip addresses
    },
    netenv: {
        "enable": "boolean"
    },
    system: {
        "enable": "boolean",
        "freeplay": "boolean",
        "dipsw1": "boolean",
        "dipsw2": "boolean",
        "dipsw3": "boolean",
    },
    gfx: {
        "windowed": "boolean",
        "framed": "boolean",
        "monitor": "number"
    },
    "led15093": {
        "enable": "boolean"
    },
    led: {
        "cabLedOutputPipe": "boolean",
        "cabLedOutputSerial": "boolean",
        "controllerLedOutputPipe": "boolean",
        "controllerLedOutputSerial": "boolean"
    },
    aimeio: {
        "path": "path"
    },
    chuniio: {
        "path": ["path"],
        "path32": ["path"],
        "path64": ["path"]
    },
    io3: {
        "test": "keycode",
        "service": "keycode",
        "coin": "keycode",
        "ir": "keycode"
    },
    ir: {
        "ir1": ["keycode"],
        "ir2": ["keycode"],
        "ir3": ["keycode"],
        "ir4": ["keycode"],
        "ir5": ["keycode"],
        "ir6": ["keycode"],
    },
    slider: {
        "enable": "boolean",
    }
} as Record<string, Record<string, SegatoolsValue | SegatoolsValue[]>>
for (let idx = 1; 32 >= idx; idx++)
    expectedKeys.slider[`cell${idx}`] = ["keycode"];