import { Types, defineComponent } from "bitecs";

export const C_Vector3 = { x: Types.f32, y: Types.f32 }
export const C_Position = defineComponent(C_Vector3);
export const C_Rotation = defineComponent({ rotation: Types.f32 });
export const C_Body = defineComponent();
export const C_Controls = defineComponent({ x: Types.f32, y: Types.f32, vel: Types.f32 });
export const C_Base = defineComponent({ active: Types.ui8, type: Types.ui8, networkTypes: Types.ui32, alive: Types.ui8 });
export const C_Weilds = defineComponent({ itemId: Types.ui16 });
export const C_HitBouceEffect = defineComponent({ hitInThisFrame: Types.ui8 });
export const C_ClientHandle = defineComponent({ cid: Types.ui16 });
export const C_AttackTimer = defineComponent({ attackDelay: Types.f32, attackCooldown: Types.f32, active: Types.ui8 });
export const C_GivesScore = defineComponent({ deathScore: Types.ui32, hitScore: Types.ui32 });
export const C_Health = defineComponent({ health: Types.ui16, maxHealth: Types.ui16, healCoolDown: Types.f32, dirty: Types.ui8 });
export const C_Hunger = defineComponent({ hunger: Types.ui8, maxHunger: Types.ui8, dirty: Types.ui8 });
export const C_Temperature = defineComponent({ temperate: Types.ui8, dirty: Types.ui8 });
export const C_Breath = defineComponent({ breath: Types.ui8, maxBreath: Types.ui8, dirty: Types.ui8 });
export const C_Mouse = defineComponent({ mouseDown: Types.ui8 });
export const C_Leaderboard = defineComponent({ score: Types.ui32 });
export const C_Mob = defineComponent({ state: Types.ui32, isHostile: Types.ui8, timer: Types.f32, stateTimer: Types.f32, targetEid: Types.ui32, targetAngle: Types.f32 });
export const C_TerrainInfo = defineComponent({ inWaterCount: Types.i16, onLandCount: Types.i16, onSnowCount: Types.i16, onLavaCount: Types.i16, onDesertCount: Types.i16 });
export const C_GivesResource = defineComponent({ resource: Types.ui16, quantity: Types.ui16 });

export const maxIventorySize = 10;

// item, quantity
export const C_Inventory = defineComponent({
  dirty: Types.ui8,
  items: [Types.ui16, maxIventorySize],
  quantities: [Types.ui16, maxIventorySize],
});