import { SPRITE } from "../../../shared/Sprite";
import { renderer } from "../GameClient";
import { mNode, mSprite, mText } from "../Renderer";
import { Sprites } from "../Sprites";

const root = new mNode();
const bg: mSprite = new mSprite(Sprites[SPRITE.LEADERBOARD_BG]);
const rankLabels: mText[] = [];
const nameLabels: mText[] = [];
const scoreLabels: mText[] = [];
export const Leaderboard_maxSize = 10;

root.add(bg);

const fontName = `"Baloo Paaji", Verdana, sans-serif`;

for (let i = 0; i < Leaderboard_maxSize; i++) {
  const rank = new mText("" + i + ".", {
    fontFamily: fontName,
    fontSize: 25,
    align: 'left',
    baseLine: 'top',
    fill: 'white',
  });

  const nameLabel = new mText("", {
    fontFamily: fontName,
    fontSize: 21,
    align: 'left',
    baseLine: 'top',
    fill: '#ede6c2',
  });

  const scoreLabel = new mText("", {
    fontFamily: fontName,
    fontSize: 21,
    align: 'right',
    baseLine: 'top',
    fill: '#ede6c2',
  });

  const base = 60;
  const spaceY = 27;
  rank.position.x = 10;
  rank.position.y = base + i * spaceY;

  nameLabel.position.x = 45;
  nameLabel.position.y = base + i * spaceY + 3;

  scoreLabel.position.x = 190;
  scoreLabel.position.y = base + i * spaceY + 3;

  rankLabels.push(rank);
  nameLabels.push(nameLabel);
  scoreLabels.push(scoreLabel);

  root.add(rank);
  root.add(nameLabel);
  root.add(scoreLabel);
}

function reposition() {
  root.position.x = renderer.width * renderer.invScale - bg.frame.size.x * bg.frame.scale.x - 5;
}


function numberToLeaderboard(num: number): string {
  if (num > 9999999) return Math.floor(num / 1000000) + "M";
  if (num > 999999) return (Math.floor((num / 1000000) * 100) / 100 + "M");
  if (num > 99999) return (Math.floor((num / 1000)) + "K").replace(".0", "");
  if (num > 9999) return (Math.floor((num / 1000) * 10) / 10 + "K").replace(".0", "");
  if (num > 0) return String(Math.floor(num));
  return String(num);
}

function updateLeaderboardValue(index: number, name: string, score: number) {
  const nameLabel = nameLabels[index];
  const scoreLabel = scoreLabels[index];

  scoreLabel.position.x = 220;
  nameLabel.updateText(name);
  scoreLabel.updateText(numberToLeaderboard(score));

  nameLabel.visible = true;
  scoreLabel.visible = true;
}

function showLeaderboardValue(index: number, show: boolean) {
  nameLabels[index].visible = show;
  scoreLabels[index].visible = show;
}

export const Leaderboard_sprite = root;
export const Leaderboard_reposition = reposition;
export const Leaderboard_updateValue = updateLeaderboardValue;
export const Leaderboard_showValue = showLeaderboardValue;