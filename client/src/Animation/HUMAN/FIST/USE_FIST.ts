import { AnimEasing, AnimEnum, getAnim } from "../../AnimUtils";

export const humanUseHandR = getAnim();
humanUseHandR[AnimEnum.xOffset] = -30;
humanUseHandR[AnimEnum.yOffset] = 30;
humanUseHandR[AnimEnum.rotateStart] = -.3;
humanUseHandR[AnimEnum.rotateEnd] = -.8;
humanUseHandR[AnimEnum.rotateDuration] = .2;
humanUseHandR[AnimEnum.xTranslateStart] = -25;
humanUseHandR[AnimEnum.xTranslateEnd] = 20;
humanUseHandR[AnimEnum.xTranslateDuration] = 0.2;
humanUseHandR[AnimEnum.xTranslateEasing] = AnimEasing.easeInCubic;
humanUseHandR[AnimEnum.yTranslateStart] = 2;
humanUseHandR[AnimEnum.yTranslateEnd] = 40;
humanUseHandR[AnimEnum.yTranslateDuration] = 0.2;


export const humanUseHandL = getAnim();
humanUseHandL[AnimEnum.xOffset] = 30;
humanUseHandL[AnimEnum.yOffset] = 30;
humanUseHandL[AnimEnum.rotateStart] = .3;
humanUseHandL[AnimEnum.rotateEnd] = .8;
humanUseHandL[AnimEnum.rotateDuration] = .2;
humanUseHandL[AnimEnum.xTranslateStart] = 25;
humanUseHandL[AnimEnum.xTranslateEnd] = -20;
humanUseHandL[AnimEnum.xTranslateEasing] = AnimEasing.easeInCubic;
humanUseHandL[AnimEnum.xTranslateDuration] = 0.2;
humanUseHandL[AnimEnum.yTranslateStart] = 2;
humanUseHandL[AnimEnum.yTranslateEnd] = 40;
humanUseHandL[AnimEnum.yTranslateDuration] = 0.2;