import { initControls } from "./Controls";
import { GameClient_render, GameClient_resize, GameClient_update } from "./GameClient";
import { MapEditor_init } from "./mapEditor.ts/mapEditor";
import "./Socket";
import { requestRespawn, Socket_connect } from "./Socket";
import Stats from "stats-js";
import { mRenderer, mText } from "./Renderer";


const stats = Stats();

document.body.appendChild(stats.dom);

function init() {
  initControls();
  GameClient_resize(); // automatically resize the canvas for the first time
  window.addEventListener("resize", GameClient_resize); // attach a resize listener

  (document.getElementById("play-btn") as any).addEventListener("click", function () {
    const nickname = (document.getElementById("nickname-input") as HTMLInputElement).value + ""; // cast to a string
    requestRespawn(nickname);
  });

  Socket_connect();
}

let then = Date.now()
function tick() {
  const now = Date.now();
  const delta = Math.min((now - then) / 1000, 1 / 30);
  then = now;
  GameClient_update(now, delta);
  GameClient_render(); // render the game world
  window.requestAnimationFrame(tick);
  stats.update();
}

init();
tick();



MapEditor_init();