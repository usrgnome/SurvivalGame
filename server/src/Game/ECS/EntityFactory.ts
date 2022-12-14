import { addComponent, addEntity } from 'bitecs'
import { Bodies, Body, Vector } from 'matter-js'
import { networkTypes, types } from '../../../../shared/EntityTypes'
import { ITEM } from '../../../../shared/Item'
import { collisionLayer } from '../../server/config'
import {
    C_AttackTimer,
    C_Base,
    C_Body,
    C_Breath,
    C_ClientHandle,
    C_Controls,
    C_GivesResource,
    C_GivesScore,
    C_Health,
    C_HitBouceEffect,
    C_Hunger,
    C_Inventory,
    C_Leaderboard,
    C_Mob,
    C_Mouse,
    C_Position,
    C_Rotation,
    C_Temperature,
    C_TerrainInfo,
} from './Components'
import GameWorld from '../GameWorld'
import { Inventory_tryGiveItem } from '../Inventory'

export const NULL_ENTITY = -1
const EntityFactory: {
    [key: string]: (
        world: GameWorld,
        clientId: number,
        addToWorld: boolean
    ) => number
} = {}
export default EntityFactory

function createEID(gameWorld: GameWorld, type: number) {
    const eid = addEntity(gameWorld.world)
    addComponent(gameWorld.world, C_Base, eid, true)
    C_Base.active[eid] = +false
    C_Base.type[eid] = type
    C_Base.networkTypes[eid] = networkTypes.ALL
    return eid
}

export interface BodyEntity extends Body {
    eid: number | undefined
}

export function createRock(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.ROCK)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true)
    addComponent(gameWorld.world, C_GivesResource, eid, true)

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED

    const body = Bodies.circle(0, 0, 110, {
        collisionFilter: {
            category: collisionLayer.ENVIRONMENT,
            mask: collisionLayer.MOB,
        },
        isStatic: true,
    }) as BodyEntity
    body.eid = eid

    C_Rotation.rotation[eid] = 0
    gameWorld.bodyMap.set(eid, body)
    C_GivesResource.resource[eid] = ITEM.STONE
    C_GivesResource.quantity[eid] = 3

    gameWorld.addEntity(eid)
    return eid
}

export function createWall(
    gameWorld: GameWorld,
    clientId: number,
    addToWorld = true
) {
    const eid = createEID(gameWorld, types.WALL)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true)
    addComponent(gameWorld.world, C_Health, eid, true)

    if (clientId !== -1) {
        addComponent(gameWorld.world, C_ClientHandle, eid, true)
        C_ClientHandle.cid[eid] = clientId
    }

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED

    const body = Bodies.circle(0, 0, 60, {
        collisionFilter: {
            category: collisionLayer.STRUCTURE,
            mask: collisionLayer.MOB,
        },
        isStatic: true,
    }) as BodyEntity

    body.eid = eid

    C_Health.health[eid] = C_Health.maxHealth[eid] = 100
    C_Rotation.rotation[eid] = 0
    gameWorld.bodyMap.set(eid, body)

    if (addToWorld) gameWorld.addEntity(eid)
    return eid
}

EntityFactory[types.WALL] = createWall

/**
 * @description Creates a player entity. Pass -1 as clientId for no associated client handle
 * @param {number} clientId associated client
 * @returns {number} eid
 */
export function createPlayer(gameWorld: GameWorld, clientId: number) {
    const eid = createEID(gameWorld, types.PLAYER)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Controls, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_AttackTimer, eid, true)
    addComponent(gameWorld.world, C_Inventory, eid, true)
    addComponent(gameWorld.world, C_Health, eid, true)
    addComponent(gameWorld.world, C_Hunger, eid, true)
    addComponent(gameWorld.world, C_Breath, eid, true)
    addComponent(gameWorld.world, C_Temperature, eid, true)
    addComponent(gameWorld.world, C_Mouse, eid, true)
    addComponent(gameWorld.world, C_Leaderboard, eid, true)
    addComponent(gameWorld.world, C_GivesScore, eid, true)
    addComponent(gameWorld.world, C_TerrainInfo, eid, true)

    if (clientId !== -1) {
        addComponent(gameWorld.world, C_ClientHandle, eid, true)
        C_ClientHandle.cid[eid] = clientId
    }

    const body = Bodies.circle(0, 0, 40, {
        inertia: Infinity,
        label: 'LAND_CREATURE',
        collisionFilter: {
            category: collisionLayer.MOB,
            mask:
                collisionLayer.ENVIRONMENT |
                collisionLayer.STRUCTURE |
                collisionLayer.BIOME,
        },
        friction: 0,
        density: 1,
        frictionAir: 0.6,
    }) as BodyEntity

    body.eid = eid
    gameWorld.bodyMap.set(eid, body)

    const x = 5000
    const y = 5000
    Body.setPosition(body, Vector.create(x, y))

    C_Health.health[eid] = C_Health.maxHealth[eid] = 100
    C_Hunger.hunger[eid] = C_Hunger.maxHunger[eid] = 100
    C_Breath.breath[eid] = C_Breath.maxBreath[eid] = 100

    // mark all stats as dirty so the client will send the correct information to them
    C_Health.dirty[eid] =
        C_Hunger.dirty[eid] =
        C_Breath.dirty[eid] =
        C_Temperature.dirty[eid] =
            +true

    C_Temperature.temperate[eid] = 50
    C_Controls.vel[eid] = 0.2
    C_GivesScore.deathScore[eid] = 1

    //Inventory_tryGiveItem(eid, ITEM.SWORD, 1);
    //Inventory_tryGiveItem(eid, ITEM.SPEAR, 1);
    Inventory_tryGiveItem(eid, ITEM.WOOD_WALL, 1)
    //Inventory_tryGiveItem(eid, ITEM.STICKS, 1);
    Inventory_tryGiveItem(eid, ITEM.MEAT, 10)
    C_Inventory.dirty[eid] = +true

    gameWorld.addEntity(eid)
    return eid
}

export function createTree(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.TREE)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true)
    addComponent(gameWorld.world, C_GivesResource, eid, true)

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED

    const body = Bodies.circle(0, 0, 110, {
        collisionFilter: {
            category: collisionLayer.ENVIRONMENT,
            mask: collisionLayer.MOB,
        },
        isStatic: true,
    }) as BodyEntity

    body.eid = eid

    C_Rotation.rotation[eid] = Math.random() > 0.5 ? 0 : Math.PI * 0.5
    gameWorld.bodyMap.set(eid, body)
    C_GivesResource.resource[eid] = ITEM.STICKS
    C_GivesResource.quantity[eid] = 3

    gameWorld.addEntity(eid)

    return eid
}

export function createBush(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.BUSH)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_HitBouceEffect, eid, true)
    addComponent(gameWorld.world, C_GivesResource, eid, true)

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED

    const body = Bodies.circle(0, 0, 50, {
        collisionFilter: {
            category: collisionLayer.ENVIRONMENT,
            mask: collisionLayer.MOB,
        },
        isStatic: true,
    }) as BodyEntity

    body.eid = eid

    C_Rotation.rotation[eid] = 0
    gameWorld.bodyMap.set(eid, body)
    C_GivesResource.resource[eid] = ITEM.MEAT
    C_GivesResource.quantity[eid] = 1
    gameWorld.addEntity(eid)
    return eid
}

export function createWolf(gameWorld: GameWorld) {
    const eid = createEID(gameWorld, types.WOLF)
    addComponent(gameWorld.world, C_Position, eid, true)
    addComponent(gameWorld.world, C_Controls, eid, true)
    addComponent(gameWorld.world, C_Rotation, eid, true)
    addComponent(gameWorld.world, C_Body, eid, true)
    addComponent(gameWorld.world, C_AttackTimer, eid, true)
    addComponent(gameWorld.world, C_Health, eid, true)
    addComponent(gameWorld.world, C_Mob, eid, true)

    C_Mob.stateTimer[eid] = Math.random() * 5000 // start with some initial random spread to try decrease cluster size of mob querying the world
    const body = Bodies.circle(0, 0, 110) as BodyEntity

    body.friction = 0.1

    body.eid = eid
    body.collisionFilter.category = collisionLayer.MOB
    body.collisionFilter.mask = collisionLayer.ENVIRONMENT

    C_Rotation.rotation[eid] = 0
    gameWorld.bodyMap.set(eid, body)

    gameWorld.addEntity(eid)

    return eid
}
