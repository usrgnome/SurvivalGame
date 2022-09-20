import { SPRITE } from "./Sprite";
import { ANIMATION } from "./AnimationConfig";
import { types } from "./EntityTypes";

interface IItem {
  id: number;
  isStructure: boolean;
  isConsumable: boolean;
  isEquipable: boolean;
  isTool: boolean;
  spriteId: number;
  inventorySprite: number;
  anim: IAnim;
  craftFrom?: [number, number][];
}

export interface IStructureItem extends IItem {
  isStructure: true,
  placedId: number;
}

export interface IEquipmentItem extends IItem {
  isEquipment: true,
}

export interface IConsumableItem extends IItem {
  isConsumable: true;
}

export interface IToolItem extends IItem {
  isTool: true;
  isMeele: boolean;
  meeleRange: number;
  meeleDamage: number;
  sweepAngle: number;
  useDelay: number,
  useCooldown: number,
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
  WOOD_WALL: 3, 
  STICKS: 4,
  STONE: 5,
  MEAT: 6,
}

export const Items: IItem[] = [];

function validateToolItem(toolItem: IToolItem){
  return toolItem;
}

function validateStructureItem(structureItem: IStructureItem){
  return structureItem;
}

Items[ITEM.FIST] = validateToolItem({
  isStructure: false,
  isTool: true,
  isEquipable: false,
  isConsumable: false,
  id: ITEM.FIST,
  spriteId: -1,
  useDelay: 100,
  useCooldown: 200,
  inventorySprite: SPRITE.SLOT,
  isMeele: true,
  meeleRange: 80,
  meeleDamage: 3,
  sweepAngle: Math.PI * .4,
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
});

Items[ITEM.SPEAR] = validateToolItem({
  isStructure: false,
  isTool: true,
  isEquipable: false,
  isConsumable: false,
  id: ITEM.SPEAR,
  spriteId: SPRITE.SPEAR,
  useDelay: 200,
  useCooldown: 400,
  inventorySprite: SPRITE.INV_SPEAR_SLOT,
  craftFrom: [[ITEM.STICKS, 6], [ITEM.STONE, 10]],
  isMeele: true,
  meeleRange: 160,
  meeleDamage: 14,
  sweepAngle: Math.PI * .4,
  anim: {
    idle: ANIMATION.IDLE_SWORD,
    move: ANIMATION.MOVE_SWORD,
    use: ANIMATION.USE_SWORD,
  }
});

Items[ITEM.SWORD] = validateToolItem({
  isStructure: false,
  isTool: true,
  isEquipable: false,
  isConsumable: false,
  id: ITEM.SWORD,
  spriteId: SPRITE.SWORD,
  inventorySprite: SPRITE.INV_SWORD_SLOT,
  useDelay: 200,
  useCooldown: 300,
  isMeele: true,
  meeleRange: 100,
  meeleDamage: 7,
  sweepAngle: Math.PI * .4,
  craftFrom: [[ITEM.STICKS, 5], [ITEM.STONE, 5]],
  anim: {
    idle: ANIMATION.IDLE_SWORD,
    move: ANIMATION.MOVE_SWORD,
    use: ANIMATION.USE_SWORD,
  }
});

Items[ITEM.WOOD_WALL] = validateStructureItem({
  isStructure: true,
  isTool: false,
  isEquipable: false,
  placedId: types.WALL,
  isConsumable: false,
  id: ITEM.WOOD_WALL,
  spriteId: SPRITE.WALL,
  inventorySprite: SPRITE.INV_WALL,
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
});

Items[ITEM.STICKS] = {
  isStructure: false,
  isTool: false,
  isEquipable: false,
  isConsumable: false,
  id: ITEM.STICKS,
  spriteId: -1,
  inventorySprite: SPRITE.INV_STICKS,
  craftFrom: [[ITEM.STICKS, 1]],
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
};

Items[ITEM.STONE] = {
  isStructure: false,
  isTool: false,
  isEquipable: false,
  isConsumable: false,
  id: ITEM.STONE,
  spriteId: -1,
  inventorySprite: SPRITE.INV_STONE,
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
};

Items[ITEM.MEAT] = {
  isStructure: false,
  isTool: false,
  isEquipable: false,
  isConsumable: true,
  id: ITEM.MEAT,
  spriteId: -1,
  inventorySprite: SPRITE.INV_MEAT,
  anim: {
    idle: ANIMATION.IDLE_FIST,
    move: ANIMATION.MOVE_FIST,
    use: ANIMATION.USE_FIST,
  }
};