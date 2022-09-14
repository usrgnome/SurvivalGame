interface T_GENERIC {
  id: number;
}

export default class ObjectManager<T extends T_GENERIC> {
  array: T[] = [];
  map: Map<number, number> = new Map;
  unused_ids: number[] = [];
  id_cursor: number = 0;

  insert(obj: T) {
    if (obj.id != -1) throw "Object already exists";

    // store the index of the object in
    const idx = this.array.length;

    // now store it
    this.array.push(obj);

    const id = this.unused_ids.length ? (this.unused_ids.pop() as number) : this.id_cursor++;
    obj.id = id;

    // store a link between the id and the index
    this.map.set(id, idx);
  }

  remove(obj: T) {
    if (obj.id === -1) throw "Object not exist";

    const idx = this.map.get(obj.id) as number; // get object index in array
    let end_idx = this.array.length - 1; // get the last object in array

    // swap the object and the very last object, and pop off the array, much faster then doing .splice() since no re-indexing array
    if (end_idx !== idx) {
      let tmp = this.array[end_idx];
      this.array[end_idx] = obj;
      this.array[idx] = tmp;
      this.map.set(tmp.id, idx);
    }
    this.array.pop();

    // remove from the map
    this.map.delete(obj.id);

    // remove the id from the object, and make to to be reused
    this.unused_ids.push(obj.id);
    obj.id = -1;
  }

  deleteId(id: number) {
    const obj = this.find(id);
    this.remove(obj);
  }

  find(id: number): T {
    const idx = this.map.get(id) as number;
    return this.array[idx];
  }

  has(id: number) {
    return this.map.has(id);
  }
}