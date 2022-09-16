import { AnimEasing, AnimEnum, getAnim } from "../../AnimUtils";

export const humanAttackItem = getAnim();
humanAttackItem[AnimEnum.rotateStart] = Math.PI * .4;
humanAttackItem[AnimEnum.rotateEnd] = Math.PI * .2;
humanAttackItem[AnimEnum.rotateDuration] = .2;