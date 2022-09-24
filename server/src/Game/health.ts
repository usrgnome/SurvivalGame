import { C_Breath, C_Health, C_Hunger, C_Temperature } from './ECS/Components'

export function resetPLayerStats(eid: number) {
    C_Health.health[eid] = C_Health.maxHealth[eid]
    C_Hunger.hunger[eid] = C_Hunger.maxHunger[eid]
    C_Breath.breath[eid] = C_Breath.maxBreath[eid]
    C_Temperature.temperate[eid] = 50
}
