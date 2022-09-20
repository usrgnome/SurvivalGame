import { SPRITE } from "../../../shared/Sprite";
import { worldLayer1 } from "../GameClient";
import { mSprite } from "../Renderer";
import { Sprites } from "../Sprites";
import AABB from "./AABB";
import { HashMap } from "./HashMap";

class Decoration {
  _hash_index: number = -1;
  _hash_grids: { [key: string]: number } = {};
  _hash_need_update: boolean = true;
  sprite: mSprite;

  dirty: boolean = true;
  aabb = new AABB<Decoration>();
  x: number = 0;
  y: number = 0;

  constructor(spriteId: number) {
    this.sprite = new mSprite(Sprites[spriteId]);
    this.sprite.visible = false;
    this.sprite.setDepth(0);
  }

  getAABB() {
    if (this.dirty) {
      this.aabb.minX = this.x - 10;
      this.aabb.maxX = this.x + 10;
      this.aabb.minY = this.y - 10;
      this.aabb.maxY = this.y + 10;
      this.dirty = false;
    }

    return this.aabb;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite.position.x = x;
    this.sprite.position.y = y;
    this.dirty = true;
  }
}

const decorationMap = new HashMap<Decoration>();


let decorations: Decoration[] = [];
const aabb = new AABB<Decoration>();

export function activeVisibleDecorations(x: number, y: number, viewWidth: number, viewHeight: number) {
  aabb.minX = x - viewWidth * .5;
  aabb.minY = y - viewHeight * .5
  aabb.maxX = x + viewWidth * .5
  aabb.maxY = y + viewHeight * .5;

  decorations = decorationMap.search(aabb);

  for (let i = 0; i < decorations.length; i++) {
    decorations[i].sprite.visible = true;
  }
}

export function deactiveVisibleDecorations() {
  for (let i = 0; i < decorations.length; i++) {
    decorations[i].sprite.visible = false;
  }

  decorations.length = 0;
}


const decorationSprites = [
  SPRITE.FLOWER0,
  SPRITE.FLOWER1,
  SPRITE.FLOWER2,
  SPRITE.FLOWER3,
  SPRITE.FLOWER4,
  SPRITE.FLOWER5,
  SPRITE.FLOWER6,
  SPRITE.FLOWER7,
  SPRITE.FLOWER8,
  SPRITE.FLOWER9,
  SPRITE.FLOWER10,
]

export function initDecoration() {
  const range = 10000;
  for (let i = 0; i < 1000; i++) {
    const decor = decorationSprites[Math.floor(Math.random() * decorationSprites.length)];
    const decoration = new Decoration(decor);
    decoration.setPosition(Math.random() * range, Math.random() * range);
    decorationMap.insert(decoration);
    worldLayer1.add(decoration.sprite);
  }
}

export function addDecoration(x: number, y: number, type: number) {
  const decoration = new Decoration(type);
  decoration.sprite.rotation = Math.random() * Math.PI * 2;
  decoration.setPosition(x, y);
  decorationMap.insert(decoration);
  worldLayer1.add(decoration.sprite);
}