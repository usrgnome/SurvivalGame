import { SPRITE } from "../../shared/Sprite";
import { mAtlas, mPoint, mSprite, mTexture } from "./Renderer";
import itemsJSON from "./atlas/itemAtlas.json";
import decorationJSON from "./atlas/decorationAtlas.json";
import uiJSON from "./atlas/uiAtlas.json";
import playerJSON from "./atlas/playerAtlas.json";

export class Sprite {
  img: HTMLImageElement;
  src: string;
  loaded = false;
  loading = false;
  halfWidth: number = 0;
  halfHeight: number = 0;
  width: number = 0;
  height: number = 0;
  private pivotX: number = 1;
  private pivotY: number = 1;

  constructor(src, pivotX: number = .5, pivotY: number = .5) {
    this.img = new Image();
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.src = src;
  }

  onload() {
    this.loaded = true;
    this.loading = false;
    this.halfHeight = this.img.height * this.pivotY;
    this.halfWidth = this.img.width * this.pivotX;
    this.width = this.img.width;
    this.height = this.img.height;
  }

  load() {
    this.loaded = false;
    this.loading = true;
    this.img.onload = this.onload.bind(this);
    this.img.src = this.src;
  }
}

const treeAtlas = new mTexture("img/entity/tree11.png", new mPoint(1148, 543));
const healthBarBorder = new mTexture("img/ui/health-gauge-front.png", new mPoint(293, 60));
const healthBarFillColor = new mTexture("img/ui/health-gauge-background-object.png", new mPoint(293, 60));
const healthBarBgColor = new mTexture("img/ui/health-gauge-background.png", new mPoint(293, 60));
const leaderboardBg = new mTexture("img/ui/leaderboard.png", new mPoint(500, 660));
const slotAtlas = new mTexture("img/ui/inv_slot.png", new mPoint(462, 462));
const swordSlotAtlas = new mTexture("img/ui/inv_sword_stone.png", new mPoint(462, 462));
const spearSlotAtlas = new mTexture("img/ui/inv_spear_stone.png", new mPoint(462, 462));
const stoneSprite = new mTexture("img/entity/stone1.png", new mPoint(520, 549));
const wolfTexture = new mTexture("img/entity/wolf.png", new mPoint(224, 224));

const itemAtlas = new mAtlas("img/item/itemAtlas.png", itemsJSON);
const decorationAtlas = new mAtlas("img/decoration/decorationAtlas.png", decorationJSON);
const playerAtlas = new mAtlas("img/entity/playerAtlas.png", playerJSON);
const uiAtlas = new mAtlas("img/ui/uiAtlas.png", uiJSON);

const playerBodySprite = new mTexture("img/entity/player.png", new mPoint(196, 216));
const playerHandSprite = new mTexture("img/entity/hand.png", new mPoint(196, 216));
const swordSprite = new mTexture("img/entity/sword.png", new mPoint(1080, 1080));

const unitScale = new mPoint(1, 1);
const halfScale = new mPoint(.5, .5);
const quaterScale = new mPoint(.22, .22);
const originPoint = new mPoint(0, 0);

export const Sprites: any = {
  [SPRITE.TREE]: treeAtlas.frame(originPoint, new mPoint(1148, 543), new mPoint(1148 * .5, 543 * .5), halfScale),
  [SPRITE.SPINNER]: treeAtlas.frame(originPoint, new mPoint(1396, 1352), new mPoint(1396 * .5, 1352 * .5), new mPoint(.1, .1)),
  [SPRITE.PLAYER]: playerBodySprite.frame(originPoint, new mPoint(196, 216), new mPoint(196 * .5, 216 * .5), unitScale),
  [SPRITE.PLAYER_ARM_L]: playerHandSprite.frame(originPoint, new mPoint(44, 44), new mPoint(44 * .5, 44 * .5), unitScale),
  [SPRITE.PLAYER_ARM_R]: playerHandSprite.frame(originPoint, new mPoint(44, 44), new mPoint(44 * .5, 44 * .5), unitScale),
  [SPRITE.SWORD]: swordSprite.frame(originPoint, new mPoint(1080, 1080), new mPoint(1080 * .2, 1080 * .7), new mPoint(.3, .3)),
  [SPRITE.SPEAR]: itemAtlas.frame("spear_amethyst", originPoint, halfScale),
  [SPRITE.HEALTH_BAR_BAR_BORDER]: healthBarBorder.frame(originPoint, new mPoint(293, 60), new mPoint(293 * .5, 60 * .5), halfScale),
  [SPRITE.HEALTH_BAR_BAR_COLOR]: healthBarFillColor.frame(originPoint, new mPoint(293, 60), new mPoint(293 * 0, 60 * .5), halfScale),
  [SPRITE.HEALTH_BAR_BG_COLOR]: healthBarBgColor.frame(originPoint, new mPoint(293, 60), new mPoint(293 * .5, 60 * .5), halfScale),
  [SPRITE.LEADERBOARD_BG]: leaderboardBg.frame(originPoint, new mPoint(500, 660), new mPoint(0, 0), halfScale),
  [SPRITE.SLOT]: slotAtlas.frame(originPoint, new mPoint(462, 462), new mPoint(0, 0), quaterScale),
  [SPRITE.WOLF]: wolfTexture.frame(originPoint, new mPoint(224, 224), new mPoint(224 * .5, 224 * .5), new mPoint(.8, .8)),
  [SPRITE.INV_SPEAR_SLOT]: spearSlotAtlas.frame(originPoint, new mPoint(462, 462), new mPoint(0, 0), quaterScale),
  [SPRITE.INV_SWORD_SLOT]: swordSlotAtlas.frame(originPoint, new mPoint(462, 462), new mPoint(0, 0), quaterScale),
  [SPRITE.STONE]: stoneSprite.frame(originPoint, new mPoint(520, 549), new mPoint(520 * .5, 549 * .5), halfScale),
  [SPRITE.FOOT_L]: playerAtlas.frame("footl2", halfScale, halfScale),
  [SPRITE.FOOT_R]: playerAtlas.frame("footr2", halfScale, halfScale),
  [SPRITE.FLOWER0]: decorationAtlas.frame("dragon_flower1", halfScale, halfScale),
  [SPRITE.FLOWER1]: decorationAtlas.frame("dragon_flower2", halfScale, halfScale),
  [SPRITE.FLOWER2]: decorationAtlas.frame("flower1", halfScale, halfScale),
  [SPRITE.FLOWER3]: decorationAtlas.frame("flower2", halfScale, halfScale),
  [SPRITE.FLOWER4]: decorationAtlas.frame("flower3", halfScale, halfScale),
  [SPRITE.FLOWER5]: decorationAtlas.frame("flower4", halfScale, halfScale),
  [SPRITE.FLOWER6]: decorationAtlas.frame("flower5", halfScale, halfScale),
  [SPRITE.FLOWER7]: decorationAtlas.frame("flower6", halfScale, halfScale),
  [SPRITE.FLOWER8]: decorationAtlas.frame("flower7", halfScale, halfScale),
  [SPRITE.FLOWER9]: decorationAtlas.frame("flower8", halfScale, halfScale),
  [SPRITE.FLOWER10]: decorationAtlas.frame("flower9", halfScale, halfScale),
  [SPRITE.GRASS0]: decorationAtlas.frame("grass1", halfScale, halfScale),
  [SPRITE.GRASS1]: decorationAtlas.frame("grass2", halfScale, halfScale),
  [SPRITE.GRASS2]: decorationAtlas.frame("grass3", halfScale, halfScale),
  [SPRITE.GRASS3]: decorationAtlas.frame("grass4", halfScale, halfScale),
  [SPRITE.GRASS4]: decorationAtlas.frame("grass5", halfScale, halfScale),
  [SPRITE.GRASS5]: decorationAtlas.frame("grass6", halfScale, halfScale),
  [SPRITE.HEALTH_BAR]: uiAtlas.frame("health_bar", halfScale, halfScale),
  [SPRITE.FOOD_BAR]: uiAtlas.frame("food_bar", halfScale, halfScale),
  [SPRITE.COLD_BAR]: uiAtlas.frame("cold_bar", halfScale, halfScale),
};

