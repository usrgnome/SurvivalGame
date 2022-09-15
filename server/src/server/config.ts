export const collisionLayer = {
  MOB: 0x01,
  ENVIRONMENT: 0x02,
  ALL: 0xffff,
}

export const COLLISION_TYPES = {
  'BODY': 0,
  'OCEAN': (1 << 0),
  'LAND_CREATURE': (1 << 1),
  'LAND': (1 << 2),
  'LAVA': (1 << 3),
  'VOLCANO': (1 << 4),
  'SNOW': (1 << 5),
  'DESERT': (1 << 6),
}