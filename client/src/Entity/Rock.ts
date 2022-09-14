import { SPRITE } from "../../../shared/Sprite";
import { mSprite } from "../Renderer";
import { Sprites } from "../Sprites";
import { HitAnimatedEntity } from "./Tree";


export class RockEntity extends HitAnimatedEntity {
  constructor(type: number) {
    super(type);
    this.sprite = new mSprite(Sprites[SPRITE.STONE]);
    this.root.add(this.sprite);
  }
}