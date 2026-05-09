import Phaser from "phaser";

export interface SideMenuButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  accentColor: number;
  onPress: () => void;
}

export class SideMenuButton {
  public readonly container: Phaser.GameObjects.Container;

  constructor(config: SideMenuButtonConfig) {
    const width = config.width ?? 74;
    const height = config.height ?? 48;

    this.container = config.scene.add.container(config.x, config.y);

    const bg = config.scene.textures.exists("ui_menu_button")
      ? config.scene.add
          .image(0, 0, "ui_menu_button")
          .setDisplaySize(width, height)
      : config.scene.add
          .rectangle(0, 0, width, height, 0x08111f, 0.96)
          .setStrokeStyle(1, config.accentColor, 0.56);

    const glow = config.scene.add.rectangle(
      0,
      0,
      width,
      height,
      config.accentColor,
      0.06,
    );
    glow.setBlendMode(Phaser.BlendModes.ADD);

    const marker = config.scene.add.circle(
      -width / 2 + 14,
      0,
      5,
      config.accentColor,
      1,
    );
    const accent = config.scene.add
      .rectangle(-width / 2 + 6, 0, 2, height - 10, config.accentColor, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const text = config.scene.add
      .text(6, 0, config.title, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        color: "#f8fafc",
        fontStyle: "bold",
        align: "left",
      })
      .setOrigin(0, 0.5)
      .setResolution(2);

    this.container.add([glow, bg, accent, marker, text]);
    this.container.setSize(width, height);
    this.container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -width / 2,
        -height / 2,
        width,
        height,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    this.container.on("pointerover", () => {
      glow.setAlpha(0.14);
      config.scene.tweens.add({
        targets: this.container,
        scale: 1.03,
        duration: 100,
        ease: "Sine.easeOut",
      });
    });

    this.container.on("pointerout", () => {
      glow.setAlpha(0.06);
      config.scene.tweens.add({
        targets: this.container,
        scale: 1,
        duration: 100,
        ease: "Sine.easeOut",
      });
    });

    this.container.on("pointerdown", config.onPress);
  }
}
