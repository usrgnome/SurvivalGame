import { createWorld, removeEntity, hasComponent } from 'bitecs'
import { Engine, Common, Events, Composite, Bodies, Runner, Body, Query, Vector, Detector } from "matter-js";
import EntityIdManager from "../../../shared/lib/EntityIDManager";
import { C_AttackTimer, C_Base, C_ClientHandle, C_GivesResource, C_GivesScore, C_Health, C_HitBouceEffect, C_Inventory, C_Leaderboard, C_Position, C_Rotation, C_TerrainInfo, C_Weilds } from "./ECS/Components";
import { Items, IToolItem } from '../../../shared/Item';
import decomp from "poly-decomp"
import { angleDifference, getRandomPointInPolygon, randomArrayIndex } from '../../../shared/Utilts';
import { leaderboardQuery } from './ECS/Queries';
import { attackTimerSystem, bodySystem, controlSystem, hungerSystem, mobSystem, mouseSystem, resetHitBouceSystem, temperateSystem } from './ECS/Systems';
import { mapData } from './MapData';
import { assert, get_polygon_centroid, mapVertsToMatterVerts } from '../server/ServerUtils';
import { collisionLayer, COLLISION_TYPES } from '../server/config';
import EventEmitter from "events";
import { actionEvent, addedEvent, changeItemEvent, hitBounceEvent, hurtEvent, IEventAction, IEventChangeItem, IEventEntityHurt, IEventEntityRemoved, IEventHitBounce, IEventInventoryChange, IEventTickStats, inventoryChangeEvent, removedEvent, tickStatsEvent } from './Event';
import EntityFactory, { createPlayer, createRock, createTree, createWall, createWolf, NULL_ENTITY } from './ECS/EntityFactory';
import { logger, loggerLevel } from '../server/Logger';
import { Inventory_tryGiveItem } from './Inventory';

Common.setDecomp(decomp);


export default class GameWorld extends EventEmitter {


  /**
   * MatterJS Engine
   * @memberof GameWorld
   */
  engine = Engine.create();

  /**
   * MatterJS runner
   * @memberof GameWorld
   */
  runner = Runner.create();

  /**
   *
   * Map associating eid -> Body
   * @type {Map<number, Body>}
   * @memberof GameWorld
   */
  bodyMap: Map<number, Body> = new Map();

  /**
   *
   * bitECS world
   * @memberof GameWorld
   */
  world = createWorld();
  /**
   *
   * Hybrid map / array data struct containing all eids
   * @type {EntityIdManager}
   * @memberof GameWorld
   */
  entities: EntityIdManager = new EntityIdManager();

  /**
   *
   * Flag that is set when the game is mid update to prevent mitigate sideeffects of modifying entity array while iterating
   * @private
   * @type {boolean}
   * @memberof GameWorld
   */
  private isUpdating: boolean = false;
  /**
   *
   * Queue of entities that will be removed at the end of the update
   * @private
   * @type {number[]}
   * @memberof GameWorld
   */
  private toRemoveQueue: number[] = [];

  private timeUntilNextStatsTick = 0;

  private cachedStructures: { [key: string]: Body } = {};

  _on(name: 'entityRemoved', callback: (e: IEventEntityRemoved) => void): void;
  _on(name: 'entityAdded', callback: (e: IEventEntityRemoved) => void): void;
  _on(name: 'inventoryChange', callback: (e: IEventInventoryChange) => void): void;
  _on(name: 'changeItem', callback: (e: IEventChangeItem) => void): void;
  _on(name: 'hitBounce', callback: (e: IEventHitBounce) => void): void;
  _on(name: 'entityHurt', callback: (e: IEventEntityHurt) => void): void;
  _on(name: 'tickStats', callback: (e: IEventTickStats) => void): void;
  _on(name: 'action', callback: (e: IEventAction) => void): void;
  _on(name: string, callback: (e: any) => void) {
    this.on(name, callback);
  }

  constructor() {
    super();

    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;

    this.generateMap();

    Events.on(this.engine, "collisionStart", function (e) {
      for (let i = 0; i < e.pairs.length; i++) {
        const pair = e.pairs[i];

        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // grab the associated key for each label
        const aTypeMask = COLLISION_TYPES[bodyA.label];
        const bTypeMask = COLLISION_TYPES[bodyB.label];

        // create a hash using this key
        const typeHash = aTypeMask | bTypeMask;

        // look for hash match
        switch (typeHash) {
          case COLLISION_TYPES.OCEAN | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.OCEAN)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionStart, entity eid is not valid!");
            C_TerrainInfo.inWaterCount[eid]++;
            break;
          }
          case COLLISION_TYPES.LAND | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.LAND)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionStart, entity eid is not valid!");
            C_TerrainInfo.onLandCount[eid]++;
            break;
          }
          case COLLISION_TYPES.SNOW | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.SNOW)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionStart, entity eid is not valid!");
            C_TerrainInfo.onSnowCount[eid]++;
            break;
          }
          case COLLISION_TYPES.DESERT | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.DESERT)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionStart, entity eid is not valid!");
            C_TerrainInfo.onDesertCount[eid]++;
            break;
          }
          case COLLISION_TYPES.LAVA | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.LAVA)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionStart, entity eid is not valid!");
            C_TerrainInfo.onLavaCount[eid]++;
            break;
          }
        }
      }
    });

    Events.on(this.engine, "collisionEnd", function (e) {
      for (let i = 0; i < e.pairs.length; i++) {
        const pair = e.pairs[i];

        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // grab the associated key for each label
        const aTypeMask = COLLISION_TYPES[bodyA.label];
        const bTypeMask = COLLISION_TYPES[bodyB.label];

        // create a hash using this key
        const typeHash = aTypeMask | bTypeMask;

        // look for hash match
        switch (typeHash) {
          case COLLISION_TYPES.OCEAN | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.OCEAN)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionEnd' entity eid is not valid!");
            C_TerrainInfo.inWaterCount[eid]--;
            break;
          }
          case COLLISION_TYPES.LAND | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.LAND)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionEnd, entity eid is not valid!");
            C_TerrainInfo.onLandCount[eid]--;
            break;
          }
          case COLLISION_TYPES.SNOW | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.SNOW)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionEnd, entity eid is not valid!");
            C_TerrainInfo.onSnowCount[eid]--;
            break;
          }
          case COLLISION_TYPES.DESERT | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.DESERT)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionEnd, entity eid is not valid!");
            C_TerrainInfo.onDesertCount[eid]--;
            break;
          }
          case COLLISION_TYPES.LAVA | COLLISION_TYPES.LAND_CREATURE: {
            let creature = bodyA;

            if (aTypeMask === COLLISION_TYPES.LAVA)
              creature = bodyB;

            // @ts-ignore
            const eid = creature.eid as number;
            assert(eid !== -1 && Number.isInteger(eid), "@ collisionEnd, entity eid is not valid!");
            C_TerrainInfo.onLavaCount[eid]--;
            break;
          }
        }
      }
    })
  }

  private loadForType(type: keyof typeof mapData, label: keyof typeof COLLISION_TYPES, category: number, mask: number, sensor: boolean, isStatic: boolean = false) {
    mapData[type].polygons.forEach(polygon => {
      const vertices = mapVertsToMatterVerts(polygon);
      const body = Bodies.fromVertices(0, 0, vertices, {
        isSensor: sensor, isStatic: (isStatic && !sensor), collisionFilter: {
          mask,
          category,
        }
      }); // cant be sensor and static, so sensor will override static property
      console.log("creating body with mask", mask)
      body.parts.forEach(part => part.label = label);
      const center = get_polygon_centroid(vertices);
      Body.setPosition(body, Vector.create(center.x, center.y));

      // like this
      if (isStatic) {
        if (!sensor) {
          Body.setStatic(body, true);
        }
      }

      console.log(body.collisionFilter);
      Composite.add(this.engine.world, body);

      setTimeout(() => { console.log(body.collisionFilter) }, 10000);
    })
  }

  /**
   * 
   * @description Makes entity active in the world
   * @param {number} id
   * @memberof World
   */
  addEntity(id: number) {
    this.entities.insert(id);
    Composite.add(this.engine.world, this.bodyMap.get(id));
    C_Base.active[id] = +true;
    C_Base.alive[id] = +true;

    addedEvent.cid = -1;
    addedEvent.eid = id;

    if (hasComponent(this.world, C_ClientHandle, id))
      addedEvent.cid = C_ClientHandle.cid[id];

    this.emit(addedEvent.type, addedEvent);
  }

  /**
   *
   * @description Makes entity inactive in the world
   * @param {number} eid
   * @param {boolean} [deleted=false]
   * @return {*} 
   * @memberof World
   */
  removeEntity(eid: number, deleted = false) {
    if (!C_Base.active[eid]) return; // cant remove object that is already removed
    C_Base.alive[eid] = +false;

    if (this.isUpdating) {
      this.toRemoveQueue.push(eid);
    } else {
      this.entities.remove(eid);
      C_Base.active[eid] = +false;

      if (this.bodyMap.has(eid)) {
        const body = this.bodyMap.get(eid);
        Composite.remove(this.engine.world, body);
        this.bodyMap.delete(eid)
      }

      removedEvent.eid = eid;
      removedEvent.cid = -1;

      if (!deleted && hasComponent(this.world, C_ClientHandle, eid)) {
        const cid = C_ClientHandle.cid[eid];
        removedEvent.cid = cid;
      }

      // remove from ECS
      console.log("Removing eid", eid);
      removeEntity(this.world, eid);

      this.emit('entityRemoved', removedEvent);
    }
  }

  beginAction(eid: number) {
    const itemId = C_Weilds.itemId[eid];
    const item = Items[itemId] as IToolItem;
    this.sweepAttack(eid, C_Position.x[eid], C_Position.y[eid], item.meeleDamage, item.meeleRange, C_Rotation.rotation[eid], item.sweepAngle);
  }

  equipItem(eid: number, itemId: number) {
    C_Weilds.itemId[eid] = itemId;
    changeItemEvent.eid = eid;
    changeItemEvent.itemId = itemId;
    this.emit(changeItemEvent.type, changeItemEvent);
  }

  onActionStart(eid: number, animUseId: number) {
    actionEvent.eid = eid;
    actionEvent.animUseId = animUseId;
    this.emit(actionEvent.type, actionEvent);
  }

  startAttackTimer(eid: number, attackDelay: number, attackCooldown: number) {
    C_AttackTimer.active[eid] = 1;
    C_AttackTimer.attackDelay[eid] = attackDelay;
    C_AttackTimer.attackCooldown[eid] = attackCooldown;
  }

  isAttackTimerActive(eid: number) {
    return !!C_AttackTimer.active[eid];
  }

  /**
   * Sets the position of a entitie's body
   * @param {number} eid
   * @param {number} x
   * @param {number} y
   * @memberof GameWorld
   */
  setBodyPosition(eid: number, x: number, y: number) {
    const body = this.bodyMap.get(eid);
    C_Position.x[eid] = x;
    C_Position.y[eid] = y;
    Body.setPosition(body, Vector.create(x, y));
  }

  getBody(eid: number): Body {
    return this.bodyMap.get(eid);
  }

  /**
   * Sets the rotation of a entities body
   * @param {number} eid
   * @param {number} x
   * @param {number} y
   * @memberof GameWorld
   */
  setBodyRotation(eid: number, rotation: number) {
    const body = this.bodyMap.get(eid);
    body.angle = rotation;
  }

  /**
   * returns whether eid is active (also handles case where eid = -1)
   * @param {number} eid
   * @return {*} 
   * @memberof GameWorld
   */
  isEntityActive(eid: number) {
    return eid !== -1 && !!C_Base.active[eid];
  }

  /**
   * returns all active bodies inside the given region
   * @param {number} minx
   * @param {number} miny
   * @param {number} maxx
   * @param {number} maxy
   * @param {number} [mask=0xffff]
   * @return {*} 
   * @memberof GameWorld
   */
  queryRect(minx: number, miny: number, maxx: number, maxy: number, mask = 0xffff) {
    const width = maxx - minx;
    const height = maxy - miny;
    const midX = (minx + maxx) * .5
    const midY = (miny + maxy) * .5
    const box = Bodies.rectangle(midX, midY, width, height);
    return Query.region(this.engine.world.bodies, box.bounds);
  }

  queryBodyPrecise(body: Body) {
    return Query.collides(body, this.engine.world.bodies);
  }

  canPlaceStructure(type: number, x: number, y: number) {
    if (!(type in this.cachedStructures)) {
      const eid = EntityFactory[type](this, -1, false);
      const body = this.getBody(eid);
      this.cachedStructures[type] = body;
      body.collisionFilter.mask = collisionLayer.ENVIRONMENT | collisionLayer.STRUCTURE | collisionLayer.MOB;
    }

    const body = this.cachedStructures[type];
    Body.setPosition(body, Vector.create(x, y));
    const query = this.queryBodyPrecise(body);

    let count = 0;
    for (let i = 0; i < query.length; i++) {
      const pair = query[i];
      const otherBody = pair.bodyA === body ? pair.bodyB : pair.bodyA;

      if (otherBody.collisionFilter.category & body.collisionFilter.mask) {
        count++;
      }
    }

    return count === 0;
  }

  willBodyOverlap(body: Body) {
    return this.queryBodyPrecise(body).length <= 1;
  }

  private onEntityDie(eid: number) {
    C_Base.alive[eid] = 0;
    this.removeEntity(eid);
  }

  private onEntityKilled(target: number, killer: number) {
    if (hasComponent(this.world, C_Leaderboard, killer) && hasComponent(this.world, C_GivesScore, target)) {
      C_Leaderboard.score[killer] += C_GivesScore.deathScore[target];
    }
  }

  damage(eid: number, damage: number, originEntity: number = NULL_ENTITY) {
    assert(eid !== NULL_ENTITY && Number.isInteger(eid), "World::damage Invalid target eid");
    assert(Number.isInteger(originEntity), "World::damage Invalid dealer eid");
    assert(damage >= 0, "Damage must be a positive number, use .heal(eid, health) to increase entity health");

    if (!this.isEntityActive(eid)) return;

    if (hasComponent(this.world, C_Health, eid)) {
      const health = C_Health.health[eid];
      const newHealth = Math.floor(health - damage);

      if (newHealth <= 0) {
        C_Health.health[eid] = 0;
        if (originEntity !== NULL_ENTITY)
          this.onEntityKilled(eid, originEntity);
        this.onEntityDie(eid);
      } else {
        C_Health.health[eid] = newHealth;

        hurtEvent.eid = eid;
        hurtEvent.cid = -1;
        hurtEvent.health = newHealth;

        if (hasComponent(this.world, C_ClientHandle, eid))
          hurtEvent.cid = C_ClientHandle.cid[eid];

      }
      this.emit(hurtEvent.type, hurtEvent);
    }
    if (
      originEntity !== NULL_ENTITY &&
      hasComponent(this.world, C_GivesResource, eid) &&
      hasComponent(this.world, C_Inventory, originEntity)
    ) {
      const didAddItem = Inventory_tryGiveItem(originEntity, C_GivesResource.resource[eid], C_GivesResource.quantity[eid]);

      console.log(didAddItem);
      if (
        didAddItem &&
        hasComponent(this.world, C_ClientHandle, originEntity)
      ) {
        console.log("semititng event!");
        inventoryChangeEvent.cid = C_ClientHandle.cid[originEntity];
        inventoryChangeEvent.eid = originEntity;
        this.emit(inventoryChangeEvent.type, inventoryChangeEvent);
      }
    }
  }

  sweepAttack(dealer: number, x: number, y: number, damage: number, range: number, startAngle: number, sweepAngle: number) {
    assert(Number.isInteger(dealer), "GameWorld::sweep expects targetEid to be integer!");

    // construct a box around the origin, and look for all entities that are inside of it
    const maxx = x + range;
    const maxy = y + range;
    const minx = x - range;
    const miny = y - range;

    const dealerBody = this.bodyMap.get(dealer);

    const bodies = this.queryRect(minx, miny, maxx, maxy);
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];

      // @ts-ignore
      const targetEid = body.eid;

      if (targetEid === NULL_ENTITY || targetEid === undefined) continue;

      const position = body.position;
      const distSqrd = (position[0] - x) ** 2 + (position[1] - y) ** 2;

      // because we are measuring the distance from center of circle, we need to subtract the radius to make it more accurate
      const sepperationOffset = (dealerBody && dealerBody.type === "circle" ? (dealerBody as any).radius : 0) + (body.type === "circle" ? (<any>body).radius : 0)

      if (distSqrd - (sepperationOffset * sepperationOffset) > range * range) continue;
      // @ts-ignore
      if (dealer === targetEid) continue;

      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const angle = Math.atan2(dy, dx);
      const angleDif = angleDifference(startAngle, angle);

      if (angleDif > sweepAngle) continue;

      // @ts-ignore
      assert(Number.isInteger(targetEid), "GameWorld::sweep expects targetEid to be integer!");


      const force = 0.01;
      const forceX = Math.cos(angle) * force;
      const forceY = Math.sin(angle) * force;
      Body.applyForce(body, body.position, Vector.create(forceX, forceY));

      if (hasComponent(this.world, C_HitBouceEffect, targetEid)) {
        if (!C_HitBouceEffect.hitInThisFrame[targetEid]) {
          C_HitBouceEffect.hitInThisFrame[targetEid] = 1;
          hitBounceEvent.angle = angle;
          hitBounceEvent.eid = targetEid;
          this.emit(hitBounceEvent.type, hitBounceEvent);
        }
      }

      this.damage(targetEid, damage, dealer);

      if (dealer !== -1 && hasComponent(this.world, C_Leaderboard, dealer) && hasComponent(this.world, C_GivesScore, targetEid))
        C_Leaderboard.score[dealer] += C_GivesScore.hitScore[targetEid];
    }
  }

  /**
   *  Returns leaderboard in format [clientId, score][]
   * @return {*}  {[number, number][]}
   * @memberof GameWorld
   */
  buildLeaderboard(): [number, number][] {
    const eids = leaderboardQuery(this.world),
      maxLength = 10,
      leaderboard: [number, number][] = []; //clientId, score

    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];

      if (!C_Base.active[eid]) continue;

      const score = C_Leaderboard.score[eid];
      const cid = C_ClientHandle.cid[eid];

      let low = 0,
        high = leaderboard.length;

      // look for ideal location in leaderboard array to insert into
      // avoids the array.sort at the end

      while (low < high) {
        let mid = (low + high) >>> 1;
        if (leaderboard[mid][1] > score) low = mid + 1;
        else high = mid;
      }

      const index = low;
      if (index < maxLength - 1 && leaderboard.length < maxLength)
        leaderboard.splice(index, 0, [cid, score]);
    }

    return leaderboard;
  }

  /**
   * Updates the world
   * @param {number} delta in milliseconds units
   * @memberof GameWorld
   */
  update(delta: number) {

    const debug = false;
    debug && console.log("===================");
    const start = Date.now();
    this.isUpdating = true;

    const startMob = Date.now();
    mobSystem(this, this.world, delta);
    const endMob = Date.now();

    debug && console.log("Mob tick took: " + (endMob - startMob) + "ms")

    const ecs1 = Date.now();
    controlSystem(this, this.world, delta); // update entity controls
    mouseSystem(this, this.world);
    attackTimerSystem(this, this.world, delta);

    this.timeUntilNextStatsTick -= delta;
    if (this.timeUntilNextStatsTick <= 0) {
      hungerSystem(this, this.world);
      temperateSystem(this, this.world);
      this.timeUntilNextStatsTick = 5000;

      this.emit(tickStatsEvent.type, tickStatsEvent);
    }

    const ecs2 = Date.now();

    const physStart = Date.now();

    //Runner.tick(this.runner, this.engine, undefined);
    Engine.update(this.engine, delta);

    const physEnd = Date.now();
    debug && console.log("Phys tick took: " + (physEnd - physStart) + "ms");

    const ecs3 = Date.now();
    bodySystem(this, this.world); // do some post updates
    resetHitBouceSystem(this.world);
    const ecs4 = Date.now();

    debug && console.log("Ecs tick took: " + ((ecs2 - ecs1) + (ecs4 - ecs3)) + "ms");

    this.isUpdating = false;
    const end = Date.now();

    if (this.toRemoveQueue.length > 0) {
      for (let i = 0; i < this.toRemoveQueue.length; i++) {
        const eid = this.toRemoveQueue[i];
        this.removeEntity(eid);
      }
      this.toRemoveQueue.length = 0;
    }

    debug && console.log(`Update took ${end - start}ms`);
  }

  /**
   * Parses map data, generates map objects & entities
   * @memberof GameWorld
   */
  generateMap() {

    logger.log(loggerLevel.info, `GameWorld: generating world`);

    const width = 10000;
    const height = 10000;
    const borderThickness = 100;

    const wall1 = Bodies.rectangle(width * .5, -borderThickness, width, borderThickness, { isStatic: true });
    const wall2 = Bodies.rectangle(width * .5, height + borderThickness, width, borderThickness, { isStatic: true });
    const wall3 = Bodies.rectangle(-borderThickness, height * .5, borderThickness, height, { isStatic: true });
    const wall4 = Bodies.rectangle(width + borderThickness, height * .5, borderThickness, height, { isStatic: true });

    wall1.collisionFilter.category = wall2.collisionFilter.category = wall3.collisionFilter.category = wall4.collisionFilter.category = collisionLayer.ALL;
    wall1.collisionFilter.mask = wall2.collisionFilter.mask = wall3.collisionFilter.mask = wall4.collisionFilter.mask = collisionLayer.ALL;

    Composite.add(this.engine.world, wall1);
    Composite.add(this.engine.world, wall2);
    Composite.add(this.engine.world, wall3);
    Composite.add(this.engine.world, wall4);

    logger.log(loggerLevel.info, `GameWorld: loading terrain`);

    this.loadForType("OCEAN", "OCEAN", collisionLayer.BIOME, collisionLayer.MOB, true, true);
    this.loadForType("FORREST", "LAND", collisionLayer.BIOME, collisionLayer.MOB, true, true);
    this.loadForType("SNOW", "SNOW", collisionLayer.BIOME, collisionLayer.MOB, true, true);
    this.loadForType("LAVA", "LAVA", collisionLayer.BIOME, collisionLayer.MOB, true, true);

    logger.log(loggerLevel.info, `GameWorld: spawning map entities`);

    for (let i = 0; i < 50; i++) {
      const forrestPolygons = mapData.FORREST.polygons;
      const polygon = forrestPolygons[randomArrayIndex(forrestPolygons)]

      const tree = createTree(this);
      const body = this.getBody(tree);

      let cnt = 0;
      do {
        let [x, y] = getRandomPointInPolygon(polygon);
        this.setBodyPosition(tree, x, y);
      } while (!this.willBodyOverlap(body) && (cnt++ < 10));
    }

    for (let i = 0; i < 30; i++) {
      const forrestPolygons = mapData.FORREST.polygons;
      const polygon = forrestPolygons[randomArrayIndex(forrestPolygons)]

      const rock = createRock(this);
      const body = this.getBody(rock);

      let cnt = 0;
      do {
        let [x, y] = getRandomPointInPolygon(polygon);
        this.setBodyPosition(rock, x, y);
      } while (!this.willBodyOverlap(body) && (cnt++ < 10));
    }


    for (let i = 0; i < 5; i++) {
      const rock = createRock(this);
      const mapSegments = mapData.SNOW.polygons;
      const polygon = mapSegments[randomArrayIndex(mapSegments)]
      const [x, y] = getRandomPointInPolygon(polygon);
      this.setBodyPosition(rock, x, y);
    }

    for (let i = 0; i < 1; i++) {
      const tree = createWall(this, -1);
      this.setBodyPosition(tree, 5000, 5000)
    }

    for (let i = 0; i < 0; i++) {
      const wolf = createWolf(this);
      this.setBodyPosition(wolf, Math.random() * 500, Math.random() * 500);
    }

    logger.log(loggerLevel.info, `GameWorld: finished loading world!`);
  }
}