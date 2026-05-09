import Phaser from "phaser";
import { DamageSystem } from "../combat/DamageSystem";
import { maps, type GameMap } from "../data/maps";
import { characters } from "../data/characters";
import { Enemy } from "../enemies/Enemy";
import { Player } from "../player/Player";
import { getProfileFromRegistry } from "../progression/ProfileRegistry";

type ActionCommand = "run" | "jump" | "attack" | "skill";

interface GameSceneData {
  mapId?: string;
}

interface CombatButton {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  baseLabel: string;
}

type TextureCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemy!: Phaser.GameObjects.Container;
  private enemySprite!: Phaser.GameObjects.Image;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private playerHealthText!: Phaser.GameObjects.Text;
  private enemyHealthText!: Phaser.GameObjects.Text;
  private battleStatusText!: Phaser.GameObjects.Text;
  private damageSystem!: DamageSystem;
  private playerObj!: Player;
  private enemyObj!: Enemy;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey?: Phaser.Input.Keyboard.Key;
  private attackKey?: Phaser.Input.Keyboard.Key;
  private skillKey?: Phaser.Input.Keyboard.Key;
  private runKey?: Phaser.Input.Keyboard.Key;
  private enemyAttackEvent?: Phaser.Time.TimerEvent;
  private currentMap!: GameMap;
  private actionButtons = {} as Record<ActionCommand, CombatButton>;
  private cooldownUntil: Record<ActionCommand, number> = {
    run: 0,
    jump: 0,
    attack: 0,
    skill: 0,
  };
  private readonly cooldownMs: Record<ActionCommand, number> = {
    run: 750,
    jump: 950,
    attack: 700,
    skill: 3200,
  };
  private readonly groundY = 474;
  private hasBattleEnded = false;
  private isPlayerBusy = false;
  private isEnemyBusy = false;
  private isJumping = false;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData = {}) {
    this.cameras.main.setBackgroundColor(0x030712);
    this.cameras.main.fadeIn(260, 5, 8, 18);

    const selectedMap = maps.find((map) => map.id === data.mapId) ?? maps[0];
    if (!selectedMap) {
      throw new Error("No game maps configured.");
    }

    this.currentMap = selectedMap;
    this.hasBattleEnded = false;
    this.isPlayerBusy = false;
    this.isEnemyBusy = false;
    this.isJumping = false;
    this.cooldownUntil = { run: 0, jump: 0, attack: 0, skill: 0 };

    const profile = getProfileFromRegistry(this);
    this.damageSystem = new DamageSystem();
    this.playerObj = new Player(profile);
    this.enemyObj = new Enemy(this.currentMap.id, this.currentMap.enemyHealth);

    this.createArena();
    this.createCombatants(profile.selectedCharacterId ?? "chrono_knight");
    this.createHud();
    this.createControls();
    this.createEnemyLoop();
  }

  update(_time: number, delta: number) {
    if (this.hasBattleEnded) {
      return;
    }

    this.handleKeyboardMovement(delta);
    this.handleKeyboardActions();
    this.updateButtonStates();
  }

  private createArena() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x020617);
    const bg = this.add
      .image(width / 2, height / 2, this.currentMap.backgroundKey)
      .setCrop(0, 0, 375, 438)
      .setDisplaySize(width, height)
      .setDepth(-10);
    bg.setScale(1.02);

    this.tweens.add({
      targets: bg,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const shade = this.add.graphics();
    shade.fillGradientStyle(
      0x020617,
      0x020617,
      0x111827,
      0x020617,
      0.4,
      0.4,
      0.88,
      0.88,
    );
    shade.fillRect(0, 0, width, height);

    const upperVeil = this.add.graphics().setDepth(-8);
    upperVeil.fillGradientStyle(
      0x020617,
      0x020617,
      0x020617,
      0x020617,
      0.92,
      0.92,
      0.05,
      0.05,
    );
    upperVeil.fillRect(0, 0, width, 168);

    const lowerVeil = this.add.graphics().setDepth(-8);
    lowerVeil.fillGradientStyle(
      0x020617,
      0x020617,
      0x020617,
      0x020617,
      0.04,
      0.04,
      0.94,
      0.94,
    );
    lowerVeil.fillRect(0, height - 230, width, 230);

    const blueGlow = this.add
      .circle(
        width * 0.28,
        height * 0.52,
        112,
        this.currentMap.accentColor,
        0.12,
      )
      .setDepth(-7)
      .setBlendMode(Phaser.BlendModes.ADD);
    const redGlow = this.add
      .circle(width * 0.76, height * 0.48, 126, 0xef4444, 0.1)
      .setDepth(-7)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [blueGlow, redGlow],
      alpha: { from: 0.08, to: 0.2 },
      scale: { from: 0.95, to: 1.08 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const ground = this.add.graphics();
    ground.fillGradientStyle(
      0x0f172a,
      0x0f172a,
      0x020617,
      0x020617,
      0.88,
      0.88,
      1,
      1,
    );
    ground.fillEllipse(width / 2, this.groundY + 10, width - 24, 88);
    ground.lineStyle(2, this.currentMap.accentColor, 0.28);
    ground.strokeEllipse(width / 2, this.groundY + 10, width - 24, 88);

    if (this.textures.exists("hub_fog")) {
      const fog = this.add
        .image(width / 2, this.groundY - 10, "hub_fog")
        .setDisplaySize(width + 24, 110)
        .setDepth(6)
        .setAlpha(0.18);
      this.tweens.add({
        targets: fog,
        x: width / 2 + 8,
        duration: 2800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private createCombatants(characterId: string) {
    const character = characters.find((item) => item.id === characterId);
    const playerTexture = character?.id ?? "chrono_knight";
    const enemyTexture = this.getEnemyTextureKey();

    this.player = this.add.container(92, this.groundY).setDepth(10);
    const playerShadow = this.add.ellipse(0, 8, 98, 24, 0x000000, 0.38);
    const playerGlow = this.add.circle(
      0,
      -82,
      64,
      this.currentMap.accentColor,
      0.14,
    );
    this.playerSprite = this.createCroppedCharacterImage(
      0,
      -110,
      playerTexture,
      136,
      190,
    );
    const playerName = this.createText(0, -198, character?.name ?? "Hero", {
      fontSize: "13px",
      color: "#bbf7d0",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.player.add([playerShadow, playerGlow, this.playerSprite, playerName]);

    this.enemy = this.add.container(274, this.groundY).setDepth(10);
    const enemyShadow = this.add.ellipse(0, 8, 102, 24, 0x000000, 0.42);
    const enemyGlow = this.add.circle(0, -82, 64, 0xef4444, 0.12);
    this.enemySprite = this.createCroppedCharacterImage(
      0,
      -110,
      enemyTexture,
      142,
      194,
      true,
    );
    this.enemySprite.setTint(0xffd0d0);
    const enemyName = this.createText(0, -198, this.currentMap.enemyName, {
      fontSize: "13px",
      color: "#fecaca",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.enemy.add([enemyShadow, enemyGlow, this.enemySprite, enemyName]);

    this.tweens.add({
      targets: this.playerSprite,
      y: -114,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: this.enemySprite,
      y: -114,
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createHud() {
    this.hudGraphics = this.add.graphics().setDepth(30);

    const topLeft = this.textures.exists("ui_resource_bar")
      ? this.add
          .image(88, 36, "ui_resource_bar")
          .setDisplaySize(150, 34)
          .setDepth(29)
      : this.add
          .rectangle(88, 36, 150, 34, 0x08111f, 0.94)
          .setStrokeStyle(1, 0x38bdf8, 0.4)
          .setDepth(29);

    const topRight = this.textures.exists("ui_resource_bar")
      ? this.add
          .image(this.scale.width - 88, 36, "ui_resource_bar")
          .setDisplaySize(150, 34)
          .setDepth(29)
      : this.add
          .rectangle(this.scale.width - 88, 36, 150, 34, 0x08111f, 0.94)
          .setStrokeStyle(1, 0xef4444, 0.4)
          .setDepth(29);

    const battleBadge = this.textures.exists("ui_menu_button")
      ? this.add
          .image(this.scale.width / 2, 94, "ui_menu_button")
          .setDisplaySize(184, 46)
          .setDepth(29)
      : this.add
          .rectangle(this.scale.width / 2, 94, 184, 46, 0x08111f, 0.94)
          .setStrokeStyle(1, this.currentMap.accentColor, 0.4)
          .setDepth(29);

    void topLeft;
    void topRight;
    void battleBadge;

    this.playerHealthText = this.createText(18, 18, "", {
      fontSize: "10px",
      color: "#e2e8f0",
      fontStyle: "bold",
    }).setDepth(31);

    this.enemyHealthText = this.createText(this.scale.width - 18, 18, "", {
      fontSize: "10px",
      color: "#e2e8f0",
      fontStyle: "bold",
    })
      .setOrigin(1, 0)
      .setDepth(31);

    this.createText(
      this.scale.width / 2,
      82,
      this.currentMap.name.toUpperCase(),
      {
        fontSize: "12px",
        color: "#f8fafc",
        fontStyle: "bold",
        align: "center",
      },
    )
      .setOrigin(0.5)
      .setDepth(31);

    this.createText(this.scale.width / 2, 100, this.currentMap.enemyName, {
      fontSize: "8px",
      color: "#94a3b8",
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(31);

    this.battleStatusText = this.createText(
      this.scale.width / 2,
      136,
      "READY",
      {
        fontSize: "13px",
        color: "#e2e8f0",
        fontStyle: "bold",
        align: "center",
      },
    )
      .setOrigin(0.5)
      .setDepth(31);

    this.redrawHud();
  }

  private createControls() {
    const { width, height } = this.scale;
    const navY = height - 38;

    if (this.textures.exists("ui_bottom_nav")) {
      this.add
        .image(width / 2, navY, "ui_bottom_nav")
        .setDisplaySize(width - 18, 56)
        .setDepth(33);
    } else {
      this.add
        .rectangle(width / 2, navY, width - 18, 56, 0x08111f, 0.94)
        .setStrokeStyle(1, 0x38bdf8, 0.3)
        .setDepth(33);
    }

    this.actionButtons.run = this.createCombatButton(
      "run",
      "RUN",
      56,
      560,
      0x0f766e,
    );
    this.actionButtons.jump = this.createCombatButton(
      "jump",
      "JUMP",
      136,
      560,
      0x2563eb,
    );
    this.actionButtons.attack = this.createCombatButton(
      "attack",
      "STRIKE",
      224,
      560,
      0xdc2626,
    );
    this.actionButtons.skill = this.createCombatButton(
      "skill",
      "SKILL",
      304,
      560,
      0x7c3aed,
    );

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.runKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SHIFT,
      );
      this.jumpKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      );
      this.attackKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.A,
      );
      this.skillKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.S,
      );
    }
  }

  private createCombatButton(
    action: ActionCommand,
    label: string,
    x: number,
    y: number,
    color: number,
  ): CombatButton {
    const container = this.add.container(x, y).setDepth(35);
    const bg = this.textures.exists("ui_menu_button")
      ? this.add.image(0, 0, "ui_menu_button").setDisplaySize(72, 42)
      : this.add
          .rectangle(0, 0, 72, 42, 0x08111f, 0.96)
          .setStrokeStyle(1, color, 0.56);
    const glow = this.add.rectangle(0, 0, 72, 42, color, 0.06);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    const marker = this.add.circle(-24, 0, 4, color, 1);
    const text = this.createText(6, 0, label, {
      fontSize: "10px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "left",
    }).setOrigin(0, 0.5);

    container.add([glow, bg, marker, text]);
    container.setSize(72, 42).setInteractive({ useHandCursor: true });
    container.on("pointerdown", () => this.triggerAction(action));
    container.on("pointerover", () =>
      this.tweens.add({ targets: container, scale: 1.04, duration: 90 }),
    );
    container.on("pointerout", () =>
      this.tweens.add({ targets: container, scale: 1, duration: 90 }),
    );

    return {
      container,
      label: text,
      baseLabel: label,
    };
  }

  private createEnemyLoop() {
    this.enemyAttackEvent?.remove(false);
    this.enemyAttackEvent = this.time.addEvent({
      delay: 2200,
      callback: () => this.performEnemyStrike(),
      loop: true,
    });
  }

  private handleKeyboardMovement(delta: number) {
    if (!this.cursors || this.isPlayerBusy) {
      return;
    }

    const moveSpeed = 185;
    const step = moveSpeed * (delta / 1000);
    let nextX = this.player.x;

    if (this.cursors.left.isDown) {
      nextX -= step;
      this.playerSprite.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      nextX += step;
      this.playerSprite.setFlipX(false);
    }

    this.player.x = Phaser.Math.Clamp(nextX, 64, this.enemy.x - 118);
  }

  private handleKeyboardActions() {
    if (this.runKey && Phaser.Input.Keyboard.JustDown(this.runKey)) {
      this.triggerAction("run");
    }

    if (this.jumpKey && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.triggerAction("jump");
    }

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.triggerAction("attack");
    }

    if (this.skillKey && Phaser.Input.Keyboard.JustDown(this.skillKey)) {
      this.triggerAction("skill");
    }
  }

  private triggerAction(action: ActionCommand) {
    if (this.hasBattleEnded) {
      return;
    }

    if (this.time.now < this.cooldownUntil[action]) {
      this.pulseButton(action);
      return;
    }

    if (this.isPlayerBusy && action !== "jump") {
      return;
    }

    this.cooldownUntil[action] = this.time.now + this.cooldownMs[action];

    if (action === "run") {
      this.performRun();
      return;
    }

    if (action === "jump") {
      this.performJump();
      return;
    }

    if (action === "attack") {
      this.performAttack();
      return;
    }

    this.performSkill();
  }

  private performRun() {
    if (this.isPlayerBusy) {
      return;
    }

    this.isPlayerBusy = true;
    this.playerSprite.setFlipX(false);
    this.battleStatusText.setText("ADVANCE");

    this.tweens.add({
      targets: this.player,
      x: this.enemy.x - 118,
      duration: 420,
      ease: "Cubic.easeOut",
      onUpdate: () => this.createDust(this.player.x - 12, this.groundY - 8),
      onComplete: () => {
        this.isPlayerBusy = false;
      },
    });
  }

  private performJump() {
    if (this.isJumping) {
      return;
    }

    this.isJumping = true;
    this.battleStatusText.setText("JUMP");

    this.tweens.add({
      targets: this.player,
      y: this.groundY - 105,
      duration: 260,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        this.player.y = this.groundY;
        this.isJumping = false;
        this.createImpact(this.player.x, this.groundY - 6, 0x38bdf8);
      },
    });
  }

  private performAttack() {
    if (this.isPlayerBusy) {
      return;
    }

    this.isPlayerBusy = true;
    this.playerSprite.setFlipX(false);
    this.battleStatusText.setText("STRIKE");

    const strike = () => {
      this.tweens.add({
        targets: this.player,
        x: this.enemy.x - 92,
        duration: 120,
        yoyo: true,
        ease: "Sine.easeInOut",
        onYoyo: () => {
          this.createSlashEffect();
          this.damageEnemy(this.playerObj.stats.attack + 18, "HIT");
        },
        onComplete: () => {
          this.isPlayerBusy = false;
        },
      });
    };

    if (this.enemy.x - this.player.x > 134) {
      this.tweens.add({
        targets: this.player,
        x: this.enemy.x - 126,
        duration: 230,
        ease: "Cubic.easeOut",
        onUpdate: () => this.createDust(this.player.x - 14, this.groundY - 8),
        onComplete: strike,
      });
      return;
    }

    strike();
  }

  private performSkill() {
    if (this.isPlayerBusy) {
      return;
    }

    this.isPlayerBusy = true;
    this.playerSprite.setFlipX(false);
    this.battleStatusText.setText("SKILL");

    const startX = this.player.x + 34;
    const startY = this.player.y - 86;
    const projectile = this.add
      .circle(startX, startY, 10, this.currentMap.accentColor, 1)
      .setDepth(22);
    const aura = this.add
      .circle(startX, startY, 22, this.currentMap.accentColor, 0.18)
      .setDepth(21);

    this.tweens.add({
      targets: [projectile, aura],
      x: this.enemy.x - 10,
      y: this.enemy.y - 78,
      duration: 520,
      ease: "Cubic.easeIn",
      onComplete: () => {
        projectile.destroy();
        aura.destroy();
        this.createImpact(
          this.enemy.x - 8,
          this.enemy.y - 78,
          this.currentMap.accentColor,
        );
        this.damageEnemy(this.playerObj.stats.attack * 2 + 26, "SKILL");
        this.cameras.main.shake(130, 0.006);
        this.isPlayerBusy = false;
      },
    });
  }

  private performEnemyStrike() {
    if (this.hasBattleEnded || this.isEnemyBusy || this.enemyObj.health <= 0) {
      return;
    }

    this.isEnemyBusy = true;
    this.battleStatusText.setText("ENEMY ATTACK");

    const homeX = this.enemy.x;

    this.tweens.add({
      targets: this.enemy,
      x: this.player.x + 106,
      duration: 270,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (this.isJumping) {
          this.showFloatingText(
            this.player.x,
            this.player.y - 135,
            "DODGE",
            "#38bdf8",
          );
        } else {
          const rawDamage = 12 + this.currentMap.recommendedLevel * 6;
          const blockedDamage = Math.floor(this.playerObj.stats.defense * 0.35);
          this.damagePlayer(Math.max(4, rawDamage - blockedDamage));
        }

        this.tweens.add({
          targets: this.enemy,
          x: homeX,
          duration: 250,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.isEnemyBusy = false;
          },
        });
      },
    });
  }

  private damageEnemy(amount: number, label: string) {
    if (this.hasBattleEnded) {
      return;
    }

    this.damageSystem.applyDamage(this.enemyObj, Math.round(amount));
    this.enemyObj.health = Math.max(0, this.enemyObj.health);
    this.enemySprite.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.enemySprite.setTint(0xffd0d0));
    this.showFloatingText(
      this.enemy.x,
      this.enemy.y - 122,
      `${label} -${Math.round(amount)}`,
      "#fecaca",
    );
    this.redrawHud();

    if (this.enemyObj.health <= 0) {
      this.resolveVictory();
    }
  }

  private damagePlayer(amount: number) {
    if (this.hasBattleEnded) {
      return;
    }

    this.damageSystem.applyDamage(this.playerObj, amount);
    this.playerObj.health = Math.max(0, this.playerObj.health);
    this.playerSprite.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.playerSprite.clearTint());
    this.showFloatingText(
      this.player.x,
      this.player.y - 126,
      `-${amount}`,
      "#fca5a5",
    );
    this.cameras.main.shake(90, 0.004);
    this.redrawHud();

    if (this.playerObj.health <= 0) {
      this.resolveDefeat();
    }
  }

  private redrawHud() {
    const enemyRatio = Phaser.Math.Clamp(
      this.enemyObj.health / this.currentMap.enemyHealth,
      0,
      1,
    );
    const playerRatio = Phaser.Math.Clamp(
      this.playerObj.health / this.playerObj.stats.health,
      0,
      1,
    );
    const enemyBarX = this.scale.width - 160;

    this.hudGraphics.clear();
    this.drawBar(18, 42, 142, 10, playerRatio, 0x22c55e);
    this.drawBar(enemyBarX, 42, 142, 10, enemyRatio, 0xef4444);

    this.playerHealthText.setText(
      `Lv ${this.playerObj.profile.level}  HP ${this.playerObj.health}/${this.playerObj.stats.health}`,
    );
    this.enemyHealthText.setText(
      `HP ${this.enemyObj.health}/${this.currentMap.enemyHealth}`,
    );
  }

  private drawBar(
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    color: number,
  ) {
    this.hudGraphics.fillStyle(0x0f172a, 0.86);
    this.hudGraphics.fillRoundedRect(x, y, width, height, 4);
    this.hudGraphics.fillStyle(color, 1);
    this.hudGraphics.fillRoundedRect(x, y, width * ratio, height, 4);
    this.hudGraphics.lineStyle(1, 0xffffff, 0.22);
    this.hudGraphics.strokeRoundedRect(x, y, width, height, 4);
  }

  private updateButtonStates() {
    (Object.keys(this.actionButtons) as ActionCommand[]).forEach((action) => {
      const button = this.actionButtons[action];
      const remainingMs = this.cooldownUntil[action] - this.time.now;

      if (remainingMs > 0) {
        button.container.setAlpha(0.56);
        button.label.setText(String(Math.ceil(remainingMs / 1000)));
        return;
      }

      button.container.setAlpha(1);
      button.label.setText(button.baseLabel);
    });
  }

  private pulseButton(action: ActionCommand) {
    const button = this.actionButtons[action];

    this.tweens.add({
      targets: button.container,
      scale: 1.08,
      duration: 70,
      yoyo: true,
    });
  }

  private createSlashEffect() {
    const slash = this.add.graphics().setDepth(25);
    slash.lineStyle(5, 0xffffff, 0.9);
    slash.beginPath();
    slash.moveTo(this.enemy.x - 34, this.enemy.y - 105);
    slash.lineTo(this.enemy.x + 24, this.enemy.y - 52);
    slash.strokePath();
    slash.lineStyle(2, this.currentMap.accentColor, 0.9);
    slash.beginPath();
    slash.moveTo(this.enemy.x - 22, this.enemy.y - 118);
    slash.lineTo(this.enemy.x + 38, this.enemy.y - 66);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 180,
      onComplete: () => slash.destroy(),
    });
  }

  private createImpact(x: number, y: number, color: number) {
    const impact = this.add.container(x, y).setDepth(24);
    const ring = this.add
      .circle(0, 0, 12, color, 0.16)
      .setStrokeStyle(2, color, 0.9);
    const core = this.add.circle(0, 0, 4, 0xffffff, 0.8);
    impact.add([ring, core]);

    this.tweens.add({
      targets: impact,
      scale: 2.3,
      alpha: 0,
      duration: 260,
      ease: "Quad.easeOut",
      onComplete: () => impact.destroy(),
    });
  }

  private createDust(x: number, y: number) {
    if (Phaser.Math.Between(0, 100) > 36) {
      return;
    }

    const dust = this.add
      .circle(x, y, Phaser.Math.Between(2, 5), 0xcbd5e1, 0.22)
      .setDepth(8);
    this.tweens.add({
      targets: dust,
      alpha: 0,
      x: x - Phaser.Math.Between(8, 18),
      y: y + Phaser.Math.Between(0, 10),
      duration: 260,
      onComplete: () => dust.destroy(),
    });
  }

  private showFloatingText(x: number, y: number, value: string, color: string) {
    const text = this.createText(x, y, value, {
      fontSize: "14px",
      color,
      fontStyle: "bold",
      stroke: "#020617",
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(40);

    this.tweens.add({
      targets: text,
      y: y - 34,
      alpha: 0,
      duration: 720,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private resolveVictory() {
    if (this.hasBattleEnded) {
      return;
    }

    this.hasBattleEnded = true;
    this.enemyAttackEvent?.remove(false);
    this.battleStatusText.setText("VICTORY");
    this.enemy.setAlpha(0.45);
    this.cameras.main.flash(240, 80, 255, 180);

    this.time.delayedCall(950, () => {
      this.scene.start("ResultScene", {
        victory: true,
        mapId: this.currentMap.id,
        rewards: this.currentMap.rewards,
      });
    });
  }

  private resolveDefeat() {
    if (this.hasBattleEnded) {
      return;
    }

    this.hasBattleEnded = true;
    this.enemyAttackEvent?.remove(false);
    this.battleStatusText.setText("DEFEAT");
    this.player.setAlpha(0.45);

    this.time.delayedCall(1100, () => {
      this.scene.start("ResultScene", {
        victory: false,
        mapId: this.currentMap.id,
      });
    });
  }

  private getEnemyTextureKey(): string {
    if (this.currentMap.id === "golden_palace") {
      return "ether_rogue";
    }

    if (this.currentMap.id === "void_gate") {
      return "aether_mage";
    }

    return "chrono_knight";
  }

  private createCroppedCharacterImage(
    x: number,
    y: number,
    textureKey: string,
    width: number,
    height: number,
    flipX = false,
  ) {
    const image = this.add.image(x, y, textureKey);
    const crop = this.getCharacterCrop(textureKey);
    image.setCrop(crop.x, crop.y, crop.width, crop.height);
    image.setDisplaySize(width, height);
    image.setFlipX(flipX);
    return image;
  }

  private getCharacterCrop(textureKey: string): TextureCrop {
    if (textureKey === "aether_mage") {
      return { x: 62, y: 8, width: 138, height: 282 };
    }

    if (textureKey === "ether_rogue") {
      return { x: 70, y: 10, width: 122, height: 280 };
    }

    return { x: 72, y: 12, width: 116, height: 278 };
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
