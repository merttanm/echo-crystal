export type BuildingId = 'castle' | 'barracks' | 'gold_mine' | 'farm' | 'crystal_core' | 'watchtower';

export interface BuildingDefinition {
    id: BuildingId;
    name: string;
    role: string;
    description: string;
    accentColor: number;
    basePower: number;
    upgradeBaseCost: {
        gold: number;
        food: number;
        crystal: number;
    };
}

export interface BuildingPosition {
    id: BuildingId;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const buildingDefinitions: BuildingDefinition[] = [
    {
        id: 'castle',
        name: 'Castle',
        role: 'Command Center',
        description: 'Unlocks kingdom systems and increases total power.',
        accentColor: 0x60a5fa,
        basePower: 120,
        upgradeBaseCost: {
            gold: 90,
            food: 70,
            crystal: 25,
        },
    },
    {
        id: 'barracks',
        name: 'Barracks',
        role: 'Army Training',
        description: 'Trains infantry for marches and base defense.',
        accentColor: 0xf97316,
        basePower: 75,
        upgradeBaseCost: {
            gold: 70,
            food: 105,
            crystal: 15,
        },
    },
    {
        id: 'gold_mine',
        name: 'Gold Mine',
        role: 'Economy',
        description: 'Improves passive gold income.',
        accentColor: 0xfacc15,
        basePower: 45,
        upgradeBaseCost: {
            gold: 45,
            food: 40,
            crystal: 10,
        },
    },
    {
        id: 'farm',
        name: 'Farm',
        role: 'Food Supply',
        description: 'Produces food for training and upgrades.',
        accentColor: 0x22c55e,
        basePower: 45,
        upgradeBaseCost: {
            gold: 45,
            food: 35,
            crystal: 8,
        },
    },
    {
        id: 'crystal_core',
        name: 'Crystal Core',
        role: 'Arcane Resource',
        description: 'Generates crystal for advanced construction.',
        accentColor: 0xa78bfa,
        basePower: 65,
        upgradeBaseCost: {
            gold: 80,
            food: 55,
            crystal: 20,
        },
    },
    {
        id: 'watchtower',
        name: 'Watchtower',
        role: 'World Intel',
        description: 'Improves scouting and encounter rewards.',
        accentColor: 0x38bdf8,
        basePower: 55,
        upgradeBaseCost: {
            gold: 60,
            food: 55,
            crystal: 14,
        },
    },
];

export const buildingPositions: BuildingPosition[] = [
    { id: 'castle', x: 139, y: 212, width: 86, height: 78 },
    { id: 'barracks', x: 34, y: 286, width: 84, height: 66 },
    { id: 'gold_mine', x: 241, y: 286, width: 84, height: 66 },
    { id: 'farm', x: 38, y: 386, width: 82, height: 60 },
    { id: 'crystal_core', x: 139, y: 380, width: 86, height: 66 },
    { id: 'watchtower', x: 246, y: 390, width: 76, height: 70 },
];

export function getBuildingDefinition(id: BuildingId): BuildingDefinition {
    const definition = buildingDefinitions.find((building) => building.id === id);

    if (!definition) {
        throw new Error(`Unknown building id: ${id}`);
    }

    return definition;
}

export function getUpgradeCost(definition: BuildingDefinition, currentLevel: number) {
    const multiplier = Math.max(1, currentLevel);

    return {
        gold: Math.floor(definition.upgradeBaseCost.gold * multiplier * 1.42),
        food: Math.floor(definition.upgradeBaseCost.food * multiplier * 1.35),
        crystal: Math.floor(definition.upgradeBaseCost.crystal * multiplier * 1.5),
    };
}

export function getBuildingPower(definition: BuildingDefinition, level: number): number {
    return definition.basePower * Math.max(1, level);
}
