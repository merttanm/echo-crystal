import Phaser from "phaser";
import { characters } from "../data/characters";
import {
  getProfileFromRegistry,
  selectProfileCharacter,
} from "../progression/ProfileRegistry";
import { ReferenceFrame } from "../ui/HubScene";
import { ResourcePill } from "../ui/ResourcePill";

type CharacterMeta = {
  role: string;
  description: string;
  imageKey: string;
  accentColor: number;
};

const CHARACTER_META: Record<string, CharacterMeta> = {
  chrono_knight: {
    role: "Frontline Duelist",
    description: "Balanced warrior with strong defense and time-based attacks.",
    imageKey: "chrono_knight",
    accentColor: 0x38bdf8,
  },
  ether_rogue: {
    role: "Fast Striker",
    description: "High mobility assassin focused on quick bursts and evasion.",
    imageKey: "ether_rogue",
    accentColor: 0xa78bfa,
  },
  aether_mage: {
    role: "Arcane Damage",
    description: "Mystic caster with powerful ranged skills and crystal magic.",
    imageKey: "aether_mage",
    accentColor: 0x22c55e,
  },
};

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacter = "chrono_knight";
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
    this.createTopBar(
      profile.level,
      profile.resources.gold,
      profile.resources.crystal,
    );
    this.createHeader(width);
    this.createCharacterLayout(width, height);
    this.createDetailPanel(width, height);
    this.createContinueButton(width, height);
    this.refreshSelection();
  }

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();

    bg.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x050812, 1);
    bg.fillRect(0, 0, width, height);

    const glowA = this.add.circle(width * 0.18, 126, 120, 0x38bdf8, 0.1);
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

  private createTopBar(level: number, gold: number, crystal: number) {
    new ResourcePill({
      scene: this,
      x: 58,
      y: 30,
      label: "Level",
      value: String(level),
      color: 0x38bdf8,
    });
    new ResourcePill({
      scene: this,
      x: 180,
      y: 30,
      label: "Gold",
      value: String(gold),
      color: 0xf59e0b,
      width: 104,
    });
    new ResourcePill({
      scene: this,
      x: 302,
      y: 30,
      label: "Crystal",
      value: String(crystal),
      color: 0x67e8f9,
      width: 104,
    });
  }

  private createHeader(width: number) {
    this.createText(width / 2, 72, "SELECT YOUR COMMANDER", {
      fontSize: "20px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
      stroke: "#0891b2",
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.createText(
      width / 2,
      99,
      "Choose the hero that will lead your crystal kingdom.",
      {
        fontSize: "10px",
        color: "#94a3b8",
        align: "center",
        wordWrap: { width: width - 44 },
      },
    ).setOrigin(0.5);
  }

  private createCharacterLayout(width: number, height: number) {
    new ReferenceFrame({
      scene: this,
      x: width / 2,
      y: height / 2 + 10,
      width: 314,
      height: 536,
      imageKey: "ref_character",
      glowColor: 0x67e8f9,
    });

    const hitAreas = [
      { id: "chrono_knight", x: 92, y: 227, width: 88, height: 218 },
      { id: "aether_mage", x: 180, y: 227, width: 88, height: 218 },
      { id: "ether_rogue", x: 268, y: 227, width: 88, height: 218 },
    ];

    hitAreas.forEach((area) => {
      const meta = this.getMeta(area.id);
      const glow = this.add
        .rectangle(area.x, area.y, area.width + 6, area.height + 6, meta.accentColor, 0.06)
        .setStrokeStyle(2, meta.accentColor, 0.3)
        .setDepth(8);
      const frame = this.add
        .rectangle(area.x, area.y, area.width, area.height, 0x000000, 0)
        .setStrokeStyle(2, meta.accentColor, 0.3)
        .setDepth(9);

      const hit = this.add
        .zone(area.x, area.y, area.width, area.height)
        .setRectangleDropZone(area.width, area.height)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });

      hit.on("pointerover", () => {
        glow.setAlpha(0.16);
        this.tweens.add({ targets: [glow, frame], scale: 1.02, duration: 90 });
      });

      hit.on("pointerout", () => {
        this.refreshSelection();
        this.tweens.add({ targets: [glow, frame], scale: 1, duration: 90 });
      });

      hit.on("pointerdown", () => this.selectCharacter(area.id));
      this.cardHighlights.set(area.id, { frame, glow });
    });
  }

  private createDetailPanel(width: number, height: number) {
    const panelY = height - 132;

    const panel = this.add.graphics();
    panel.fillStyle(0x07111f, 0.96);
    panel.fillRoundedRect(18, panelY - 54, width - 36, 104, 18);
    panel.lineStyle(1, 0x38bdf8, 0.45);
    panel.strokeRoundedRect(18, panelY - 54, width - 36, 104, 18);

    this.detailTitle = this.createText(36, panelY - 34, "", {
      fontSize: "15px",
      color: "#f8fafc",
      fontStyle: "bold",
    });

    this.detailRole = this.createText(36, panelY - 10, "", {
      fontSize: "10px",
      color: "#67e8f9",
      fontStyle: "bold",
    });

    this.detailDescription = this.createText(36, panelY + 13, "", {
      fontSize: "10px",
      color: "#94a3b8",
      wordWrap: { width: width - 72 },
      lineSpacing: 3,
    });
  }

  private createContinueButton(width: number, height: number) {
    this.continueButton = this.add.container(width / 2, height - 46);

    const bg = this.add
      .rectangle(0, 0, width - 54, 44, 0x0891b2, 0.96)
      .setStrokeStyle(1, 0x67e8f9, 0.9);

    const label = this.createText(0, 0, "CONTINUE TO KINGDOM", {
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    this.continueButton.add([bg, label]);

    this.continueButton.setSize(width - 54, 44);
    this.continueButton.setInteractive(
      new Phaser.Geom.Rectangle(-(width - 54) / 2, -22, width - 54, 44),
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

    this.detailTitle?.setText(character.name.toUpperCase());
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
