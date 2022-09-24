import { defineQuery } from 'bitecs'
import {
    C_AttackTimer,
    C_Body,
    C_ClientHandle,
    C_Controls,
    C_Health,
    C_HitBouceEffect,
    C_Hunger,
    C_Leaderboard,
    C_Mob,
    C_Mouse,
    C_Position,
    C_Temperature,
    C_TerrainInfo,
} from './Components'

export const controlQuery = defineQuery([C_Body, C_Controls])
export const bodyQuery = defineQuery([C_Body, C_Position])
export const hitBouceQuery = defineQuery([C_HitBouceEffect])
export const attackTimerQuery = defineQuery([C_AttackTimer])
export const healthQuery = defineQuery([C_AttackTimer])
export const mouseQuery = defineQuery([C_Mouse])
export const leaderboardQuery = defineQuery([C_ClientHandle, C_Leaderboard])
export const mobQuery = defineQuery([C_Mob])

export const temperatureQuery = defineQuery([
    C_Temperature,
    C_Health,
    C_TerrainInfo,
])
export const hungerQuery = defineQuery([C_Hunger, C_Health])
