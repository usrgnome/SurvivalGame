export function MapEditor_init() {
    (document.getElementById("homepage") as any).style.display = "none";

    const biomes = {
        FORREST: 0,
        SNOW: 1,
        JUNGLE: 2,
        OCEAN: 3,
        DESERT: 4,
        LAVA: 5,
        VOLCANO_PLANE: 6,
        VOLCANO_PEAK: 7,
        MOUNTAIN: 8,
        GLAZIER: 9,
        SAVANA: 10,
        BEACH: 11,
        CAVE: 12,
        ICE_WATER: 13,
        TIAGA: 14,
    }

    const Keys: { [key: string]: keyof typeof biomes } = {
        "KeyY": "FORREST",
        "KeyU": "SNOW",
        "KeyI": "JUNGLE",
        "KeyO": "OCEAN",
        "KeyH": "DESERT",
        "KeyJ": "LAVA",
        "KeyK": "VOLCANO_PLANE",
        "KeyL": "VOLCANO_PEAK",
        "KeyB": "MOUNTAIN",
        "KeyN": "GLAZIER",
        "KeyV": "SAVANA",
        "KeyC": "BEACH",
        "KeyX": "CAVE",
        "KeyZ": "ICE_WATER",
        "KeyT": "TIAGA",
    }

    const COLOURS: string[] = [];
    COLOURS[biomes.FORREST] = "#71b47c";
    COLOURS[biomes.SNOW] = "#daedf8";
    COLOURS[biomes.JUNGLE] = "#aae26f";
    COLOURS[biomes.OCEAN] = "#357ba0";
    COLOURS[biomes.DESERT] = "#efea94";
    COLOURS[biomes.LAVA] = "#ff6600"
    COLOURS[biomes.VOLCANO_PLANE] = "#403333";
    COLOURS[biomes.VOLCANO_PEAK] = "#352a2a";
    COLOURS[biomes.MOUNTAIN] = "#6b7772";
    COLOURS[biomes.GLAZIER] = "#baddf0";
    COLOURS[biomes.SAVANA] = "#a3b471";
    COLOURS[biomes.BEACH] = "#eff8b3";
    COLOURS[biomes.CAVE] = "#b0b0b0";
    COLOURS[biomes.ICE_WATER] = "#448bb0";
    COLOURS[biomes.TIAGA] = "#609276";



    class Polygon {
        points: number[];
        debug = true;
        //@ts-ignore
        color: string = "white";

        constructor(points: number[]) {
            this.points = points;
        }

        isValid() {
            return this.points.length >= 6;
        }

        draw(ctx: CanvasRenderingContext2D) {
            const points = this.points;
            ctx.strokeStyle = "red";
            ctx.fillStyle = "blue";

            if (this.isValid()) {
                ctx.beginPath();
                ctx.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                    ctx.lineTo(points[i], points[i + 1]);
                }

                ctx.lineTo(points[0], points[1]);
                ctx.lineDashOffset = 10;
                ctx.setLineDash([4, 16]);
                if (!this.debug) {
                    ctx.fillStyle = this.color;
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            }

            if (this.debug) {
                for (let i = 0; i < points.length; i += 2) {
                    ctx.fillStyle = i === points.length - 2 ? "blue" : "red";
                    ctx.beginPath();
                    ctx.arc(points[i], points[i + 1], 10 / camera.zoom, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        addPoints(x: number, y: number) {
            this.points.push(x, y);
        }
    }

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const dimensionsStr = prompt("Dimensions: ") || "1000x1000" as string;
    const [mapWidth, mapHeight] = dimensionsStr.split("x").map(a => Number(a));
    const camera = { x: 0, y: 0, zoom: 1 };
    const mouse = { x: 0, y: 0 };
    let keystate = 0;
    let currentPolygon = new Polygon([]);
    // @ts-ignore
    let selectedPolygon: Polygon = null;

    type modes = "INSERT" | "SELECT";
    let mode: modes = "INSERT";

    let biomeData: any = {}
    let biomesPolys: any = {}

    for (let key in biomes) {
        const arr = []
        biomeData[key] = {
            color: COLOURS[biomes[key]],
            polygons: arr,
        }
        biomesPolys[key] = arr;
    }

    const points: [number, number][] = [];
    const polygons: Polygon[] = [];
    let currentBiome: string = "FORREST";
    //polygons.push(new Polygon([0, 0, mapWidth, 0, mapWidth, mapHeight]))

    function getNearestPoint() {
        let nearestDist = Infinity;

        // @ts-ignore
        let nearestPoint = [null, -1] as [Polygon, number];

        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            const verts = polygon.points;

            for (let u = 0; u < verts.length; u += 2) {
                const dx = mouse.x - verts[u + 0];
                const dy = mouse.y - verts[u + 1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist && dist < 30 / camera.zoom) {
                    nearestDist = dist;
                    nearestPoint[0] = polygon;
                    nearestPoint[1] = u;
                }
            }
        }

        return nearestPoint;
    }

    function draw() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let mx = 0;
        let my = 0;
        let ms = 1;
        if (keystate & DIRECTIONS.UP) my--;
        if (keystate & DIRECTIONS.LEFT) mx--;
        if (keystate & DIRECTIONS.DOWN) my++;
        if (keystate & DIRECTIONS.RIGHT) mx++;
        if (keystate & DIRECTIONS.SPEED) ms = 10;

        let invMag = mx || my ? 1 / Math.hypot(mx, my) : 1;
        mx *= invMag;
        my *= invMag;

        camera.x += mx * ms;
        camera.y += my * ms;

        if (keystate & DIRECTIONS.ZOOM_IN) camera.zoom = Math.max(0.01, camera.zoom - 0.01);
        if (keystate & DIRECTIONS.ZOOM_OUT) camera.zoom = Math.max(0, camera.zoom + 0.01);





        ctx.fillStyle = "white";
        ctx.textBaseline = "top";
        ctx.fillText(`Current biome: ` + currentBiome, 0, 0);


        ctx.save();
        ctx.translate(canvas.width * .5, canvas.height * .5);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        ctx.fillStyle = "grey";
        ctx.fillRect(0, 0, mapWidth, mapHeight)

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(point[0], point[1], 10 / camera.zoom, 0, Math.PI * 2);
            ctx.fill();
        }

        polygons.forEach(poly => poly.draw(ctx));

        currentPolygon.draw(ctx);

        const [nearestPoly, idx] = getNearestPoint();
        if (idx !== -1) {
            const x = nearestPoly.points[idx + 0];
            const y = nearestPoly.points[idx + 1];

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(x, y, 10 / camera.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (mode === 'SELECT') {
            if (selectedPolygon) {
                selectedPolygon.draw(ctx);
            }
        }


        ctx.restore();

        let u = 0;
        for (let key in Keys) {
            const biome = Keys[key];
            ctx.font = '25px Sans-serif';
            ctx.fillStyle = COLOURS[biomes[biome]];
            ctx.strokeStyle = "#303030";
            ctx.beginPath()
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            let offy = 30;
            ctx.strokeText(biome + " key: " + key, 0, u * offy + 50);
            ctx.fillText(biome + " key: " + key, 0, u * offy + 50);
            u++;
        }

        ctx.textBaseline = "bottom";
        ctx.fillText("mode: " + mode, 0, canvas.height);

        window.requestAnimationFrame(draw);
    }

    const DIRECTIONS = {
        UP: 1,
        DOWN: 2,
        LEFT: 4,
        RIGHT: 8,
        ZOOM_IN: 16,
        ZOOM_OUT: 32,
        SPEED: 64,
    }


    function inside(x: number, y: number, vs: Polygon) {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html


        const points = vs.points;
        const verts: [number, number][] = [];

        for (let i = 0; i < points.length; i += 2) {
            verts.push([points[i + 0], points[i + 1]]);
        }

        var inside = false;
        for (var i = 0, j = verts.length - 1; i < verts.length; j = i++) {
            var xi = verts[i][0], yi = verts[i][1];
            var xj = verts[j][0], yj = verts[j][1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    window.addEventListener("keydown", function (e) {
        switch (e.code) {
            case 'KeyW':
                keystate |= DIRECTIONS.UP;
                break;
            case 'KeyD':
                keystate |= DIRECTIONS.RIGHT;
                break;
            case 'KeyS':
                keystate |= DIRECTIONS.DOWN;
                break;
            case 'KeyA':
                keystate |= DIRECTIONS.LEFT;
                break;
            case 'KeyE':
                keystate |= DIRECTIONS.ZOOM_OUT;
                break;
            case 'KeyQ':
                keystate |= DIRECTIONS.ZOOM_IN;
                break;
            case 'ShiftLeft':
                keystate |= DIRECTIONS.SPEED;
                break;
        }
    });

    function mouseOnPolygon(): Polygon {
        for(let i = polygons.length -1; i >= 0; i--){
            if(inside(mouse.x, mouse.y, polygons[i])){
                return polygons[i];
            }
        }

        // @ts-ignore
        return null;
    }

    function unselectPolygon() {

        if (selectedPolygon) selectedPolygon.debug = false;

        // @ts-ignore
        selectedPolygon = null;
    }
    function changeMode(newMode: modes) {
        unselectPolygon();
        mode = newMode;
    }

    window.addEventListener("keyup", function (e) {

        if (mode === 'INSERT') {
            if (e.code in Keys) {
                currentBiome = Keys[e.code];
                return;
            }
        }

        console.log(e.code);

        switch (e.code) {
            case 'KeyI':
                mode = "INSERT";
                unselectPolygon();
                break;
            case 'Delete':
                if (selectedPolygon) {
                    polygons.splice(polygons.indexOf(selectedPolygon), 1);

                    for (let key in biomesPolys) {
                        const index = biomesPolys[key].indexOf(selectedPolygon);
                        if (index !== -1) {
                            biomesPolys[key].splice(index, 1);
                        }
                    }
                }

                unselectPolygon();
                break;
            case 'KeyW':
                keystate &= ~DIRECTIONS.UP;
                break;
            case 'KeyD':
                keystate &= ~DIRECTIONS.RIGHT;
                break;
            case 'KeyS':
                keystate &= ~DIRECTIONS.DOWN;
                break;
            case 'KeyA':
                keystate &= ~DIRECTIONS.LEFT;
                break;
            case 'KeyE':
                keystate &= ~DIRECTIONS.ZOOM_OUT;
                break;
            case 'KeyQ':
                keystate &= ~DIRECTIONS.ZOOM_IN;
                break;
            case 'Enter':
                if (currentPolygon.isValid()) {
                    polygons.push(currentPolygon);
                    currentPolygon.color = COLOURS[biomes[currentBiome]];
                    currentPolygon.debug = false;
                    biomesPolys[currentBiome].push(currentPolygon);
                    currentPolygon = new Polygon([])
                }
                break;
            case 'Escape':
                if (mode === 'INSERT') {
                    currentPolygon = new Polygon([]);
                    mode = 'SELECT';
                } else if (mode === 'SELECT') {
                    if (selectedPolygon) selectedPolygon.debug = false;
                    // @ts-ignore
                    selectedPolygon = null;
                }
                break;
            case 'KeyP': {

                const obj: any = {};
                for (let key in biomeData) {
                    obj[key] = {};
                    obj[key].color = biomeData[key].color;
                    obj[key].polygons = [];

                    const polygons = biomeData[key].polygons;
                    for (let u = 0; u < polygons.length; u++) {
                        obj[key].polygons.push(polygons[u].points);
                    }
                }

                console.log(JSON.stringify(obj));
                break;
            }
            case 'ShiftLeft':
                keystate &= ~DIRECTIONS.SPEED;
                break;
            default:
                if (e.code.match(/Digit\d+/)) {
                    const val = Number(e.code.split("Digit")[1]);
                    for (let biome in biomes) {
                        if (biomes[biome] === val) {
                            currentBiome = biome;
                            break;
                        }
                    }
                }
        }
    });

    window.addEventListener('mouseup', (e) => {
        const { x, y } = e;
        const mapX = (x - canvas.width * .5) / camera.zoom + camera.x;
        const mapY = (y - canvas.height * .5) / camera.zoom + camera.y;

        const clippedX = Math.min(Math.max(0, mapX), mapWidth);
        const clippedY = Math.min(Math.max(0, mapY), mapHeight);

        let [nearestPoly, idx] = getNearestPoint();

        if (mode === "INSERT") {

            if (idx !== -1) {

                currentPolygon.addPoints(nearestPoly.points[idx], nearestPoly.points[idx + 1]);
            } else {
                currentPolygon.addPoints(clippedX, clippedY);
            }
        } else if (mode === "SELECT") {

            unselectPolygon();

            let clickedPoly = mouseOnPolygon();
            if(clickedPoly){
                nearestPoly = clickedPoly;
                idx = -2;
            }

            if (idx !== -1) {
                selectedPolygon = nearestPoly;
                selectedPolygon.debug = true;
            } else {
                if (selectedPolygon) selectedPolygon.debug = false;
                // @ts-ignore
                selectedPolygon = null;
            }

        }
    })

    window.addEventListener('mousemove', (e) => {
        const { x, y } = e;
        const mapX = (x - canvas.width * .5) / camera.zoom + camera.x;
        const mapY = (y - canvas.height * .5) / camera.zoom + camera.y;

        const clippedX = Math.min(Math.max(0, mapX), mapWidth);
        const clippedY = Math.min(Math.max(0, mapY), mapHeight);

        mouse.x = clippedX;
        mouse.y = clippedY;
    })


    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', function () {
        resize();
    })

    resize();

    window.requestAnimationFrame(draw);
}
