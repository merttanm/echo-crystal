import Phaser from 'phaser';
import { DamageSystem } from '../combat/DamageSystem';
import { maps, type GameMap } from '../data/maps';
import { characters } from '../data/characters';
import { Enemy } from '../enemies/Enemy';
import { Player } from '../player/Player';
import { getProfileFromRegistry } from '../progression/ProfileRegistry';

type ActionCommand = 'run' | 'jump' | 'attack' | 'skill';

interface GameSceneData {
    mapId?: string;
}

interface CombatButton {
    container: Phaser.GameObjects.Container;
    label: Phaser.GameObjects.Text;
    baseLabel: string;
}

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
    private readonly groundY = 462;
    private hasBattleEnded = false;
    private isPlayerBusy = false;
    private isEnemyBusy = false;
    private isJumping = false;

    constructor() {
        super('GameScene');
    }

    create(data: GameSceneData = {}) {
        const selectedMap = maps.find((map) => map.id === data.mapId) ?? maps[0];
        if (!selectedMap) {
            throw new Error('No game maps configured.');
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
        this.createCombatants(profile.selectedCharacterId ?? 'chrono_knight');
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
        this.add.image(width / 2, height / 2, this.currentMap.backgroundKey).setDisplaySize(width, height).setDepth(-10);

        const shade = this.add.graphics();
        shade.fillGradientStyle(0x020617, 0x020617, 0x111827, 0x020617, 0.4, 0.4, 0.88, 0.88);
        shade.fillRect(0, 0, width, height);

        const ground = this.add.graphics();
        ground.fillGradientStyle(0x0f172a, 0x0f172a, 0x020617, 0x020617, 0.88, 0.88, 1, 1);
        ground.fillRect(0, this.groundY - 18, width, height - this.groundY + 18);
        ground.lineStyle(2, this.currentMap.accentColor, 0.45);
        ground.lineBetween(0, this.groundY - 18, width, this.groundY - 18);

        this.add.text(18, 86, this.currentMap.name, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#f8fafc',
            fontStyle: 'bold'
        });

        this.add.text(18, 111, this.currentMap.enemyName, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#cbd5e1'
        });
    }

    private createCombatants(characterId: string) {
        const character = characters.find((item) => item.id === characterId);
        const playerTexture = character?.id ?? 'chrono_knight';
        const enemyTexture = this.getEnemyTextureKey();

        this.player = this.add.container(78, this.groundY).setDepth(10);
        const playerShadow = this.add.ellipse(0, 4, 78, 18, 0x000000, 0.38);
        const playerGlow = this.add.circle(0, -56, 48, this.currentMap.accentColor, 0.12);
        this.playerSprite = this.add.image(0, -64, playerTexture).setDisplaySize(88, 88);
        const playerName = this.add.text(0, -125, character?.name ?? 'Hero', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#bbf7d0',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.player.add([playerShadow, playerGlow, this.playerSprite, playerName]);

        this.enemy = this.add.container(282, this.groundY).setDepth(10);
        const enemyShadow = this.add.ellipse(0, 4, 84, 20, 0x000000, 0.42);
        const enemyGlow = this.add.circle(0, -58, 50, 0xef4444, 0.12);
        this.enemySprite = this.add.image(0, -64, enemyTexture).setDisplaySize(92, 92).setFlipX(true);
        this.enemySprite.setTint(0xffd0d0);
        const enemyName = this.add.text(0, -128, this.currentMap.enemyName, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#fecaca',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.enemy.add([enemyShadow, enemyGlow, this.enemySprite, enemyName]);
    }

    private createHud() {
        this.hudGraphics = this.add.graphics().setDepth(30);

        this.playerHealthText = this.add.text(18, 22, '', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#f8fafc'
        }).setDepth(31);

        this.enemyHealthText = this.add.text(this.scale.width - 18, 22, '', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#f8fafc'
        }).setOrigin(1, 0).setDepth(31);

        this.battleStatusText = this.add.text(this.scale.width / 2, 154, 'READY', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(31);

        this.redrawHud();
    }

    private createControls() {
        const y = 582;

        this.actionButtons.run = this.createCombatButton('run', 'RUN', 60, y, 0x0f766e);
        this.actionButtons.jump = this.createCombatButton('jump', 'JUMP', 140, y, 0x2563eb);
        this.actionButtons.attack = this.createCombatButton('attack', 'HIT', 220, y, 0xdc2626);
        this.actionButtons.skill = this.createCombatButton('skill', 'SKILL', 300, y, 0x7c3aed);

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.runKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
            this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.skillKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        }
    }

    private createCombatButton(action: ActionCommand, label: string, x: number, y: number, color: number): CombatButton {
        const container = this.add.container(x, y).setDepth(35);
        const bg = this.add.rectangle(0, 0, 68, 46, color, 0.9).setStrokeStyle(1, 0xffffff, 0.35);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setSize(68, 46).setInteractive({ useHandCursor: true });
        container.on('pointerdown', () => this.triggerAction(action));

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

        this.player.x = Phaser.Math.Clamp(nextX, 46, this.enemy.x - 88);
    }

    private handleKeyboardActions() {
        if (this.runKey && Phaser.Input.Keyboard.JustDown(this.runKey)) {
            this.triggerAction('run');
        }

        if (this.jumpKey && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
            this.triggerAction('jump');
        }

        if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.triggerAction('attack');
        }

        if (this.skillKey && Phaser.Input.Keyboard.JustDown(this.skillKey)) {
            this.triggerAction('skill');
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

        if (this.isPlayerBusy && action !== 'jump') {
            return;
        }

        this.cooldownUntil[action] = this.time.now + this.cooldownMs[action];

        if (action === 'run') {
            this.performRun();
            return;
        }

        if (action === 'jump') {
            this.performJump();
            return;
        }

        if (action === 'attack') {
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
        this.battleStatusText.setText('ADVANCE');

        this.tweens.add({
            targets: this.player,
            x: this.enemy.x - 105,
            duration: 420,
            ease: 'Cubic.easeOut',
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
        this.battleStatusText.setText('JUMP');

        this.tweens.add({
            targets: this.player,
            y: this.groundY - 105,
            duration: 260,
            ease: 'Quad.easeOut',
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
        this.battleStatusText.setText('STRIKE');

        const strike = () => {
            this.tweens.add({
                targets: this.player,
                x: this.enemy.x - 78,
                duration: 120,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onYoyo: () => {
                    this.createSlashEffect();
                    this.damageEnemy(this.playerObj.stats.attack + 18, 'HIT');
                },
                onComplete: () => {
                    this.isPlayerBusy = false;
                },
            });
        };

        if (this.enemy.x - this.player.x > 118) {
            this.tweens.add({
                targets: this.player,
                x: this.enemy.x - 112,
                duration: 230,
                ease: 'Cubic.easeOut',
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
        this.battleStatusText.setText('SKILL');

        const startX = this.player.x + 34;
        const startY = this.player.y - 86;
        const projectile = this.add.circle(startX, startY, 10, this.currentMap.accentColor, 1).setDepth(22);
        const aura = this.add.circle(startX, startY, 22, this.currentMap.accentColor, 0.18).setDepth(21);

        this.tweens.add({
            targets: [projectile, aura],
            x: this.enemy.x - 10,
            y: this.enemy.y - 78,
            duration: 520,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                projectile.destroy();
                aura.destroy();
                this.createImpact(this.enemy.x - 8, this.enemy.y - 78, this.currentMap.accentColor);
                this.damageEnemy(this.playerObj.stats.attack * 2 + 26, 'SKILL');
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
        this.battleStatusText.setText('ENEMY ATTACK');

        const homeX = this.enemy.x;

        this.tweens.add({
            targets: this.enemy,
            x: this.player.x + 92,
            duration: 270,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (this.isJumping) {
                    this.showFloatingText(this.player.x, this.player.y - 135, 'DODGE', '#38bdf8');
                } else {
                    const rawDamage = 12 + this.currentMap.recommendedLevel * 6;
                    const blockedDamage = Math.floor(this.playerObj.stats.defense * 0.35);
                    this.damagePlayer(Math.max(4, rawDamage - blockedDamage));
                }

                this.tweens.add({
                    targets: this.enemy,
                    x: homeX,
                    duration: 250,
                    ease: 'Cubic.easeIn',
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
        this.showFloatingText(this.enemy.x, this.enemy.y - 122, `${label} -${Math.round(amount)}`, '#fecaca');
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
        this.showFloatingText(this.player.x, this.player.y - 126, `-${amount}`, '#fca5a5');
        this.cameras.main.shake(90, 0.004);
        this.redrawHud();

        if (this.playerObj.health <= 0) {
            this.resolveDefeat();
        }
    }

    private redrawHud() {
        const enemyRatio = Phaser.Math.Clamp(this.enemyObj.health / this.currentMap.enemyHealth, 0, 1);
        const playerRatio = Phaser.Math.Clamp(this.playerObj.health / this.playerObj.stats.health, 0, 1);
        const enemyBarX = this.scale.width - 160;

        this.hudGraphics.clear();
        this.drawBar(18, 42, 142, 10, playerRatio, 0x22c55e);
        this.drawBar(enemyBarX, 42, 142, 10, enemyRatio, 0xef4444);

        this.playerHealthText.setText(`Lv ${this.playerObj.profile.level}  HP ${this.playerObj.health}/${this.playerObj.stats.health}`);
        this.enemyHealthText.setText(`HP ${this.enemyObj.health}/${this.currentMap.enemyHealth}`);
    }

    private drawBar(x: number, y: number, width: number, height: number, ratio: number, color: number) {
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
        const ring = this.add.circle(0, 0, 12, color, 0.16).setStrokeStyle(2, color, 0.9);
        const core = this.add.circle(0, 0, 4, 0xffffff, 0.8);
        impact.add([ring, core]);

        this.tweens.add({
            targets: impact,
            scale: 2.3,
            alpha: 0,
            duration: 260,
            ease: 'Quad.easeOut',
            onComplete: () => impact.destroy(),
        });
    }

    private createDust(x: number, y: number) {
        if (Phaser.Math.Between(0, 100) > 36) {
            return;
        }

        const dust = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0xcbd5e1, 0.22).setDepth(8);
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
        const text = this.add.text(x, y, value, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color,
            fontStyle: 'bold',
            stroke: '#020617',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(40);

        this.tweens.add({
            targets: text,
            y: y - 34,
            alpha: 0,
            duration: 720,
            ease: 'Quad.easeOut',
            onComplete: () => text.destroy(),
        });
    }

    private resolveVictory() {
        if (this.hasBattleEnded) {
            return;
        }

        this.hasBattleEnded = true;
        this.enemyAttackEvent?.remove(false);
        this.battleStatusText.setText('VICTORY');
        this.enemy.setAlpha(0.45);
        this.cameras.main.flash(240, 80, 255, 180);

        this.time.delayedCall(950, () => {
            this.scene.start('ResultScene', {
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
        this.battleStatusText.setText('DEFEAT');
        this.player.setAlpha(0.45);

        this.time.delayedCall(1100, () => {
            this.scene.start('ResultScene', {
                victory: false,
                mapId: this.currentMap.id,
            });
        });
    }

    private getEnemyTextureKey(): string {
        if (this.currentMap.id === 'golden_palace') {
            return 'ether_rogue';
        }

        if (this.currentMap.id === 'void_gate') {
            return 'aether_mage';
        }

        return 'chrono_knight';
    }
}
