import { GameClient_enterPressed, GameClient_mouseDown, GameClient_mouseUp, GameClient_tryHit, isChatOpen, renderer } from "./GameClient";

let keyState = 0;
let lastKeyState = 0;
let lastMouse = 0;
export let mouse = 0;
let lastUpdate = 0;
export let mouseX = 0;
export let mouseY = 0;

export function getKeyState() {
  let ret = keyState;
  lastKeyState = ret;
  return ret;
}

export function getMouseState() {
  let ret = mouse;
  lastMouse = ret;
  return ret;
}

export function isControlsDirty() {
  const now = Date.now();
  let ret = (keyState !== lastKeyState || lastMouse !== mouse) && (now - lastUpdate) > 1000 / 15;
  if (ret) lastUpdate = now;
  return ret;
}

export function initControls() {
  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case 'KeyW':
        if (!isChatOpen) keyState |= 1;
        break;
      case 'KeyD':
        if (!isChatOpen) keyState |= 2;
        break;
      case 'KeyS':
        if (!isChatOpen) keyState |= 4;
        break;
      case 'KeyA':
        if (!isChatOpen) keyState |= 8;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case 'KeyW':
        if (!isChatOpen) keyState &= ~1;
        break;
      case 'KeyD':
        if (!isChatOpen) keyState &= ~2;
        break;
      case 'KeyS':
        if (!isChatOpen) keyState &= ~4;
        break;
      case 'KeyA':
        if (!isChatOpen) keyState &= ~8;
        break;
      case 'Enter':
        GameClient_enterPressed();
        break;
    }
  })
}

export function stopMoving() {
  keyState = 0;
}

window.addEventListener("mousemove", (e) => {
  mouse = Math.atan2(e.y - window.innerHeight * .5, e.x - window.innerWidth * .5);
  mouseX = e.x * renderer.invScale;
  mouseY = e.y * renderer.invScale;
});

window.addEventListener("mousedown", (e) => {
  mouse = Math.atan2(e.y - window.innerHeight * .5, e.x - window.innerWidth * .5);
  GameClient_mouseDown();
});

window.addEventListener("mouseup", (e) => {
  mouse = Math.atan2(e.y - window.innerHeight * .5, e.x - window.innerWidth * .5);
  GameClient_mouseUp();
});