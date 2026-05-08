import Phaser from "phaser";
import { loadProfileIntoRegistry } from "../progression/ProfileRegistry";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    loadProfileIntoRegistry(this);

    this.cameras.main.setBackgroundColor(0x07070f);
    const { width, height } = this.scale;

    const bootText = this.add
      .text(width / 2, height / 2, "Booting Heirs of Aether...", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Loading dots animation
    let dots = 0;
    const loadingInterval = this.time.addEvent({
      delay: 500,
      callback: () => {
        dots = (dots + 1) % 4;
        const dotString = ".".repeat(dots);
        bootText.setText(`Booting Heirs of Aether${dotString}`);
      },
      loop: true,
    });

    this.time.delayedCall(2000, () => {
      loadingInterval.destroy();
      this.scene.start("PreloadScene");
    });
  }
}
