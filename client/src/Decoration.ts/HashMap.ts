import AABB from "./AABB";
import k2AABB from "./AABB";

interface IInsertable {
  _hash_index: number;
  _hash_grids: { [key: string]: number };
  _hash_need_update: boolean;
  getAABB(): AABB<any>
}

let shift = 500; // how big each grid is (bigger = fastery query but less accurate)

export class HashMap<T extends IInsertable> {
  objects: T[] = [];
  grid: { [key: string]: T[] } = {};
  duplicates: Map<number, boolean> = new Map();

  remove(obj: T, remove_from_objects: boolean = true) {
    if (remove_from_objects) {
      if (obj._hash_index === -1)
        throw new Error("[Spatial Grid] Object was already removed!");
      const index = obj._hash_index;
      const len = this.objects.length - 1;

      if (index !== len) {
        const tmp = this.objects[len];
        this.objects[len] = this.objects[index];
        this.objects[index] = tmp;
        tmp._hash_index = index;
      }

      this.objects.pop();
      obj._hash_index = -1;
    }

    for (let hash in obj._hash_grids) {
      const index = obj._hash_grids[hash];
      const bucket = this.grid[hash];
      const len = bucket.length - 1;

      if (index !== len) {
        const tmp = bucket[len];
        bucket[len] = bucket[index];
        bucket[index] = tmp;
        tmp._hash_grids[hash] = index;
      }

      bucket.pop();

      if (bucket.length === 0) delete this.grid[hash];
      delete obj._hash_grids[hash];
    }
  }

  insert(obj: T, insert_into_objects: boolean = true) {
    const aabb = obj.getAABB();

    let minX = Math.floor(aabb.minX / shift);
    let minY = Math.floor(aabb.minY / shift);
    let maxX = Math.ceil(aabb.maxX / shift);
    let maxY = Math.ceil(aabb.maxY / shift);

    if (insert_into_objects) {
      const len = this.objects.length;
      this.objects.push(obj);
      obj._hash_index = len;
    }

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        let hash = x + ":" + y;
        if (!this.grid[hash]) this.grid[hash] = [];
        let bucket = this.grid[hash];
        let len = bucket.length;
        bucket[len] = obj;
        obj._hash_grids[hash] = len;
      }
    }
  }

  search(aabb: AABB<T>): T[] {
    let minX = Math.floor(aabb.minX / shift);
    let minY = Math.floor(aabb.minY / shift);
    let maxX = Math.ceil(aabb.maxX / shift);
    let maxY = Math.ceil(aabb.maxY / shift);

    const data: T[] = [];
    const duplicates = this.duplicates;
    duplicates.clear();

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        let hash = x + ":" + y;
        if (this.grid[hash]) {
          const bucket = this.grid[hash];
          for (let i = 0; i < bucket.length; i++) {
            let v = bucket[i]._hash_index;
            if (!duplicates.has(v)) {
              data.push(bucket[i]);
              duplicates.set(v, true);
            }
          }
        }
      }
    }

    return data;
  }

  update_system() {
    const objects = this.objects;
    const len = objects.length;
    // @ts-ignore
    let obj: T = null;
    for (let i = 0; i < len; i++) {
      obj = objects[i];
      if (obj._hash_need_update) {
        this.remove(obj, false);
        this.insert(obj, false);
        obj._hash_need_update = false;
      }
    }
  }

  debug(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "black";
    for (let hash in this.grid) {
      const [x, y] = hash.split(":").map((a) => parseInt(a));
      ctx.beginPath();
      ctx.rect(x * shift, y * shift, shift, shift);
      ctx.stroke();
    }
  }
}