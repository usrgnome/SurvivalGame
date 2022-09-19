import { SPRITE } from "../../shared/Sprite";
import { mSprite } from "./Renderer";
import { Sprites } from "./Sprites";

export function addParticle(x: number, y: number){
    const sprite = new mSprite(Sprites[SPRITE.FLOWER4]);
    sprite.position.x = x;
    sprite.position.y = y;
}