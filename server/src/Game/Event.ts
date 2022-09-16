export interface IEventEntityRemoved {
  type: 'string';
  eid: number;
  cid: number;
}

export const removedEvent = {
  type: 'entityRemoved',
  eid: -1,
  cid: -1,
}

export interface IEventEntityHurt {
  eid: number;
  cid: number;
  type: string;
  health: number
}

export const hurtEvent = {
  type: 'entityHurt',
  eid: -1,
  cid: -1,
  health: 0,
};

export interface IEventHitBounce {
  eid: number;
  angle: number;
  type: string;
}

export const hitBounceEvent = {
  type: 'hitBounce',
  eid: -1,
  angle: 0
};

export interface IEventTickStats {
  type: string;
}

export const tickStatsEvent = {
  type: 'tickStats'
}

export interface IEventAction {
  type: string,
  eid: number,
  animUseId: number;
}

export const actionEvent = {
  type: 'action',
  eid: -1,
  animUseId: -1,
}

export interface IEventChangeItem {
  type: 'changeItem';
  eid: number;
  itemId: number;
}

export const changeItemEvent = {
  type: 'changeItem',
  eid: -1,
  itemId: -1,
};