let isYolo = false;
let isPlainText = false;

export function setYolo(yolo: boolean) { isYolo = yolo; }
export function getIsYolo() { return isYolo; }

export function setPlainText(plainText: boolean) { isPlainText = plainText; }
export function getIsPlainText() { return isPlainText; }
