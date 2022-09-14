import { IWorld } from "bitecs";
import World from "../GameWorld";
import { attackTimerQuery, bodyQuery, controlQuery, healthQuery, hitBouceQuery, mobQuery, mouseQuery } from "./Queries";
import { C_AttackTimer, C_Base, C_Controls, C_HitBouceEffect, C_Mouse, C_Position, } from "./Components";
import { Body, Vector } from "matter-js";
import { tickMob } from "../Mob/MobAI";

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
        if (Math.random() > .5) {
        }
        //gameWorld.server.sendAction(eid, Items[C_Weilds.itemId[eid]].anim.use);
        gameWorld.startAttackTimer(eid, 200, 200);
      }
    }
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
    const v = 0.01;
    const x = C_Controls.x[eid] * vel * delta;
    const y = C_Controls.y[eid] * vel * delta;
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
