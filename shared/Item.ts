import { SPRITE } from "./Sprite";
import { ANIMATION } from "./AnimationConfig";

interface IItem {
  id: number;
  isStructure: boolean;
  isConsumable: boolean;
  isEquipable: boolean;
  isTool: boolean;
  spriteId: number;
  inventorySprite: number;
}

export interface IStructureItem extends IItem {
  isStructure: true,
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
  anim: IAnim;
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
  useDelay: 100,
  useCooldown: 200,
  inventorySprite: SPRITE.INV_SPEAR_SLOT,
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
  useDelay: 100,
  useCooldown: 200,
  isMeele: true,
  meeleRange: 100,
  meeleDamage: 7,
  sweepAngle: Math.PI * .4,
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
  isConsumable: false,
  id: ITEM.WOOD_WALL,
  spriteId: SPRITE.WALL,
  inventorySprite: SPRITE.WALL,
})