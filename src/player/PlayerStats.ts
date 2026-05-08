export interface PlayerStats {
    health: number;
    mana: number;
    stamina: number;
    attack: number;
    defense: number;
}

export function createStatsForLevel(level: number): PlayerStats {
    const safeLevel = Math.max(1, Math.floor(level));

    return {
        health: 100 + (safeLevel - 1) * 14,
        mana: 50 + (safeLevel - 1) * 6,
        stamina: 75 + (safeLevel - 1) * 8,
        attack: 12 + (safeLevel - 1) * 3,
        defense: 5 + (safeLevel - 1) * 2,
    };
}
