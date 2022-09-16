import { GameClient_clearWorld, GameClient_entities, NULL_ENTITY, ourEid } from "../GameClient";
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

const positionText = new mText("0, 0", {
    fontSize: 25,
    fontFamily: fontName,
    fill: "black",
    align: "left",
    baseLine: "top",
});

const pingText = new mText("WAITINGms", {
    fontSize: 25,
    fontFamily: fontName,
    fill: "black",
    align: "left",
    baseLine: "top",
});

export function Debug_update() {
    if(ourEid !== NULL_ENTITY){
        const entity = GameClient_entities.find(ourEid);
        if(entity)
            positionText.updateText(`${Math.floor(entity.root.position.x)} ${Math.floor(entity.root.position.y)}`);
    }
}

export function Debug_updateServerVersion(a: number, b: number, c: number){
    someText.updateText(`SERVER VERSION: ${a}.${b}.${c}`);
}

export function Debug_updatePing(ping: number){
    pingText.updateText(ping + "ms");
}

export function Debug_init() {
    debugInfo.add(someText);
    debugInfo.add(positionText);
    debugInfo.add(pingText);
    someText.position.x = 100;
    someText.position.y = 10;
    positionText.position.x = 100;
    positionText.position.y = 10 + someText.frame.size.y;
    pingText.position.x = 100;
    pingText.position.y = positionText.position.y + positionText.frame.size.y;
}