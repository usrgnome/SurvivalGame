import { CLIENT_HEADER, SERVER_HEADER } from "../../shared/headers";
import { StreamReader, StreamWriter } from "../../shared/lib/StreamWriter";
import { GameClient_clearWorld, Gameclient_showMenu, GameClient_unpackAction, GameClient_unpackAddClient, GameClient_unpackAddEntity, GameClient_unpackBuildMode, GameClient_unpackChat, GameClient_unpackConfig, GameClient_unpackDied, GameClient_unpackHealth, GameClient_unpackHitBouceEffect, GameClient_unpackHunger, GameClient_unpackHurt, GameClient_unpackInventory, GameClient_unpackLeaderboard, GameClient_unpackPing, GameClient_unpackPingResponse, GameClient_unpackRemoveEntity, GameClient_unpackSetOurEntity, GameClient_unpackSwapItem, GameClient_unpackTemperature, GameClient_unpackUpdateEntity } from "./GameClient";
import { isDev } from "./dev";

const wsLocation = location.hostname;
const devUrl = "localhost:8080/wss";

export const outBoundStream = new StreamWriter();
export const inBoundStream = new StreamReader();
export const outStream = outBoundStream;
export const inStream = inBoundStream;

// @ts-ignore
let ws: WebSocket = null;

export function Socket_connect() {
  const wsUrl = `${location.protocol === "http:" ? "ws" : "wss"}://${isDev() ? devUrl : (wsLocation + "/ws")}`;
  ws = new WebSocket(wsUrl);
  ws.binaryType = "arraybuffer";
  ws.onmessage = Socket_onMessage;
  ws.onclose = Socket_onClose;
  ws.onopen = Socket_onOpen;
}

export function Socket_isOpen() {
  return ws && ws.readyState === WebSocket.OPEN;
}

export function requestRespawn(nickname: string) {
  outStream.writeU8(CLIENT_HEADER.REQUEST_RESPAWN);
  outStream.writeString(nickname);
  flushStream();
}

export function flushStream() {
  if (!Socket_isOpen()) return;
  ws.send(outStream.bytes());
  outStream.reset();
}

function Socket_onClose() {
  // automatically reconnect
  setTimeout(() => Socket_connect(), 500);
}

function Socket_onOpen() {
  console.log("WebSocket open!");
  GameClient_clearWorld();
}

export function sendRandomData() {
  return;
  const length = 1 + Math.floor(Math.random() * 100);
  for (let i = 0; i < length; i++) {
    outStream.writeU8(Math.floor(Math.random() * 0xff));
  }
  flushStream();
}

function Socket_onMessage(data: MessageEvent) {
  if (typeof data.data === "string") {
    console.log(data.data);
    if (data.data === "ready") {
      //if (isDev()) setTimeout(() => requestRespawn("DEV_RESPAWN"), 500);
    } else {
    }
  } else {
    const now = Date.now();
    inStream.readFrom(data.data);

    while (inStream.hasMoreData()) {
      const header = inStream.readU8();
      switch (header) {
        case SERVER_HEADER.CHAT:
          GameClient_unpackChat();
          break;
        case SERVER_HEADER.ADD_CLIENT:
          GameClient_unpackAddClient();
          break;
        case SERVER_HEADER.REMOVE_ENTITY:
          GameClient_unpackRemoveEntity();
          break;
        case SERVER_HEADER.SET_OUR_ENTITY:
          GameClient_unpackSetOurEntity();
          break;
        case SERVER_HEADER.CONFIG:
          GameClient_unpackConfig();
          break;
        case SERVER_HEADER.ADD_ENTITY:
          GameClient_unpackAddEntity(now);
          break;
        case SERVER_HEADER.SWAP_ITEM:
          GameClient_unpackSwapItem();
          break;
        case SERVER_HEADER.UPDATE_ENTITY:
          GameClient_unpackUpdateEntity(now);
          break;
        case SERVER_HEADER.ACTION:
          GameClient_unpackAction();
          break;
        case SERVER_HEADER.HIT_BOUNCE_EFFECT:
          GameClient_unpackHitBouceEffect();
          break;
        case SERVER_HEADER.INVENTORY:
          GameClient_unpackInventory();
          break;
        case SERVER_HEADER.HEALTH:
          GameClient_unpackHealth();
          break;
        case SERVER_HEADER.HUNGER:
          GameClient_unpackHunger();
          break;
        case SERVER_HEADER.TEMPERATURE:
          GameClient_unpackTemperature();
          break;
        case SERVER_HEADER.DIED:
          GameClient_unpackDied();
          break;
        case SERVER_HEADER.PING:
          GameClient_unpackPing();
          break;
        case SERVER_HEADER.PING_RESPONSE:
          GameClient_unpackPingResponse();
          break;
        case SERVER_HEADER.LEADERBOARD:
          GameClient_unpackLeaderboard();
          break;
        case SERVER_HEADER.BUILD_MODE:
          GameClient_unpackBuildMode();
          break;
        case SERVER_HEADER.HURT:
          GameClient_unpackHurt();
          break;
        default:
          throw "u " + header;
      }
    }
  }
}