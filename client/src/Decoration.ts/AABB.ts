export default class AABB<T> {
  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  ref: T;
  // @ts-ignore
  constructor(ref: T = null) {
    this.ref = ref;
  }
}

export function k2AABBOverlap<T>(a: AABB<T>, b: AABB<T>) {
  return (
    a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
  );
}
