import Phaser from "phaser";

export interface ReferenceFrameConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  imageKey: string;
  glowColor?: number;
  overlayAlpha?: number;
}

export class ReferenceFrame {
  public readonly container: Phaser.GameObjects.Container;
  public readonly image: Phaser.GameObjects.Image;

  constructor(config: ReferenceFrameConfig) {
    const glowColor = config.glowColor ?? 0x38bdf8;
    const overlayAlpha = config.overlayAlpha ?? 0;

    this.container = config.scene.add.container(config.x, config.y);

    const shadow = config.scene.add.rectangle(
      0,
      14,
      config.width + 12,
      config.height + 18,
      0x000000,
      0.28,
    );

    const glow = config.scene.add
      .rectangle(0, 0, config.width + 18, config.height + 18, glowColor, 0.08)
      .setStrokeStyle(1, glowColor, 0.34);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    const frame = config.scene.add
      .rectangle(0, 0, config.width + 8, config.height + 8, 0x07111f, 0.96)
      .setStrokeStyle(1, 0x8be9fd, 0.3);

    this.image = config.scene.add.image(0, 0, config.imageKey);
    this.image.setDisplaySize(config.width, config.height);

    const overlay =
      overlayAlpha > 0
        ? config.scene.add.rectangle(
            0,
            0,
            config.width,
            config.height,
            0x020617,
            overlayAlpha,
          )
        : null;

    this.container.add(
      overlay
        ? [shadow, glow, frame, this.image, overlay]
        : [shadow, glow, frame, this.image],
    );
  }
}
