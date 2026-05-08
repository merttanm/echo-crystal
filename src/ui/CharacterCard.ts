import Phaser from "phaser";

export interface CharacterCardConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  name: string;
  role: string;
  imageKey: string;
  accentColor: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

export class CharacterCard {
  public container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private config: CharacterCardConfig;
  private border: Phaser.GameObjects.Rectangle;
  private glow: Phaser.GameObjects.Rectangle;
  private selectedGem: Phaser.GameObjects.Arc;

  constructor(config: CharacterCardConfig) {
    this.scene = config.scene;
    this.config = config;

    this.container = this.scene.add.container(config.x, config.y);

    this.glow = this.scene.add.rectangle(
      0,
      0,
      config.width + 12,
      config.height + 12,
      config.accentColor,
      config.selected ? 0.2 : 0.04,
    );

    this.glow.setStrokeStyle(
      1,
      config.accentColor,
      config.selected ? 0.9 : 0.2,
    );

    const bg = this.scene.add.rectangle(
      0,
      0,
      config.width,
      config.height,
      0x07111f,
      0.96,
    );

    bg.setStrokeStyle(1, 0x1e293b, 0.9);

    const topGlow = this.scene.add.rectangle(
      0,
      -config.height / 2 + 38,
      config.width - 16,
      58,
      config.accentColor,
      0.08,
    );

    const portrait = this.scene.add.image(0, -34, config.imageKey);
    portrait.setDisplaySize(config.width - 28, config.height * 0.52);

    const shade = this.scene.add.rectangle(
      0,
      config.height * 0.23,
      config.width,
      config.height * 0.35,
      0x020617,
      0.82,
    );

    const nameText = this.scene.add.text(
      0,
      config.height * 0.24,
      config.name.toUpperCase(),
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: config.width - 18 },
      },
    );

    nameText.setOrigin(0.5);
    nameText.setResolution(2);

    const roleText = this.scene.add.text(
      0,
      config.height * 0.37,
      config.role.toUpperCase(),
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#94a3b8",
        align: "center",
      },
    );

    roleText.setOrigin(0.5);
    roleText.setResolution(2);

    this.selectedGem = this.scene.add.circle(
      0,
      config.height * 0.48,
      11,
      config.accentColor,
      config.selected ? 0.95 : 0.45,
    );

    this.selectedGem.setStrokeStyle(2, 0xffffff, config.selected ? 0.45 : 0.15);

    this.border = this.scene.add.rectangle(
      0,
      0,
      config.width,
      config.height,
      0x000000,
      0,
    );

    this.border.setStrokeStyle(
      config.selected ? 3 : 1,
      config.accentColor,
      config.selected ? 1 : 0.35,
    );

    this.container.add([
      this.glow,
      bg,
      topGlow,
      portrait,
      shade,
      nameText,
      roleText,
      this.selectedGem,
      this.border,
    ]);

    this.container.setSize(config.width, config.height);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(
        -config.width / 2,
        -config.height / 2,
        config.width,
        config.height,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    this.container.on("pointerover", () => this.hoverIn());
    this.container.on("pointerout", () => this.hoverOut());
    this.container.on("pointerdown", () => this.select());
  }

  setSelected(selected: boolean) {
    this.config.selected = selected;

    this.glow.setAlpha(selected ? 0.2 : 0.04);
    this.selectedGem.setAlpha(selected ? 0.95 : 0.45);
    this.selectedGem.setStrokeStyle(2, 0xffffff, selected ? 0.45 : 0.15);

    this.border.setStrokeStyle(
      selected ? 3 : 1,
      this.config.accentColor,
      selected ? 1 : 0.35,
    );
  }

  destroy() {
    this.container.destroy(true);
  }

  private hoverIn() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.04,
      duration: 120,
      ease: "Sine.easeOut",
    });

    this.glow.setAlpha(0.18);
  }

  private hoverOut() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 120,
      ease: "Sine.easeOut",
    });

    this.glow.setAlpha(this.config.selected ? 0.2 : 0.04);
  }

  private select() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.97,
      duration: 80,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    this.config.onSelect(this.config.id);
  }
}
