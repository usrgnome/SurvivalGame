import GameServer from "./GameServer";
import { WebSocket } from "uWebSockets.js";
import { CLIENT_HEADER, SERVER_HEADER } from "../../../shared/headers";
import { C_Base, C_ClientHandle, C_Controls, C_Health, C_HitBouceEffect, C_Hunger, C_Inventory, C_Mouse, C_Position, C_Rotation, C_Weilds, maxIventorySize } from "../Game/ECS/Components";
import EntityIdManager from "../../../shared/lib/EntityIDManager";
import { networkTypes, types } from "../../../shared/EntityTypes";
import { resetPLayerStats } from "../Game/health";
import { modulo } from "../../../shared/Utilts";
import { createPlayer, NULL_ENTITY } from "../Game/ECS/EntityFactory";
import { BinaryTypes, BufferReader, BufferSchema, BufferWriter } from "../../../shared/lib/StreamUtils"
import { Items } from "../../../shared/Item";
import { removeComponent } from "bitecs";
import { Inventory_canAddItem, Inventory_craftItem, Inventory_removeItem } from "../Game/Inventory";
import { clientDebugLogger, loggerLevel } from "./Logger";

const TMP_ENTITY_MANAGER: Map<number, boolean> = new Map();

const requestRespawnSchema = new BufferSchema([BinaryTypes.str], { errorMessage: "invalid respawn packet!" })
const inputSchema = new BufferSchema([BinaryTypes.u8, BinaryTypes.f32], { errorMessage: "invalid input packet!" })
const inventorySchema = new BufferSchema([BinaryTypes.u8], { errorMessage: "invalid invetory packet!" })
const chatSchema = new BufferSchema([BinaryTypes.str], { errorMessage: "invalid chat packet!" })
const pongSchema = new BufferSchema([BinaryTypes.u8], { errorMessage: "invalid pong packet!" })
const craftSchema = new BufferSchema([BinaryTypes.u8], { errorMessage: "invalid craft packet!" })

export class Client {

  hungerStats: number = 0;
  healthStats: number = 0;
  coldStats: number = 0;
  isStatsDirty: boolean = false;

  pingSeqId: number = 0;
  waitingForPingSeqId: number = -1;
  pingTimestamp: number = 0;

  id: number = -1;
  eid: number = NULL_ENTITY;
  server: GameServer;
  socket: WebSocket;
  stream = new BufferWriter(0xFFFFFF);

  private inStream = new BufferReader();
  nickname: string = "";
  ready: boolean = false;
  visibleEntities = new EntityIdManager();
  ownedEntities = new EntityIdManager();

  constructor(server: GameServer, socket: WebSocket) {
    socket.client = this;
    this.server = server;
    this.socket = socket;
  }

  flushStream() {
    if (this.stream.offset === 0) return;
    this.socket.send(this.stream.bytes(), true, true);
    this.stream.reset();
  }

  buildSnapshot() {
    if (!this.ready) throw "Client::buildSnapshot not ready";

    const x = C_Position.x[this.eid];
    const y = C_Position.y[this.eid];


    const screenX = 1920 * 1.5;
    const screenY = 1080 * 1.5;

    const bodies = this.server.gameWorld.queryRect(
      x - screenX * .5,
      y - screenY * .5,
      x + screenX * .5,
      y + screenY * .5
    );

    // add new eid's to entity manager for fast lookup
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      // @ts-ignore
      const eid = body.eid as number;
      if (eid === -1) continue;

      TMP_ENTITY_MANAGER.set(eid, true);
    }

    const oldVisible = this.visibleEntities.array;
    const newVisible = TMP_ENTITY_MANAGER;
    const stream = this.stream;

    for (let i = 0; i < oldVisible.length; i++) {
      const eid = oldVisible[i];
      if (!newVisible.has(eid)) {
        // remove
        if (C_Base.networkTypes[eid] & networkTypes.REMOVED) {
          stream.writeU8(SERVER_HEADER.REMOVE_ENTITY);
          stream.writeLEB128(eid);
        }

        this.visibleEntities.remove(eid);
      }
    }

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      // @ts-ignore
      const eid = body.eid as number;
      if (eid === NULL_ENTITY || eid === undefined) continue;

      if (this.visibleEntities.has(eid)) {
        // update
        if (C_Base.networkTypes[eid] & networkTypes.UPDATES) {
          stream.writeU8(SERVER_HEADER.UPDATE_ENTITY);
          stream.writeLEB128(eid);
          stream.writeF32(C_Rotation.rotation[eid]);
          stream.writeF32(C_Position.x[eid]);
          stream.writeF32(C_Position.y[eid]);
        }
      } else {
        // add
        if (C_Base.networkTypes[eid] & networkTypes.ADDED) {
          stream.writeU8(SERVER_HEADER.ADD_ENTITY);
          stream.writeU8(C_Base.type[eid]);
          stream.writeLEB128(eid);
          stream.writeF32(C_Rotation.rotation[eid]);
          stream.writeF32(C_Position.x[eid]);
          stream.writeF32(C_Position.y[eid]);
        }

        // now write additional information
        switch (C_Base.type[eid]) {
          case types.PLAYER:
            stream.writeU16(C_ClientHandle.cid[eid]);
            stream.writeU16(C_Weilds.itemId[eid]);

            //stream.writeU8(SERVER_HEADER.UPDATE_HEALTH);
            //stream.writeLEB128(eid);
            //stream.writeU16(C_Health.health[eid]);
            break;
        }

        this.visibleEntities.insert(eid);
      }
    }

    TMP_ENTITY_MANAGER.clear();

    if (this.eid !== NULL_ENTITY && C_Inventory.dirty[this.eid]) {
      const eid = this.eid;
      C_Inventory.dirty[eid] = +false;
      const items = C_Inventory.items[eid];
      const quantities = C_Inventory.quantities[eid];

      const size = items.length;
      stream.writeU8(SERVER_HEADER.INVENTORY);
      stream.writeU8(size);

      for (let i = 0; i < size; i++) {
        stream.writeU16(items[i]);
        stream.writeU16(quantities[i]);
      }
    }
  }


  removeOwnedEntities() {
    const ownedEntities = this.ownedEntities.array.slice();
    for (let i = 0; i < ownedEntities.length; i++) {
      const eid = ownedEntities[i];
      removeComponent(this.server.gameWorld.world, C_ClientHandle, eid);
      this.server.gameWorld.removeEntity(eid);
      this.ownedEntities.remove(eid);
    }
  }

  onSocketClose(code: number, message: ArrayBuffer) {
    this.ready = false;
    this.server.removeClient(this);
    this.removeOwnedEntities();
    this.eid = NULL_ENTITY;
  }

  onSocketMessage(data: ArrayBuffer, isBinary: boolean) {
    const inStream = this.inStream;

    if (data.byteLength > 50) return; // drop packets over N  bytes in length

    inStream.readFrom(data);

    let currentReads = 0;
    while (inStream.hasMoreData() && (currentReads++ < 10)) { // dont read more then N packets crammed together
      const header = inStream.readU8();
      switch (header) {
        case CLIENT_HEADER.CRAFT: {
          try { craftSchema.validate(inStream); }
          catch (e) { return; };

          const itemId = inStream.readU8();
          if (this.eid !== NULL_ENTITY) {
            if (Inventory_craftItem(this.eid, itemId)) {
              C_Inventory.dirty[this.eid] = +true;
            }
          }
          break;
        }
        case CLIENT_HEADER.REQUEST_RESPAWN:
          try { requestRespawnSchema.validate(inStream); }
          catch (e) { return; };

          this.onRequestSpawn();
          break;
        case CLIENT_HEADER.INPUT:
          try { inputSchema.validate(inStream) }
          catch (e) { return; };

          this.onInput();
          break;
        case CLIENT_HEADER.MOUSE_UP: {
          if (this.eid !== NULL_ENTITY)
            C_Mouse.mouseDown[this.eid] = +false;
          break;
        }
        case CLIENT_HEADER.INVENTORY: {
          try { inventorySchema.validate(inStream); }

          catch (e) { return; };

          if (this.eid === NULL_ENTITY) return;

          const slotId = inStream.readU8();
          if (slotId > maxIventorySize) return;
          const slotOffset = slotId;
          if (slotOffset >= C_Inventory.items[this.eid].length) console.warn("Too long slot offset")


          const eid = this.eid;
          const itemId = C_Inventory.items[eid][slotOffset];
          const item = Items[itemId];

          if(!item) return;

          if (item.isTool) {
            this.server.gameWorld.equipItem(eid, itemId)
            const stream = this.stream;
            stream.writeU8(SERVER_HEADER.BUILD_MODE);
            stream.writeU8(0);
            stream.writeU8(item.id);
          }
          else if (item.isStructure) {
            this.server.gameWorld.equipItem(eid, itemId)
            const stream = this.stream;
            stream.writeU8(SERVER_HEADER.BUILD_MODE);
            stream.writeU8(1);
            stream.writeU8(item.id);
          } else if (item.isConsumable) {
            if (Inventory_removeItem(this.eid, itemId, 1)) {
              C_Hunger.hunger[eid] = Math.min(C_Hunger.hunger[eid] + 5, C_Hunger.maxHunger[eid]);
              C_Inventory.dirty[this.eid] = +true;
            }
          }

          break;
        }
        case CLIENT_HEADER.CHAT: {
          try { chatSchema.validate(inStream); }
          catch (e) { return; };

          if (!this.ready) return inStream.skipPacket();
          const message = inStream.readString();
          this.server.sendChat(this.eid, message);
          break;
        }
        case CLIENT_HEADER.MOUSE_DOWN: {
          const angle = modulo(inStream.readF32(), Math.PI * 2);
          if (this.eid !== NULL_ENTITY) {
            C_Mouse.mouseDown[this.eid] = +true;
            C_Rotation.rotation[this.eid] = angle;
          }
          break;
        }
        case CLIENT_HEADER.PONG:
          try { pongSchema.validate(inStream); }
          catch (e) { return; };

          this.onPong();
          break;
      }
    }
  }

  /*
  * description Called once a client has been added to the server
  */
  onceReady() {
    this.socket.send("ready", false);
    this.ready = true;
    this.server.sendClientInitilise(this);
  }

  // message events

  onInput() {
    const keyState = this.inStream.readU8();
    const mouseRotation = modulo(this.inStream.readF32(), Math.PI * 2);

    let x = 0;
    let y = 0;
    if (keyState & 1) y--;
    if (keyState & 2) x++;
    if (keyState & 4) y++;
    if (keyState & 8) x--;

    let invMag = x || y ? 1 / Math.hypot(x, y) : 0;
    x *= invMag;
    y *= invMag;

    if (this.eid !== NULL_ENTITY) {
      C_Controls.x[this.eid] = x;
      C_Controls.y[this.eid] = y;
      C_Rotation.rotation[this.eid] = mouseRotation;
    }
  }

  onRequestSpawn() {
    let nickname = this.inStream.readString();
    if (this.eid !== NULL_ENTITY) return;
    if (nickname === "") nickname = "GameNickName:" + this.id;
    this.nickname = nickname;
    this.eid = createPlayer(this.server.gameWorld, this.id);
    this.server.playerSpawned(this);

    // @ts-ignore
    clientDebugLogger.log(loggerLevel.info, "NICKNAME: " + nickname + " DEBUG_INFO: " + this.socket.debugInfo);
  }

  onPong() {
    const seqId = this.inStream.readU8();

    if (seqId === this.waitingForPingSeqId) {
      this.waitingForPingSeqId = -1;


      const now = Date.now();
      const difference = now - this.pingTimestamp;

      // Cap the difference to 65535 (uint16 max size), to prevent overflow error
      this.sendPingTime(Math.min(difference, 0xFFFF));
    }
  }


  ping() {
    if (this.waitingForPingSeqId !== -1) return;
    this.stream.writeU8(SERVER_HEADER.PING);
    this.stream.writeU8(this.pingSeqId);
    this.waitingForPingSeqId = this.pingSeqId;
    this.pingSeqId = (this.pingSeqId + 1) % 0xff;
    this.pingTimestamp = Date.now();
  }

  sendPingTime(time: number) {
    this.stream.writeU8(SERVER_HEADER.PING_RESPONSE);
    this.stream.writeU16(time);
  }

  onDied() {
    this.eid = NULL_ENTITY;
    this.removeOwnedEntities();
  }
}