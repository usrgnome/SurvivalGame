import { CLIENT_HEADER } from "../../../shared/headers";
import { ITEM, Items } from "../../../shared/Item";
import { SPRITE } from "../../../shared/Sprite";
import { renderer } from "../GameClient";
import { mBufferCanvas, mNode, mSprite, mText } from "../Renderer";
import { flushStream, inStream, outStream } from "../Socket";
import { Sprite, Sprites } from "../Sprites";

const root: mNode = new mNode();
const icons: mSprite[] = [];
const totalSlots: number = 10;
const slotIndexLabels: mText[] = [];
const slotQuantityLabels: mText[] = [];
const gap = 10;
const fontName = `"Baloo Paaji", Verdana, sans-serif`;

class Bar {
  root: mNode = new mNode();
  bar: mSprite = new mSprite(Sprites[SPRITE.COLD_BAR]);
  fillSprite = new mBufferCanvas();
  fill: number = 1;
  // TODO, add the bar fill, whether should be a image or a buffer geometry

  constructor(spriteId: number, fillColor: string) {
    this.bar.frame = Sprites[spriteId];

    this.fillSprite.resize(270, 40);
    const ctx = this.fillSprite.getCtx();
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, this.fillSprite.frame.size.x, this.fillSprite.frame.size.y);

    this.fillSprite.position.x = -this.bar.frame.size.x * .5 * this.bar.frame.scale.x + 30;
    this.fillSprite.position.y = -this.bar.frame.size.y * .5 * this.bar.frame.scale.y + 10;
    this.root.add(this.fillSprite);
    this.root.add(this.bar);
    this.setFill(.1);
  }

  setFill(fill: number) {
    this.fill = fill;
    this.fillSprite.scale.x = fill;
  }

  setPosition(x: number, y: number) {
    this.root.position.x = x;
    this.root.position.y = y;
  }
}

export const temperateBar = new Bar(SPRITE.COLD_BAR, "blue");
export const hungerBar = new Bar(SPRITE.FOOD_BAR, "red");
export const healthBar = new Bar(SPRITE.HEALTH_BAR, "green");

root.add(temperateBar.root);
root.add(hungerBar.root);
root.add(healthBar.root);


for (let i = 0; i < totalSlots; i++) {
  const sprite = new mSprite(Sprites[SPRITE.SLOT]);
  icons.push(sprite);
  root.add(sprite);

  const indexLabel = new mText("" + (i + 1), {
    fontSize: 25,
    fontFamily: fontName,
    fill: "white",
    align: "left",
    baseLine: "top",
  });

  const quantityLabel = new mText("", {
    fontSize: 25,
    fontFamily: fontName,
    fill: "white",
    align: "right",
    baseLine: "top",
  });

  sprite.onclick = () => {

    outStream.writeU8(CLIENT_HEADER.INVENTORY);
    outStream.writeU8(i);
    flushStream();

  };

  indexLabel.position.x = 10;
  indexLabel.position.y = 10;
  indexLabel.visible = false;

  quantityLabel.position.x = 70;
  quantityLabel.position.y = 80;
  quantityLabel.visible = false;

  sprite.add(indexLabel);
  sprite.add(quantityLabel);

  slotIndexLabels.push(indexLabel);
  slotQuantityLabels.push(quantityLabel);
}

function reposition() {
  const firstIcon = icons[0];
  let totalWidth = totalSlots * (firstIcon.frame.size.x * firstIcon.frame.scale.x + gap);

  const y = renderer.scaledHeight - firstIcon.frame.size.y * firstIcon.frame.scale.y - 5;

  const x = renderer.scaledWidth * .5 - totalWidth * .5;
  root.position.y = y;

  for (let i = 0; i < totalSlots; i++) {
    const icon = icons[i];
    icon.position.y = 0
    icon.position.x = x + i * (icon.frame.size.x * icon.frame.scale.x + gap);
  }

  const barGap = 50;
  const height = -50;
  healthBar.root.position.x = renderer.scaledWidth * .5 - temperateBar.bar.frame.size.x * temperateBar.bar.frame.scale.x - barGap;
  healthBar.root.position.y = height;
  temperateBar.root.position.x = renderer.scaledWidth * .5;
  temperateBar.root.position.y = height;
  hungerBar.root.position.x = renderer.scaledWidth * .5 + temperateBar.bar.frame.size.x * temperateBar.bar.frame.scale.x + barGap;
  hungerBar.root.position.y = height;
}

function updateSlot(slotIndex: number, itemId: number, quantity: number) {
  if (itemId === ITEM.NONE || quantity === 0) {
    quantity = 0;
    itemId = ITEM.NONE;
    slotQuantityLabels[slotIndex].visible = false;
    slotIndexLabels[slotIndex].visible = false;
  } else {
    slotQuantityLabels[slotIndex].visible = true;
    slotIndexLabels[slotIndex].visible = true;
    slotQuantityLabels[slotIndex].updateText("x" + quantity);
  }

  icons[slotIndex].frame = Sprites[Items[itemId].inventorySprite];
}

updateSlot(3, 0, 0);

export const Hotbar_root = root;
export const Hotbar_reposition = reposition;
export const Hotbar_updateSlot = updateSlot;