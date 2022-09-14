import { types } from "../../shared/EntityTypes";
import { CLIENT_HEADER } from "../../shared/headers";
import { Items } from "../../shared/Item";
import ObjectManagerAssigned from "../../shared/lib/ObjectManagerAssignedIds";
import { getKeyState, getMouseState, isControlsDirty, mouse, mouseX, mouseY, stopMoving } from "./Controls";
import { Entity, getSnapShot, storeSnapShot } from "./Entity/Entity";
import { mBufferGeometry, mNode, mRenderer, mSprite } from "./Renderer";
import { flushStream, inStream, outStream}  from "./Socket";
import { lerpAngle } from "../../shared/Utilts";
import { HumanEntity } from "./Entity/Human";
import { HitAnimatedEntity, TreeEntity } from "./Entity/Tree";
import { Leaderboard_maxSize, Leaderboard_reposition, Leaderboard_showValue, Leaderboard_sprite, Leaderboard_updateValue } from "./UI/Leaderboard";
import { healthBar, Hotbar_reposition, Hotbar_root, Hotbar_updateSlot } from "./UI/Hotbar";
import { RockEntity } from "./Entity/Rock";
import { activeVisibleDecorations, deactiveVisibleDecorations, initDecoration } from "./Decoration.ts/Decoration";
import { MobEntity } from "./Entity/MobEntity";
import earcut from "./Ear";


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
export let ourEid = -1;
export let tickRate = 0;

root.add(gameWorldScene);
root.add(gameTopScene);
root.add(uiScene);

const mapData = { "FORREST": { "color": "#71b47c", "polygons": [] }, "SNOW": { "color": "#daedf8", "polygons": [] }, "JUNGLE": { "color": "#aae26f", "polygons": [] }, "OCEAN": { "color": "#357ba0", "polygons": [[506.1644431110645, 827.3223378479067, 743.0065483742226, 734.3398817075556, 790.3749694268541, 404.51532030404667, 634.234618549661, 122.05917995316932, 425.4626887250995, 141.35742556720442, 453.53286416369605, 357.1468992514151, 120.19953083036248, 408.0240922338713, 418.4451448654504, 502.7609343391345, 230.72584661983626, 771.1819869707135]] }, "DESERT": { "color": "#efea94", "polygons": [] }, "LAVA": { "color": "#ff6600", "polygons": [] }, "VOLCANO_PLANE": { "color": "#403333", "polygons": [] }, "VOLCANO_PEAK": { "color": "#352a2a", "polygons": [] }, "MOUNTAIN": { "color": "#6b7772", "polygons": [] }, "GLAZIER": { "color": "#baddf0", "polygons": [] }, "SAVANA": { "color": "#a3b471", "polygons": [] }, "BEACH": { "color": "#eff8b3", "polygons": [] }, "CAVE": { "color": "#b0b0b0", "polygons": [] }, "ICE_WATER": { "color": "#448bb0", "polygons": [] }, "TIAGA": { "color": "#609276", "polygons": [] } }

const vertices: number[] = [];
const colours: string[] = [];
const colorMap: string[] = [];
function parseMap(){
  mapData.OCEAN.polygons.forEach(polygon => {
    const _vertices = earcut(polygon);
    const newVertices: number[] = [];
    for(let i = 0; i < _vertices.length; i++){
      const offset = _vertices[i];
      newVertices[i * 2 + 0] = polygon[offset * 2 + 0];
      newVertices[i * 2 + 1] = polygon[offset * 2 + 1];
    }

    vertices.push(...newVertices);


    for(let i = 0; i < vertices.length / 6; i++){
      colours.push(mapData.OCEAN.color);
    }
  })
}

parseMap();
console.log(colours, colorMap);
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

export function GameClient_update(now: number, delta: number) {


  if (isControlsDirty()) {
    const keyState = getKeyState();
    const mouseState = getMouseState();
    outStream.writeU8(CLIENT_HEADER.INPUT);
    outStream.writeU8(keyState);
    outStream.writeF32(mouseState);
    flushStream();
  }

  const entityArr = GameClient_entities.array;
  var render_timestamp = now - (1000.0 / tickRate);


  for (let i = 0; i < entityArr.length; i++) {
    const entity = entityArr[i];

    // Find the two authoritative positions surrounding the rendering timestamp.
    if (entity.doInterpolation) {
      var buffer = entity.buffer;

      // Drop older positions.
      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        storeSnapShot(buffer.shift() as any); // assume its not undefined
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];
        let factor = (render_timestamp - t0) / (t1 - t0);

        const root = entity.root;

        const newX = buffer[0][1] + (buffer[1][1] - buffer[0][1]) * factor;
        const newY = buffer[0][2] + (buffer[1][2] - buffer[0][2]) * factor;
        const newRotation = lerpAngle(buffer[0][3], buffer[1][3], factor);

        if (entity.type === types.PLAYER) {
          const distanceDelta = (root.position.x - newX) ** 2 + (root.position.y - newY) ** 2;
          const humanEntity = entity as HumanEntity;
          const item = Items[humanEntity.itemId];
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
  }
}

export function gameClient_addEntity(now: number, eid: number, type: number, x: number, y: number, rotation: number) {
  let entity: Entity;
  switch (type) {
    case types.PLAYER:
      entity = new HumanEntity(type);
      break;
    case types.TREE:
      entity = new TreeEntity(type);
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
  const rotation = inStream.readF32() - Math.PI * .5;
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
  tickRate = _tickRate;
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

  let entity = GameClient_entities.find(eid);

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
  for (let i = 0; i < size; i++) {
    const itemId = inStream.readU16();
    const quantity = inStream.readU16();
    Hotbar_updateSlot(i, itemId, quantity);
  }
}

export function GameClient_unpackHealth() {
  const health = inStream.readU16();
  const food = inStream.readU16();
  const hunger = inStream.readU16();

  healthBar.setFill(health / 100);
}

export function GameClient_unpackDied() {
  Gameclient_showMenu();
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
