import { SPRITE } from "../../../shared/Sprite";
import { mNode, mSprite } from "../Renderer";
import { Sprites } from "../Sprites";

export class HealthBar {
  backgroundColor = new mSprite(Sprites[SPRITE.HEALTH_BAR_BG_COLOR]);
  border = new mSprite(Sprites[SPRITE.HEALTH_BAR_BAR_BORDER]);
  color = new mSprite(Sprites[SPRITE.HEALTH_BAR_BAR_COLOR]);
  root = new mNode();

  constructor() {
    this.root.add(this.backgroundColor);
    this.root.add(this.color);
    this.root.add(this.border);
    this.color.position.x = -this.backgroundColor.frame.anchor.x * this.backgroundColor.frame.scale.x + 5;
  }

  setHealth(health: number) {
    this.color.scale.x = health;
  }
}