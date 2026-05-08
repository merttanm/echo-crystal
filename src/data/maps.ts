export interface GameMap {
    id: string;
    name: string;
    subtitle: string;
    backgroundKey: string;
    accentColor: number;
    enemyName: string;
    enemyHealth: number;
    recommendedLevel: number;
    rewards: {
        xp: number;
        gold: number;
        food?: number;
        crystal?: number;
        unlockedCardIds?: string[];
    };
}

export const maps: GameMap[] = [
    {
        id: 'mist_valley',
        name: 'Mist Valley',
        subtitle: 'Starter battlefield',
        backgroundKey: 'mist_valley_bg',
        accentColor: 0x67e8f9,
        enemyName: 'Mist Guard',
        enemyHealth: 120,
        recommendedLevel: 1,
        rewards: {
            xp: 50,
            gold: 25,
            food: 30,
            crystal: 6,
        },
    },
    {
        id: 'golden_palace',
        name: 'Golden Sand Palace',
        subtitle: 'Stronger enemy forces',
        backgroundKey: 'golden_palace_bg',
        accentColor: 0xfbbf24,
        enemyName: 'Sun Warden',
        enemyHealth: 165,
        recommendedLevel: 2,
        rewards: {
            xp: 80,
            gold: 45,
            food: 42,
            crystal: 10,
        },
    },
    {
        id: 'void_gate',
        name: 'Void Gate',
        subtitle: 'Elite challenge',
        backgroundKey: 'void_gate_bg',
        accentColor: 0xc084fc,
        enemyName: 'Void Champion',
        enemyHealth: 220,
        recommendedLevel: 4,
        rewards: {
            xp: 130,
            gold: 80,
            food: 64,
            crystal: 18,
        },
    },
];
