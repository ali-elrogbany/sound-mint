export const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function ipfsToHttp(uri) {
    if (!uri || typeof uri !== "string") return uri;
    if (uri.startsWith("ipfs://")) {
        return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
    }
    if (uri.startsWith("/ipfs/")) {
        return `https://gateway.pinata.cloud${uri}`;
    }
    return uri;
}

export function bpmLabel(bpm) {
    if (bpm < 80) return "Slow";
    if (bpm < 120) return "Moderate";
    if (bpm < 160) return "Fast";
    return "Hyperspeed";
}

export function energyLabel(energy) {
    if (energy < 85) return "Low";
    if (energy < 170) return "Medium";
    return "High";
}

export function brightnessLabel(brightness) {
    if (brightness < 85) return "Dark";
    if (brightness <= 168) return "Mid";
    return "Bright";
}
