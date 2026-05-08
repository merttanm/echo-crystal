import type { PlayerProfile } from '../progression/PlayerProfile';
import { createStatsForLevel, type PlayerStats } from './PlayerStats';

export class Player {
    public id: string;
    public profile: PlayerProfile;
    public stats: PlayerStats;
    public health: number;

    constructor(profile: PlayerProfile) {
        this.id = profile.playerId;
        this.profile = profile;
        this.stats = createStatsForLevel(profile.level);
        this.health = this.stats.health;
    }
}
