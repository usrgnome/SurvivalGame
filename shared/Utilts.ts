const max = Math.PI * 2;
export function lerpAngle(a1: number, a2: number, t: number) {
  const diff = (a2 - a1) % max;
  return a1 + (2 * diff % max - diff) * t;
}

export function modulo(a: number, b: number): number {
  var r = a % b;
  return (r * b < 0) ? r + b : r;
}



export function angleDifference(a0: number, a1: number) {
  const da = (a1 - a0) % max;
  return Math.abs(2 * da % max - da);
}

export function getRandomPointInPolygon(polygon: number[]): [number, number] {

  // generate the bounding box of the polygon

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < polygon.length; i += 2) {
    const x = polygon[i + 0];
    const y = polygon[i + 1];

    if (x <= minX) minX = x;
    if (x >= maxX) maxX = x;

    if (y <= minY) minY = y;
    if (y >= maxY) maxY = y;
  }

  let x = 0;
  let y = 0;

  do {
    let inside = false;
    x = minX + Math.random() * (maxX - minX);
    y = minY + Math.random() * (maxY - minY);

    for (let i = 0, j = polygon.length - 1 * 2; i < polygon.length; i += 2) {
      const xi = polygon[i + 0], yi = polygon[i + 1];
      const xj = polygon[j + 0], yj = polygon[j + 1];
      j = i;
      const intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;

    }

    if (inside) break;
  } while (true);

  return [x, y];
}

export function randomArrayIndex(array: any){
  return Math.floor(Math.random() * array.length);
}