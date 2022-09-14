import GameServer from "./GameServer";
import { WebSocket } from "ws";
import { StreamReader, StreamWriter } from "../../../shared/lib/StreamWriter";
import { CLIENT_HEADER, SERVER_HEADER } from "../../../shared/headers";
import { C_Base, C_ClientHandle, C_Controls, C_Health, C_Inventory, C_Mouse, C_Position, C_Rotation, C_Weilds } from "../Game/ECS/Components";
import { ITEM, Items } from "../../../shared/Item";
import EntityIdManager from "../../../shared/lib/EntityIDManager";
import { networkTypes, types } from "../../../shared/EntityTypes";
import { resetHealth } from "../Game/health";
import {modulo} from "../../../shared/Utilts";
import { createPlayer } from "../Game/ECS/EntityFactory";

const TMP_ENTITY_MANAGER: Map<number, boolean> = new Map();

export class Client {

  hungerStats: number = 0;
  healthStats: number = 0;
  coldStats: number = 0;
  isStatsDirty: boolean = false;

  id: number = -1;
  eid: number = -1;
  server: GameServer;
  socket: WebSocket;
  stream: StreamWriter = new StreamWriter();
  private inStream = new StreamReader();
  nickname: string = "Player#" + Math.floor(Math.random() * 999);
  ready: boolean = false;
  visibleEntities = new EntityIdManager();

  constructor(server: GameServer, socket: WebSocket) {
    this.server = server;
    this.socket = socket;

    this.socket.on("message", (data, isBinary) => this.onBinaryData(data as ArrayBuffer));
    this.socket.on("close", () => this.onSocketClose());
  }

  flushStream() {
    if (this.stream.ptr === 0) return;
    this.socket.send(this.stream.bytes());
    this.stream.reset();
  }

  buildSnapshot() {
    const x = C_Position.x[this.eid];
    const y = C_Position.y[this.eid];


    const screenX = 1920;
    const screenY = 1080;

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
      if (eid === -1) continue;

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
  }

  onSocketClose() {
    this.ready = false;
    if (this.eid !== -1) this.server.gameWorld.deleteEntity(this.eid);
    this.eid = -1;
    this.server.removeClient(this);
  }

  onBinaryData(data: ArrayBuffer) {
    const inStream = this.inStream;

    if (data.byteLength > 50) return; // drop packets over N  bytes in length

    inStream.readFrom(data);

    let currentReads = 0;
    while (inStream.hasMoreData() && (currentReads++ < 10)) { // dont read more then N packets crammed together
      const header = inStream.readU8();
      switch (header) {
        case CLIENT_HEADER.REQUEST_RESPAWN:
          this.onRequestSpawn();
          break;
        case CLIENT_HEADER.INPUT:
          this.onInput();
          break;
        case CLIENT_HEADER.MOUSE_UP: {
          if (this.eid !== -1) C_Mouse.mouseDown[this.eid] = +false;
          break;
        }
        case CLIENT_HEADER.INVENTORY: {
          const slotId = inStream.readU8() * 2;
          const eid = this.eid;
          const itemId = C_Inventory.items[eid][slotId];
          this.server.gameWorld.changeEntityItem(eid, itemId);
         break; 
        }
        case CLIENT_HEADER.CHAT: {
          if(!this.ready) return inStream.skipPacket();
          const message = inStream.readString();
          this.server.sendChat(this.eid, message);
          break;
        }
        case CLIENT_HEADER.MOUSE_DOWN: {
          const angle = modulo(inStream.readF32(), Math.PI * 2);
          if (this.eid !== -1) {
            C_Mouse.mouseDown[this.eid] = +true;
            this.server.gameWorld.setBodyRotation(this.eid, angle);
            C_Rotation.rotation[this.eid] = angle;
            //C_Weilds.itemId[this.eid] = ITEM.SWORD;
          }
          break;
        }
        default:
          throw "u" + header;
      }
    }
  }

  /*
  * description Called once a client has been added to the server
  */
  onceReady() {
    this.eid = createPlayer(this.server.gameWorld, this.id);
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

    if (this.eid !== -1) {
      C_Controls.x[this.eid] = x;
      C_Controls.y[this.eid] = y;
      C_Rotation.rotation[this.eid] = mouseRotation;
    }
  }

  onRequestSpawn() {
    if (this.server.gameWorld.isEntityActive(this.eid)) return;
    let nickname = this.inStream.readString();
    if(nickname === "") nickname = "GameNickName:" + this.id;
    this.nickname = nickname;

    resetHealth(this.eid);
    this.server.gameWorld.addEntity(this.eid);
    this.server.playerSpawned(this);

    console.log("Requested respawn!");
  }
}