import { ITEM, Items } from "../../../shared/Item";
import { assert } from "../server/ServerUtils";
import { C_Inventory, maxIventorySize } from "./ECS/Components"
import { NULL_ENTITY } from "./ECS/EntityFactory";

const NONE = 0;

export function Inventory_indexOfItem(entity: number, itemIdToSearchFor: number) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemIdToSearchFor && quantity > 0) return i / 2;
  }

  return -1;
}

export function Inventory_canAddItem(entity: number, itemIdToInsert, insertQuantity: number = 0): boolean {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemIdToInsert && quantity + insertQuantity < 0xffff) return true;
    if (itemId === NONE) return true;
  }

  return false
}

export function Inventory_tryGiveItem(entity: number, itemToAdd: number, quantityToAdd: number) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemToAdd && quantity + quantityToAdd < 0xffff) {
      ar[i + 1] += quantityToAdd;
      return true;
    } else if (itemId === NONE) {
      ar[i + 0] = itemToAdd;
      ar[i + 1] = quantityToAdd;
      return true;
    }
  }

  return false
}

export function Inventory_hasItem(entity: number, itemIdToSearchFor: number, quantityToSearchFor: number) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemIdToSearchFor && quantity >= quantityToSearchFor) return true;
  }
}

export function Inventory_removeStack(entity: number, itemIdToSearchFor: number) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemIdToSearchFor) {
      ar[i + 0] = NONE;
      ar[i + 1] = NONE;
      return quantity;
    }
  }

  return 0;
}

export function Inventory_removeItem(entity: number, itemIdToSearchFor: number, quantityToRemove = 1) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i += 2) {
    const itemId = ar[i + 0];
    const quantity = ar[i + 1];
    if (itemId === itemIdToSearchFor) {
      const newQuantity = Math.max(quantity - quantityToRemove, 0);

      if (newQuantity === 0) {
        ar[i + 0] = NONE;
        ar[i + 1] = NONE;
        return true;
      } else {
        ar[i + 1] = newQuantity;
        return true;
      }
    }
  }

  return false;
}

export function Inventory_reset(entity: number) {
  const ar = C_Inventory.items[entity];
  for (let i = 0; i < ar.length; i++) ar[i] = NONE;
}

export function Inventory_isFull(entity: number){
  const items = C_Inventory.items[entity];
  const quantities = C_Inventory.quantities[entity];
  for(let i = 0; i < maxIventorySize; i++){
    const itemId = items[i];
    const quantity = quantities[i];

    if(itemId === ITEM.FIST || quantity === 0){
      return false;
    }
  }

  return true;
}

export function Inventory_craftItem(entity: number, itemId: number){
  assert(itemId in Items, "Inventory_canCraftItem: Invalid item id");
  assert(entity !== NULL_ENTITY && Number.isInteger(entity), "Inventory_canCraft invalid entity id");

  if(Inventory_canAddItem(entity, itemId, 1)){
    Inventory_tryGiveItem(entity, itemId, 1);
    return true;
  }

  return false;
}