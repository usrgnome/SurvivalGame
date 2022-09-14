import { SPRITE } from "./Sprite";
import { ANIMATION } from "./AnimationConfig";

interface IItem {
  id: number;
  spriteId: number;
  inventorySprite: number;
  anim: IAnim;
  useDelay: number,
  useCooldown: number,

  isMeele: boolean;
  meeleRange: number;
  meeleDamage: number;
}

interface IAnim {
  idle: number;
  use: number;
  move: number;
}

export const ITEM = {
  NONE: 0,
  FIST: 0,
  SWORD: 1,
  SPEAR: 2, 
}

export const Items: IItem[] = [];

Items[ITEM.FIST] = {
  id: ITEM.FIST,
  spriteId: -1,
  useDelay: 100,
  useCooldown: 200,
  inventorySprite: SPRITE.SLOT,
  isMeele: true,
  meeleRange: 100,
  meeleDamage: 30,
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
}

Items[ITEM.SPEAR] = {
  id: ITEM.SPEAR,
  spriteId: SPRITE.SPEAR,
  useDelay: 100,
  useCooldown: 200,
  inventorySprite: SPRITE.INV_SPEAR_SLOT,
  isMeele: true,
  meeleRange: 100,
  meeleDamage: 30,
  anim: {
    idle: ANIMATION.IDLE_SWORD,
    move: ANIMATION.MOVE_SWORD,
    use: ANIMATION.USE_SWORD,
  }
}

Items[ITEM.SWORD] = {
  id: ITEM.SWORD,
  spriteId: SPRITE.SWORD,
  inventorySprite: SPRITE.INV_SWORD_SLOT,
  useDelay: 100,
  useCooldown: 200,
  isMeele: true,
  meeleRange: 100,
  meeleDamage: 30,
  anim: {
    idle: ANIMATION.IDLE_SWORD,
    move: ANIMATION.MOVE_SWORD,
    use: ANIMATION.USE_SWORD,
  }
} 