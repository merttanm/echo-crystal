import Phaser from "phaser";

export interface ResourcePillConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label?: string;
  value: string;
  color: number;
  width?: number;
  iconKey?: string;
}

export class ResourcePill {
  public readonly container: Phaser.GameObjects.Container;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly valueBaseFontSize: number;
  private readonly valueMaxWidth: number;
  private readonly valueMinFontSize: number;

  constructor(config: ResourcePillConfig) {
    const width = config.width ?? 86;
    const textX = -width / 2 + 28;
    const textMaxWidth = width - 38;
    const valueFontSize = config.label ? 10 : 11;

    this.container = config.scene.add.container(config.x, config.y);
    this.valueBaseFontSize = valueFontSize;
    this.valueMaxWidth = textMaxWidth;
    this.valueMinFontSize = config.label ? 8 : 9;

    const hasBarTexture = config.scene.textures.exists("ui_resource_bar");
    const bg = hasBarTexture
      ? config.scene.add
          .image(0, 0, "ui_resource_bar")
          .setDisplaySize(width, 28)
      : config.scene.add
          .rectangle(0, 0, width, 28, 0x08111f, 0.94)
          .setStrokeStyle(1, config.color, 0.5);

    const iconKey = config.iconKey ?? this.getIconKey(config.label);
    const icon =
      iconKey && config.scene.textures.exists(iconKey)
        ? config.scene.add
            .image(-width / 2 + 14, 0, iconKey)
            .setDisplaySize(14, 14)
        : null;

    const dot = !icon
      ? config.scene.add.circle(-width / 2 + 12, 0, 5, config.color, 1)
      : null;

    const labelText = config.label
      ? config.scene.add
          .text(textX, -7, config.label.toUpperCase(), {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "7px",
            color: "#94a3b8",
            fontStyle: "bold",
          })
          .setResolution(2)
      : null;

    this.valueText = config.scene.add
      .text(textX, config.label ? 5 : 0, config.value, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${valueFontSize}px`,
        color: "#f8fafc",
        fontStyle: "bold",
      })
      .setOrigin(0, config.label ? 0 : 0.5)
      .setResolution(2);

    if (labelText) {
      this.fitTextToWidth(labelText, textMaxWidth, 7, 6);
    }
    this.fitTextToWidth(
      this.valueText,
      this.valueMaxWidth,
      this.valueBaseFontSize,
      this.valueMinFontSize,
    );

    const children: Phaser.GameObjects.GameObject[] = [bg];
    if (icon) children.push(icon);
    if (dot) children.push(dot);
    if (labelText) children.push(labelText);
    children.push(this.valueText);

    this.container.add(children);
  }

  setValue(value: string) {
    this.valueText.setText(value);
    this.fitTextToWidth(
      this.valueText,
      this.valueMaxWidth,
      this.valueBaseFontSize,
      this.valueMinFontSize,
    );
  }

  private getIconKey(label?: string) {
    if (!label) {
      return null;
    }

    const normalized = label.toLowerCase();
    if (normalized === "gold") return "ui_gold_icon";
    if (normalized === "food") return "ui_food_icon";
    if (normalized === "crystal" || normalized === "level") {
      return "ui_crystal_icon";
    }

    return null;
  }

  private fitTextToWidth(
    text: Phaser.GameObjects.Text,
    maxWidth: number,
    baseFontSize: number,
    minFontSize: number,
  ) {
    let fontSize = baseFontSize;
    text.setFontSize(`${fontSize}px`);

    while (text.width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      text.setFontSize(`${fontSize}px`);
    }
  }
}
