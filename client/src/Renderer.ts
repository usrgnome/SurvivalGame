import { Sprite } from "./Sprites";

enum k2Type {
  NODE = 0,
  SCENE,
  SPRITE
}

export class mPoint {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  copy(point: mPoint) {
    this.x = point.x;
    this.y = point.y;
  }
}

type tex = HTMLImageElement | HTMLCanvasElement;

export class mTexture {
  src: string;
  texture: tex;
  srcWidth: number;
  srcHeight: number;

  constructor(src: string, size: mPoint, texture: tex = new Image()) {
    this.src = src;
    this.texture = texture;
    this.srcWidth = size.x;
    this.srcHeight = size.y;

    if (this.texture instanceof HTMLImageElement) this.texture.src = src;
  }

  frame(origin: mPoint, size: mPoint, anchor: mPoint, scale: mPoint) {
    return new mFrame(this, origin, size, anchor, scale);
  }
}

export class mFrame {
  texture: mTexture;
  tex: tex;
  anchor: mPoint = new mPoint();
  uvs: [number, number, number, number] = [0, 0, 0, 0];
  size: mPoint = new mPoint();
  scale: mPoint = new mPoint();

  constructor(texture: mTexture, origin: mPoint, size: mPoint, anchor: mPoint, initScale: mPoint) {
    this.scale.copy(initScale);
    this.size.copy(size);
    this.anchor.copy(anchor);
    this.texture = texture;
    this.tex = texture.texture;
    this.uvs[0] = origin.x / texture.srcWidth;
    this.uvs[1] = origin.y / texture.srcHeight;
    this.uvs[2] = (origin.x + size.x) / texture.srcWidth;
    this.uvs[3] = (origin.y + size.y) / texture.srcHeight;
  }
}

interface IAtlas {
  frames: {
    [key: string]: {
      frame: {
        x: number, y: number;
        w: number, h: number;
      }
    }
  };
  meta: {
    size: {
      w: number, h: number;
    }
  };
}

const metaStr = Math.random() <= 10 ? "meta".slice() : "";
const wStr = Math.random() <= 10 ? "w".slice() : "";
const hStr = Math.random() <= 10 ? "h".slice() : "";

export class mAtlas {
  texture: mTexture;
  data: IAtlas;
  constructor(src: string, data: IAtlas) {
    this.texture = new mTexture(src, new mPoint(data.meta.size.w, data.meta.size.h));
    this.data = data;
  }

  frame(name: string, anchor: mPoint, scale: mPoint) {
    const frame = this.data.frames[name + ".png"].frame;
    const width = frame.w;
    const height = frame.h;
    const newPoint = new mPoint(anchor.x * width, anchor.y * height);
    return this.texture.frame(new mPoint(frame.x, frame.y), new mPoint(width, height), newPoint, scale)
  }
}

export class mNode {
  // @ts-ignore
  parent: mNode = null;
  children: mNode[] = [];
  protected depth: number = 0;
  isSprite: boolean = false;
  isGeometry: boolean = false;
  position = new mPoint(0, 0);
  rotation = 0;
  scale = new mPoint(1, 1);
  pivot = new mPoint(0, 0);
  visible = true;
  dirty = false;

  sort() {
    let n = this.children.length;
    for (let i = 1; i < n; i++) {
      let current = this.children[i];
      let j = i - 1;
      while ((j > -1) && (current.depth < this.children[j].depth)) {
        this.children[j + 1] = this.children[j];
        j--;
      }
      this.children[j + 1] = current;
    }

    this.dirty = false;
  }

  add(node: mNode) {
    this.dirty = true;
    node.parent = this;
    this.children.push(node);
  }

  remove(node: mNode) {
    if (node.parent !== this) return;
    // @ts-ignore
    node.parent = null;

    this.children.splice(this.children.indexOf(node), 1);
  }

  setDepth(depth: number) {
    if (this.parent) this.parent.dirty = true;
    this.depth = depth;
  }
}

export class mBufferGeometry extends mNode {
  geometry: number[];
  colours: string[];
  isGeometry = true;
  constructor(geometry: number[], colours: string[]) {
    super();
    this.geometry = geometry;
    this.colours = colours;
  }
}

export class mSprite extends mNode {
  tint: number = 0xFFFFFF00;
  frame: mFrame;
  isSprite = true;
  alpha: number = 1;

  constructor(frame: mFrame) {
    super();
    this.frame = frame;
  }

  onclick: (() => void) | null = null;
}

interface ITextOptions {
  fontFamily: string;
  fontSize: number;
  align: 'center' | 'left' | 'right';
  baseLine: 'top';
  fill: string;
  bg?: string;
  padding?: number;
}

export class mText extends mSprite {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: ITextOptions;

  constructor(text: string, options: ITextOptions) {
    const canvas = document.createElement("canvas");
    const width = 1;
    const height = 1;
    const texture = new mTexture("", new mPoint(width, height), canvas);
    const frame = texture.frame(new mPoint(), new mPoint(width, height), new mPoint(), new mPoint(1, 1));

    super(frame);

    this.options = Object.assign({}, options);
    this.options.padding = this.options.padding || 0;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.updateText(text);
  }

  updateText(text: string) {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const frame = this.frame;

    const fontSize = this.options.fontSize;
    const fontFamily = this.options.fontFamily;

    const fontStr = `${fontSize}px ${fontFamily}`;
    ctx.font = fontStr;
    const padding = (this.options.padding as number);
    const width = (ctx.measureText(text).width || 1) + padding * 2;
    const height = fontSize + padding * 2;

    canvas.width = width;
    canvas.height = height;

    if (this.options.bg) {
      ctx.fillStyle = this.options.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.textBaseline = this.options.baseLine;
    ctx.fillStyle = this.options.fill
    ctx.font = fontStr;
    ctx.textAlign = this.options.align;

    const x = this.options.align === 'right' ? width + padding : padding;
    ctx.fillText(text, x, padding);

    frame.size.x = width;
    frame.size.y = height;
    frame.texture.srcWidth = width;
    frame.texture.srcHeight = height;
  }
}

export class mBufferCanvas extends mSprite {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: ITextOptions;

  constructor() {
    const canvas = document.createElement("canvas");
    const width = 1;
    const height = 1;
    const texture = new mTexture("", new mPoint(width, height), canvas);
    const frame = texture.frame(new mPoint(), new mPoint(width, height), new mPoint(), new mPoint(1, 1));

    super(frame);

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.frame.size.x = width;
    this.frame.size.y = height;
  }

  getCtx() {
    return this.ctx;
  }
}

export class mAnimatedSprite extends mSprite {
  lastState: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  saveState() {
    this.lastState[0] = this.position.x;
    this.lastState[1] = this.position.y;
    this.lastState[2] = this.rotation;
    this.lastState[3] = this.scale.x;
    this.lastState[4] = this.scale.y;
  }
}

const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D;

export class mRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 1920;
  height = 1080;
  scale = 1;
  invScale = 1;
  scaledWidth = 1920;
  scaledHeight = 1080;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  clearScreen(color: string) {
    this.ctx.fillStyle = color;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    const ZOOM = 1;
    const MAX_SCREEN_WIDTH = 1920 * ZOOM;
    const MAX_SCREEN_HEIGHT = 1080 * ZOOM;
    this.scale = Math.max(width / MAX_SCREEN_WIDTH, height / MAX_SCREEN_HEIGHT);
    this.invScale = 1 / this.scale;

    this.scaledWidth = width * this.invScale;
    this.scaledHeight = height * this.invScale;
  }

  render(node: mNode) {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this._render(node);
  }

  _render(node: mNode) {

    if (node.dirty) node.sort();

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(node.position.x, node.position.y);
    ctx.rotate(node.rotation);
    ctx.scale(node.scale.x, node.scale.y);
    ctx.translate(-node.pivot.x, -node.pivot.y);

    if (node.isSprite) {
      const sprite = node as mSprite;
      const uvs = sprite.frame.uvs;
      const size = sprite.frame.size;
      const srcWidth = sprite.frame.texture.srcWidth;
      const srcHeight = sprite.frame.texture.srcHeight;
      const scale = sprite.frame.scale;
      const anchor = sprite.frame.anchor;

      ctx.globalAlpha = sprite.alpha;

      if (false && sprite.tint) {
        tempCanvas.width = size.x * scale.x;
        tempCanvas.height = size.y * scale.y;

        tempCtx.drawImage(
          sprite.frame.tex,
          srcWidth * uvs[0],
          srcHeight * uvs[1],
          srcWidth * (uvs[2] - uvs[0]),
          srcHeight * (uvs[3] - uvs[1]),
          0,
          0,
          size.x * scale.x,
          size.y * scale.y
        );

        tempCtx.globalCompositeOperation = "source-atop";
        tempCtx.fillStyle = "#" + (sprite.tint.toString(16));
        tempCtx.rect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.fill();

        ctx.drawImage(
          tempCanvas,
          -anchor.x * scale.x,
          -anchor.y * scale.y
        );

      } else {
        ctx.drawImage(
          sprite.frame.tex,
          srcWidth * uvs[0],
          srcHeight * uvs[1],
          srcWidth * (uvs[2] - uvs[0]),
          srcHeight * (uvs[3] - uvs[1]),
          -anchor.x * scale.x,
          -anchor.y * scale.y,
          size.x * scale.x,
          size.y * scale.y
        );
      }

      ctx.globalAlpha = 1;
    } else if (node.isGeometry) {
      const bufferGeometry = node as mBufferGeometry;
      const geometry = bufferGeometry.geometry;
      // store points inside the geometry like...
      // X1, Y1, X2, Y2, X3, Y3
      for (let i = 0, idx = 0; i < geometry.length; i += 6, idx++) {
        const color = bufferGeometry.colours[idx];
        const X1 = geometry[i + 0];
        const Y1 = geometry[i + 1];

        const X2 = geometry[i + 2];
        const Y2 = geometry[i + 3];

        const X3 = geometry[i + 4];
        const Y3 = geometry[i + 5];

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(X1, Y1);
        ctx.lineTo(X2, Y2);
        ctx.lineTo(X3, Y3);
        ctx.lineTo(X1, Y1);
        ctx.fill();
      }
    }

    const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.visible) this._render(child);
    }

    ctx.restore();
  }
}

export class k2Node {
  type: k2Type = k2Type.NODE;
  transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  children: k2Node[] = [];
  lastState: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  depth: number = 0;
  active: boolean = true;

  // @ts-ignore
  parent: k2Node = null;

  disable() {
    this.active = false;
  }

  enable() {
    this.active = true;
  }

  resort() {
    let n = this.children.length;
    for (let i = 1; i < n; i++) {
      // Choosing the first element in our unsorted subarray
      let current = this.children[i];
      // The last element of our sorted subarray
      let j = i - 1;
      while ((j > -1) && (current.depth < this.children[j].depth)) {
        this.children[j + 1] = this.children[j];
        j--;
      }
      this.children[j + 1] = current;
    }
  }

  setDepth(depth: number) {
    this.depth = depth;
    this.parent.resort();
  }

  addChild(child: k2Node) {
    this.children.push(child);
    child.parent = this;
    // use insertion sort to resort the data
    this.resort();
  }

  removeChild(child: k2Node) {
    this.children.splice(this.children.indexOf(child), 1);
  }
}

export class k2Scene extends k2Node {
  type = k2Type.SCENE;
};

export class k2Sprite extends k2Node {
  sprite: Sprite;
  type = k2Type.SPRITE;
  scaleX: number = 1;
  scaleY: number = 1;

  constructor(sprite: Sprite, loadImmediatley: boolean, scaleX = 1, scaleY = 1) {
    super();
    this.sprite = sprite;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    if (loadImmediatley && !(this.sprite.loading || this.sprite.loaded)) this.sprite.load();
  }

  saveSate() {
    this.lastState[0] = this.transform.x;
    this.lastState[1] = this.transform.y;
    this.lastState[2] = this.transform.rotation;
    this.lastState[3] = this.transform.scaleX;
    this.lastState[4] = this.transform.scaleY;
  }
};

export class k2Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  scale = 1
  invScale = 1;
  scaledWidth = 1920;
  scaledHeight = 1080;
  width = 1920;
  height = 1080;
  counter = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    this.scale = Math.max(width / 1920, height / 1080);
    this.invScale = 1 / this.scale;

    this.scaledWidth = width * this.invScale;
    this.scaledHeight = height * this.invScale;
  }

  clearScreen(color: string) {
    this.ctx.fillStyle = color;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }


  render(scene: k2Scene) {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    if (scene.active) this.traverse(scene);
  }

  private traverse(node: k2Node) {
    const children = node.children;
    this.ctx.save();
    this.ctx.translate(node.transform.x, node.transform.y);
    this.ctx.rotate(node.transform.rotation);
    this.ctx.scale(node.transform.scaleX, node.transform.scaleY);

    // handle drawing images
    for (let i = 0; i < children.length; ++i) {
      const child = (children[i] as k2Sprite);
      if (!child.active) continue;
      if (child.type === k2Type.SPRITE) {
        const sprite = child.sprite;
        if (sprite.loaded) {
          const img = sprite.img;
          this.ctx.save();
          this.ctx.translate(child.transform.x, child.transform.y);
          this.ctx.rotate(child.transform.rotation);
          this.ctx.scale(child.transform.scaleX, child.transform.scaleY);
          //this.ctx.fillStyle = "red"
          //this.ctx.fillRect(-sprite.halfWidth * child.scaleX, -sprite.halfHeight * child.scaleY, sprite.width * child.scaleX, sprite.height * child.scaleY);
          this.ctx.drawImage(img, -sprite.halfWidth * child.scaleX, -sprite.halfHeight * child.scaleY, sprite.width * child.scaleX, sprite.height * child.scaleY);
          //this.ctx.beginPath();
          //this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
          //this.ctx.fillStyle = "blue";
          //this.ctx.fill();
          this.ctx.restore();
        } else if (!child.sprite.loading) {
          sprite.load();
        }
      }

      this.traverse(child);
    }

    // exit out of the node
    this.ctx.restore();
  }
}