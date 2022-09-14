import { mNode, mText } from "../Renderer";

export const debugInfo = new mNode();

const fontName = `"Baloo Paaji", Verdana, sans-serif`;

const someText = new mText("DEBUG BUILD", {
    fontSize: 25,
    fontFamily: fontName,
    fill: "black",
    align: "left",
    baseLine: "top",
});

export function Debug_update() {

}

export function Debug_init() {
    debugInfo.add(someText);
    someText.position.x = 100;
    someText.position.y = 10;
}