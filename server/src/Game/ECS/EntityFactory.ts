import { addComponent, addEntity } from "bitecs";
import { Bodies, Body, Vector } from "matter-js";
import { networkTypes, types } from "../../../../shared/EntityTypes";
import { ITEM } from "../../../../shared/Item";
import { collisionLayer } from "../../server/config";
import { C_AttackTimer, C_Base, C_Body, C_ClientHandle, C_Controls, C_GivesScore, C_Health, C_HitBouceEffect, C_Inventory, C_Leaderboard, C_Mob, C_Mouse, C_Position, C_Rotation, C_TerrainInfo } from "./Components";
import GameWorld from "../GameWorld";
import { Inventory_addItem } from "../Inventory";


function createEID(gameWorld: GameWorld, type: number) {
    const eid = addEntity(gameWorld.world);
    addComponent(gameWorld.world, C_Base, eid, true);
    C_Base.active[eid] = +(false);
    C_Base.type[eid] = type;
    C_Base.networkTypes[eid] = networkTypes.ALL;
    return eid;
}

export function createRock(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.ROCK);
    addComponent(gameWorld.world, C_Position, eid, true);
    addComponent(gameWorld.world, C_Body, eid, true);
    addComponent(gameWorld.world, C_Rotation, eid, true);
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true);

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED;

    const body = Bodies.circle(0, 0, 110);
    body.collisionFilter.category = collisionLayer.ENVIRONMENT;
    Body.setStatic(body, true);
    //@ts-ignore
    body.eid = eid;

    C_Rotation.rotation[eid] = 0;
    gameWorld.bodyMap.set(eid, body);

    return eid;
}

/**
 * @description Creates a player entity. Pass -1 as clientId for no associated client handle
 * @param {number} clientId associated client
 * @returns {number} eid
 */
export function createPlayer(gameWorld: GameWorld, clientId: number) {
    const eid = createEID(gameWorld, types.PLAYER);
    addComponent(gameWorld.world, C_Position, eid, true);
    addComponent(gameWorld.world, C_Controls, eid, true);
    addComponent(gameWorld.world, C_Rotation, eid, true);
    addComponent(gameWorld.world, C_Body, eid, true);
    addComponent(gameWorld.world, C_AttackTimer, eid, true);
    addComponent(gameWorld.world, C_Inventory, eid, true);
    addComponent(gameWorld.world, C_Health, eid, true);
    addComponent(gameWorld.world, C_Mouse, eid, true);
    addComponent(gameWorld.world, C_Leaderboard, eid, true);
    addComponent(gameWorld.world, C_GivesScore, eid, true);
    addComponent(gameWorld.world, C_TerrainInfo, eid, true);

    if (clientId !== -1) {
        addComponent(gameWorld.world, C_ClientHandle, eid, true);
        C_ClientHandle.cid[eid] = clientId;
    }

    C_GivesScore.deathScore[eid] = 1;

    const body = Bodies.circle(0, 0, 50, {
        inertia: Infinity,
        label: 'LAND_CREATURE',
        collisionFilter: {
            category: collisionLayer.MOB,
            mask: collisionLayer.ENVIRONMENT,
        },
        friction: 0,
        density: 1,
    });

    // @ts-ignore
    body.eid = eid;
    gameWorld.bodyMap.set(eid, body);

    const range = 500;
    const x = range + (Math.random() * range - range * .5);
    const y = range + (Math.random() * range - range * .5);
    Body.setPosition(body, Vector.create(x, y));

    C_Health.health[eid] = C_Health.maxHealth[eid] = 100;
    C_Controls.vel[eid] = 0.100;

    Inventory_addItem(eid, ITEM.SWORD, 1);
    return eid;
}

export function createTree(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.TREE);
    addComponent(gameWorld.world, C_Position, eid, true);
    addComponent(gameWorld.world, C_Body, eid, true);
    addComponent(gameWorld.world, C_Rotation, eid, true);
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true);

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED;

    const body = Bodies.circle(0, 0, 110);
    body.collisionFilter.category = collisionLayer.ENVIRONMENT;
    Body.setStatic(body, true);

    //@ts-ignore
    body.eid = eid;

    C_Rotation.rotation[eid] = 0;
    gameWorld.bodyMap.set(eid, body);

    return eid;
}

export function createWolf(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.WOLF);
    addComponent(gameWorld.world, C_Position, eid, true);
    addComponent(gameWorld.world, C_Controls, eid, true);
    addComponent(gameWorld.world, C_Rotation, eid, true);
    addComponent(gameWorld.world, C_Body, eid, true);
    addComponent(gameWorld.world, C_AttackTimer, eid, true);
    addComponent(gameWorld.world, C_Health, eid, true);
    addComponent(gameWorld.world, C_Mob, eid, true);

    C_Mob.stateTimer[eid] = Math.random() * 5000; // start with some initial random spread to try decrease cluster size of mob querying the world
    const body = Bodies.circle(0, 0, 110);

    body.friction = 0.1;

    // @ts-ignore
    body.eid = eid;
    body.collisionFilter.category = collisionLayer.MOB;
    body.collisionFilter.mask = collisionLayer.ENVIRONMENT;

    C_Rotation.rotation[eid] = 0;
    gameWorld.bodyMap.set(eid, body);

    return eid;
  }