import { profileStore } from "./ProfileStore";
import {
  PROFILE_REGISTRY_KEY,
  type PlayerProfile,
  type ProgressGrantResult,
  type ProgressReward,
} from "./PlayerProfile";

interface SceneWithRegistry {
  registry: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  };
}

export function loadProfileIntoRegistry(
  scene: SceneWithRegistry,
): PlayerProfile {
  const profile = profileStore.load();
  scene.registry.set(PROFILE_REGISTRY_KEY, profile);

  return profile;
}

export function getProfileFromRegistry(
  scene: SceneWithRegistry,
): PlayerProfile {
  const profile = scene.registry.get(PROFILE_REGISTRY_KEY);

  if (profile) {
    return profile as PlayerProfile;
  }

  return loadProfileIntoRegistry(scene);
}

export function selectProfileCharacter(
  scene: SceneWithRegistry,
  characterId: string,
): PlayerProfile {
  const profile = profileStore.selectCharacter(characterId);
  scene.registry.set(PROFILE_REGISTRY_KEY, profile);

  return profile;
}

export function grantProfileReward(
  scene: SceneWithRegistry,
  reward: ProgressReward,
): ProgressGrantResult {
  const result = profileStore.grantReward(reward);
  scene.registry.set(PROFILE_REGISTRY_KEY, result.profile);

  return result;
}

export function updateProfileInRegistry(
  scene: SceneWithRegistry,
  updater: (profile: PlayerProfile) => PlayerProfile,
): PlayerProfile {
  const profile = profileStore.update(updater);
  scene.registry.set(PROFILE_REGISTRY_KEY, profile);

  return profile;
}
