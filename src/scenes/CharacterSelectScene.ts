import Phaser from 'phaser';
import { characters } from '../data/characters';
import { getProfileFromRegistry, selectProfileCharacter } from '../progression/ProfileRegistry';

export class CharacterSelectScene extends Phaser.Scene {
    private selectedCharacter: string = '';

    constructor() {
        super('CharacterSelectScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x050812);
        this.cameras.main.fadeIn(260, 5, 8, 18);

        const { width, height } = this.scale;
        const profile = getProfileFromRegistry(this);
        this.selectedCharacter = profile.selectedCharacterId ?? '';

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020617, 0x020617, 0x111827, 0x020617, 1, 1, 1, 1);
        bg.fillRect(0, 0, width, height);

        this.createText(width / 2, 48, 'SELECT YOUR COMMANDER', {
            fontSize: '21px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#0891b2',
            strokeThickness: 1
        }).setOrigin(0.5);

        this.createText(width / 2, 76, 'Your progress will stay linked to this profile.', {
            fontSize: '10px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5);

        const charImages = ['chrono_knight', 'ether_rogue', 'aether_mage'];
        characters.forEach((char, index) => {
            this.createCharacterCard(char.id, char.name, charImages[index] ?? 'chrono_knight', 26, 126 + index * 130, profile.level);
        });

        const skipBtn = this.createButton(width / 2, height - 54, 'START WITH CHRONO KNIGHT');
        skipBtn.on('pointerdown', () => {
            selectProfileCharacter(this, characters[0]?.id ?? 'chrono_knight');
            this.startHub();
        });
    }

    private createCharacterCard(id: string, name: string, texture: string, x: number, y: number, level: number) {
        const isSelected = this.selectedCharacter === id;
        const card = this.add.container(x, y);
        const bg = this.add.graphics();
        this.drawCharacterCard(bg, isSelected ? 0x38bdf8 : 0x334155, isSelected);

        const glow = this.add.circle(57, 52, 38, isSelected ? 0x38bdf8 : 0x64748b, isSelected ? 0.18 : 0.08);
        const portraitFrame = this.add.circle(57, 52, 34, 0x0f172a, 0.96).setStrokeStyle(1, isSelected ? 0x67e8f9 : 0x475569, 0.9);
        const portrait = this.add.image(57, 52, texture).setDisplaySize(58, 58);
        const title = this.createText(108, 27, name.toUpperCase(), {
            fontSize: '14px',
            color: '#f8fafc',
            fontStyle: 'bold'
        });
        const desc = this.createText(108, 51, isSelected ? `Saved at level ${level}` : 'Tap to choose this commander', {
            fontSize: '10px',
            color: '#94a3b8'
        });
        const role = this.createText(108, 72, this.getRoleLabel(id), {
            fontSize: '9px',
            color: '#bae6fd',
            fontStyle: 'bold'
        });

        card.add([bg, glow, portraitFrame, portrait, title, desc, role]);
        card.setSize(308, 104);
        card.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 308, 104),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        card.on('pointerdown', () => {
            selectProfileCharacter(this, id);
            this.tweens.add({
                targets: card,
                scale: 1.035,
                duration: 100,
                yoyo: true,
                onComplete: () => this.startHub(),
            });
        });
        card.on('pointerover', () => this.tweens.add({ targets: card, x: x + 3, duration: 110 }));
        card.on('pointerout', () => this.tweens.add({ targets: card, x, duration: 110 }));
    }

    private drawCharacterCard(graphics: Phaser.GameObjects.Graphics, accentColor: number, isSelected: boolean) {
        graphics.clear();
        graphics.fillStyle(0x07111f, 0.94);
        graphics.fillRoundedRect(0, 0, 308, 104, 14);
        graphics.lineStyle(1, 0xffffff, 0.08);
        graphics.strokeRoundedRect(1, 1, 306, 102, 14);
        graphics.lineStyle(isSelected ? 2 : 1, accentColor, isSelected ? 0.92 : 0.58);
        graphics.strokeRoundedRect(0, 0, 308, 104, 14);
    }

    private createButton(x: number, y: number, label: string) {
        const button = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 238, 42, 0x0e7490, 0.96).setStrokeStyle(1, 0x67e8f9, 0.86);
        const text = this.createText(0, 0, label, {
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        button.add([bg, text]);
        button.setSize(238, 42);
        button.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-119, -21, 238, 42),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        return button;
    }

    private getRoleLabel(id: string): string {
        if (id === 'ether_rogue') {
            return 'FAST STRIKER';
        }

        if (id === 'aether_mage') {
            return 'ARCANE DAMAGE';
        }

        return 'FRONTLINE DUELIST';
    }

    private startHub() {
        this.cameras.main.fadeOut(180, 5, 8, 18);
        this.time.delayedCall(190, () => this.scene.start('HubScene'));
    }

    private createText(
        x: number,
        y: number,
        value: string,
        style: Phaser.Types.GameObjects.Text.TextStyle,
    ): Phaser.GameObjects.Text {
        return this.add.text(x, y, value, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: 0,
            ...style
        }).setResolution(2);
    }
}
