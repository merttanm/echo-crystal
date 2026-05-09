import Phaser from "phaser";
import { CardDatabase } from "../cards/CardDatabase";
import type { CardData } from "../cards/CardTypes";
import { getUpgradeCost, getBuildingDefinition } from "../data/buildings";
import type { BuildingId } from "../data/buildings";
import { characters } from "../data/characters";
import { maps } from "../data/maps";
import {
  getProfileFromRegistry,
  updateProfileInRegistry,
} from "../progression/ProfileRegistry";
import type {
  PlayerProfile,
  ResourceWallet,
  BuildingState,
} from "../progression/PlayerProfile";
import { ReferenceFrame } from "../ui/HubScene";
import { ResourcePill } from "../ui/ResourcePill";
import { SideMenuButton } from "../ui/SideMenuButton";

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
    this.createReferenceHub(width, height);
    this.createTopBar(profile);
    this.createHeroHeader(width, commander, profile);
    this.createHubButtons(width, height);
  }

  private createBackground(width: number, height: number) {
    this.add
      .image(width / 2, height / 2, "crystal_temple_bg")
      .setDisplaySize(width, height)
      .setDepth(-8)
      .setAlpha(0.84);

    if (this.textures.exists("hub_bg")) {
      this.add
        .image(width / 2, height / 2, "hub_bg")
        .setDisplaySize(width, height)
        .setDepth(-7)
        .setAlpha(0.78);
    }

    if (this.textures.exists("hub_glow")) {
      const glow = this.add
        .image(width / 2, height * 0.42, "hub_glow")
        .setDisplaySize(332, 332)
        .setDepth(-6)
        .setAlpha(0.34)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: glow,
        scale: { from: 0.94, to: 1.08 },
        alpha: { from: 0.24, to: 0.42 },
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    if (this.textures.exists("hub_castle")) {
      const castle = this.add
        .image(width / 2, height * 0.51, "hub_castle")
        .setDisplaySize(214, 274)
        .setDepth(-5)
        .setAlpha(0.88);

      this.tweens.add({
        targets: castle,
        y: castle.y - 7,
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    if (this.textures.exists("hub_fog")) {
      const fogFront = this.add
        .image(width / 2, height * 0.66, "hub_fog")
        .setDisplaySize(width + 32, 150)
        .setDepth(-4)
        .setAlpha(0.18);
      const fogBack = this.add
        .image(width / 2, height * 0.58, "hub_fog")
        .setDisplaySize(width + 50, 128)
        .setDepth(-5)
        .setAlpha(0.12);

      this.tweens.add({
        targets: fogFront,
        x: width / 2 + 10,
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: fogBack,
        x: width / 2 - 12,
        duration: 4100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const veil = this.add.graphics().setDepth(-3);
    veil.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x030712, 0.92);
    veil.fillRect(0, 0, width, height);

    const cyanGlow = this.add
      .circle(width / 2, height * 0.36, 170, 0x00e5ff, 0.08)
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

  private createReferenceHub(width: number, height: number) {
    const frame = new ReferenceFrame({
      scene: this,
      x: width / 2,
      y: height / 2 + 4,
      width: 320,
      height: 500,
      imageKey: "ref_hub",
      glowColor: 0x38bdf8,
    });
    frame.container.setDepth(2).setAlpha(0.92);

    this.add.rectangle(width / 2, 108, 248, 46, 0x020617, 0.68).setDepth(7);
    this.add.rectangle(314, 319, 56, 264, 0x020617, 0.5).setDepth(7);
    this.add.rectangle(width / 2, 535, 278, 36, 0x020617, 0.54).setDepth(7);
  }

  private createTopBar(profile: PlayerProfile) {
    new ResourcePill({
      scene: this,
      x: 48,
      y: 30,
      label: "Level",
      value: String(profile.level),
      color: 0x38bdf8,
      width: 72,
    }).container.setDepth(UI_DEPTH + 8);

    new ResourcePill({
      scene: this,
      x: 128,
      y: 30,
      label: "Gold",
      value: String(profile.resources.gold),
      color: 0xfacc15,
      width: 76,
    }).container.setDepth(UI_DEPTH + 8);

    new ResourcePill({
      scene: this,
      x: 210,
      y: 30,
      label: "Food",
      value: String(profile.resources.food),
      color: 0x22c55e,
      width: 76,
    }).container.setDepth(UI_DEPTH + 8);

    new ResourcePill({
      scene: this,
      x: 292,
      y: 30,
      label: "Crystal",
      value: String(profile.resources.crystal),
      color: 0xa78bfa,
      width: 84,
    }).container.setDepth(UI_DEPTH + 8);
  }

  private createHeroHeader(
    width: number,
    commander: string,
    profile: PlayerProfile,
  ) {
    this.createText(width / 2, 74, "ECHO CRYSTAL", {
      fontSize: "22px",
      color: "#f8fafc",
      fontStyle: "bold",
      align: "center",
      stroke: "#0891b2",
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.createText(
      width / 2,
      101,
      `${commander.toUpperCase()} - KINGDOM POWER ${this.getPower(profile)}`,
      {
        fontSize: "10px",
        color: "#67e8f9",
        fontStyle: "bold",
        align: "center",
      },
    ).setOrigin(0.5);
  }

  private createHubButtons(width: number, height: number) {
    const worldButton = new SideMenuButton({
      scene: this,
      x: width - 42,
      y: 248,
      title: "WORLD",
      accentColor: 0x38bdf8,
      onPress: () => this.showWorldPanel(),
    });
    worldButton.container.setDepth(UI_DEPTH + 10);

    const heroButton = new SideMenuButton({
      scene: this,
      x: width - 42,
      y: 304,
      title: "HEROES",
      accentColor: 0xa78bfa,
      onPress: () => this.showHeroPanel(),
    });
    heroButton.container.setDepth(UI_DEPTH + 10);

    const castleButton = new SideMenuButton({
      scene: this,
      x: width - 42,
      y: 360,
      title: "CASTLE",
      accentColor: 0xfacc15,
      onPress: () => this.showCastlePanel(),
    });
    castleButton.container.setDepth(UI_DEPTH + 10);

    const questButton = new SideMenuButton({
      scene: this,
      x: width - 42,
      y: 472,
      title: "QUESTS",
      accentColor: 0x22c55e,
      onPress: () => this.showQuestPanel(),
    });
    questButton.container.setDepth(UI_DEPTH + 10);

    this.add
      .zone(178, 266, 132, 160)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.showCastlePanel());

    this.add
      .zone(183, 337, 180, 222)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.showWorldPanel());

    this.createBottomNav(width, height);
  }

  private createBottomNav(width: number, height: number) {
    const navY = height - 28;
    if (this.textures.exists("ui_bottom_nav")) {
      this.add
        .image(width / 2, navY, "ui_bottom_nav")
        .setDisplaySize(width - 18, 52)
        .setDepth(UI_DEPTH + 6);
    } else {
      this.add
        .rectangle(width / 2, navY, width - 18, 52, 0x08111f, 0.96)
        .setStrokeStyle(1, 0x38bdf8, 0.35)
        .setDepth(UI_DEPTH + 6);
    }

    const shortcuts = [
      { x: width / 2 - 104, label: "WORLD", color: 0x38bdf8, onPress: () => this.showWorldPanel() },
      { x: width / 2, label: "CASTLE", color: 0xfacc15, onPress: () => this.showCastlePanel() },
      { x: width / 2 + 104, label: "QUESTS", color: 0x22c55e, onPress: () => this.showQuestPanel() },
    ];

    shortcuts.forEach((shortcut) => {
      const button = this.add.container(shortcut.x, navY).setDepth(UI_DEPTH + 10);
      const dot = this.add.circle(0, -8, 4, shortcut.color, 1);
      const text = this.createText(0, 8, shortcut.label, {
        fontSize: "9px",
        color: "#f8fafc",
        fontStyle: "bold",
        align: "center",
      }).setOrigin(0.5);

      button.add([dot, text]);
      button.setSize(76, 40);
      button.setInteractive(
        new Phaser.Geom.Rectangle(-38, -20, 76, 40),
        Phaser.Geom.Rectangle.Contains,
      );
      button.on("pointerdown", shortcut.onPress);
      button.on("pointerover", () =>
        this.tweens.add({ targets: button, scale: 1.04, duration: 100 }),
      );
      button.on("pointerout", () =>
        this.tweens.add({ targets: button, scale: 1, duration: 100 }),
      );
    });
  }

  private showCastlePanel() {
    const profile = getProfileFromRegistry(this);
    const castle = this.getBuildingState(profile, "castle");
    const definition = getBuildingDefinition("castle");
    const cost = getUpgradeCost(definition, castle.level);
    const canUpgrade = this.canAfford(profile.resources, cost);

    const { overlay, panel } = this.createOverlayPanel(328, 438);

    const art = this.add.image(0, -10, "ref_castle");
    art.setDisplaySize(312, 268);
    panel.add(art);

    panel.add(this.add.rectangle(0, -146, 210, 58, 0x020617, 0.72));
    panel.add(this.add.rectangle(0, 110, 250, 84, 0x020617, 0.82));

    panel.add(
      this.createText(0, -160, "CASTLE UPGRADE", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#0e7490",
        strokeThickness: 1,
      }).setOrigin(0.5),
    );

    panel.add(
      this.createText(0, -136, `Level ${castle.level} -> ${castle.level + 1}`, {
        fontSize: "11px",
        color: "#67e8f9",
        fontStyle: "bold",
        align: "center",
      }).setOrigin(0.5),
    );

    panel.add(this.createCostRow(0, 86, cost, profile.resources));

    const upgrade = this.createPanelButton(
      0,
      148,
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

    const close = this.createPanelButton(0, 194, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
  }

  private showWorldPanel() {
    const profile = getProfileFromRegistry(this);
    const { overlay, panel } = this.createOverlayPanel(336, 504);

    const art = this.add.image(0, -8, "ref_map");
    art.setDisplaySize(320, 438);
    panel.add(art);

    panel.add(this.add.rectangle(0, -196, 214, 44, 0x020617, 0.74));
    panel.add(this.add.rectangle(0, 98, 256, 88, 0x020617, 0.62));
    panel.add(this.add.rectangle(0, 191, 252, 40, 0x020617, 0.4));

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

    const map = maps.find((item) => item.id === "mist_valley") ?? maps[0];
    const actionLabel = profile.level >= (map?.recommendedLevel ?? 1)
      ? "START BATTLE"
      : "LOCKED";

    panel.add(
      this.createText(0, 114, `${map?.name ?? "Map"} - ${map?.enemyName ?? ""}`, {
        fontSize: "12px",
        color: "#f8fafc",
        fontStyle: "bold",
        align: "center",
      }).setOrigin(0.5),
    );

    panel.add(
      this.createText(
        0,
        134,
        `Reward ${map?.rewards.xp ?? 0} XP - ${map?.rewards.gold ?? 0} Gold - ${map?.rewards.crystal ?? 0} Crystal`,
        {
          fontSize: "8px",
          color: "#cbd5e1",
          align: "center",
        },
      ).setOrigin(0.5),
    );

    const start = this.createPanelButton(
      0,
      188,
      actionLabel,
      profile.level >= (map?.recommendedLevel ?? 1) ? 0x0e7490 : 0x475569,
    );
    start.on("pointerdown", () => {
      if (!map || profile.level < map.recommendedLevel) {
        this.showToast("Level up to unlock this battle.");
        return;
      }

      this.cameras.main.fadeOut(180, 5, 8, 18);
      this.time.delayedCall(190, () => this.scene.start("GameScene", { mapId: map.id }));
    });
    panel.add(start);

    const close = this.createPanelButton(0, 236, "CLOSE", 0x1e293b);
    close.on("pointerdown", () => this.closeOverlay(overlay, panel));
    panel.add(close);

    this.openOverlay(overlay, panel);
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
