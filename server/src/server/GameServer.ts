import ObjectManager from "../../../shared/lib/ObjectManager";
import { WebSocket } from "uWebSockets.js";
import { Client } from "./Client";
import { SERVER_HEADER } from "../../../shared/headers";
import { C_Health, C_Hunger, C_Inventory, C_Temperature } from "../Game/ECS/Components";
import GameWorld from "../Game/GameWorld";
import { SocketServer } from "./SocketServer";
import NanoTimer from "./NanoTimer";
import { versionBits } from "./config";

export default class GameServer {
  clients: ObjectManager<Client> = new ObjectManager;
  gameWorld: GameWorld = new GameWorld;
  tickRate: number = 15;
  leaderboardTicks = 0;
  lastUpdate: number = 0;
  socketServer: SocketServer;

  constructor(port: number) {
    this.socketServer = new SocketServer(port, this);

    const timer = new NanoTimer(false);
    timer.setInterval(() => this.tick(), '', Math.floor(1000 / this.tickRate) + 'm');

    this.gameWorld._on('entityRemoved', (e) => {
      const { cid, eid } = e;

      // let clients who can see the entity know it was removed
      this.entityRemoved(eid);

      // if the removed entity has an associated client, let the client know he died
      if (this.clients.has(cid)) {
        const client = this.clients.find(cid);
        client.ownedEntities.remove(eid);
        if (client.eid === eid) this.clientPlayerRemoved(client);
      }
    });

    this.gameWorld._on('entityAdded', (e) => {
      const { cid, eid } = e;

      // 
      if (this.clients.has(cid)) {
        const client = this.clients.find(cid);
        client.ownedEntities.insert(eid);
      }
    });

    this.gameWorld._on('entityHurt', (e) => {
      const { cid, eid, health } = e;

      if (this.clients.has(cid)) {
        const client = this.clients.find(cid);

        if (eid === client.eid) {
          const hunger = C_Hunger.hunger[eid];
          const temperate = C_Temperature.temperate[eid];
          this.updateStats(client, health, hunger, temperate);
        }
      }
    });

    this.gameWorld._on('hitBounce', (e) => {
      const { eid, angle } = e;
      this.hitBouceEffect(eid, angle);
    });

    this.gameWorld._on('tickStats', (e) => {
      const clients = this.clients.array;
      for (let u = 0; u < clients.length; u++) {
        const client = clients[u];
        if (!client.ready) continue;
        const eid = client.eid;
        if (!this.gameWorld.isEntityActive(eid)) continue;

        const hunger = C_Hunger.hunger[eid];
        const temperate = C_Temperature.temperate[eid];
        const health = C_Health.health[eid];
        this.updateStats(client, health, hunger, temperate);
      }
    });

    this.gameWorld._on('action', (e) => {
      const { eid, animUseId } = e;
      this.sendAction(eid, animUseId);
    });

    this.gameWorld._on('changeItem', (e) => {
      const { eid, itemId } = e;
      this.sendChangeItem(eid, itemId);
    });
  }

  /**
   * Updates the world state, builds update snapshot for each client and flushes client message buffers
   * @memberof GameServer
   */
  tick() {
    const tickStart = Date.now();
    const now = Date.now();
    const _delta = now - this.lastUpdate;
    this.lastUpdate = now;

    const delta = (1000 / this.tickRate);
    this.gameWorld.update(delta);

    const start = Date.now();
    this.leaderboardTicks++;
    if (this.leaderboardTicks > this.tickRate * 3) { // every 5 seconds
      this.updateLeaderboard(this.gameWorld.buildLeaderboard());
      this.leaderboardTicks = 0;
    }

    const clients = this.clients.array;
    for (let u = 0; u < clients.length; u++) {
      const client = clients[u];
      if (client.ready) { client.buildSnapshot(); client.ping(); }
      client.flushStream();
    }
    const end = Date.now();
    //console.log("Syncing clients took: " + (end - start))
    const tickEnd = Date.now();
    //console.log("Tick took: " + (tickEnd- tickStart));
  }

  /**
   * Returns true/false whether new websocket can be acceped into the server
   * @return {*} 
   * @memberof GameServer
   */
  isServerFull() {
    return false;
  }

  /**
   * Adds a websocket to the server, associates with a client and initilises it
   * @param {WebSocket} socket
   * @return {*} 
   * @memberof GameServer
   */
  addClient(socket: WebSocket) {
    if (this.isServerFull()) return void socket.close();

    // add the client to the game
    const client = new Client(this, socket);
    this.clients.insert(client);
    client.onceReady();
  }

  /**
   * Removed client from server's list of clients
   * @param {Client} client
   * @memberof GameServer
   */
  removeClient(client: Client) {
    this.clients.remove(client);
  }

  /**
   * Notifies all clients that a new player has spawned, sending the nickname, and client id.
   * Also sends the client of the player who spawned know its entity ID, health and inventory
   * @param {Client} ownerClient
   * @memberof GameServer
   */
  playerSpawned(ownerClient: Client) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;

      if (!client.ready) continue;

      stream.writeU8(SERVER_HEADER.ADD_CLIENT);
      stream.writeLEB128(ownerClient.id);
      stream.writeString(ownerClient.nickname);
      client.flushStream();
    }

    ownerClient.stream.writeU8(SERVER_HEADER.SET_OUR_ENTITY);
    ownerClient.stream.writeLEB128(ownerClient.eid);

    const eid = ownerClient.eid;
    const health = C_Health.health[eid];
    const hunger = C_Hunger.hunger[eid];
    const temperate = C_Temperature.temperate[eid];

    this.updateStats(ownerClient, health, hunger, temperate);
    this.sendInventory(ownerClient.eid, ownerClient);
    ownerClient.flushStream();
  }

  /**
   * Syncs the leaderboard data with all clients 
   * @param {[number, number][]} lbData
   * @memberof GameServer
   */
  updateLeaderboard(lbData: [number, number][]) {
    const clients = this.clients.array;
    const leaderboardSize = lbData.length;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;
      if (!client.ready) continue;

      stream.writeU8(SERVER_HEADER.LEADERBOARD);
      stream.writeU8(leaderboardSize)

      for (let u = 0; u < lbData.length; u++) {
        const cid = lbData[u][0];
        const score = lbData[u][1];
        stream.writeU16(cid);
        stream.writeU32(score);
      }
    }
  }

  /**
   * Alerts any client that can see the entity, that it has been removed
   * @param {number} eid
   * @memberof GameServer
   */
  entityRemoved(eid: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;

      if (!client.ready) continue;
      if (client.visibleEntities.has(eid)) {
        client.visibleEntities.remove(eid);
        stream.writeU8(SERVER_HEADER.REMOVE_ENTITY);
        stream.writeLEB128(eid);
      }
    }
  }

  // send all player's that are spawned to the client
  sendClientInitilise(initClient: Client) {
    const clients = this.clients.array;
    const initStream = initClient.stream;

    initStream.writeU8(SERVER_HEADER.CONFIG);
    initStream.writeU8(this.tickRate);
    initStream.writeU8(versionBits[0]);
    initStream.writeU8(versionBits[1]);
    initStream.writeU8(versionBits[2]);

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      if (client === initClient) continue;
      if (!client.ready) continue;
      if (!this.gameWorld.isEntityActive(client.eid)) continue;

      initStream.writeU8(SERVER_HEADER.ADD_CLIENT);
      initStream.writeLEB128(client.id);
      initStream.writeString(client.nickname);
    }

    // write the inventory into the stream
    initClient.flushStream();
  }

  sendChangeItem(eid: number, newItemId: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.SWAP_ITEM);
      stream.writeLEB128(eid);
      stream.writeU16(newItemId);
    }
  }

  updateStats(client: Client, health: number, food: number, hunger: number) {
    const stream = client.stream;
    stream.writeU8(SERVER_HEADER.HEALTH);
    stream.writeU16(health);
    stream.writeU16(food);
    stream.writeU16(hunger);
  }

  sendAction(eid: number, actionId: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.ACTION);
      stream.writeLEB128(eid);
      stream.writeU8(actionId);
    }
  }

  hitBouceEffect(eid: number, direction: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.HIT_BOUNCE_EFFECT);
      stream.writeLEB128(eid);
      stream.writeF32(direction);
    }
  }

  clientPlayerRemoved(client: Client) {
    const stream = client.stream;
    stream.writeU8(SERVER_HEADER.DIED);
    client.flushStream(); // need to flush the current buffer to the client
    client.onDied();
  }

  sendInventory(eid: number, client: Client) {
    const stream = client.stream;
    const inventory = C_Inventory.items[eid];

    const size = inventory.length / 2;
    stream.writeU8(SERVER_HEADER.INVENTORY);
    stream.writeU8(size);

    for (let i = 0; i < size; i++) {
      stream.writeU16(inventory[i * 2 + 0]);
      stream.writeU16(inventory[i * 2 + 1]);
    }
  }

  sendChat(eid: number, message: string) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.CHAT);
      stream.writeLEB128(eid);
      stream.writeString(message);
    }
  }
}