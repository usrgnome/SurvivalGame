import { IWorld } from "bitecs";
import World from "../GameWorld";
import { attackTimerQuery, bodyQuery, controlQuery, healthQuery, hitBouceQuery, hungerQuery, mobQuery, mouseQuery, temperatureQuery } from "./Queries";
import { C_AttackTimer, C_Base, C_ClientHandle, C_Controls, C_HitBouceEffect, C_Hunger, C_Mouse, C_Position, C_Rotation, C_Temperature, C_TerrainInfo, C_Weilds, } from "./Components";
import { Body, Vector } from "matter-js";
import { tickMob } from "../Mob/MobAI";
import { createWall, NULL_ENTITY } from "./EntityFactory";
import { Items, IToolItem } from "../../../../shared/Item";
import { types } from "../../../../shared/EntityTypes";

export const bodySystem = (gameWorld: World, world: IWorld) => {
  const ents = bodyQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    const body = gameWorld.bodyMap.get(eid) as Body;
    const pos = body.position;
    C_Position.x[eid] = pos.x;
    C_Position.y[eid] = pos.y;

    //console.log("Terrian COUNT eid:", eid, "count:", C_TerrainInfo.inWaterCount[eid], "landCount:", C_TerrainInfo.onLandCount[eid]);

  }
}

export const mouseSystem = (gameWorld: World, world: IWorld) => {
  const ents = mouseQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    if (C_Mouse.mouseDown[eid]) {


      if (!gameWorld.isAttackTimerActive(eid)) {

        //gameWorld.
        //gameWorld.server.sendAction(eid, Items[C_Weilds.itemId[eid]].anim.use);
        const item = Items[C_Weilds.itemId[eid]];
        if (item.isStructure) {
          const rotation = C_Rotation.rotation[eid];
          const range = 130;
          const x = Math.cos(rotation) * range;
          const y = Math.sin(rotation) * range;
          const body = gameWorld.getBody(eid);
          const placeX = x + body.position.x;
          const placeY = y + body.position.y;

          if (gameWorld.canPlaceStructure(types.WALL, placeX, placeY)) {
            const wall = createWall(gameWorld, C_ClientHandle.cid[eid]);
            C_Rotation.rotation[wall] = C_Rotation.rotation[eid];
            gameWorld.setBodyPosition(wall, body.position.x + x, body.position.y + y);
          }

          C_Mouse.mouseDown[eid] = +false;
        } else if (item.isTool) {
          const tool = item as IToolItem;
          gameWorld.onActionStart(eid, tool.anim.use)
          gameWorld.startAttackTimer(eid, tool.useDelay, tool.useCooldown);
        }
      }
    }
  }
}

export const hungerSystem = (gameWorld: World, world: IWorld) => {
  return;
  const ents = hungerQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    let hunger = C_Hunger.hunger[eid] - 10;

    if (hunger <= 0) {
      hunger = 0,
        gameWorld.damage(eid, 10);
    }

    C_Hunger.hunger[eid] = hunger;
  }
}

function exposeTemperature(temperature: number, targetTemp: number, maxChange: number) {
  const dif = Math.abs(temperature - targetTemp);
  const change = Math.min(dif, maxChange);
  temperature += (targetTemp < temperature ? -1 : 1) * change;
  return temperature;
}

export const temperateSystem = (gameWorld: World, world: IWorld) => {
  const ents = temperatureQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    const temperature = C_Temperature.temperate[eid];

    // in water, and not on land
    let isSwimming = C_TerrainInfo.inWaterCount[eid] > 0 && (C_TerrainInfo.onLandCount[eid] === 0);
    let isOnSnow = C_TerrainInfo.onSnowCount[eid] > 0;
    let isOnLava = C_TerrainInfo.onLavaCount[eid] > 0;
    let isOnDesert = C_TerrainInfo.onDesertCount[eid] > 0;

    let newTemperature = temperature;

    /*
    Temperature scale
    100 (too hot)
    50
    0 (too cold)
    */

    //console.log(`
    //inWater: ${C_TerrainInfo.inWaterCount[eid]}
    //onDesert: ${C_TerrainInfo.onDesertCount[eid]}
    //onLand: ${C_TerrainInfo.onLandCount[eid]}
    //onLava: ${C_TerrainInfo.onLavaCount[eid]}
    //onSnow: ${C_TerrainInfo.onSnowCount[eid]}
    //`);

    if (isSwimming)
      newTemperature = exposeTemperature(newTemperature, 20, 5);

    if (isOnSnow)
      newTemperature = exposeTemperature(newTemperature, 0, 10);

    if (isOnLava)
      newTemperature = exposeTemperature(newTemperature, 100, 10);

    C_Temperature.temperate[eid] = Math.max(0, newTemperature);

    if (newTemperature === 0)
      gameWorld.damage(eid, 10);
  }
}

export const mobSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = mobQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    tickMob(gameWorld, eid, delta);
  }
}

export const healthSystem = (gameWorld: World, world: IWorld) => {
  const ents = healthQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
  }
}

export const resetHitBouceSystem = (world: IWorld) => {
  const ents = hitBouceQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    C_HitBouceEffect.hitInThisFrame[eid] = 0;
  }
}

export const controlSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = controlQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    const vel = C_Controls.vel[eid];
    const body = gameWorld.bodyMap.get(eid) as Body;

    let isSwimming = C_TerrainInfo.inWaterCount[eid] > 0 && C_TerrainInfo.onLandCount[eid] === 0;

    let swimFactor = 0.3;
    let movementFactor = isSwimming ? swimFactor : 1;
    const x = C_Controls.x[eid] * vel * delta * movementFactor;
    const y = C_Controls.y[eid] * vel * delta * movementFactor;
    Body.applyForce(body, body.position, Vector.create(x, y));
  }
}

export const attackTimerSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = attackTimerQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.active[eid]) continue;

    if (!C_AttackTimer.active[eid]) continue;

    // if entity is building up to the attack
    if (C_AttackTimer.attackDelay[eid] > 0) {
      C_AttackTimer.attackDelay[eid] -= delta;
      if (C_AttackTimer.attackDelay[eid] <= 0) {
        C_AttackTimer.attackDelay[eid] = 0;
        gameWorld.beginAction(eid);
      }
    } else if (C_AttackTimer.attackCooldown[eid] > 0) {
      // entity is cooling down after the attack
      C_AttackTimer.attackCooldown[eid] -= delta;
      if (C_AttackTimer.attackCooldown[eid] <= 0) {
        C_AttackTimer.active[eid] = 0; // set the timer to be inactive again
        C_AttackTimer.attackCooldown[eid] = 0;
        C_AttackTimer.attackDelay[eid] = 0;
      }
    } else {
      // case where something else has changed the delay
      C_AttackTimer.active[eid] = 0;
      C_AttackTimer.attackCooldown[eid] = 0;
      C_AttackTimer.attackDelay[eid] = 0;
    }
  }
}
