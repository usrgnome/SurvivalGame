import { mNode } from "../Renderer";
import { ANIMATION } from "../../../shared/AnimationConfig";
import { worldLayer1 } from "../GameClient";

type SnapShot = [number, number, number, number];

const cachedSnapShots: SnapShot[] = [];

export function getSnapShot(timestamp: number, x: number, y: number, rotation: number): SnapShot {
  const snapshot = cachedSnapShots.length ? cachedSnapShots.pop() as SnapShot : [0, 0, 0, 0] as SnapShot;
  snapshot[0] = timestamp;
  snapshot[1] = x;
  snapshot[2] = y;
  snapshot[3] = rotation;
  return snapshot;
}

export function storeSnapShot(snapshot: SnapShot) {
  cachedSnapShots.push(snapshot);
}

export class Entity {
  id: number = -1;
  type: number = 0;
  buffer: SnapShot[] = [];
  delta: number = 0;
  animationState: number = ANIMATION.IDLE_FIST;
  totalTransitionTime = 1;
  transition = 0;
  isTransition: boolean = false;
  // @ts-ignore
  root: mNode = null;
  doInterpolation: boolean = false;
  doUpdate: boolean = false;

  constructor(type: number) {
    this.type = type;
  }

  changeAnimState(newState: number) {
    this.animationState = newState;
    this.delta = 0;
    this.transition = 0;
    this.isTransition = true;
  }

  /**
   * @override
   * @param x 
   * @param y 
   * @param rotation 
   */
  setTransform(x: number, y: number, rotation: number) {
    this.root.position.x = x;
    this.root.position.y = y;
    this.root.rotation = rotation;
  }

  setRotation(rotation: number) {
    this.root.rotation = rotation;
  }

  updateHealth(health: number){};

  addToScene() {
    worldLayer1.add(this.root);
  }
  removeFromScene() {
    worldLayer1.remove(this.root);
  }

  update(delta: number) { };
  onAnimationOver() { }
}