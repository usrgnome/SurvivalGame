import { k2Sprite, mAnimatedSprite, mSprite } from "../Renderer";

type Animation = [
  number, // x offset
  number, // y offset
  number, // angle offset
  number, // translate start x
  number, // translate end x
  number, // translate duration x
  number, // translate easing x
  number, // translate start y
  number, // translate end y
  number, // translate easing y
  number, // translate duration y
  number, // rotation start y
  number, // rotation end y
  number, // rotate easing x
  number, // rotation duration y
  number, // scale start x
  number, // scale end x
  number, // scale duration x
  number, // scale easing x
  number, // scale start y
  number, // scale end y
  number, // scale duration y
  number // scale easing y
];

export function getAnim(): Animation {
  return new Array(23).fill(0) as Animation;
}

export const AnimEnum = {
  xOffset: 0,
  yOffset: 1,
  angleOffset: 2,
  xTranslateStart: 3,
  xTranslateEnd: 4,
  xTranslateDuration: 5,
  xTranslateEasing: 6,
  yTranslateStart: 7,
  yTranslateEnd: 8,
  yTranslateDuration: 9,
  yTranslateEasing: 10,
  rotateStart: 11,
  rotateEnd: 12,
  rotateDuration: 13,
  rotateEasing: 14,
  xScaleStart: 15,
  xScaleEnd: 16,
  xScaleDuration: 17,
  xScaleEasing: 18,
  yScaleStart: 19,
  yScaleEnd: 20,
  yScaleDuration: 21,
  yScaleEasing: 22,
};

const {
  xOffset,
  yOffset,
  angleOffset,
  xTranslateStart,
  xTranslateEnd,
  xTranslateDuration,
  xTranslateEasing,
  yTranslateStart,
  yTranslateEnd,
  yTranslateDuration,
  yTranslateEasing,
  rotateStart,
  rotateEnd,
  rotateDuration,
  rotateEasing,
  xScaleStart,
  xScaleEnd,
  xScaleDuration,
  xScaleEasing,
  yScaleStart,
  yScaleEnd,
  yScaleDuration,
  yScaleEasing,
} = AnimEnum;

export const AnimEasing = {
  linear: 0,
  easeInQuad: 1,
  easeOutQuad: 2,
  easeInOutQuad: 3,
  easeInCubic: 4,
  easeOutCubic: 5,
  easeInOutCubic: 6,
  easeInQuart: 7,
  easeOutQuart: 8,
  easeInOutQuart: 9,
  easeInQuint: 10,
  easeOutQuint: 11,
  easeInOutQuint: 12,
};

const EASING_FUNCTIONS: { [a: number]: (t: number) => number } = {
  [AnimEasing.easeInQuad]: (t) => t * t,
  [AnimEasing.easeOutQuad]: (t) => t * (2 - t),
  [AnimEasing.easeInOutQuad]: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  [AnimEasing.easeInCubic]: (t) => t * t * t,
  [AnimEasing.easeOutCubic]: (t) => (--t) * t * t + 1,
  [AnimEasing.easeInOutCubic]: (t) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  [AnimEasing.easeInQuart]: (t) => t * t * t * t,
  [AnimEasing.easeOutQuart]: (t) => 1 - (--t) * t * t * t,
  [AnimEasing.easeInOutQuart]: (t) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  [AnimEasing.easeInQuint]: (t) => t * t * t * t * t,
  [AnimEasing.easeOutQuint]: (t) => 1 + (--t) * t * t * t * t,
  [AnimEasing.easeInOutQuint]: (t) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
};

export const ANIMATION_OUTPUT =
  new Float32Array([0, 0, 0, 0, 0]); // x, y, rotation, scalex, scaley

export function computeAnimation(
  animation: Animation,
  delta: number,
) {
  // TRANSLATE X
  ANIMATION_OUTPUT[0] = animation[xOffset];
  if (animation[xTranslateDuration] !== 0) {
    let _timer =
      (delta % animation[xTranslateDuration]) /
      animation[xTranslateDuration];
    if (Math.floor(delta / animation[xTranslateDuration]) % 2 === 1) {
      _timer = 1 - _timer;
    }

    if (animation[xTranslateEasing]) {
      _timer = EASING_FUNCTIONS[animation[xTranslateEasing]](_timer);
    }

    ANIMATION_OUTPUT[0] +=
      animation[xTranslateStart] +
      _timer * (animation[xTranslateEnd] - animation[xTranslateStart]);
  }

  // TRANSLATE Y
  ANIMATION_OUTPUT[1] = animation[yOffset];
  if (animation[yTranslateDuration] !== 0) {
    let _timer =
      (delta % animation[yTranslateDuration]) /
      animation[yTranslateDuration];
    if (Math.floor(delta / animation[yTranslateDuration]) % 2 === 1) {
      _timer = 1 - _timer;
    }

    if (animation[yTranslateEasing]) {
      _timer = EASING_FUNCTIONS[animation[yTranslateEasing]](_timer);
    }

    ANIMATION_OUTPUT[1] +=
      animation[yTranslateStart] +
      _timer * (animation[yTranslateEnd] - animation[yTranslateStart]);
  }

  // ROTATION
  ANIMATION_OUTPUT[2] = animation[angleOffset];
  if (animation[rotateDuration] !== 0) {
    let _timer =
      (delta % animation[rotateDuration]) /
      animation[rotateDuration];

    if (Math.floor(delta / animation[rotateDuration]) % 2 === 1) {
      _timer = 1 - _timer;
    }

    if (animation[rotateEasing]) {
      _timer = EASING_FUNCTIONS[animation[rotateEasing]](_timer);
    }

    ANIMATION_OUTPUT[2] +=
      animation[rotateStart] +
      _timer *
      (animation[rotateEnd] -
        animation[rotateStart]);
  }

  // SCALE X
  if (animation[xScaleDuration] !== 0) {
    let _timer =
      (delta % animation[xScaleDuration]) / animation[xScaleDuration];
    if (Math.floor(delta / animation[xScaleDuration]) % 2 === 1) {
      _timer = 1 - _timer;
    }

    if (animation[xScaleEasing]) {
      _timer = EASING_FUNCTIONS[animation[xScaleEasing]](_timer);
    }

    ANIMATION_OUTPUT[3] =
      animation[xScaleStart] +
      _timer * (animation[xScaleEnd] - animation[xScaleStart]);
  }

  // SCALE y
  if (animation[yScaleDuration] !== 0) {
    let _timer =
      (delta % animation[yScaleDuration]) / animation[yScaleDuration];

    if (Math.floor(delta / animation[yScaleDuration]) % 2 === 1) {
      _timer = 1 - _timer;
    }

    if (animation[yScaleEasing]) {
      _timer = EASING_FUNCTIONS[animation[yScaleEasing]](_timer);
    }

    ANIMATION_OUTPUT[4] =
      animation[yScaleStart] +
      _timer * (animation[yScaleEnd] - animation[yScaleStart]);
  }
}

export function computeAndApplyAnimation(
  sprite: mAnimatedSprite,
  animation: Animation,
  delta: number,
) {
  computeAnimation(animation, delta);

  sprite.position.x = ANIMATION_OUTPUT[0];
  sprite.position.y = ANIMATION_OUTPUT[1];

  sprite.rotation = ANIMATION_OUTPUT[2];

  if (animation[xScaleDuration]) sprite.scale.x = ANIMATION_OUTPUT[3];
  else sprite.scale.x = 1;
  if (animation[yScaleDuration]) sprite.scale.y = ANIMATION_OUTPUT[4];
  else sprite.scale.y = 1;
}


export const PI_2 = Math.PI * 2;
export const PI = Math.PI;
export const halfPI = Math.PI * .5;

export const lerp = (start: number, end: number, amt: number): number =>
  (1 - amt) * start + amt * end;

export const clamp = (num: number, min: number, max: number): number =>
  Math.min(Math.max(num, min), max);

export const repeat = (t: number, m: number): number =>
  clamp(t - Math.floor(t / m) * m, 0, m);


export function lerpTheta(a: number, b: number, t: number): number {
  const dt = repeat(b - a, PI_2);
  return lerp(a, a + (dt > PI ? dt - PI_2 : dt), t);
}


export function computeAndApplyAnimationTransition(
  sprite: mAnimatedSprite,
  currentAnimation: Animation,
  currentDelta: number,
  t: number,
) {
  computeAnimation(currentAnimation, currentDelta);

  sprite.position.x =
    (1 - t) * sprite.lastState[0] + t * ANIMATION_OUTPUT[0];
  sprite.position.y =
    (1 - t) * sprite.lastState[1] + t * ANIMATION_OUTPUT[1];

  sprite.rotation = (lerpTheta(sprite.lastState[2], ANIMATION_OUTPUT[2], t));

  if (ANIMATION_OUTPUT[3]) {
    sprite.scale.x = (1 - t) * sprite.lastState[3] + t * ANIMATION_OUTPUT[3];
  } else sprite.scale.x = 1;

  if (ANIMATION_OUTPUT[4]) {
    sprite.scale.y = (1 - t) * sprite.lastState[4] + t * ANIMATION_OUTPUT[4];
  } else sprite.scale.y = 1;
}