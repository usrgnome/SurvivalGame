import { C_Health } from "./ECS/Components";

export function resetHealth(eid: number) {
  C_Health.health[eid] = C_Health.maxHealth[eid];
}