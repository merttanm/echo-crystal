import {
  createNewPlayerProfile,
  grantProgressReward,
  normalizePlayerProfile,
  type PlayerProfile,
  type ProgressGrantResult,
  type ProgressReward,
} from "./PlayerProfile";

const STORAGE_KEY = "echo-crystal.player-profile.v1";

export class ProfileStore {
  private cachedProfile: PlayerProfile | null = null;

  load(): PlayerProfile {
    if (this.cachedProfile) {
      return this.cachedProfile;
    }

    const storage = getStorage();
    const rawProfile = storage?.getItem(STORAGE_KEY);
    const profile = rawProfile
      ? parseStoredProfile(rawProfile)
      : createNewPlayerProfile();

    this.cachedProfile = profile;
    this.persist(profile);

    return profile;
  }

  save(profile: PlayerProfile): PlayerProfile {
    const normalizedProfile = normalizePlayerProfile(profile);

    this.cachedProfile = normalizedProfile;
    this.persist(normalizedProfile);

    return normalizedProfile;
  }

  selectCharacter(characterId: string): PlayerProfile {
    const now = new Date().toISOString();

    return this.save({
      ...this.load(),
      selectedCharacterId: characterId,
      updatedAt: now,
    });
  }

  grantReward(reward: ProgressReward): ProgressGrantResult {
    const result = grantProgressReward(this.load(), reward);
    this.save(result.profile);

    return result;
  }

  update(updater: (profile: PlayerProfile) => PlayerProfile): PlayerProfile {
    return this.save(updater(this.load()));
  }

  private persist(profile: PlayerProfile): void {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export const profileStore = new ProfileStore();

function parseStoredProfile(rawProfile: string): PlayerProfile {
  try {
    return normalizePlayerProfile(JSON.parse(rawProfile));
  } catch {
    return createNewPlayerProfile();
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
