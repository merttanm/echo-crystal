import Phaser from "phaser";
import { getProfileFromRegistry } from "../progression/ProfileRegistry";
import { ReferenceFrame } from "../ui/HubScene";

export class SplashScene extends Phaser.Scene {
  constructor() {
    super("SplashScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x050812);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050812, 0x050812, 0x0b1830, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    const frame = new ReferenceFrame({
      scene: this,
      x: width / 2,
      y: height / 2 + 6,
      width: 320,
      height: 466,
      imageKey: "ref_splash",
      glowColor: 0x38bdf8,
    });

    const titleCover = this.add
      .rectangle(width / 2, 182, 238, 110, 0x020617, 0.72)
      .setDepth(10);

    const logo = this.add
      .text(width / 2, 170, "HEIRS\nOF AETHER", {
        fontFamily: "Arial, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#f8fafc",
        align: "center",
        lineSpacing: 4,
        stroke: "#00e5ff",
        strokeThickness: 1,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#00e5ff",
          blur: 14,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(11);

    const subtitle = this.add
      .text(width / 2, 244, "ENTER THE CRYSTAL KINGDOM", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#67e8f9",
        align: "center",
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(11);

    const ctaBack = this.add
      .rectangle(width / 2, height - 122, 228, 34, 0x020617, 0.82)
      .setStrokeStyle(1, 0x38bdf8, 0.32)
      .setDepth(11);

    const loading = this.add
      .text(width / 2, height - 122, "TAP TO CONTINUE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#e2e8f0",
        align: "center",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(12);

    this.tweens.add({
      targets: [frame.container, logo, subtitle, titleCover, ctaBack, loading],
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: frame.container,
      y: frame.container.y - 4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: loading,
      alpha: { from: 0.4, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    let hasStartedNextScene = false;
    const startNextScene = () => {
      if (hasStartedNextScene) {
        return;
      }

      hasStartedNextScene = true;
      this.cameras.main.fadeOut(650, 5, 8, 18);

      this.time.delayedCall(660, () => {
        const profile = getProfileFromRegistry(this);
        const nextScene = profile.selectedCharacterId
          ? "HubScene"
          : "CharacterSelectScene";

        this.scene.start(nextScene);
      });
    };

    this.input.once("pointerdown", startNextScene);
    this.time.delayedCall(2600, startNextScene);
  }
}
