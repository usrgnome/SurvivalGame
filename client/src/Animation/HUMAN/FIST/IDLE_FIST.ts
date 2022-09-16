import { AnimEnum, getAnim } from "../../AnimUtils";

export const humanIdleHandL = getAnim();
humanIdleHandL[AnimEnum.xOffset] = 30;
humanIdleHandL[AnimEnum.yOffset] = 30;
humanIdleHandL[AnimEnum.rotateStart] = humanIdleHandL[AnimEnum.rotateEnd] = .3;
humanIdleHandL[AnimEnum.rotateDuration] = 1;
humanIdleHandL[AnimEnum.xTranslateStart] = 25;
humanIdleHandL[AnimEnum.xTranslateEnd] = 30;
humanIdleHandL[AnimEnum.xTranslateDuration] = 1;
humanIdleHandL[AnimEnum.yTranslateStart] = 2;
humanIdleHandL[AnimEnum.yTranslateEnd] = 0;
humanIdleHandL[AnimEnum.yTranslateDuration] = 1;

export const humanIdleHandR = getAnim();
humanIdleHandR[AnimEnum.xOffset] = -30;
humanIdleHandR[AnimEnum.yOffset] = 30;
humanIdleHandR[AnimEnum.rotateStart] = humanIdleHandR[AnimEnum.rotateEnd] = -.3;
humanIdleHandR[AnimEnum.rotateDuration] = 1;
humanIdleHandR[AnimEnum.xTranslateStart] = -25;
humanIdleHandR[AnimEnum.xTranslateEnd] = -30;
humanIdleHandR[AnimEnum.xTranslateDuration] = 1;
humanIdleHandR[AnimEnum.yTranslateStart] = 2;
humanIdleHandR[AnimEnum.yTranslateEnd] = 0;
humanIdleHandR[AnimEnum.yTranslateDuration] = 1;