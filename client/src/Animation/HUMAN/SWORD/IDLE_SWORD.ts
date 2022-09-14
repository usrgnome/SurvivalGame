import { AnimEasing, AnimEnum, getAnim } from "../../AnimUtils";

export const humanIdleSword = getAnim();
humanIdleSword[AnimEnum.rotateStart] = .8;
humanIdleSword[AnimEnum.rotateEnd] = .8;
humanIdleSword[AnimEnum.rotateDuration] = 1;