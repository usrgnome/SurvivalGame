import { SPRITE } from "../../../shared/Sprite";
import { mNode, mSprite } from "../Renderer";
import { Sprites } from "../Sprites";
import { Entity } from "./Entity";


export class MobEntity extends Entity {
  root = new mNode;
  doInterpolation: boolean = true;
  doUpdate: boolean = true;

  constructor(type: number) {
    super(type);
    this.root.add(new mSprite(Sprites[SPRITE.WOLF]));
  }
}