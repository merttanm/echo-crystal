import Phaser from 'phaser';
import { CardDatabase } from '../cards/CardDatabase';
import type { CardData } from '../cards/CardTypes';
import {
    buildingDefinitions,
    buildingPositions,
    getBuildingDefinition,
    getBuildingPower,
    getUpgradeCost,
    type BuildingDefinition,
    type BuildingId,
} from '../data/buildings';
import { characters } from '../data/characters';
import { maps, type GameMap } from '../data/maps';
import { getProfileFromRegistry, updateProfileInRegistry } from '../progression/ProfileRegistry';
import type { ArmyState, BuildingState, PlayerProfile, ResourceWallet } from '../progression/PlayerProfile';

const UI_DEPTH = 10;
const OVERLAY_DEPTH = 100;

export class HubScene extends Phaser.Scene {
    constructor() {
        super('HubScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x050812);
        this.cameras.main.fadeIn(260, 5, 8, 18);

        const { width, height } = this.scale;
        const profile = getProfileFromRegistry(this);
        const selectedCharacter = characters.find((character) => character.id === profile.selectedCharacterId);

        this.createBackground(width, height);
        this.createTopBar(profile, selectedCharacter?.name ?? 'Commander');
        this.createBaseMap(profile);
        this.createBottomNav(profile);
    }

    private createBackground(width: number, height: number) {
        this.add.image(width / 2, height / 2, 'crystal_temple_bg')
            .setDisplaySize(width, height)
            .setDepth(-3)
            .setAlpha(0.68);

        const shade = this.add.graphics().setDepth(-2);
        shade.fillGradientStyle(0x020617, 0x020617, 0x111827, 0x020617, 0.56, 0.56, 0.98, 1);
        shade.fillRect(0, 0, width, height);

        const horizon = this.add.graphics().setDepth(-1);
        horizon.fillStyle(0x38bdf8, 0.08);
        horizon.fillEllipse(width / 2, 294, 318, 122);
    }

    private createTopBar(profile: PlayerProfile, commanderName: string) {
        this.createText(18, 18, 'KINGDOM COMMAND', {
            fontSize: '19px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#0e7490',
            strokeThickness: 1,
        }).setDepth(UI_DEPTH);

        this.createText(20, 42, `${commanderName} - Power ${this.getKingdomPower(profile)}`, {
            fontSize: '10px',
            color: '#93c5fd',
            fontStyle: 'bold',
        }).setDepth(UI_DEPTH);

        this.createResourceStrip(profile.resources);
    }

    private createResourceStrip(resources: ResourceWallet) {
        const items = [
            { label: 'Gold', value: resources.gold, color: 0xfacc15 },
            { label: 'Food', value: resources.food, color: 0x22c55e },
            { label: 'Crystal', value: resources.crystal, color: 0xa78bfa },
        ];

        items.forEach((item, index) => {
            const x = 18 + index * 110;
            const box = this.add.container(x, 70).setDepth(UI_DEPTH);
            const bg = this.add.graphics();
            bg.fillStyle(0x07111f, 0.92);
            bg.fillRoundedRect(0, 0, 104, 38, 10);
            bg.lineStyle(1, item.color, 0.48);
            bg.strokeRoundedRect(0, 0, 104, 38, 10);

            const dot = this.add.circle(15, 19, 5, item.color, 0.95);
            const label = this.createText(27, 8, item.label.toUpperCase(), {
                fontSize: '7px',
                color: '#94a3b8',
                fontStyle: 'bold',
            });
            const value = this.createText(27, 20, this.formatNumber(item.value), {
                fontSize: '11px',
                color: '#f8fafc',
                fontStyle: 'bold',
            });

            box.add([bg, dot, label, value]);
        });
    }

    private createBaseMap(profile: PlayerProfile) {
        const mapPanel = this.add.graphics().setDepth(UI_DEPTH);
        mapPanel.fillStyle(0x06101d, 0.5);
        mapPanel.fillRoundedRect(18, 124, 324, 368, 18);
        mapPanel.lineStyle(1, 0x38bdf8, 0.24);
        mapPanel.strokeRoundedRect(18, 124, 324, 368, 18);

        const ground = this.add.graphics().setDepth(UI_DEPTH);
        ground.fillStyle(0x0f2a2a, 0.74);
        ground.beginPath();
        ground.moveTo(180, 146);
        ground.lineTo(322, 270);
        ground.lineTo(181, 472);
        ground.lineTo(39, 270);
        ground.closePath();
        ground.fillPath();
        ground.lineStyle(2, 0x67e8f9, 0.2);
        ground.strokePath();

        this.addBaseRoads();

        buildingPositions.forEach((position) => {
            const definition = getBuildingDefinition(position.id);
            const building = this.getBuildingState(profile, position.id);

            this.createBuildingNode(definition, building, position.x, position.y, position.width, position.height);
        });

        this.createText(180, 508, 'Tap a building to upgrade, collect, or train troops.', {
            fontSize: '9px',
            color: '#94a3b8',
            align: 'center',
        }).setOrigin(0.5).setDepth(UI_DEPTH);
    }

    private addBaseRoads() {
        const roads = this.add.graphics().setDepth(UI_DEPTH);
        roads.lineStyle(8, 0x132b36, 0.86);
        roads.beginPath();
        roads.moveTo(180, 252);
        roads.lineTo(76, 320);
        roads.moveTo(180, 252);
        roads.lineTo(284, 320);
        roads.moveTo(180, 252);
        roads.lineTo(180, 414);
        roads.moveTo(180, 414);
        roads.lineTo(78, 414);
        roads.moveTo(180, 414);
        roads.lineTo(284, 420);
        roads.strokePath();

        roads.lineStyle(2, 0x67e8f9, 0.12);
        roads.strokePath();
    }

    private createBuildingNode(
        definition: BuildingDefinition,
        building: BuildingState,
        x: number,
        y: number,
        width: number,
        height: number,
    ) {
        const node = this.add.container(x, y).setDepth(UI_DEPTH + 2);
        const body = this.add.graphics();
        this.drawBuilding(body, definition, width, height, building.level);

        const levelBadge = this.add.container(width - 9, 8);
        const badgeBg = this.add.circle(0, 0, 13, 0x020617, 0.92).setStrokeStyle(1, definition.accentColor, 0.95);
        const badgeText = this.createText(0, 0, String(building.level), {
            fontSize: '9px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);
        levelBadge.add([badgeBg, badgeText]);

        const name = this.createText(width / 2, height + 7, definition.name, {
            fontSize: '8px',
            color: '#e2e8f0',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#020617',
            strokeThickness: 3,
        }).setOrigin(0.5, 0);

        node.add([body, levelBadge, name]);
        node.setSize(width, height + 22);
        node.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, width, height + 22),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });
        node.on('pointerdown', () => this.showBuildingPanel(definition.id));
        node.on('pointerover', () => this.tweens.add({ targets: node, y: y - 4, duration: 100 }));
        node.on('pointerout', () => this.tweens.add({ targets: node, y, duration: 100 }));
    }

    private drawBuilding(graphics: Phaser.GameObjects.Graphics, definition: BuildingDefinition, width: number, height: number, level: number) {
        graphics.clear();
        graphics.fillStyle(0x000000, 0.28);
        graphics.fillEllipse(width / 2, height - 4, width + 12, 18);

        graphics.fillStyle(0x111827, 0.96);
        graphics.fillRoundedRect(8, height * 0.34, width - 16, height * 0.56, 8);
        graphics.lineStyle(1, definition.accentColor, 0.72);
        graphics.strokeRoundedRect(8, height * 0.34, width - 16, height * 0.56, 8);

        graphics.fillStyle(definition.accentColor, 0.34);
        graphics.beginPath();
        graphics.moveTo(width / 2, 0);
        graphics.lineTo(width - 10, height * 0.39);
        graphics.lineTo(10, height * 0.39);
        graphics.closePath();
        graphics.fillPath();

        graphics.lineStyle(2, definition.accentColor, 0.86);
        graphics.strokePath();

        if (definition.id === 'castle') {
            graphics.fillStyle(0x1e293b, 1);
            graphics.fillRoundedRect(width / 2 - 9, height * 0.17, 18, height * 0.62, 4);
            graphics.lineStyle(1, definition.accentColor, 0.8);
            graphics.strokeRoundedRect(width / 2 - 9, height * 0.17, 18, height * 0.62, 4);
        }

        graphics.fillStyle(definition.accentColor, 0.22 + Math.min(level, 6) * 0.02);
        graphics.fillRoundedRect(18, height * 0.55, width - 36, 8, 3);
    }

    private createBottomNav(profile: PlayerProfile) {
        const { width, height } = this.scale;
        const nav = this.add.graphics().setDepth(UI_DEPTH + 5);
        nav.fillStyle(0x050b14, 0.94);
        nav.fillRoundedRect(14, height - 104, width - 28, 80, 18);
        nav.lineStyle(1, 0x38bdf8, 0.22);
        nav.strokeRoundedRect(14, height - 104, width - 28, 80, 18);

        this.createNavButton(60, height - 64, 'WORLD', 'March', 0x38bdf8, () => this.showWorldPanel());
        this.createNavButton(140, height - 64, 'ARMY', `${this.getArmySize(profile.army)} troops`, 0xf97316, () => this.showArmyPanel());
        this.createNavButton(220, height - 64, 'HEROES', `${profile.unlockedCardIds.length} cards`, 0xa78bfa, () => this.showHeroPanel());
        this.createNavButton(300, height - 64, 'STORE', 'Soon', 0x22c55e, () => this.showToast('Store will unlock with accounts.'));
    }

    private createNavButton(
        x: number,
        y: number,
        title: string,
        subtitle: string,
        color: number,
        onPress: () => void,
    ) {
        const button = this.add.container(x, y).setDepth(UI_DEPTH + 6);
        const bg = this.add.rectangle(0, 0, 68, 48, 0x0f172a, 0.96).setStrokeStyle(1, color, 0.55);
        const dot = this.add.circle(0, -13, 5, color, 0.95);
        const titleText = this.createText(0, -1, title, {
            fontSize: '9px',
            color: '#f8fafc',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);
        const subtitleText = this.createText(0, 13, subtitle, {
            fontSize: '7px',
            color: '#94a3b8',
            align: 'center',
        }).setOrigin(0.5);

        button.add([bg, dot, titleText, subtitleText]);
        button.setSize(68, 48);
        button.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-34, -24, 68, 48),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });
        button.on('pointerdown', onPress);
        button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.04, duration: 100 }));
        button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 100 }));
    }

    private showBuildingPanel(buildingId: BuildingId) {
        const profile = getProfileFromRegistry(this);
        const definition = getBuildingDefinition(buildingId);
        const building = this.getBuildingState(profile, buildingId);
        const upgradeCost = getUpgradeCost(definition, building.level);
        const canUpgrade = this.canAfford(profile.resources, upgradeCost);

        const { overlay, panel } = this.createOverlayPanel(316, 420);
        const header = this.createText(0, -176, definition.name.toUpperCase(), {
            fontSize: '21px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#0e7490',
            strokeThickness: 1,
        }).setOrigin(0.5);
        const role = this.createText(0, -148, `${definition.role} - Level ${building.level}`, {
            fontSize: '10px',
            color: '#93c5fd',
            align: 'center',
        }).setOrigin(0.5);
        const description = this.createText(0, -116, definition.description, {
            fontSize: '10px',
            color: '#cbd5e1',
            align: 'center',
            wordWrap: { width: 248 },
        }).setOrigin(0.5);

        const power = this.createStatPill(-75, -62, 'POWER', String(getBuildingPower(definition, building.level)), definition.accentColor);
        const nextPower = this.createStatPill(75, -62, 'NEXT', String(getBuildingPower(definition, building.level + 1)), 0x22c55e);

        panel.add([header, role, description, power, nextPower]);
        panel.add(this.createCostRow(0, -4, upgradeCost, profile.resources));

        const upgradeButton = this.createPanelButton(0, 70, canUpgrade ? 'UPGRADE BUILDING' : 'NEED RESOURCES', canUpgrade ? 0x0e7490 : 0x475569);
        upgradeButton.on('pointerdown', () => {
            if (!canUpgrade) {
                this.showToast('Not enough resources.');
                return;
            }

            updateProfileInRegistry(this, (currentProfile) => ({
                ...currentProfile,
                resources: this.spendResources(currentProfile.resources, upgradeCost),
                gold: currentProfile.resources.gold - upgradeCost.gold,
                buildings: currentProfile.buildings.map((item) => item.id === buildingId
                    ? { ...item, level: item.level + 1 }
                    : item),
                updatedAt: new Date().toISOString(),
            }));
            this.closeOverlay(overlay, panel, () => this.scene.restart());
        });

        panel.add(upgradeButton);

        const secondaryAction = this.createBuildingActionButton(definition, building, profile);
        if (secondaryAction) {
            panel.add(secondaryAction);
        }

        const closeButton = this.createPanelButton(0, 166, 'CLOSE', 0x1e293b);
        closeButton.on('pointerdown', () => this.closeOverlay(overlay, panel));
        panel.add(closeButton);

        this.openOverlay(overlay, panel);
    }

    private createBuildingActionButton(definition: BuildingDefinition, building: BuildingState, profile: PlayerProfile) {
        if (definition.id === 'barracks') {
            const trainCost = this.getTrainCost(building.level);
            const canTrain = this.canAfford(profile.resources, trainCost);
            const button = this.createPanelButton(0, 118, canTrain ? 'TRAIN INFANTRY' : 'NEED FOOD', canTrain ? 0xf97316 : 0x475569);

            button.on('pointerdown', () => {
                if (!canTrain) {
                    this.showToast('Not enough food or gold.');
                    return;
                }

                updateProfileInRegistry(this, (currentProfile) => ({
                    ...currentProfile,
                    resources: this.spendResources(currentProfile.resources, trainCost),
                    gold: currentProfile.resources.gold - trainCost.gold,
                    army: {
                        ...currentProfile.army,
                        infantry: currentProfile.army.infantry + building.level * 12,
                    },
                    updatedAt: new Date().toISOString(),
                }));
                this.scene.restart();
            });

            return button;
        }

        if (definition.id === 'gold_mine' || definition.id === 'farm' || definition.id === 'crystal_core') {
            const button = this.createPanelButton(0, 118, 'COLLECT OUTPUT', definition.accentColor);
            button.on('pointerdown', () => {
                updateProfileInRegistry(this, (currentProfile) => {
                    const currentBuilding = this.getBuildingState(currentProfile, definition.id);
                    const gain = this.getCollectionGain(definition.id, currentBuilding.level);

                    return {
                        ...currentProfile,
                        resources: {
                            gold: currentProfile.resources.gold + gain.gold,
                            food: currentProfile.resources.food + gain.food,
                            crystal: currentProfile.resources.crystal + gain.crystal,
                        },
                        gold: currentProfile.resources.gold + gain.gold,
                        updatedAt: new Date().toISOString(),
                    };
                });
                this.scene.restart();
            });

            return button;
        }

        return null;
    }

    private showWorldPanel() {
        const profile = getProfileFromRegistry(this);
        const { overlay, panel } = this.createOverlayPanel(322, 448);

        panel.add(this.createText(0, -196, 'WORLD MAP', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#0e7490',
            strokeThickness: 1,
        }).setOrigin(0.5));
        panel.add(this.createText(0, -168, 'Choose a march target for your commander army.', {
            fontSize: '10px',
            color: '#93c5fd',
            align: 'center',
        }).setOrigin(0.5));

        maps.forEach((map, index) => {
            panel.add(this.createWorldTarget(map, -142, -124 + index * 92, profile));
        });

        const closeButton = this.createPanelButton(0, 184, 'CLOSE', 0x1e293b);
        closeButton.on('pointerdown', () => this.closeOverlay(overlay, panel));
        panel.add(closeButton);

        this.openOverlay(overlay, panel);
    }

    private createWorldTarget(map: GameMap, x: number, y: number, profile: PlayerProfile) {
        const isLocked = profile.level < map.recommendedLevel;
        const target = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x0b1220, 0.96);
        bg.fillRoundedRect(0, 0, 284, 76, 12);
        bg.lineStyle(1, isLocked ? 0x475569 : map.accentColor, isLocked ? 0.35 : 0.75);
        bg.strokeRoundedRect(0, 0, 284, 76, 12);

        const marker = this.add.circle(24, 38, 15, isLocked ? 0x475569 : map.accentColor, 0.28)
            .setStrokeStyle(1, isLocked ? 0x64748b : map.accentColor, 0.9);
        const title = this.createText(50, 13, map.name, {
            fontSize: '13px',
            color: isLocked ? '#94a3b8' : '#ffffff',
            fontStyle: 'bold',
        });
        const enemy = this.createText(50, 34, map.enemyName, {
            fontSize: '9px',
            color: '#94a3b8',
        });
        const reward = this.createText(50, 52, `Reward ${map.rewards.xp} XP - ${map.rewards.gold} Gold - ${map.rewards.food ?? 0} Food`, {
            fontSize: '8px',
            color: '#cbd5e1',
        });
        const action = this.createText(245, 38, isLocked ? 'LOCKED' : 'MARCH', {
            fontSize: '9px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);

        target.add([bg, marker, title, enemy, reward, action]);
        target.setSize(284, 76);
        target.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 284, 76),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: !isLocked,
        });
        target.on('pointerdown', () => {
            if (isLocked) {
                this.showToast('Level up your commander to unlock this target.');
                return;
            }

            this.cameras.main.fadeOut(180, 5, 8, 18);
            this.time.delayedCall(190, () => this.scene.start('GameScene', { mapId: map.id }));
        });

        return target;
    }

    private showArmyPanel() {
        const profile = getProfileFromRegistry(this);
        const { overlay, panel } = this.createOverlayPanel(316, 416);

        panel.add(this.createText(0, -176, 'ARMY COMMAND', {
            fontSize: '21px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#9a3412',
            strokeThickness: 1,
        }).setOrigin(0.5));
        panel.add(this.createText(0, -148, `Total troops ${this.getArmySize(profile.army)}`, {
            fontSize: '10px',
            color: '#fed7aa',
            align: 'center',
        }).setOrigin(0.5));

        panel.add(this.createArmyRow(-108, -98, 'Infantry', profile.army.infantry, 0xf97316));
        panel.add(this.createArmyRow(-108, -50, 'Archers', profile.army.archers, 0x22c55e));
        panel.add(this.createArmyRow(-108, -2, 'Mages', profile.army.mages, 0xa78bfa));

        const barracks = this.getBuildingState(profile, 'barracks');
        const trainCost = this.getTrainCost(barracks.level);
        const canTrain = this.canAfford(profile.resources, trainCost);
        panel.add(this.createCostRow(0, 72, trainCost, profile.resources));

        const trainButton = this.createPanelButton(0, 130, canTrain ? `TRAIN ${barracks.level * 12} INFANTRY` : 'NEED RESOURCES', canTrain ? 0xf97316 : 0x475569);
        trainButton.on('pointerdown', () => {
            if (!canTrain) {
                this.showToast('Not enough resources.');
                return;
            }

            updateProfileInRegistry(this, (currentProfile) => ({
                ...currentProfile,
                resources: this.spendResources(currentProfile.resources, trainCost),
                gold: currentProfile.resources.gold - trainCost.gold,
                army: {
                    ...currentProfile.army,
                    infantry: currentProfile.army.infantry + barracks.level * 12,
                },
                updatedAt: new Date().toISOString(),
            }));
            this.closeOverlay(overlay, panel, () => this.scene.restart());
        });
        panel.add(trainButton);

        const closeButton = this.createPanelButton(0, 174, 'CLOSE', 0x1e293b);
        closeButton.on('pointerdown', () => this.closeOverlay(overlay, panel));
        panel.add(closeButton);

        this.openOverlay(overlay, panel);
    }

    private createArmyRow(x: number, y: number, label: string, value: number, color: number) {
        const row = this.add.container(x, y);
        const bg = this.add.rectangle(108, 0, 216, 36, 0x0f172a, 0.92).setStrokeStyle(1, color, 0.35);
        const dot = this.add.circle(18, 0, 6, color, 0.9);
        const name = this.createText(36, -9, label.toUpperCase(), {
            fontSize: '8px',
            color: '#94a3b8',
            fontStyle: 'bold',
        });
        const count = this.createText(36, 4, this.formatNumber(value), {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold',
        });

        row.add([bg, dot, name, count]);

        return row;
    }

    private showHeroPanel() {
        const profile = getProfileFromRegistry(this);
        const { overlay, panel } = this.createOverlayPanel(316, 448);

        panel.add(this.createText(0, -196, 'HERO DECK', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#6d28d9',
            strokeThickness: 1,
        }).setOrigin(0.5));
        panel.add(this.createText(0, -168, 'Commander cards used in hero combat.', {
            fontSize: '10px',
            color: '#c4b5fd',
            align: 'center',
        }).setOrigin(0.5));

        CardDatabase.forEach((card, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            panel.add(this.createVaultCard(card, column === 0 ? -75 : 75, -98 + row * 124, profile.unlockedCardIds.includes(card.id)));
        });

        const closeButton = this.createPanelButton(0, 184, 'CLOSE', 0x1e293b);
        closeButton.on('pointerdown', () => this.closeOverlay(overlay, panel));
        panel.add(closeButton);

        this.openOverlay(overlay, panel);
    }

    private createVaultCard(card: CardData, x: number, y: number, isOwned: boolean) {
        const container = this.add.container(x, y);
        const rarityColor = isOwned ? this.getCardAccent(card.type) : 0x475569;
        const bg = this.add.graphics();
        bg.fillStyle(isOwned ? 0x111827 : 0x0f172a, isOwned ? 0.98 : 0.72);
        bg.fillRoundedRect(-62, -50, 124, 108, 12);
        bg.lineStyle(1, rarityColor, isOwned ? 0.95 : 0.45);
        bg.strokeRoundedRect(-62, -50, 124, 108, 12);
        bg.fillStyle(rarityColor, isOwned ? 0.2 : 0.08);
        bg.fillRoundedRect(-52, -40, 104, 34, 8);

        const name = this.createText(0, -25, card.name.toUpperCase(), {
            fontSize: '12px',
            color: isOwned ? '#ffffff' : '#94a3b8',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);

        const type = this.createText(0, 6, card.type.toUpperCase(), {
            fontSize: '9px',
            color: isOwned ? '#bae6fd' : '#64748b',
            align: 'center',
        }).setOrigin(0.5);

        const power = this.createText(0, 31, isOwned ? `POWER ${card.power}` : 'LOCKED', {
            fontSize: '10px',
            color: isOwned ? '#facc15' : '#64748b',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);

        container.add([bg, name, type, power]);

        return container;
    }

    private createCostRow(x: number, y: number, cost: ResourceWallet, resources: ResourceWallet) {
        const row = this.add.container(x, y);
        const items = [
            { key: 'gold', label: 'Gold', color: 0xfacc15 },
            { key: 'food', label: 'Food', color: 0x22c55e },
            { key: 'crystal', label: 'Crystal', color: 0xa78bfa },
        ] as const;

        items.forEach((item, index) => {
            const itemX = -96 + index * 96;
            const affordable = resources[item.key] >= cost[item.key];
            const label = this.createText(itemX, -9, item.label.toUpperCase(), {
                fontSize: '7px',
                color: '#94a3b8',
                fontStyle: 'bold',
                align: 'center',
            }).setOrigin(0.5);
            const value = this.createText(itemX, 8, this.formatNumber(cost[item.key]), {
                fontSize: '10px',
                color: affordable ? '#ffffff' : '#fca5a5',
                fontStyle: 'bold',
                align: 'center',
            }).setOrigin(0.5);
            const dot = this.add.circle(itemX - 30, 3, 4, item.color, 0.9);

            row.add([dot, label, value]);
        });

        return row;
    }

    private createStatPill(x: number, y: number, label: string, value: string, color: number) {
        const pill = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 118, 44, 0x0f172a, 0.92).setStrokeStyle(1, color, 0.55);
        const labelText = this.createText(0, -10, label, {
            fontSize: '7px',
            color: '#94a3b8',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);
        const valueText = this.createText(0, 6, value, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);

        pill.add([bg, labelText, valueText]);

        return pill;
    }

    private createOverlayPanel(width: number, height: number) {
        const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x020617, 0)
            .setDepth(OVERLAY_DEPTH)
            .setInteractive();
        const panel = this.add.container(this.scale.width / 2, this.scale.height / 2 + 6)
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

    private openOverlay(overlay: Phaser.GameObjects.Rectangle, panel: Phaser.GameObjects.Container) {
        this.tweens.add({ targets: overlay, alpha: 0.78, duration: 160, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: panel, alpha: 1, scale: 1, duration: 190, ease: 'Back.easeOut' });
    }

    private closeOverlay(overlay: Phaser.GameObjects.Rectangle, panel: Phaser.GameObjects.Container, onComplete?: () => void) {
        this.tweens.add({
            targets: [panel, overlay],
            alpha: 0,
            duration: 150,
            ease: 'Sine.easeIn',
            onComplete: () => {
                panel.destroy();
                overlay.destroy();
                onComplete?.();
            },
        });
    }

    private createPanelButton(x: number, y: number, label: string, color: number) {
        const button = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 204, 38, color, 0.96).setStrokeStyle(1, 0xffffff, 0.22);
        const text = this.createText(0, 0, label, {
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);

        button.add([bg, text]);
        button.setSize(204, 38);
        button.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-102, -19, 204, 38),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });

        return button;
    }

    private showToast(message: string) {
        const toast = this.add.container(this.scale.width / 2, 120).setDepth(OVERLAY_DEPTH + 20).setAlpha(0);
        const bg = this.add.rectangle(0, 0, 286, 38, 0x020617, 0.95).setStrokeStyle(1, 0x38bdf8, 0.7);
        const text = this.createText(0, 0, message, {
            fontSize: '10px',
            color: '#f8fafc',
            align: 'center',
        }).setOrigin(0.5);
        toast.add([bg, text]);

        this.tweens.add({
            targets: toast,
            alpha: 1,
            y: 108,
            duration: 140,
            yoyo: true,
            hold: 850,
            onComplete: () => toast.destroy(),
        });
    }

    private getBuildingState(profile: PlayerProfile, buildingId: BuildingId): BuildingState {
        return profile.buildings.find((building) => building.id === buildingId) ?? {
            id: buildingId,
            level: buildingId === 'castle' ? 2 : 1,
        };
    }

    private getKingdomPower(profile: PlayerProfile): number {
        const buildingPower = buildingDefinitions.reduce((total, definition) => {
            const building = this.getBuildingState(profile, definition.id);
            return total + getBuildingPower(definition, building.level);
        }, 0);

        return buildingPower + this.getArmySize(profile.army) * 4 + profile.level * 85;
    }

    private getArmySize(army: ArmyState): number {
        return army.infantry + army.archers + army.mages;
    }

    private canAfford(resources: ResourceWallet, cost: ResourceWallet): boolean {
        return resources.gold >= cost.gold && resources.food >= cost.food && resources.crystal >= cost.crystal;
    }

    private spendResources(resources: ResourceWallet, cost: ResourceWallet): ResourceWallet {
        return {
            gold: Math.max(0, resources.gold - cost.gold),
            food: Math.max(0, resources.food - cost.food),
            crystal: Math.max(0, resources.crystal - cost.crystal),
        };
    }

    private getTrainCost(barracksLevel: number): ResourceWallet {
        return {
            gold: 24 * barracksLevel,
            food: 42 * barracksLevel,
            crystal: 0,
        };
    }

    private getCollectionGain(buildingId: BuildingId, level: number): ResourceWallet {
        if (buildingId === 'gold_mine') {
            return { gold: 65 * level, food: 0, crystal: 0 };
        }

        if (buildingId === 'farm') {
            return { gold: 0, food: 75 * level, crystal: 0 };
        }

        if (buildingId === 'crystal_core') {
            return { gold: 0, food: 0, crystal: 18 * level };
        }

        return { gold: 0, food: 0, crystal: 0 };
    }

    private getCardAccent(type: CardData['type']): number {
        if (type === 'slash') {
            return 0xef4444;
        }

        if (type === 'dash') {
            return 0x38bdf8;
        }

        if (type === 'shield') {
            return 0x22c55e;
        }

        return 0xa78bfa;
    }

    private formatNumber(value: number): string {
        if (value >= 1000000) {
            return `${Math.floor(value / 100000) / 10}M`;
        }

        if (value >= 1000) {
            return `${Math.floor(value / 100) / 10}K`;
        }

        return String(value);
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
            ...style,
        }).setResolution(2);
    }
}
