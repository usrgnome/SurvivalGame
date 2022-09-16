import { AnimEnum, getAnim } from "../../AnimUtils";

export const humanMoveHandL = getAnim();
humanMoveHandL[AnimEnum.xOffset] = 30;
humanMoveHandL[AnimEnum.yOffset] = 25;
humanMoveHandL[AnimEnum.rotateStart] = humanMoveHandL[AnimEnum.rotateEnd] = .3;
humanMoveHandL[AnimEnum.rotateDuration] = .5;
humanMoveHandL[AnimEnum.xTranslateStart] = 25;
humanMoveHandL[AnimEnum.xTranslateEnd] = 29;
humanMoveHandL[AnimEnum.xTranslateDuration] = .5;
humanMoveHandL[AnimEnum.yTranslateStart] = 10;
humanMoveHandL[AnimEnum.yTranslateEnd] = 2;
humanMoveHandL[AnimEnum.yTranslateDuration] = .5;

export const humanMoveHandR = getAnim();
humanMoveHandR[AnimEnum.xOffset] = -30;
humanMoveHandR[AnimEnum.yOffset] = 25;
humanMoveHandR[AnimEnum.rotateStart] = humanMoveHandR[AnimEnum.rotateEnd] = -.3;
humanMoveHandR[AnimEnum.rotateDuration] = .5;
humanMoveHandR[AnimEnum.xTranslateStart] = -29;
humanMoveHandR[AnimEnum.xTranslateEnd] = -25;
humanMoveHandR[AnimEnum.xTranslateDuration] = .5;
humanMoveHandR[AnimEnum.yTranslateStart] = 2;
humanMoveHandR[AnimEnum.yTranslateEnd] = 10;
humanMoveHandR[AnimEnum.yTranslateDuration] = .5;

export const humanMoveFootL = getAnim();
humanMoveFootL[AnimEnum.xOffset] = -20;
humanMoveFootL[AnimEnum.yOffset] = 0;
humanMoveFootL[AnimEnum.xTranslateStart] = 0;
humanMoveFootL[AnimEnum.xTranslateEnd] = 0;
humanMoveFootL[AnimEnum.xTranslateDuration] = 0;
humanMoveFootL[AnimEnum.yTranslateStart] = 30;
humanMoveFootL[AnimEnum.yTranslateEnd] = -30;
humanMoveFootL[AnimEnum.yTranslateDuration] = .5;

export const humanMoveFootR = getAnim();
humanMoveFootR[AnimEnum.xOffset] = 20;
humanMoveFootR[AnimEnum.yOffset] = 0;
humanMoveFootR[AnimEnum.xTranslateStart] = 0;
humanMoveFootR[AnimEnum.xTranslateEnd] = 0;
humanMoveFootR[AnimEnum.xTranslateDuration] = 0;
humanMoveFootR[AnimEnum.yTranslateStart] = -30
humanMoveFootR[AnimEnum.yTranslateEnd] = 30;
humanMoveFootR[AnimEnum.yTranslateDuration] = .5;