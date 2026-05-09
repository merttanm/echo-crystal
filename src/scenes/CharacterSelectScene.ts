import Phaser from "phaser";
import { characters } from "../data/characters";
import {
  getProfileFromRegistry,
  selectProfileCharacter,
} from "../progression/ProfileRegistry";
import { ResourcePill } from "../ui/ResourcePill";

type TextureCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CharacterMeta = {
  displayName: string;
  role: string;
  description: string;
  imageKey: string;
  accentColor: number;
  crop: TextureCrop;
};

const CHARACTER_META: Record<string, CharacterMeta> = {
  chrono_knight: {
    displayName: "Chrono Knight",
    role: "Zaman Şövalyesi",
    description:
      "Zamanın gücüyle savaşan şövalye. Dengeli, dayanıklı ve güvenilir.",
    imageKey: "chrono_knight",
    accentColor: 0x38bdf8,
    crop: { x: 72, y: 12, width: 116, height: 278 },
  },
  ether_rogue: {
    displayName: "Ether Rogue",
    role: "Gölge Suikastçısı",
    description:
      "Hızlı saldırılar ve kaçınma üzerine kurulu çevik bir komutan.",
    imageKey: "ether_rogue",
    accentColor: 0xa78bfa,
    crop: { x: 70, y: 10, width: 122, height: 280 },
  },
  aether_mage: {
    displayName: "Aether Mage",
    role: "Toprak Büyücüsü",
    description:
      "Ağır vuruşlar, koruma büyüleri ve yüksek alan kontrolü sağlar.",
    imageKey: "aether_mage",
    accentColor: 0x22c55e,
    crop: { x: 62, y: 8, width: 138, height: 282 },
  },
};

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacter = "chrono_knight";
  private featuredPortrait?: Phaser.GameObjects.Image;
  private detailTitle?: Phaser.GameObjects.Text;
  private detailRole?: Phaser.GameObjects.Text;
  private detailDescription?: Phaser.GameObjects.Text;
  private continueButton?: Phaser.GameObjects.Container;
  private cardHighlights = new Map<
    string,
    { frame: Phaser.GameObjects.Rectangle; glow: Phaser.GameObjects.Rectangle }
  >();

  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x050812);
    this.cameras.main.fadeIn(260, 5, 8, 18);

    const { width, height } = this.scale;
    const profile = getProfileFromRegistry(this);

    this.selectedCharacter =
      profile.selectedCharacterId ?? characters[0]?.id ?? "chrono_knight";

    this.createBackground(width, height);
    this.createTopBar(width, profile.resources.gold, profile.resources.crystal);
    this.createHeader(width);
    this.createCharacterLayout(width, height);
    this.createDetailPanel(width, height);
    this.createContinueButton(width, height);
    this.refreshSelection();
  }

  private createBackground(width: number, height: number) {
    this.add
      .image(width / 2, height / 2, "mist_valley_bg")
      .setCrop(0, 0, 375, 438)
      .setDisplaySize(width, height)
      .setDepth(-8);

    const bg = this.add.graphics().setDepth(-7);
    bg.fillGradientStyle(
      0x020617,
      0x020617,
      0x0f172a,
      0x050812,
      0.72,
      0.72,
      0.94,
      0.94,
    );
    bg.fillRect(0, 0, width, height);

    const glowA = this.add.circle(width * 0.18, 136, 118, 0x38bdf8, 0.1);
    const glowB = this.add.circle(
      width * 0.82,
      height * 0.42,
      150,
      0x7c3aed,
      0.09,
    );

    glowA.setBlendMode(Phaser.BlendModes.ADD);
    glowB.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [glowA, glowB],
      alpha: { from: 0.06, to: 0.16 },
      scale: { from: 0.95, to: 1.12 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createTopBar(width: number, gold: number, crystal: number) {
    new ResourcePill({
      scene: this,
      x: width - 154,
      y: 28,
      value: String(gold),
      color: 0xfacc15,
      width: 92,
      iconKey: "ui_gold_icon",
    }).container.setDepth(22);

    new ResourcePill({
      scene: this,
      x: width - 66,
      y: 28,
      value: String(crystal),
      color: 0xa78bfa,
      width: 74,
      iconKey: "ui_crystal_icon",
    }).container.setDepth(22);

    const addButton = this.add.container(width - 24, 28).setDepth(23);
    const bg = this.add
      .rectangle(0, 0, 28, 28, 0x07111f, 0.96)
      .setStrokeStyle(1, 0x67e8f9, 0.65);
    const plus = this.createText(0, -1, "+", {
      fontSize: "20px",
      color: "#67e8f9",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    addButton.add([bg, plus]);
  }

  private createHeader(width: number) {
    this.createText(width / 2, 70, "KOMUTANINI SEÇ", {
      fontSize: "20px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
      stroke: "#0891b2",
      strokeThickness: 1,
    })
      .setOrigin(0.5)
      .setDepth(22);

    this.createText(
      width / 2,
      96,
      "Kristal krallığını yönetecek kahramanı belirle.",
      {
        fontSize: "10px",
        color: "#94a3b8",
        align: "center",
        wordWrap: { width: width - 44 },
      },
    )
      .setOrigin(0.5)
      .setDepth(22);
  }

  private createCharacterLayout(width: number, _height: number) {
    const coreGlow = this.add
      .circle(width / 2, 250, 156, 0x38bdf8, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);

    this.tweens.add({
      targets: coreGlow,
      scale: { from: 0.94, to: 1.08 },
      alpha: { from: 0.09, to: 0.17 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const choices = [
      { id: "chrono_knight", x: 64 },
      { id: "aether_mage", x: width / 2 },
      { id: "ether_rogue", x: width - 64 },
    ];
    const cardY = 248;
    const cardWidth = 92;
    const cardHeight = 252;

    choices.forEach((choice) => {
      const meta = this.getMeta(choice.id);
      const glow = this.add
        .rectangle(
          choice.x,
          cardY,
          cardWidth + 8,
          cardHeight + 8,
          meta.accentColor,
          0.05,
        )
        .setStrokeStyle(2, meta.accentColor, 0.22)
        .setDepth(8);
      const frame = this.add
        .rectangle(choice.x, cardY, cardWidth, cardHeight, 0x07111f, 0.94)
        .setStrokeStyle(2, meta.accentColor, 0.28)
        .setDepth(9);
      const portrait = this.createCharacterPortrait(
        choice.x,
        cardY - 24,
        choice.id,
        cardWidth + 18,
        178,
        10,
      );
      const shade = this.add
        .rectangle(choice.x, cardY + 72, cardWidth, 84, 0x020617, 0.72)
        .setDepth(10);
      const name = this.createText(
        choice.x,
        cardY + 66,
        meta.displayName.toUpperCase(),
        {
          fontSize: "9px",
          color: "#f8fafc",
          fontStyle: "bold",
          align: "center",
          wordWrap: { width: cardWidth - 12 },
        },
      )
        .setOrigin(0.5)
        .setDepth(11);
      const gem = this.add
        .circle(choice.x, cardY + 108, 14, meta.accentColor, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.28)
        .setDepth(11);

      const hit = this.add
        .zone(choice.x, cardY, cardWidth + 8, cardHeight + 8)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });

      hit.on("pointerover", () => {
        glow.setFillStyle(meta.accentColor, 0.14);
        this.tweens.add({
          targets: [glow, frame, portrait, shade, name, gem],
          scale: 1.025,
          duration: 90,
        });
      });
      hit.on("pointerout", () => {
        this.refreshSelection();
        this.tweens.add({
          targets: [glow, frame, portrait, shade, name, gem],
          scale: 1,
          duration: 90,
        });
      });
      hit.on("pointerdown", () => this.selectCharacter(choice.id));

      this.cardHighlights.set(choice.id, { frame, glow });
    });

    this.featuredPortrait = this.createCharacterPortrait(
      60,
      488,
      this.selectedCharacter,
      46,
      58,
      21,
    );
    this.featuredPortrait.setAlpha(0.72);
  }

  private createDetailPanel(width: number, height: number) {
    const panelY = height - 136;

    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0x07111f, 0.96);
    panel.fillRoundedRect(18, panelY - 54, width - 36, 104, 18);
    panel.lineStyle(1, 0x38bdf8, 0.45);
    panel.strokeRoundedRect(18, panelY - 54, width - 36, 104, 18);

    this.detailTitle = this.createText(92, panelY - 34, "", {
      fontSize: "15px",
      color: "#f8fafc",
      fontStyle: "bold",
    }).setDepth(21);

    this.detailRole = this.createText(92, panelY - 10, "", {
      fontSize: "10px",
      color: "#67e8f9",
      fontStyle: "bold",
    }).setDepth(21);

    this.detailDescription = this.createText(36, panelY + 13, "", {
      fontSize: "10px",
      color: "#cbd5e1",
      wordWrap: { width: width - 72 },
      lineSpacing: 3,
    }).setDepth(21);
  }

  private createContinueButton(width: number, height: number) {
    this.continueButton = this.add
      .container(width / 2, height - 48)
      .setDepth(22);

    const bg = this.add
      .rectangle(0, 0, width - 114, 44, 0x9a6a12, 0.98)
      .setStrokeStyle(1, 0xfacc15, 0.86);

    const label = this.createText(0, 0, "SEÇ", {
      fontSize: "15px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      stroke: "#422006",
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.continueButton.add([bg, label]);

    this.continueButton.setSize(width - 114, 44);
    this.continueButton.setInteractive(
      new Phaser.Geom.Rectangle(-(width - 114) / 2, -22, width - 114, 44),
      Phaser.Geom.Rectangle.Contains,
    );

    this.continueButton.on("pointerover", () => {
      this.tweens.add({
        targets: this.continueButton,
        scale: 1.025,
        duration: 100,
        ease: "Sine.easeOut",
      });
    });

    this.continueButton.on("pointerout", () => {
      this.tweens.add({
        targets: this.continueButton,
        scale: 1,
        duration: 100,
        ease: "Sine.easeOut",
      });
    });

    this.continueButton.on("pointerdown", () => {
      selectProfileCharacter(this, this.selectedCharacter);
      this.startHub();
    });
  }

  private selectCharacter(id: string) {
    this.selectedCharacter = id;
    this.refreshSelection();
  }

  private refreshSelection() {
    this.cardHighlights.forEach((highlight, id) => {
      const selected = id === this.selectedCharacter;
      const accentColor = this.getMeta(id).accentColor;
      highlight.glow.setFillStyle(accentColor, selected ? 0.18 : 0.05);
      highlight.glow.setStrokeStyle(2, accentColor, selected ? 0.9 : 0.25);
      highlight.frame.setStrokeStyle(2, accentColor, selected ? 0.95 : 0.25);
    });

    const character =
      characters.find((item) => item.id === this.selectedCharacter) ??
      characters[0];
    const meta = this.getMeta(character.id);

    if (this.featuredPortrait) {
      this.setCharacterPortraitTexture(this.featuredPortrait, character.id);
    }

    this.detailTitle?.setText(meta.displayName.toUpperCase());
    this.detailRole?.setText(meta.role.toUpperCase());
    this.detailDescription?.setText(meta.description);
  }

  private getMeta(id: string): CharacterMeta {
    return CHARACTER_META[id] ?? CHARACTER_META.chrono_knight;
  }

  private startHub() {
    this.cameras.main.fadeOut(220, 5, 8, 18);
    this.time.delayedCall(230, () => this.scene.start("HubScene"));
  }

  private createCharacterPortrait(
    x: number,
    y: number,
    id: string,
    width: number,
    height: number,
    depth: number,
  ) {
    const image = this.add.image(x, y, this.getMeta(id).imageKey);
    this.setCharacterPortraitTexture(image, id);
    return image.setDisplaySize(width, height).setDepth(depth);
  }

  private setCharacterPortraitTexture(
    image: Phaser.GameObjects.Image,
    id: string,
  ) {
    const meta = this.getMeta(id);
    const crop = meta.crop;
    image.setTexture(meta.imageKey);
    image.setCrop(crop.x, crop.y, crop.width, crop.height);
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
        ...style,
      })
      .setResolution(2);
  }
}
