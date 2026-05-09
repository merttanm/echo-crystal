// src/gameConfig.ts
import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { SplashScene } from "./scenes/SplashScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { HubScene } from "./scenes/HubScene";
import { GameScene } from "./scenes/GameScene";
import { ResultScene } from "./scenes/ResultScene";
import { BattleScene } from "./scenes/BattleScene";
import { WorldScene } from "./scenes/WorldScene";

export const config = {
  type: Phaser.AUTO,
  resolution:
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1,

  parent: "game-container",

  width: 360,
  height: 640,

  backgroundColor: "#050812",

  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: "high-performance",
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scene: [
    BootScene,
    PreloadScene,
    SplashScene,
    CharacterSelectScene,
    HubScene,
    GameScene,
    ResultScene,
    WorldScene,
    BattleScene,
  ],

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: 360,
    height: 640,
  },

  input: {
    activePointers: 3,
  },
} as Phaser.Types.Core.GameConfig;
