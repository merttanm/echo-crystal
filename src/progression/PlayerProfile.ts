export const PROFILE_SCHEMA_VERSION = 2;
export const PROFILE_REGISTRY_KEY = "playerProfile";

const STARTER_CARD_IDS = ["card1", "card2", "card3"];
const DEFAULT_BUILDING_IDS = [
  "castle",
  "barracks",
  "gold_mine",
  "farm",
  "crystal_core",
  "watchtower",
];

export interface PlayerProfile {
  schemaVersion: number;
  playerId: string;
  displayName: string;
  selectedCharacterId: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  resources: ResourceWallet;
  army: ArmyState;
  buildings: BuildingState[];
  unlockedCardIds: string[];
  completedMapIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceWallet {
  gold: number;
  food: number;
  crystal: number;
}

export interface ArmyState {
  infantry: number;
  archers: number;
  mages: number;
}

export interface BuildingState {
  id: string;
  level: number;
}

export interface ProgressReward {
  xp: number;
  gold: number;
  food?: number;
  crystal?: number;
  unlockedCardIds?: string[];
  completedMapId?: string;
}

export interface AppliedProgressReward {
  xp: number;
  gold: number;
  food: number;
  crystal: number;
  unlockedCardIds: string[];
  completedMapId: string | null;
}

export interface ProgressGrantResult {
  profile: PlayerProfile;
  reward: AppliedProgressReward;
  levelsGained: number;
}

export function calculateXpToNextLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(100 * Math.pow(1.35, safeLevel - 1));
}

export function createNewPlayerProfile(
  now: string = new Date().toISOString(),
): PlayerProfile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    playerId: createPlayerId(),
    displayName: "Guest Hero",
    selectedCharacterId: null,
    level: 1,
    xp: 0,
    xpToNextLevel: calculateXpToNextLevel(1),
    gold: 420,
    resources: {
      gold: 420,
      food: 360,
      crystal: 90,
    },
    army: {
      infantry: 35,
      archers: 12,
      mages: 4,
    },
    buildings: DEFAULT_BUILDING_IDS.map((id) => ({
      id,
      level: id === "castle" ? 2 : 1,
    })),
    unlockedCardIds: [...STARTER_CARD_IDS],
    completedMapIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizePlayerProfile(
  value: unknown,
  now: string = new Date().toISOString(),
): PlayerProfile {
  if (!isRecord(value)) {
    return createNewPlayerProfile(now);
  }

  let level = positiveInteger(value.level, 1);
  let xp = nonNegativeInteger(value.xp, 0);
  let xpToNextLevel = calculateXpToNextLevel(level);

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = calculateXpToNextLevel(level);
  }

  const legacyGold = nonNegativeInteger(value.gold, 420);
  const resources = normalizeResources(value.resources, legacyGold);

  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    playerId: stringValue(value.playerId, createPlayerId()),
    displayName: stringValue(value.displayName, "Guest Hero"),
    selectedCharacterId: nullableStringValue(value.selectedCharacterId),
    level,
    xp,
    xpToNextLevel,
    gold: resources.gold,
    resources,
    army: normalizeArmy(value.army),
    buildings: normalizeBuildings(value.buildings),
    unlockedCardIds: uniqueStringArray(value.unlockedCardIds, STARTER_CARD_IDS),
    completedMapIds: uniqueStringArray(value.completedMapIds, []),
    createdAt: stringValue(value.createdAt, now),
    updatedAt: stringValue(value.updatedAt, now),
  };
}

export function grantProgressReward(
  profile: PlayerProfile,
  reward: ProgressReward,
  now: string = new Date().toISOString(),
): ProgressGrantResult {
  const xpReward = Math.max(0, Math.floor(reward.xp));
  const goldReward = Math.max(0, Math.floor(reward.gold));
  const foodReward = Math.max(0, Math.floor(reward.food ?? 0));
  const crystalReward = Math.max(0, Math.floor(reward.crystal ?? 0));
  const completedMapId = reward.completedMapId ?? null;
  const unlockedCardIds = reward.unlockedCardIds ?? [];

  let level = profile.level;
  let xp = profile.xp + xpReward;
  let xpToNextLevel = calculateXpToNextLevel(level);
  let levelsGained = 0;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    levelsGained += 1;
    xpToNextLevel = calculateXpToNextLevel(level);
  }

  const nextUnlockedCards = new Set(profile.unlockedCardIds);
  unlockedCardIds.forEach((cardId) => nextUnlockedCards.add(cardId));

  const nextCompletedMaps = new Set(profile.completedMapIds);
  if (completedMapId) {
    nextCompletedMaps.add(completedMapId);
  }

  return {
    profile: {
      ...profile,
      schemaVersion: PROFILE_SCHEMA_VERSION,
      level,
      xp,
      xpToNextLevel,
      gold: profile.resources.gold + goldReward,
      resources: {
        gold: profile.resources.gold + goldReward,
        food: profile.resources.food + foodReward,
        crystal: profile.resources.crystal + crystalReward,
      },
      unlockedCardIds: [...nextUnlockedCards],
      completedMapIds: [...nextCompletedMaps],
      updatedAt: now,
    },
    reward: {
      xp: xpReward,
      gold: goldReward,
      food: foodReward,
      crystal: crystalReward,
      unlockedCardIds,
      completedMapId,
    },
    levelsGained,
  };
}

function createPlayerId(): string {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === "function") {
    return `player_${browserCrypto.randomUUID()}`;
  }

  return `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function nullableStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function positiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeResources(
  value: unknown,
  legacyGold: number,
): ResourceWallet {
  if (!isRecord(value)) {
    return {
      gold: legacyGold,
      food: 360,
      crystal: 90,
    };
  }

  return {
    gold: nonNegativeInteger(value.gold, legacyGold),
    food: nonNegativeInteger(value.food, 360),
    crystal: nonNegativeInteger(value.crystal, 90),
  };
}

function normalizeArmy(value: unknown): ArmyState {
  if (!isRecord(value)) {
    return {
      infantry: 35,
      archers: 12,
      mages: 4,
    };
  }

  return {
    infantry: nonNegativeInteger(value.infantry, 35),
    archers: nonNegativeInteger(value.archers, 12),
    mages: nonNegativeInteger(value.mages, 4),
  };
}

function normalizeBuildings(value: unknown): BuildingState[] {
  const incomingBuildings = Array.isArray(value) ? value : [];
  const byId = new Map<string, BuildingState>();

  incomingBuildings.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const id = stringValue(item.id, "");

    if (!DEFAULT_BUILDING_IDS.includes(id)) {
      return;
    }

    byId.set(id, {
      id,
      level: positiveInteger(item.level, id === "castle" ? 2 : 1),
    });
  });

  DEFAULT_BUILDING_IDS.forEach((id) => {
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        level: id === "castle" ? 2 : 1,
      });
    }
  });

  return DEFAULT_BUILDING_IDS.map((id) => byId.get(id)!);
}

function uniqueStringArray(value: unknown, fallback: string[]): string[] {
  const source = Array.isArray(value) ? value : fallback;
  const output = new Set<string>();

  source.forEach((item) => {
    if (typeof item === "string" && item.trim().length > 0) {
      output.add(item);
    }
  });

  return [...output];
}
