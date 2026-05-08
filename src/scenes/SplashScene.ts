import Phaser from "phaser";
import { getProfileFromRegistry } from "../progression/ProfileRegistry";

export class SplashScene extends Phaser.Scene {
  constructor() {
    super("SplashScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x050812);

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050812, 0x050812, 0x0b1830, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    // Soft crystal glow
    const glow = this.add.circle(
      width / 2,
      height / 2 - 30,
      135,
      0x00e5ff,
      0.12,
    );
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: glow,
      scale: { from: 0.85, to: 1.25 },
      alpha: { from: 0.08, to: 0.2 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Decorative crystal diamond
    const crystal = this.add.graphics();
    crystal.lineStyle(2, 0x00e5ff, 0.55);
    crystal.fillStyle(0x00e5ff, 0.08);

    const cx = width / 2;
    const cy = height / 2 - 115;

    crystal.beginPath();
    crystal.moveTo(cx, cy - 34);
    crystal.lineTo(cx + 26, cy);
    crystal.lineTo(cx, cy + 42);
    crystal.lineTo(cx - 26, cy);
    crystal.closePath();
    crystal.fillPath();
    crystal.strokePath();

    crystal.lineBetween(cx, cy - 34, cx, cy + 42);
    crystal.lineBetween(cx - 26, cy, cx + 26, cy);

    crystal.setAlpha(0);
    crystal.setScale(0.9);

    // Main logo
    const logo = this.add.text(width / 2, height / 2 - 38, "HEIRS\nOF AETHER", {
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
    });

    logo.setOrigin(0.5);
    logo.setAlpha(0);
    logo.setResolution(2);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 2 + 48,
      "HEIRS OF AETHER",
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#67e8f9",
        align: "center",
        letterSpacing: 3,
      },
    );

    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    subtitle.setResolution(2);

    // Bottom line
    const line = this.add.rectangle(
      width / 2,
      height / 2 + 78,
      170,
      2,
      0x00e5ff,
      0.75,
    );
    line.setAlpha(0);
    line.setBlendMode(Phaser.BlendModes.ADD);

    const loading = this.add.text(width / 2, height - 74, "TAP TO CONTINUE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#64748b",
      align: "center",
      letterSpacing: 4,
    });

    loading.setOrigin(0.5);
    loading.setAlpha(0);
    loading.setResolution(2);

    // Fade animations
    this.tweens.add({
      targets: crystal,
      alpha: 1,
      scale: 1,
      duration: 700,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: logo,
      alpha: 1,
      y: logo.y - 6,
      duration: 850,
      delay: 250,
      ease: "Cubic.easeOut",
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: subtitle.y - 4,
      duration: 750,
      delay: 650,
      ease: "Cubic.easeOut",
    });

    this.tweens.add({
      targets: [line, loading],
      alpha: 1,
      duration: 600,
      delay: 900,
      ease: "Sine.easeOut",
    });

    // Professional subtle breathing effect
    this.tweens.add({
      targets: logo,
      scale: { from: 1, to: 1.025 },
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: crystal,
      angle: 360,
      duration: 9000,
      repeat: -1,
      ease: "Linear",
    });

    this.tweens.add({
      targets: loading,
      alpha: { from: 0.35, to: 1 },
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
