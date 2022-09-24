import { Vector } from 'matter-js'
import { logger, loggerLevel } from './Logger'

export function mapVertsToMatterVerts(verts: number[]) {
    const v = []

    for (let i = 0; i < verts.length; i += 2) {
        const vx = verts[i + 0]
        const vy = verts[i + 1]
        v.push(Vector.create(vx, vy))
    }

    return v
}

export function get_polygon_centroid(pts) {
    pts = pts.slice() // make a shallow copy, make sure this is SAFE
    const first = pts[0],
        last = pts[pts.length - 1]
    if (first.x != last.x || first.y != last.y) pts.push(first)
    let twicearea = 0,
        x = 0,
        y = 0,
        nPts = pts.length,
        p1,
        p2,
        f
    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
        p1 = pts[i]
        p2 = pts[j]
        f =
            (p1.y - first.y) * (p2.x - first.x) -
            (p2.y - first.y) * (p1.x - first.x)
        twicearea += f
        x += (p1.x + p2.x - 2 * first.x) * f
        y += (p1.y + p2.y - 2 * first.y) * f
    }
    f = twicearea * 3
    return { x: x / f + first.x, y: y / f + first.y }
}

export function assert(condition: boolean, message = 'Assetion failed!') {
    if (!condition) {
        logger.log(loggerLevel.error, `GameServer: assert failed: ${message}`)
        throw message
    }
}
