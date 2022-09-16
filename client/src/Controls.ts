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

const ControlEnum = {
  MOVE_UP: '0',
  MOVE_LEFT: '1',
  MOVE_RIGHT: '2',
  MOVE_DOWN: '3',
  SLOT_1: '4',
  SLOT_2: '5',
  SLOT_3: '6',
  SLOT_4: '7',
  SLOT_5: '8',
  SLOT_6: '9',
  SLOT_7: '10',
  SLOT_8: '11',
  SLOT_9: '12',
  SLOT_10: '13',
  CHAT: '14',
}

const defaultKeybinds = {
  [ControlEnum.MOVE_UP]: 'KeyW',
  [ControlEnum.MOVE_LEFT]: 'KeyA',
  [ControlEnum.MOVE_RIGHT]: 'KeyD',
  [ControlEnum.MOVE_DOWN]: 'KeyS',
  [ControlEnum.SLOT_1]: 'Digit0',
  [ControlEnum.SLOT_2]: 'Digit1',
  [ControlEnum.SLOT_3]: 'Digit2',
  [ControlEnum.SLOT_4]: 'Digit3',
  [ControlEnum.SLOT_5]: 'Digit4',
  [ControlEnum.SLOT_6]: 'Digit5',
  [ControlEnum.SLOT_7]: 'Digit6',
  [ControlEnum.SLOT_8]: 'Digit7',
  [ControlEnum.SLOT_9]: 'Digit8',
  [ControlEnum.SLOT_10]: 'Digit9',
  [ControlEnum.CHAT]: 'Enter',
}


function saveKeys() {
  localStorage.setItem("keybinds", JSON.stringify(KeyBinds));
}

function loadKeys(): typeof defaultKeybinds {
  try {
    let _keyBinds: any = JSON.parse(localStorage.getItem("keyBinds") as any) || defaultKeybinds;

    for (let key in defaultKeybinds) {
      if (!(key in _keyBinds)) {
        _keyBinds[key] = defaultKeybinds[key];
      }
    }

    return _keyBinds;
  } catch (e) {
    console.error(e);

    return JSON.parse(JSON.stringify(defaultKeybinds));
  }
}

const KeyBinds = loadKeys();

export function initControls() {
  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case KeyBinds[ControlEnum.MOVE_UP]:
        if (!isChatOpen) keyState |= 1;
        break;
      case KeyBinds[ControlEnum.MOVE_RIGHT]:
        if (!isChatOpen) keyState |= 2;
        break;
      case KeyBinds[ControlEnum.MOVE_DOWN]:
        if (!isChatOpen) keyState |= 4;
        break;
      case KeyBinds[ControlEnum.MOVE_LEFT]:
        if (!isChatOpen) keyState |= 8;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case KeyBinds[ControlEnum.MOVE_UP]:
        if (!isChatOpen) keyState &= ~1;
        break;
      case KeyBinds[ControlEnum.MOVE_RIGHT]:
        if (!isChatOpen) keyState &= ~2;
        break;
      case KeyBinds[ControlEnum.MOVE_DOWN]:
        if (!isChatOpen) keyState &= ~4;
        break;
      case KeyBinds[ControlEnum.MOVE_LEFT]:
        if (!isChatOpen) keyState &= ~8;
        break;
      case KeyBinds[ControlEnum.CHAT]:
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