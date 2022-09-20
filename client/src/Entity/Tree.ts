import { SPRITE } from "../../../shared/Sprite";
import { mNode, mSprite } from "../Renderer";
import { Sprites } from "../Sprites";
import { Entity } from "./Entity";

export class HitAnimatedEntity extends Entity {
  root = new mNode();
  // @ts-ignore
  sprite: mNode = null;
  hitX = 0;
  hitY = 0;
  hitAnimtionTime = .2;
  hitTimer = this.hitAnimtionTime;
  hit: boolean = false;

  setHit(x: number, y: number){
    this.hitX = x;
    this.hitY = y;
    this.hit = true;
    this.doUpdate = true;
  }

  update(delta: number) {
    if (this.hit) {
      this.hitTimer -= delta;
      if (this.hitTimer <= 0) {
        this.sprite.position.x = 0;
        this.sprite.position.y = 0;
        this.hitTimer = this.hitAnimtionTime;
        this.hit = false;
        this.doUpdate = false;
      } else {
        const t = 1 - this.hitTimer / this.hitAnimtionTime;
        const val = t > .5 ? 1 - t : t;
        this.sprite.position.x = -this.hitX * val;
        this.sprite.position.y = -this.hitY * val;
      }
    }
  }
}

export class TreeEntity extends HitAnimatedEntity {
  constructor(type: number) {
    super(type);
    this.sprite = new mSprite(Sprites[SPRITE.TREE]);
    this.root.add(this.sprite);
  }
}

export class BushEntity extends HitAnimatedEntity {
  constructor(type: number) {
    super(type);
    this.sprite = new mSprite(Sprites[SPRITE.BUSH]);
    this.root.add(this.sprite);
  }
}