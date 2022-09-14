import { AnimEasing, AnimEnum, getAnim } from "../../AnimUtils";

export const humanAttackItem = getAnim();
humanAttackItem[AnimEnum.xOffset] = -40;
humanAttackItem[AnimEnum.yOffset] = 30;
humanAttackItem[AnimEnum.rotateStart] = 5;
humanAttackItem[AnimEnum.rotateEnd] = 10;
humanAttackItem[AnimEnum.rotateDuration] = .2;
humanAttackItem[AnimEnum.xTranslateStart] = -25;
humanAttackItem[AnimEnum.xTranslateEnd] = 20;
humanAttackItem[AnimEnum.xTranslateDuration] = 0.2;
humanAttackItem[AnimEnum.xTranslateEasing] = AnimEasing.easeInCubic;
humanAttackItem[AnimEnum.yTranslateStart] = 2;
humanAttackItem[AnimEnum.yTranslateEnd] = 40;
humanAttackItem[AnimEnum.yTranslateDuration] = 0.2;