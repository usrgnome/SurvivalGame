import { types } from "../../shared/EntityTypes";
import { CLIENT_HEADER } from "../../shared/headers";
import { Items, IToolItem } from "../../shared/Item";
import ObjectManagerAssigned from "../../shared/lib/ObjectManagerAssignedIds";
import { getKeyState, getMouseState, isControlsDirty, mouse, mouseX, mouseY, stopMoving } from "./Controls";
import { Entity, getSnapShot, storeSnapShot } from "./Entity/Entity";
import { mBufferGeometry, mNode, mRenderer, mSprite } from "./Renderer";
import { flushStream, inStream, outStream, sendRandomData } from "./Socket";
import { lerpAngle } from "../../shared/Utilts";
import { HumanEntity } from "./Entity/Human";
import { BushEntity, HitAnimatedEntity, TreeEntity } from "./Entity/Tree";
import { Leaderboard_maxSize, Leaderboard_reposition, Leaderboard_showValue, Leaderboard_sprite, Leaderboard_updateValue } from "./UI/Leaderboard";
import { healthBar, Hotbars_update, Hotbar_reposition, Hotbar_root, Hotbar_updateSlot, hungerBar, lerpColor, numberToHexStr, temperateBar } from "./UI/Hotbar";
import { RockEntity } from "./Entity/Rock";
import { activeVisibleDecorations, deactiveVisibleDecorations, initDecoration } from "./Decoration.ts/Decoration";
import { MobEntity } from "./Entity/MobEntity";
import earcut from "./Ear";
import { isDev, isProd } from "./dev";
import { debugInfo, Debug_init, Debug_update, Debug_updatePing, Debug_updateServerVersion } from "./UI/Debug";
import QuadNode from "./QuadNode";
import { WallEntity } from "./Entity/WallEntity";
import { SPRITE } from "../../shared/Sprite";
import { Sprite, Sprites } from "./Sprites";
import { addParticle, ParticleContainer_update } from "./ParticleContainer";
import { Inventory_calculateCraftable } from "./Inventory";


const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const renderer = new mRenderer(canvas);
export const clientNames: Map<number, string> = new Map();

const game = new mNode();
const scene = new mNode();
game.add(scene);

export const root = new mNode();
export const gameWorldScene = new mNode();
export let isChatOpen = false;

export const worldLayer1 = new mNode();
export const worldLayer2 = new mNode();

gameWorldScene.add(worldLayer1);
gameWorldScene.add(worldLayer2);

export const gameTopScene = new mNode();
export const uiScene = new mNode();
export const GameClient_entities: ObjectManagerAssigned<Entity> = new ObjectManagerAssigned();
export const NULL_ENTITY = -1;
export let ourEid = NULL_ENTITY;
export let tickRate = 0;

root.add(gameWorldScene);
root.add(gameTopScene);
root.add(uiScene);

if (!isProd()) uiScene.add(debugInfo);

const mapData = { "FORREST": { "color": "#71b47c", "polygons": [[4583.555946702201, 8730.555946702152, 5083.555946702201, 8610.555946702152, 5523.555946702201, 8450.555946702152, 5903.555946702201, 7950.555946702152, 6093.555946702201, 7590.555946702152, 6443.555946702201, 7250.555946702152, 6713.555946702201, 6850.555946702152, 7083.555946702201, 6470.555946702152, 7243.555946702201, 5900.555946702152, 6893.555946702201, 5320.555946702152, 7003.555946702201, 4640.555946702152, 7333.555946702201, 4190.555946702152, 7533.555946702201, 3910.555946702152, 7573.555946702201, 3610.555946702152, 7493.555946702201, 3230.555946702152, 7453.555946702201, 2930.555946702152, 6903.555946702201, 2280.555946702152, 6843.555946702201, 2210.555946702152, 6323.555946702201, 2170.5559467021517, 5883.555946702201, 2170.5559467021517, 5283.555946702201, 2270.555946702152, 4253.555946702201, 2270.555946702152, 3633.5559467022013, 2500.555946702152, 3433.5559467022013, 2740.555946702152, 3363.5559467022013, 3350.555946702152, 3363.5559467022013, 3880.555946702152, 3003.555946702201, 4090.555946702152, 2803.555946702201, 5040.555946702152, 2803.555946702201, 5190.555946702152, 2983.555946702201, 5390.555946702152, 3103.5559467022013, 6040.555946702152, 2893.555946702201, 6570.555946702152, 2893.555946702201, 6910.555946702152, 2973.555946702201, 7020.555946702152, 3223.5559467022013, 7200.555946702152, 3573.5559467022013, 7190.555946702152, 3933.5559467022013, 7510.555946702152, 4023.5559467022013, 8090.555946702152, 4023.5559467022013, 8360.555946702152, 3953.5559467022013, 8540.555946702152, 3953.5559467022013, 8770.555946702152, 4143.555946702201, 9150.555946702152]] }, "SNOW": { "color": "#daedf8", "polygons": [[2543.555946702201, 3300.555946702152, 2543.555946702201, 2950.555946702152, 2863.555946702201, 1760.5559467021517, 4883.555946702201, 750.5559467021521, 4163.555946702201, 220.55594670215214, 3233.5559467022013, 90.55594670215214, 2423.555946702201, 260.55594670215214, 1683.5559467022008, 880.5559467021517, 1283.5559467022013, 1520.5559467021517, 1073.5559467022013, 2690.555946702152, 1483.5559467022013, 3540.555946702152, 2333.555946702201, 3810.555946702152]] }, "JUNGLE": { "color": "#aae26f", "polygons": [[7663.555946702201, 4750.555946702152, 7843.555946702201, 4370.555946702152, 8293.555946702201, 3630.555946702152, 8253.555946702201, 2350.555946702152, 8823.555946702201, 2910.555946702152, 9783.555946702201, 1860.5559467021517, 10000, 830.5559467021521, 10000, 4564.526509450632, 8850.526509450681, 4944.526509450632, 8320.526509450681, 5574.526509450632, 8123.555946702201, 6340.555946702152, 7823.555946702201, 5590.555946702152]] }, "OCEAN": { "color": "#357ba0", "polygons": [[3363.5559467022013, 3880.555946702152, 3363.5559467022013, 3350.555946702152, 3433.5559467022013, 2740.555946702152, 3633.5559467022013, 2500.555946702152, 4253.555946702201, 2270.555946702152, 5283.555946702201, 2270.555946702152, 5883.555946702201, 2170.5559467021517, 6843.555946702201, 2210.555946702152, 7453.555946702201, 2930.555946702152, 8253.555946702201, 2350.555946702152, 7933.555946702201, 1500.5559467021517, 6703.555946702201, 1090.5559467021517, 4883.555946702201, 750.5559467021521, 2863.555946702201, 1760.5559467021517, 2543.555946702201, 2950.555946702152, 2543.555946702201, 3300.555946702152, 2833.555946702201, 3610.555946702152], [3363.5559467022013, 3880.555946702152, 2833.555946702201, 3610.555946702152, 2543.555946702201, 3300.555946702152, 2333.555946702201, 3810.555946702152, 2023.5559467022008, 4320.555946702152, 1873.5559467022008, 5120.555946702152, 2083.555946702201, 5690.555946702152, 2193.555946702201, 6670.555946702152, 2443.555946702201, 7970.555946702152, 3063.5559467022013, 8170.555946702152, 3483.5559467022013, 8940.555946702152, 3953.5559467022013, 8770.555946702152, 3953.5559467022013, 8540.555946702152, 4023.5559467022013, 8360.555946702152, 4023.5559467022013, 8090.555946702152, 3933.5559467022013, 7510.555946702152, 3573.5559467022013, 7190.555946702152, 3223.5559467022013, 7200.555946702152, 2973.555946702201, 7020.555946702152, 2893.555946702201, 6910.555946702152, 2893.555946702201, 6570.555946702152, 3103.5559467022013, 6040.555946702152, 2983.555946702201, 5390.555946702152, 2803.555946702201, 5190.555946702152, 2803.555946702201, 5040.555946702152, 3003.555946702201, 4090.555946702152], [7453.555946702201, 2930.555946702152, 8253.555946702201, 2350.555946702152, 8293.555946702201, 3630.555946702152, 7843.555946702201, 4370.555946702152, 7663.555946702201, 4750.555946702152, 7823.555946702201, 5590.555946702152, 8123.555946702201, 6340.555946702152, 7753.555946702201, 6990.555946702152, 6933.555946702201, 8280.555946702152, 6423.555946702201, 8740.555946702152, 5853.555946702201, 9300.555946702152, 5093.555946702201, 9540.555946702152, 3853.5559467022013, 9940.555946702152, 3043.5559467022013, 9710.555946702152, 3113.5559467022013, 9140.555946702152, 3483.5559467022013, 8940.555946702152, 3953.5559467022013, 8770.555946702152, 4143.555946702201, 9150.555946702152, 4583.555946702201, 8730.555946702152, 5083.555946702201, 8610.555946702152, 5523.555946702201, 8450.555946702152, 5903.555946702201, 7950.555946702152, 6093.555946702201, 7590.555946702152, 6443.555946702201, 7250.555946702152, 6713.555946702201, 6850.555946702152, 7083.555946702201, 6470.555946702152, 7243.555946702201, 5900.555946702152, 6893.555946702201, 5320.555946702152, 7003.555946702201, 4640.555946702152, 7333.555946702201, 4190.555946702152, 7533.555946702201, 3910.555946702152, 7573.555946702201, 3610.555946702152, 7493.555946702201, 3230.555946702152], [0, 6645.526509450632, 243.55594670220034, 6220.555946702152, 1103.5559467022013, 7120.555946702152, 2193.555946702201, 6670.555946702152, 2443.555946702201, 7970.555946702152, 3063.5559467022013, 8170.555946702152, 3483.5559467022013, 8940.555946702152, 3113.5559467022013, 9140.555946702152, 3043.5559467022013, 9710.555946702152, 2778.0138828659824, 10000, 0, 10000]] }, "DESERT": { "color": "#efea94", "polygons": [] }, "LAVA": { "color": "red", "polygons": [[10000, 7724.526509450632, 9210.526509450681, 7814.526509450632, 8900.526509450681, 8484.526509450632, 8750.526509450681, 8874.526509450632, 8230.526509450681, 9134.526509450632, 8130.526509450681, 9344.526509450632, 8130.526509450681, 9574.526509450632, 7880.526509450681, 9864.526509450632, 7860.526509450681, 10000, 10000, 10000]] }, "VOLCANO_PLANE": { "color": "#403333", "polygons": [[8123.555946702201, 6340.555946702152, 7753.555946702201, 6990.555946702152, 6933.555946702201, 8280.555946702152, 5853.555946702201, 9300.555946702152, 5423.555946702201, 9960.555946702152, 5460.526509450681, 10000, 10000, 10000, 10000, 4564.526509450632, 8850.526509450681, 4944.526509450632, 8320.526509450681, 5574.526509450632, 8123.555946702201, 6340.555946702152]] }, "VOLCANO_PEAK": { "color": "#352a2a", "polygons": [[10000, 5974.526509450632, 8740.526509450681, 6834.526509450632, 8090.526509450681, 8234.526509450632, 7110.526509450681, 9254.526509450632, 6720.526509450681, 10000, 10000, 10000]] }, "MOUNTAIN": { "color": "#6b7772", "polygons": [] }, "GLAZIER": { "color": "#baddf0", "polygons": [] }, "SAVANA": { "color": "#a3b471", "polygons": [[2778.0138828659824, 10000, 3043.5559467022013, 9710.555946702152, 3853.5559467022013, 9940.555946702152, 5853.555946702201, 9300.555946702152, 5423.555946702201, 9960.555946702152, 5460.526509450681, 10000]] }, "BEACH": { "color": "#eff8b3", "polygons": [[1483.5559467022013, 3540.555946702152, 2333.555946702201, 3810.555946702152, 2023.5559467022008, 4320.555946702152, 1873.5559467022008, 5120.555946702152, 2083.555946702201, 5690.555946702152, 2193.555946702201, 6670.555946702152, 1103.5559467022013, 7120.555946702152, 243.55594670220034, 6220.555946702152, 323.55594670220125, 5170.555946702152, 723.5559467022013, 4340.555946702152, 1063.5559467022013, 3850.555946702152]] }, "CAVE": { "color": "#b0b0b0", "polygons": [[243.55594670220034, 6220.555946702152, 323.55594670220125, 5170.555946702152, 723.5559467022013, 4340.555946702152, 1063.5559467022013, 3850.555946702152, 1483.5559467022013, 3540.555946702152, 1073.5559467022013, 2690.555946702152, 1283.5559467022013, 1520.5559467021517, 1683.5559467022008, 880.5559467021517, 2423.555946702201, 260.55594670215214, 3233.5559467022013, 90.55594670215214, 4163.555946702201, 220.55594670215214, 4723.555946702201, 0, 0, 0, 0, 6645.526509450632]] }, "ICE_WATER": { "color": "#448bb0", "polygons": [] }, "TIAGA": { "color": "#609276", "polygons": [[4883.555946702201, 750.5559467021521, 4163.555946702201, 220.55594670215214, 4723.555946702201, 0, 6633.555946702201, 0, 10000, 0, 10000, 830.5559467021521, 9783.555946702201, 1860.5559467021517, 8823.555946702201, 2910.555946702152, 8253.555946702201, 2350.555946702152, 7933.555946702201, 1500.5559467021517, 6703.555946702201, 1090.5559467021517]] } };


const vertices: number[] = [];
const colours: string[] = [];
const colorMap: string[] = [];

const highlight = new mSprite(Sprites[SPRITE.WALL]);
worldLayer2.add(highlight);
highlight.visible = false;

const tree = new QuadNode({ minx: 0, miny: 0, maxx: 10000, maxy: 10000 }, 4, 10);

class Poly {
  vertices: number[];
  color: string;
  bound = { minx: Infinity, miny: Infinity, maxx: -Infinity, maxy: -Infinity }
  constructor(vertices: number[], color: string) {
    this.vertices = vertices;
    this.color = color;

    for (let i = 0; i < vertices.length; i += 2) {
      let x = vertices[i];
      let y = vertices[i + 1];

      if (x < this.bound.minx) this.bound.minx = x;
      if (x > this.bound.maxx) this.bound.maxx = x;

      if (y < this.bound.miny) this.bound.miny = y;
      if (y > this.bound.maxy) this.bound.maxy = y;
    }
  }
}

let oceanPolys: Poly[] = [];

function parseMap() {

  function parseMapForKey(name: string) {
    mapData[name].polygons.forEach(polygon => {

      const _vertices = earcut(polygon);
      const newVertices: number[] = [];
      for (let i = 0; i < _vertices.length; i++) {
        const offset = _vertices[i];
        newVertices[i * 2 + 0] = polygon[offset * 2 + 0];
        newVertices[i * 2 + 1] = polygon[offset * 2 + 1];
      }

      for (let i = 0; i < newVertices.length;) {
        const vert: number[] = [];
        vert.push(newVertices[i++])
        vert.push(newVertices[i++])

        vert.push(newVertices[i++])
        vert.push(newVertices[i++])

        vert.push(newVertices[i++])
        vert.push(newVertices[i++])

        const poly = new Poly(vert, mapData[name].color);
        if (name === "OCEAN") oceanPolys.push(poly);
        tree.insert(poly);
      }

      vertices.push(...newVertices);

      for (let i = 0; i < newVertices.length / 6; i++) {
        colours.push(mapData[name].color);
      }
    });
  }

  for (let name in mapData) {
    parseMapForKey(name);
  }
}

parseMap();
const buffer = new mBufferGeometry(
  vertices,
  colours,
);
worldLayer1.add(buffer);

export function GameClient_clearWorld() {
  // make a copy of the entities, to iterate and remove them
  const entites = GameClient_entities.array.slice();

  for (let i = 0; i < entites.length; i++) {
    const eid = entites[i].id;
    GameClient_removeEntity(eid);
  }
}

export function GameClient_selectSlot(slot: number) {
  outStream.writeU8(CLIENT_HEADER.INVENTORY);
  outStream.writeU8(slot);
  flushStream();
}

export function GameClient_resize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  repositionUI();
}

export function GameClient_hideMenu() {
  (document.getElementById("homepage") as any).style.display = "none";
}

export function Gameclient_showMenu() {
  (document.getElementById("homepage") as any).style.display = "block";
}

export function repositionUI() {
  Leaderboard_reposition();
  Hotbar_reposition();
}

export function GameClient_init() {
  uiScene.add(Leaderboard_sprite);
  uiScene.add(Hotbar_root)
  repositionUI();
  initDecoration();
  Debug_init();
}

GameClient_init();


export function GameClient_showChat() {
  (document.getElementById("chat-wrapper") as any).style.display = "block";
  (document.getElementById("chat") as any).focus();
  isChatOpen = true;
}

export function GameClient_hideChat() {
  (document.getElementById("chat-wrapper") as any).style.display = "none";
  (document.getElementById("chat") as any).blur();
  (document.getElementById("chat") as any).value = "";
  isChatOpen = false;
}


export function GameClient_enterPressed() {
  const chatWrapper = document.getElementById("chat-wrapper") as any;
  if (chatWrapper.style.display === "none") {
    stopMoving();
    GameClient_showChat();
  } else {

    const chatValue = (document.getElementById("chat") as any).value;
    if (chatValue !== "") {

      outStream.writeU8(CLIENT_HEADER.CHAT);
      outStream.writeString(chatValue);
      flushStream();
    }
    GameClient_hideChat();
  }
}

export function GameClient_render() {
  renderer.clearScreen("#e8e4e3");
  renderer.render(root);
  deactiveVisibleDecorations();
}

function pointInSprite(x: number, y: number, sprite: mSprite) {
  const position = sprite.position;
  const frame = sprite.frame;
  return (
    x >= position.x - frame.anchor.x * frame.scale.x &&
    x <= position.x + (frame.size.x - frame.anchor.x) * frame.scale.x &&
    y >= position.y - frame.anchor.y * frame.scale.y &&
    y <= position.y + (frame.size.y - frame.anchor.y) * frame.scale.y
  );
}

// @ts-ignore

export function mouseVsSprite(x: number, y: number, node: mNode, maxDepth = 1, accumX: number = 0, accumY = 0, currentDepth = 0): boolean {
  accumX += node.position.x;
  accumY += node.position.y

  if (currentDepth > maxDepth) return false;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child.visible) continue;
    if (child.isSprite) {
      if ((child as mSprite).onclick && pointInSprite(x - accumX, y - accumY, child as mSprite)) {
        ((child as mSprite).onclick as any)();
        return true;
      } else {
        if (mouseVsSprite(x, y, child, maxDepth, accumX, accumY, currentDepth + 1)) return true;;
      }
    } else {
      if (mouseVsSprite(x, y, child, maxDepth, accumX, accumY, currentDepth + 1)) return true;
    }
  }

  return false;
}

let v = 0;
let dir = 1;

export function GameClient_update(now: number, delta: number) {

  sendRandomData();

  if (isControlsDirty()) {
    const keyState = getKeyState();
    const mouseState = getMouseState();
    outStream.writeU8(CLIENT_HEADER.INPUT);
    outStream.writeU8(keyState);
    outStream.writeF32(mouseState);
    flushStream();
  }

  if (dir) {
    v += delta / 3;
    if (v >= 1) {
      v = 1;
      dir = 0;
    }
  } else {
    v -= delta / 3;
    if (v <= 0) {
      v = 0;
      dir = 1;
    }
  }

  ParticleContainer_update(delta);

  const color = numberToHexStr(lerpColor(0x1daad1, 0x326cc9, v));
  for (let i = 0; i < oceanPolys.length; i++) {
    oceanPolys[i].color = color;
  }

  if (!isProd()) Debug_update();
  Hotbars_update(delta);

  const entityArr = GameClient_entities.array;
  const render_timestamp = now - (1000.0 / tickRate);

  for (let i = 0; i < entityArr.length; i++) {
    const entity = entityArr[i];

    // Find the two authoritative positions surrounding the rendering timestamp.
    if (entity.doInterpolation) {
      const buffer = entity.buffer;

      // Drop older positions.
      let sum = 0;
      let total = 0;
      for (let i = 1; i < buffer.length; i++) {
        const buf = buffer[i];
        const lastBuf = buffer[i - 1]
        const timeDif = buf[0] - lastBuf[0]
        sum += timeDif;
        total++;
      }

      if (total) {
        //console.log("Average tick", sum / total, "expected: ", 1000 / tickRate);
      }

      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        storeSnapShot(buffer.shift() as any); // assume its not undefined
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
        const t0 = buffer[0][0];
        const t1 = buffer[1][0];
        const factor = (render_timestamp - t0) / (t1 - t0);

        const root = entity.root;

        const newX = buffer[0][1] + (buffer[1][1] - buffer[0][1]) * factor;
        const newY = buffer[0][2] + (buffer[1][2] - buffer[0][2]) * factor;
        const newRotation = lerpAngle(buffer[0][3], buffer[1][3], factor);

        if (entity.type === types.PLAYER) {
          const distanceDelta = (root.position.x - newX) ** 2 + (root.position.y - newY) ** 2;
          const humanEntity = entity as HumanEntity;
          const item = Items[humanEntity.itemId] as IToolItem;
          if (distanceDelta > 1) {
            if (entity.animationState !== item.anim.use && item.anim.move !== entity.animationState) entity.changeAnimState(item.anim.move);
          } else {
            if (entity.animationState !== item.anim.use && item.anim.idle !== entity.animationState) entity.changeAnimState(item.anim.idle);
          }
        }

        entity.setTransform(newX, newY, newRotation)
      }
    }

    if (entity.doUpdate) entity.update(delta);
  }

  if (ourEid !== -1 && GameClient_entities.has(ourEid)) {
    let ourEntity = GameClient_entities.find(ourEid) as HumanEntity;
    const sprite = ourEntity.root;
    gameWorldScene.position.x = renderer.scaledWidth * .5 - sprite.position.x;
    gameWorldScene.position.y = renderer.scaledHeight * .5 - sprite.position.y;
    ourEntity.setRotation(mouse - Math.PI * .5);
    activeVisibleDecorations(sprite.position.x, sprite.position.y, 1920, 1080);

    const x = sprite.position.x;
    const y = sprite.position.y;
    const query = { minx: x - 1920 * .5, miny: y - 1080 * .5, maxx: x + 1920 * .5, maxy: y + 1080 * .5 };

    const results = []
    tree.find(query, results);

    buffer.geometry.length = 0;
    buffer.colours.length = 0;
    for (let i = 0; i < results.length; i++) {
      const result = results[i] as Poly;

      buffer.geometry.push(...result.vertices);
      buffer.colours.push(result.color);
    }

    const rotation = sprite.rotation + Math.PI * .5;
    highlight.position.x = x + Math.cos(rotation) * 130;
    highlight.position.y = y + Math.sin(rotation) * 130;
    highlight.rotation = rotation;
  }
}

export function gameClient_addEntity(now: number, eid: number, type: number, x: number, y: number, rotation: number) {
  let entity: Entity;
  switch (type) {
    case types.PLAYER:
      entity = new HumanEntity(type);
      break;
    case types.WALL:
      entity = new WallEntity(type);
      break;
    case types.TREE:
      entity = new TreeEntity(type);
      break;
    case types.BUSH:
      entity = new BushEntity(type);
      break;
    case types.ROCK:
      entity = new RockEntity(type);
      break;
    case types.WOLF:
      entity = new MobEntity(type);
      break;
    default:
      console.warn("Warning, defaulting entity: " + type);
      entity = new Entity(type);
      break;
  }
  entity.type = type;
  entity.id = eid;
  entity.buffer.push(getSnapShot(now, x, y, rotation));

  entity.root.setDepth(type);
  entity.setTransform(x, y, rotation);

  entity.addToScene();
  GameClient_entities.insert(entity);
  return entity;
}

export function GameClient_tryHit() {
}
export function GameClient_mouseDown() {
  if (mouseVsSprite(mouseX, mouseY, uiScene, 10)) {

  } else {
    outStream.writeU8(CLIENT_HEADER.MOUSE_DOWN);
    outStream.writeF32(getMouseState());
    flushStream();
  }
}

export function GameClient_mouseUp() {
  outStream.writeU8(CLIENT_HEADER.MOUSE_UP);
  flushStream();
}

export function GameClient_removeEntity(eid: number) {
  const entity = GameClient_entities.find(eid);
  GameClient_entities.deleteId(eid);
  entity.removeFromScene();
}

export function GameClient_unpackAddEntity(packetArrivalTime: number) {
  const type = inStream.readU8();
  const eid = inStream.readULEB128();
  const rotation = inStream.readF32();
  const x = inStream.readF32();
  const y = inStream.readF32();

  let entity = gameClient_addEntity(packetArrivalTime, eid, type, x, y, rotation);

  // read additional data depending on the entity
  switch (entity.type) {
    case types.PLAYER:
      const cid = inStream.readU16();
      (<HumanEntity>entity).updateName(clientNames.get(cid) as string);
      const itemId = inStream.readU16();
      if (itemId !== (<HumanEntity>entity).itemId) {
        (<HumanEntity>entity).itemId = itemId; // do something to the skeleton
        (<HumanEntity>entity).changeItem(itemId);
      }
      break;
  }
}

export function GameClient_unpackUpdateEntity(packetArrivalTime: number) {
  const eid = inStream.readULEB128();
  const rotation = inStream.readF32() - Math.PI * .5;
  const x = inStream.readF32();
  const y = inStream.readF32();
  let entity = GameClient_entities.find(eid);
  entity.buffer.push(getSnapShot(packetArrivalTime, x, y, rotation));
}

export function GameClient_unpackRemoveEntity() {
  const eid = inStream.readULEB128();
  GameClient_removeEntity(eid);
}

export function GameClient_unpackConfig() {
  const _tickRate = inStream.readU8();
  const versionBit1 = inStream.readU8();
  const versionBit2 = inStream.readU8();
  const versionBit3 = inStream.readU8();

  tickRate = _tickRate;
  Debug_updateServerVersion(versionBit1, versionBit2, versionBit3);
}

export function GameClient_unpackSetOurEntity() {
  const eid = inStream.readULEB128();
  ourEid = eid;
  GameClient_hideMenu();
}

export function GameClient_unpackAddClient() {
  const id = inStream.readULEB128();
  const nickname = inStream.readString();
  clientNames.set(id, nickname);
}

export function GameClient_unpackSwapItem() {
  const eid = inStream.readULEB128();
  const itemId = inStream.readU16();
  const entity = GameClient_entities.find(eid);

  if (itemId !== (<HumanEntity>entity).itemId) {
    (<HumanEntity>entity).itemId = itemId; // do something to the skeleton
    (<HumanEntity>entity).changeItem(itemId);
  }
}

export function GameClient_unpackAction() {
  const eid = inStream.readULEB128();
  const action = inStream.readU8();
  let entity = GameClient_entities.find(eid);

  entity.changeAnimState(action);
}

export function GameClient_unpackChat() {
  const eid = inStream.readULEB128();
  const message = inStream.readString();

  try {
    let entity = GameClient_entities.find(eid) as HumanEntity;
    (<HumanEntity>entity).updateChat(message); // do something to the skeleton
  } catch (e) {
    console.log("Error, expected humanLike, got something else", e);
  }
}

export function GameClient_unpackHitBouceEffect() {
  const eid = inStream.readULEB128();
  const angle = inStream.readF32();
  let entity = GameClient_entities.find(eid) as HitAnimatedEntity;
  const range = 40;
  const x = Math.cos(angle) * range;
  const y = Math.sin(angle) * range;

  entity.setHit(x, y);
}

export function GameClient_unpackInventory() {
  const size = inStream.readU8();
  const inventory: [number, number][] = []

  for (let i = 0; i < size; i++) {
    const itemId = inStream.readU16();
    const quantity = inStream.readU16();
    inventory.push([itemId, quantity]);
    Hotbar_updateSlot(i, itemId, quantity);
  }

  Inventory_calculateCraftable(inventory);
}

export function GameClient_unpackHealth() {
  const health = inStream.readU16();
  const hunger = inStream.readU16();
  const temperature = inStream.readU16();

  healthBar.setFill(health / 100);
  temperateBar.setFill(temperature / 100);
  hungerBar.setFill(hunger / 100);
}

export function GameClient_unpackDied() {
  Gameclient_showMenu();
}

export function GameClient_unpackPing() {
  const seqId = inStream.readU8();

  outStream.writeU8(CLIENT_HEADER.PONG);
  outStream.writeU8(seqId);

  flushStream();
}

export function GameClient_unpackPingResponse() {
  const ping = inStream.readU16();
  Debug_updatePing(ping);
}

export function GameClient_unpackLeaderboard() {
  const lbSize = inStream.readU8();
  for (let i = 0; i < lbSize; i++) {
    const cid = inStream.readU16();
    const score = inStream.readI32();
    Leaderboard_updateValue(i, clientNames.get(cid) as string, score);
  }

  for (let i = lbSize; i < Leaderboard_maxSize; i++) {
    Leaderboard_showValue(i, false);
  }
}

export function GameClient_unpackBuildMode() {
  const inBuildMode = !!inStream.readU8();
  const itemId = inStream.readU8();

  if (inBuildMode) {
    const item = Items[itemId];
    highlight.frame = Sprites[item.spriteId];
    highlight.visible = true;
  } else {
    highlight.visible = false;
  }
}

export function GameClient_unpackHurt() {
  const eid = inStream.readULEB128();
  const x = inStream.readF32();
  const y = inStream.readF32();
  const total = 1 + Math.floor(Math.random() * 3);
  const type = GameClient_entities.find(eid).type;

  for (let i = 0; i < total; i++) {
    addParticle(type === types.PLAYER ? SPRITE.FLOWER7 : SPRITE.FLOWER2, x, y);
  }
}