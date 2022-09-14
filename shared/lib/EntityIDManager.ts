export default class EntityIdManager {
  array: number[] = [];
  map: Map<number, number> = new Map;

  insert(id: number) {
    if (this.map.has(id)) throw "Object already exists: " + id;
    // store the index of the object in
    const idx = this.array.length;

    // now store it
    this.array.push(id);

    // store a link between the id and the index
    this.map.set(id, idx);
  }

  remove(id: number) {
    if (!this.map.has(id)) throw "Object not exist";

    const idx = this.map.get(id) as number; // get object index in array
    let end_idx = this.array.length - 1; // get the last object in array

    // swap the object and the very last object, and pop off the array, much faster then doing .splice() since no re-indexing array
    if (end_idx !== idx) {
      let tmp = this.array[end_idx];
      this.array[end_idx] = id;
      this.array[idx] = tmp;
      this.map.set(tmp, idx);
    }

    this.array.pop();

    // remove from the map
    this.map.delete(id);

    // remove the id from the object, and make to to be reused
  }

  has(id: number) {
    return this.map.has(id);
  }

  reset(){
    this.array.length = 0;
    this.map.clear();
  }
}