import { CLIENT_HEADER } from "../../../shared/headers";
import { ITEM, Items } from "../../../shared/Item";
import { SPRITE } from "../../../shared/Sprite";
import { lerp } from "../Animation/AnimUtils";
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

const temperatureBarType = 1;

class Bar {
  root: mNode = new mNode();
  bar: mSprite = new mSprite(Sprites[SPRITE.COLD_BAR]);
  fillSprite = new mBufferCanvas();
  fill: number = 1;
  targetFill: number = 1;
  type: number = 0;

  changeFill(fillColor: string) {
    const ctx = this.fillSprite.getCtx();
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, this.fillSprite.frame.size.x, this.fillSprite.frame.size.y);
  }
  // TODO, add the bar fill, whether should be a image or a buffer geometry

  constructor(spriteId: number, fillColor: string, fillOffsetX: number = 0, fillOffsetY: number = 0) {
    this.bar.frame = Sprites[spriteId];

    this.fillSprite.resize(270, 40);
    this.changeFill(fillColor);

    this.fillSprite.position.x = -this.bar.frame.size.x * .5 * this.bar.frame.scale.x + 30 + fillOffsetX;
    this.fillSprite.position.y = -this.bar.frame.size.y * .5 * this.bar.frame.scale.y + 10 + fillOffsetY;
    this.root.add(this.fillSprite);
    this.root.add(this.bar);
    this.setFill(.1);
  }

  _setFill(fill: number) {
    this.fill = this.targetFill = fill;
  }

  setFill(fill: number) {
    this.targetFill = fill;
  }

  setPosition(x: number, y: number) {
    this.root.position.x = x;
    this.root.position.y = y;
  }

  update(deltaMs: number) {
    this.fill = lerp(this.fill, this.targetFill, deltaMs);
    this.fillSprite.scale.x = this.fill;

    if (this.type === temperatureBarType) {
        this.changeFill(lerpColor('#47a1b4', '#eb4334', this.fill));
      //if (this.fill === 0.5)
        //this.changeFill("#aeeb34");
      //else if (this.fill > 0.5)
        //this.changeFill(lerpColor('#aeeb34', '#eb4334', (this.fill - 0.5) * 2));
      //else
        //this.changeFill(lerpColor('#aeeb34', '#349beb', 1 - (this.fill) * 2));
    }
  }
}

export const temperateBar = new Bar(SPRITE.COLD_BAR, "blue", -5);
export const hungerBar = new Bar(SPRITE.FOOD_BAR, "#b53217", -4, 4);
export const healthBar = new Bar(SPRITE.HEALTH_BAR, "#62a859", 1, -5);

temperateBar.type = temperatureBarType;

root.add(temperateBar.root);
root.add(hungerBar.root);
root.add(healthBar.root);

function lerpColor(a: string, b: string, amount: number) {
  var ah = parseInt(a.replace(/#/g, ''), 16),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ''), 16),
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

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

export function Hotbars_update(deltaMs: number) {
  temperateBar.update(deltaMs);
  hungerBar.update(deltaMs);
  healthBar.update(deltaMs);
}

updateSlot(3, 0, 0);

export const Hotbar_root = root;
export const Hotbar_reposition = reposition;
export const Hotbar_updateSlot = updateSlot;