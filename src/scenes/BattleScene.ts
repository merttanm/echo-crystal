import Phaser from 'phaser';

interface CardData {
    id: string;
    name: string;
    damage: number;
}

export class BattleScene extends Phaser.Scene {
    private enemyHP: number = 100;
    private maxHP: number = 100;
    private hpBar!: Phaser.GameObjects.Graphics;
    private isAttacking: boolean = false;
    private castleContainer!: Phaser.GameObjects.Container;
    private dustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() { super('BattleScene'); }

    preload() {
        // 15-frame run set
        for (let i = 1; i <= 15; i++) {
            const fileName = (i === 8) ? 'spn7.png' : `spn${i}.png`;
            this.load.image(`spn${i}`, fileName);
        }
        this.load.image('knight_static', '8hareket.png');
        this.load.image('particle', 'https://labs.phaser.io/assets/particles/white.png');
    }

    create() {
        // 1. Atmosphere
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x020205, 0x020205, 0x1a0a2a, 0x1a0a2a, 1);
        sky.fillRect(0, 0, 360, 640);

        // 2. Castle and ground
        const ground = this.add.graphics();
        ground.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x000000, 0x000000, 1);
        ground.fillRect(0, 340, 360, 300);
        this.createCastle();

        // 3. Health bar
        this.hpBar = this.add.graphics();
        this.updateHPBar();

        // 4. Particles
        this.createParticles();

        // 5. Animation (15 frames)
        const frameConfig = Array.from({ length: 15 }, (_, i) => ({ key: `spn${i + 1}` }));
        this.anims.create({ 
            key: 'knight_run_anim', 
            frames: frameConfig, 
            frameRate: 24, 
            repeat: -1 
        });

        // 6. Cards
        this.createKnightCard(70, 520, { id: 'k1', name: 'SLASH', damage: 25 }, 0x00ff00);
        this.createKnightCard(180, 520, { id: 'k2', name: 'CHARGE', damage: 25 }, 0x00ffff);
        this.createKnightCard(290, 520, { id: 'k3', name: 'CRITICAL', damage: 50 }, 0xff00ff);
    }

    private createCastle() {
        this.castleContainer = this.add.container(310, 280);
        const wall = this.add.rectangle(0, 0, 70, 120, 0x3d3d3d).setStrokeStyle(3, 0x1a1a1a);
        const window = this.add.rectangle(0, -20, 12, 18, 0xffcc00);
        this.castleContainer.add([wall, window]);
    }

    private updateHPBar() {
        this.hpBar.clear();
        const x = 250, y = 150, w = 100, h = 12;
        this.hpBar.fillStyle(0x333333).fillRoundedRect(x, y, w, h, 4);
        const currentW = (this.enemyHP / this.maxHP) * w;
        this.hpBar.fillStyle(0x00ff00).fillRoundedRect(x, y, currentW, h, 4);
    }

    private createParticles() {
        this.dustParticles = this.add.particles(0, 0, 'particle', {
            speed: 50, scale: { start: 0.1, end: 0 }, alpha: { start: 0.5, end: 0 }, emitting: false
        });
        this.hitParticles = this.add.particles(0, 0, 'particle', {
            speed: 200, scale: { start: 0.2, end: 0 }, blendMode: 'ADD', emitting: false
        });
    }

    private createKnightCard(x: number, y: number, data: CardData, color: number) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 90, 130, 0x1a1a1a).setStrokeStyle(2, color);
        const nameTxt = this.add.text(0, -40, data.name, { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
        container.add([bg, nameTxt]);
        container.setSize(90, 130).setInteractive();
        this.input.setDraggable(container);

        container.on('drag', (_p: any, dx: number, dy: number) => {
            if (!this.isAttacking) container.setPosition(dx, dy);
        });

        container.on('dragend', () => {
            if (container.y < 400 && !this.isAttacking) {
                this.isAttacking = true;
                this.performKnightAttack(data, container);
            } else {
                this.tweens.add({ targets: container, x, y, duration: 200 });
            }
        });
    }

    performKnightAttack(cardData: CardData, cardContainer: Phaser.GameObjects.Container) {
        cardContainer.setAlpha(0);
        const knight = this.add.sprite(40, 345, 'spn1').setScale(0.2).setFlipX(true);
        knight.play('knight_run_anim');
        this.dustParticles.startFollow(knight);
        this.dustParticles.start();

        this.tweens.add({
            targets: knight, x: 280, duration: 1000, ease: 'Cubic.out',
            onComplete: () => {
                this.dustParticles.stop();
                this.applyEnemyDamage(cardData, knight, cardContainer);
            }
        });
    }

    applyEnemyDamage(cardData: CardData, knight: Phaser.GameObjects.Sprite, card: Phaser.GameObjects.Container) {
        this.enemyHP -= cardData.damage;
        if (this.enemyHP < 0) this.enemyHP = 0;
        this.updateHPBar();
        this.cameras.main.flash(100);
        this.hitParticles.emitParticleAt(knight.x, knight.y, 15);

        this.tweens.add({
            targets: knight, alpha: 0, y: '-=50', duration: 400,
            onComplete: () => {
                knight.destroy();
                card.destroy();
                this.isAttacking = false;
            }
        });
    }
}
