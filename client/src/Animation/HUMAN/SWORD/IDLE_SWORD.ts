import { AnimEasing, AnimEnum, getAnim } from "../../AnimUtils";

export const humanIdleSword = getAnim();
humanIdleSword[AnimEnum.rotateStart] = Math.PI * .4;
humanIdleSword[AnimEnum.rotateEnd] = Math.PI * .38;
humanIdleSword[AnimEnum.rotateDuration] = 1;