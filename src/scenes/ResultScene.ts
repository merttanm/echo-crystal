import Phaser from "phaser";
import { maps } from "../data/maps";
import {
  getProfileFromRegistry,
  grantProfileReward,
} from "../progression/ProfileRegistry";

interface ResultSceneData {
  victory?: boolean;
  mapId?: string;
  rewards?: {
    xp: number;
    gold: number;
    food?: number;
    crystal?: number;
    unlockedCardIds?: string[];
  };
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(data: ResultSceneData = {}) {
    this.cameras.main.setBackgroundColor(0x050812);
    this.cameras.main.fadeIn(240, 5, 8, 18);

    const { width, height } = this.scale;
    const currentMap = maps.find((map) => map.id === data.mapId);
    const defaultRewards = { xp: 50, gold: 25, food: 25, crystal: 5 };
    const rewardResult = data.victory
      ? grantProfileReward(this, {
          ...defaultRewards,
          ...data.rewards,
          completedMapId: data.mapId,
        })
      : null;
    const profile = rewardResult?.profile ?? getProfileFromRegistry(this);
    const panelColor = data.victory ? 0x0e7490 : 0x475569;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x020617, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);

    const glow = this.add.circle(width / 2, 154, 116, panelColor, 0.15);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: glow,
      scale: { from: 0.9, to: 1.16 },
      alpha: { from: 0.12, to: 0.24 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.createText(width / 2, 82, data.victory ? "VICTORY" : "BATTLE ENDED", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      stroke: "#0891b2",
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.createText(width / 2, 122, currentMap?.name ?? "Combat Report", {
      fontSize: "13px",
      color: "#bae6fd",
      align: "center",
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x07111f, 0.94);
    panel.fillRoundedRect(22, 164, 316, 330, 16);
    panel.lineStyle(1, 0x38bdf8, 0.55);
    panel.strokeRoundedRect(22, 164, 316, 330, 16);

    this.createRewardTile(
      48,
      205,
      "XP",
      `+${rewardResult?.reward.xp ?? 0}`,
      0x38bdf8,
    );
    this.createRewardTile(
      188,
      205,
      "GOLD",
      `+${rewardResult?.reward.gold ?? 0}`,
      0xfacc15,
    );
    this.createRewardTile(
      48,
      278,
      "FOOD",
      `+${rewardResult?.reward.food ?? 0}`,
      0x22c55e,
    );
    this.createRewardTile(
      188,
      278,
      "CRYSTAL",
      `+${rewardResult?.reward.crystal ?? 0}`,
      0xa78bfa,
    );
    this.createRewardTile(48, 351, "LEVEL", `${profile.level}`, 0x60a5fa);
    this.createRewardTile(188, 351, "POWER", "SAVED", 0x14b8a6);

    const xpRatio = Phaser.Math.Clamp(profile.xp / profile.xpToNextLevel, 0, 1);
    this.add.rectangle(48, 443, 264, 10, 0x1e293b, 1).setOrigin(0, 0.5);
    this.add
      .rectangle(48, 443, 264 * xpRatio, 10, 0x22c55e, 1)
      .setOrigin(0, 0.5);
    this.createText(
      48,
      459,
      `${profile.xp}/${profile.xpToNextLevel} XP TO NEXT LEVEL`,
      {
        fontSize: "9px",
        color: "#94a3b8",
      },
    );

    if (rewardResult && rewardResult.levelsGained > 0) {
      this.createText(
        width / 2,
        514,
        `LEVEL UP +${rewardResult.levelsGained}`,
        {
          fontSize: "18px",
          color: "#86efac",
          fontStyle: "bold",
          align: "center",
          stroke: "#14532d",
          strokeThickness: 1,
        },
      ).setOrigin(0.5);
    } else {
      this.createText(
        width / 2,
        514,
        data.victory ? "Kingdom progress saved" : "No rewards earned",
        {
          fontSize: "12px",
          color: "#94a3b8",
          align: "center",
        },
      ).setOrigin(0.5);
    }

    const continueBtn = this.createContinueButton(width / 2, height - 82);
    continueBtn.on("pointerdown", () => this.goToHub());

    this.time.delayedCall(6500, () => {
      if (this.scene.isActive("ResultScene")) {
        this.goToHub();
      }
    });
  }

  private createRewardTile(
    x: number,
    y: number,
    label: string,
    value: string,
    color: number,
  ) {
    const bg = this.add
      .rectangle(x + 56, y, 112, 52, 0x0f172a, 0.92)
      .setStrokeStyle(1, color, 0.42);
    const glow = this.add
      .circle(x + 18, y, 11, color, 0.18)
      .setStrokeStyle(1, color, 0.78);
    this.createText(x + 38, y - 13, label, {
      fontSize: "9px",
      color: "#94a3b8",
      fontStyle: "bold",
    });
    this.createText(x + 38, y + 3, value, {
      fontSize: "15px",
      color: "#f8fafc",
      fontStyle: "bold",
    });

    return [bg, glow];
  }

  private createContinueButton(x: number, y: number) {
    const button = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 214, 48, 0x0e7490, 0.96)
      .setStrokeStyle(1, 0x67e8f9, 0.9);
    const label = this.createText(0, 0, "CONTINUE TO HUB", {
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(214, 48);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-107, -24, 214, 48),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    button.on("pointerover", () =>
      this.tweens.add({ targets: button, scale: 1.035, duration: 110 }),
    );
    button.on("pointerout", () =>
      this.tweens.add({ targets: button, scale: 1, duration: 110 }),
    );

    return button;
  }

  private goToHub() {
    this.cameras.main.fadeOut(180, 5, 8, 18);
    this.time.delayedCall(190, () => this.scene.start("HubScene"));
  }

  private createText(
    x: number,
    y: number,
    value: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, value, {
        fontFamily: "Arial, Helvetica, sans-serif",
        letterSpacing: 0,
        ...style,
      })
      .setResolution(2);
  }
}
