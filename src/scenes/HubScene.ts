import Phaser from "phaser";
import { CardDatabase } from "../cards/CardDatabase";
import type { CardData } from "../cards/CardTypes";
import { getUpgradeCost, getBuildingDefinition } from "../data/buildings";
import type { BuildingId } from "../data/buildings";
import { characters } from "../data/characters";
import { maps, type GameMap } from "../data/maps";
import {
  getProfileFromRegistry,
  updateProfileInRegistry,
} from "../progression/ProfileRegistry";
import type {
  PlayerProfile,
  ResourceWallet,
  BuildingState,
} from "../progression/PlayerProfile";

const UI_DEPTH = 10;
const OVERLAY_DEPTH = 100;

export class HubScene extends Phaser.Scene {
  constructor() {
    super("HubScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x050812);
    this.cameras.main.fadeIn(280, 5, 8, 18);

    const { width, height } = this.scale;
    const profile = getProfileFromRegistry(this);
    const commander =
      characters.find((item) => item.id === profile.selectedCharacterId)
        ?.name ?? "Commander";

    this.createBackground(width, height);
    this.createTopBar(profile);
    this.createHeroHeader(width, commander, profile);
    this.createCrystalCore(width, height);
    this.createMainActions(width, height);
  }

  private createBackground(width: number, height: number) {
    this.add
      .image(width / 2, height / 2, "crystal_temple_bg")
      .setDisplaySize(width, height)
      .setDepth(-4)
      .setAlpha(0.5);

    const veil = this.add.graphics().setDepth(-3);
    veil.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x030712, 0.92);
    veil.fillRect(0, 0, width, height);

    const cyanGlow = this.add
      .circle(width / 2, height * 0.36, 170, 0x00e5ff, 0.12)
      .setDepth(-2)
      .setBlendMode(Phaser.BlendModes.ADD);

    const purpleGlow = this.add
      .circle(width * 0.78, height * 0.58, 130, 0x7c3aed, 0.1)
      .setDepth(-2)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [cyanGlow, purpleGlow],
      scale: { from: 0.92, to: 1.16 },
      alpha: { from: 0.08, to: 0.18 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    for (let i = 0; i < 28; i += 1) {
      const particle = this.add
        .circle(
          Phaser.Math.Between(12, width - 12),
          Phaser.Math.Between(90, height - 130),
          Phaser.Math.FloatBetween(1.2, 2.4),
          0x67e8f9,
          Phaser.Math.FloatBetween(0.12, 0.38),
        )
        .setDepth(-1)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(20, 52),
        alpha: { from: particle.alpha, to: 0 },
        duration: Phaser.Math.Between(2400, 5200),
        delay: Phaser.Math.Between(0, 1200),
        repeat: -1,
        ease: "Sine.easeOut",
      });
    }
  }

  private createTopBar(profile: PlayerProfile) {
    this.createResourcePill(54, 30, `LV ${profile.level}`, 0x38bdf8);
    this.createResourcePill(142, 30, `${profile.resources.gold}`, 0xfacc15);
    this.createResourcePill(230, 30, `${profile.resources.food}`, 0x22c55e);
    this.createResourcePill(318, 30, `${profile.resources.crystal}`, 0xa78bfa);
  }

  private createHeroHeader(
    width: number,
    commander: string,
    profile: PlayerProfile,
  ) {
    this.createText(width / 2, 74, "ECHO CRYSTAL", {
      fontSize: "24px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
      stroke: "#0891b2",
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.createText(
      width / 2,
      101,
      `${commander.toUpperCase()} • KINGDOM POWER ${this.getPower(profile)}`,
      {
        fontSize: "10px",
        color: "#67e8f9",
        fontStyle: "bold",
        align: "center",
      },
    ).setOrigin(0.5);
  }

  private createCrystalCore(width: number, height: number) {
    const y = height * 0.36;

    const platform = this.add.graphics().setDepth(UI_DEPTH);
    platform.fillStyle(0x07111f, 0.82);
    platform.fillRoundedRect(34, y + 70, width - 68, 54, 22);
    platform.lineStyle(1, 0x38bdf8, 0.28);
    platform.strokeRoundedRect(34, y + 70, width - 68, 54, 22);

    const core = this.add.container(width / 2, y).setDepth(UI_DEPTH + 2);

    const aura = this.add
      .circle(0, 0, 90, 0x00e5ff, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);

    const diamond = this.add.graphics();
    diamond.fillStyle(0x67e8f9, 0.18);
    diamond.lineStyle(2, 0x67e8f9, 0.95);
    diamond.beginPath();
    diamond.moveTo(0, -76);
    diamond.lineTo(48, -8);
    diamond.lineTo(0, 80);
    diamond.lineTo(-48, -8);
    diamond.closePath();
    diamond.fillPath();
    diamond.strokePath();

    diamond.lineStyle(1, 0xffffff, 0.28);
    diamond.lineBetween(0, -76, 0, 80);
    diamond.lineBetween(-48, -8, 48, -8);

    const title = this.createText(0, 112, "CRYSTAL KINGDOM", {
      fontSize: "16px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    const subtitle = this.createText(
      0,
      134,
      "Upgrade. Conquer. Unlock the Void Gate.",
      {
        fontSize: "9px",
        color: "#94a3b8",
        align: "center",
      },
    ).setOrigin(0.5);

    core.add([aura, diamond, title, subtitle]);

    this.tweens.add({
      targets: aura,
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.08, to: 0.22 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: diamond,
      y: -8,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createMainActions(width: number, height: number) {
    const startY = height - 210;
    const gap = 58;

    this.createActionButton(
      width / 2,
      startY,
      "BATTLE",
      "Choose map and fight",
      0x0ea5e9,
      () => this.showWorldPanel(),
    );

    this.createActionButton(
      width / 2,
      startY + gap,
      "CASTLE",
      "Upgrade your kingdom",
      0xfacc15,
      () => this.showCastlePanel(),
    );

    this.createActionButton(
      width / 2,
      startY + gap * 2,
      "HEROES",
      "View cards and powers",
      0xa78bfa,
      () => this.showHeroPanel(),
    );

    this.createActionButton(
      width / 2,
      startY + gap * 3,
      "QUESTS",
      "Daily objectives",
      0x22c55e,
      () => this.showQuestPanel(),
    );
  }

  private createActionButton(
    x: number,
    y: number,
    title: string,
    subtitle: string,
    color: number,
    onPress: () => void,
  ) {
    const button = this.add.container(x, y).setDepth(UI_DEPTH + 5);

    const glow = this.add
      .rectangle(0, 0, 310, 52, color, 0.08)
      .setStrokeStyle(1, color, 0.3);

    const bg = this.add
      .rectangle(0, 0, 296, 46, 0x07111f, 0.95)
      .setStrokeStyle(1, color, 0.58);

    const dot = this.add.circle(-122, 0, 7, color, 0.95);

    const titleText = this.createText(-104, -10, title, {
      fontSize: "13px",
      color: "#f8fafc",
      fontStyle: "bold",
    });

    const subtitleText = this.createText(-104, 8, subtitle, {
      fontSize: "9px",
      color: "#94a3b8",
    });

    const arrow = this.createText(122, 0, "›", {
      fontSize: "24px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    button.add([glow, bg, dot, titleText, subtitleText, arrow]);
    button.setSize(296, 46);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-148, -23, 296, 46),
      Phaser.Geom.Rectangle.Contains,
    );

    button.on("pointerover", () => {
      glow.setAlpha(0.18);
      this.tweens.add({ targets: button, scale: 1.025, duration: 100 });
    });

    button.on("pointerout", () => {
      glow.setAlpha(1);
      this.tweens.add({ targets: button, scale: 1, duration: 100 });
    });

    button.on("pointerdown", onPress);
  }

  private showCastlePanel() {
    const profile = getProfileFromRegistry(this);
    const castle = this.getBuildingState(profile, "castle");
    const definition = getBuildingDefinition("castle");
    const cost = getUpgradeCost(definition, castle.level);
    const canUpgrade = this.canAfford(profile.resources, cost);

    const { overlay, panel } = this.createOverlayPanel(318, 390);

    panel.add(
      this.createText(0, -156, "CASTLE CORE", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#0e7490",
        strokeThickness: 1,
      }).setOrigin(0.5),
    );

    panel.add(
      this.createText(0, -126, `Level ${castle.level}`, {
        fontSize: "12px",
        color: "#67e8f9",
        fontStyle: "bold",
        align: "center",
      }).setOrigin(0.5),
    );

    panel.add(
      this.createText(
        0,
        -88,
        "The castle increases kingdom power and unlocks stronger upgrades.",
        {
          fontSize: "10px",
          color: "#cbd5e1",
          align: "center",
          wordWrap: { width: 250 },
        },
      ).setOrigin(0.5),
    );

    panel.add(this.createCostRow(0, -20, cost, profile.resources));

    const upgrade = this.createPanelButton(
      0,
      52,
      canUpgrade ? "UPGRADE CASTLE" : "NEED RESOURCES",
      canUpgrade ? 0x0e7490 : 0x475569,
    );

    upgrade.on("pointerdown", () => {
      if (!canUpgrade) {
        this.showToast("Not enough resources.");
        return;
      }

      updateProfileInRegistry(this, (current) => ({
        ...current,
        resources: this.spendResources(current.resources, cost),
        buildings: current.buildings.map((item) =>
          item.id === "castle" ? { ...item, level: item.level + 1 } : item,
        ),
        updatedAt: new Date().toISOString(),
      }));

      this.closeOverlay(overlay, panel, () => this.scene.restart());
    });

    panel.add(upgrade);

    const close = this.createPanelButton(0, 112, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
  }

  private showWorldPanel() {
    const profile = getProfileFromRegistry(this);
    const { overlay, panel } = this.createOverlayPanel(322, 448);

    panel.add(
      this.createText(0, -196, "WORLD MAP", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#0e7490",
        strokeThickness: 1,
      }).setOrigin(0.5),
    );

    maps.forEach((map, index) => {
      panel.add(this.createWorldTarget(map, -142, -142 + index * 92, profile));
    });

    const close = this.createPanelButton(0, 184, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
  }

  private createWorldTarget(
    map: GameMap,
    x: number,
    y: number,
    profile: PlayerProfile,
  ) {
    const locked = profile.level < map.recommendedLevel;
    const target = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1220, 0.96);
    bg.fillRoundedRect(0, 0, 284, 76, 12);
    bg.lineStyle(1, locked ? 0x475569 : map.accentColor, locked ? 0.35 : 0.8);
    bg.strokeRoundedRect(0, 0, 284, 76, 12);

    const marker = this.add
      .circle(24, 38, 15, locked ? 0x475569 : map.accentColor, 0.3)
      .setStrokeStyle(1, locked ? 0x64748b : map.accentColor, 0.9);

    const title = this.createText(50, 12, map.name, {
      fontSize: "13px",
      color: locked ? "#94a3b8" : "#ffffff",
      fontStyle: "bold",
    });

    const enemy = this.createText(50, 33, map.enemyName, {
      fontSize: "9px",
      color: "#94a3b8",
    });

    const reward = this.createText(
      50,
      52,
      `${map.rewards.xp} XP • ${map.rewards.gold} Gold`,
      {
        fontSize: "8px",
        color: "#cbd5e1",
      },
    );

    const action = this.createText(245, 38, locked ? "LOCKED" : "START", {
      fontSize: "9px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    target.add([bg, marker, title, enemy, reward, action]);
    target.setSize(284, 76);
    target.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 284, 76),
      Phaser.Geom.Rectangle.Contains,
    );

    target.on("pointerdown", () => {
      if (locked) {
        this.showToast("Level up to unlock this map.");
        return;
      }

      this.cameras.main.fadeOut(180, 5, 8, 18);
      this.time.delayedCall(190, () =>
        this.scene.start("GameScene", { mapId: map.id }),
      );
    });

    return target;
  }

  private showHeroPanel() {
    const profile = getProfileFromRegistry(this);
    const { overlay, panel } = this.createOverlayPanel(316, 448);

    panel.add(
      this.createText(0, -196, "HERO DECK", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#6d28d9",
        strokeThickness: 1,
      }).setOrigin(0.5),
    );

    CardDatabase.forEach((card, index) => {
      const x = index % 2 === 0 ? -75 : 75;
      const y = -124 + Math.floor(index / 2) * 124;
      panel.add(
        this.createVaultCard(
          card,
          x,
          y,
          profile.unlockedCardIds.includes(card.id),
        ),
      );
    });

    const close = this.createPanelButton(0, 184, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
  }

  private showQuestPanel() {
    const { overlay, panel } = this.createOverlayPanel(316, 360);

    panel.add(
      this.createText(0, -136, "QUEST BOARD", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#166534",
        strokeThickness: 1,
      }).setOrigin(0.5),
    );

    const quests = [
      "Win 1 battle",
      "Upgrade the castle",
      "Train 12 infantry",
      "Collect crystal income",
    ];

    quests.forEach((quest, index) => {
      panel.add(
        this.createText(-112, -82 + index * 42, `• ${quest}`, {
          fontSize: "12px",
          color: "#cbd5e1",
        }),
      );
    });

    const close = this.createPanelButton(0, 124, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
  }

  private createVaultCard(
    card: CardData,
    x: number,
    y: number,
    owned: boolean,
  ) {
    const container = this.add.container(x, y);
    const color = owned ? this.getCardAccent(card.type) : 0x475569;

    const bg = this.add.graphics();
    bg.fillStyle(owned ? 0x111827 : 0x0f172a, owned ? 0.98 : 0.72);
    bg.fillRoundedRect(-62, -50, 124, 108, 12);
    bg.lineStyle(1, color, owned ? 0.95 : 0.45);
    bg.strokeRoundedRect(-62, -50, 124, 108, 12);

    const name = this.createText(0, -25, card.name.toUpperCase(), {
      fontSize: "12px",
      color: owned ? "#ffffff" : "#94a3b8",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    const type = this.createText(0, 6, card.type.toUpperCase(), {
      fontSize: "9px",
      color: owned ? "#bae6fd" : "#64748b",
      align: "center",
    }).setOrigin(0.5);

    const power = this.createText(
      0,
      31,
      owned ? `POWER ${card.power}` : "LOCKED",
      {
        fontSize: "10px",
        color: owned ? "#facc15" : "#64748b",
        fontStyle: "bold",
        align: "center",
      },
    ).setOrigin(0.5);

    container.add([bg, name, type, power]);
    return container;
  }

  private createResourcePill(
    x: number,
    y: number,
    value: string,
    color: number,
  ) {
    const pill = this.add.container(x, y).setDepth(UI_DEPTH + 6);

    const bg = this.add
      .rectangle(0, 0, 76, 28, 0x07111f, 0.92)
      .setStrokeStyle(1, color, 0.45);

    const dot = this.add.circle(-24, 0, 5, color, 0.95);

    const text = this.createText(-12, 0, value, {
      fontSize: "9px",
      color: "#f8fafc",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    pill.add([bg, dot, text]);
  }

  private createCostRow(
    x: number,
    y: number,
    cost: ResourceWallet,
    resources: ResourceWallet,
  ) {
    const row = this.add.container(x, y);
    const items = [
      { key: "gold", label: "Gold", color: 0xfacc15 },
      { key: "food", label: "Food", color: 0x22c55e },
      { key: "crystal", label: "Crystal", color: 0xa78bfa },
    ] as const;

    items.forEach((item, index) => {
      const itemX = -96 + index * 96;
      const affordable = resources[item.key] >= cost[item.key];

      row.add([
        this.add.circle(itemX - 28, 3, 4, item.color, 0.9),
        this.createText(itemX, -9, item.label.toUpperCase(), {
          fontSize: "7px",
          color: "#94a3b8",
          fontStyle: "bold",
          align: "center",
        }).setOrigin(0.5),
        this.createText(itemX, 8, String(cost[item.key]), {
          fontSize: "10px",
          color: affordable ? "#ffffff" : "#fca5a5",
          fontStyle: "bold",
          align: "center",
        }).setOrigin(0.5),
      ]);
    });

    return row;
  }

  private createOverlayPanel(width: number, height: number) {
    const overlay = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x020617,
        0,
      )
      .setDepth(OVERLAY_DEPTH)
      .setInteractive();

    const panel = this.add
      .container(this.scale.width / 2, this.scale.height / 2 + 6)
      .setDepth(OVERLAY_DEPTH + 1)
      .setAlpha(0)
      .setScale(0.96);

    const bg = this.add.graphics();
    bg.fillStyle(0x07111f, 0.98);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(1, 0x38bdf8, 0.64);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    panel.add(bg);
    return { overlay, panel };
  }

  private openOverlay(
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Container,
  ) {
    this.tweens.add({ targets: overlay, alpha: 0.78, duration: 160 });
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 190,
      ease: "Back.easeOut",
    });
  }

  private closeOverlay(
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Container,
    onComplete?: () => void,
  ) {
    this.tweens.add({
      targets: [overlay, panel],
      alpha: 0,
      duration: 140,
      onComplete: () => {
        panel.destroy();
        overlay.destroy();
        onComplete?.();
      },
    });
  }

  private createPanelButton(
    x: number,
    y: number,
    label: string,
    color: number,
  ) {
    const button = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, 204, 38, color, 0.96)
      .setStrokeStyle(1, 0xffffff, 0.22);

    const text = this.createText(0, 0, label, {
      fontSize: "11px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(204, 38);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-102, -19, 204, 38),
      Phaser.Geom.Rectangle.Contains,
    );

    return button;
  }

  private showToast(message: string) {
    const toast = this.add
      .container(this.scale.width / 2, 110)
      .setDepth(OVERLAY_DEPTH + 20)
      .setAlpha(0);

    const bg = this.add
      .rectangle(0, 0, 286, 38, 0x020617, 0.95)
      .setStrokeStyle(1, 0x38bdf8, 0.7);

    const text = this.createText(0, 0, message, {
      fontSize: "10px",
      color: "#f8fafc",
      align: "center",
    }).setOrigin(0.5);

    toast.add([bg, text]);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 96,
      duration: 140,
      yoyo: true,
      hold: 850,
      onComplete: () => toast.destroy(),
    });
  }

  private getBuildingState(
    profile: PlayerProfile,
    buildingId: BuildingId,
  ): BuildingState {
    return (
      profile.buildings.find((item) => item.id === buildingId) ?? {
        id: buildingId,
        level: buildingId === "castle" ? 2 : 1,
      }
    );
  }

  private getPower(profile: PlayerProfile) {
    const buildingPower = profile.buildings.reduce(
      (total, building) => total + building.level * 120,
      0,
    );

    const armyPower =
      profile.army.infantry * 4 +
      profile.army.archers * 5 +
      profile.army.mages * 8;

    return buildingPower + armyPower + profile.level * 90;
  }

  private canAfford(resources: ResourceWallet, cost: ResourceWallet) {
    return (
      resources.gold >= cost.gold &&
      resources.food >= cost.food &&
      resources.crystal >= cost.crystal
    );
  }

  private spendResources(
    resources: ResourceWallet,
    cost: ResourceWallet,
  ): ResourceWallet {
    return {
      gold: Math.max(0, resources.gold - cost.gold),
      food: Math.max(0, resources.food - cost.food),
      crystal: Math.max(0, resources.crystal - cost.crystal),
    };
  }

  private getCardAccent(type: CardData["type"]) {
    if (type === "slash") return 0xef4444;
    if (type === "dash") return 0x38bdf8;
    if (type === "shield") return 0x22c55e;
    return 0xa78bfa;
  }

  private createText(
    x: number,
    y: number,
    value: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    return this.add
      .text(x, y, value, {
        fontFamily: "Arial, Helvetica, sans-serif",
        ...style,
      })
      .setResolution(2);
  }
}
