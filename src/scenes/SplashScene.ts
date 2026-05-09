import Phaser from "phaser";
import { getProfileFromRegistry } from "../progression/ProfileRegistry";

export class SplashScene extends Phaser.Scene {
  constructor() {
    super("SplashScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x020617);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x020617, 0x020617, 0x050812, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    const splash = this.add
      .image(width / 2, height / 2, "ref_splash")
      .setCrop(0, 0, 304, 494)
      .setDisplaySize(width, 586)
      .setAlpha(0);

    this.tweens.add({
      targets: splash,
      alpha: 1,
      y: height / 2 - 4,
      duration: 700,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: splash,
      scaleX: 1.012,
      scaleY: 1.012,
      duration: 2400,
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
