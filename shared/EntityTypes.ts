// note, the numbers are render order
let $v = 0;
export const types = {
  ROCK: $v++,
  PLAYER: $v++,
  WOLF: $v++,
  WALL: $v++,
  TREE: $v++,
}

export const networkTypes = {
  NONE: 0,
  ADDED: 1,
  UPDATES: 2,
  REMOVED: 4,
  ALL: 0xFF,
}