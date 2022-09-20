import { CLIENT_HEADER } from "../../shared/headers";
import { ITEM, Items } from "../../shared/Item";
import { uiScene } from "./GameClient";
import { mSprite } from "./Renderer";
import { flushStream, outStream } from "./Socket";
import { Sprites } from "./Sprites";

const craftSprites: mSprite[] = []

function canAfford(inventory: [number, number][], itemId: number, quantity: number) {
    for (let i = 0; i < inventory.length; i++) {
        const invItemId = inventory[i][0];
        const invItemQnty = inventory[i][1];

        if (invItemId === itemId && invItemQnty >= quantity) {
            return true;
        }
    }

    return false;
}

function canCraft(inventory: [number, number][], receipe: [number, number][]) {
    for (let i = 0; i < receipe.length; i++) {
        if (!canAfford(inventory, receipe[i][0], receipe[i][1])) return false;
    }

    return true;
}


const weakMap = new WeakSet();
let kek = 0;
export function Inventory_calculateCraftable(inventory: [number, number][]) {
    for (let i = 0; i < craftSprites.length; i++) {
        const sprite = craftSprites[i];
        uiScene.remove(sprite);
    }

    craftSprites.length = 0;

    const maxPerHeight = 3;
    const padding = 10;
    const gap = 5;
    let i = 0;
    for (let KEY in ITEM) {
        const itemId = ITEM[KEY];
        const item = Items[itemId];
        const receipe = item.craftFrom;
        if (receipe) {
            if (canCraft(inventory, receipe)) {
                const sprite = new mSprite(Sprites[item.inventorySprite]);
                sprite.position.x = padding + Math.floor((i / maxPerHeight)) * (sprite.frame.size.x * sprite.frame.scale.x + gap);
                sprite.position.y = padding + (i % maxPerHeight) * (sprite.frame.size.x * sprite.frame.scale.x + gap);

                uiScene.add(sprite);
                craftSprites.push(sprite);
                i++;

                sprite.onclick = () => {
                    outStream.writeU8(CLIENT_HEADER.CRAFT);
                    outStream.writeU8(itemId);
                    flushStream();
                }
            }
        }
    }
}