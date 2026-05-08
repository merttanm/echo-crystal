import Phaser from "phaser";

export class WorldScene extends Phaser.Scene {
  private knight!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private worldLayer!: Phaser.GameObjects.Layer;
  private isPlaying: boolean = false;
  private selectionContainer!: Phaser.GameObjects.Container;
  private dashCard!: Phaser.GameObjects.Container;
  // Lock normal walk animation during attack/dash.
  private isDashing: boolean = false;

  constructor() {
    super("WorldScene");
  }

  preload() {
    this.load.image("login_bg", "login_bg.png");
    this.load.image("knight_static", "8hareket.png");
    this.load.image("chrono_knight", "assets/knight_card.png");
    this.load.image("cave_floor", "cave_floor.png");
    this.load.image("card_dash", "card_dash.png");

    for (let i = 1; i <= 15; i++) {
      const fileName = i === 8 ? "spn7.png" : `spn${i}.png`;
      this.load.image(`spn${i}`, fileName);
    }
  }

  create() {
    const { width, height } = this.scale;

    const runFrames = [];
    for (let i = 1; i <= 15; i++) {
      runFrames.push({ key: `spn${i}` });
    }

    if (!this.anims.exists("knight_run_fast")) {
      this.anims.create({
        key: "knight_run_fast",
        frames: runFrames,
        frameRate: 25,
        repeat: 0,
      });
    }

    // Login and character selection flow.
    const loginContainer = this.add.container(0, 0).setDepth(1000);
    const bg = this.add
      .image(width / 2, height / 2, "login_bg")
      .setDisplaySize(width, height);
    const guestBtn = this.add.container(width / 2, height * 0.85);
    const btnRect = this.add
      .rectangle(0, 0, 240, 50, 0x000000, 0.6)
      .setStrokeStyle(2, 0x9400d3);
    const btnText = this.add
      .text(0, 0, "PLAY AS GUEST", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    guestBtn.add([btnRect, btnText]);
    guestBtn.setSize(240, 50).setInteractive({ useHandCursor: true });
    guestBtn.on("pointerdown", () => {
      this.tweens.add({
        targets: this.cameras.main,
        zoom: 2.5,
        duration: 1500,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          loginContainer.destroy();
          this.showCharacterSelection();
        },
      });
      this.cameras.main.fadeOut(1500, 0, 0, 0);
    });
    loginContainer.add([bg, guestBtn]);

    this.worldLayer = this.add.layer();
    this.add
      .image(width / 2, height * 0.75, "cave_floor")
      .setScale(0.8)
      .setDepth(-1)
      .setAlpha(0.6);

    this.knight = this.add.container(width / 2, height * 0.7).setAlpha(0);
    const sprite = this.add.sprite(0, 0, "spn1").setScale(0.25);
    const nameTag = this.add
      .text(0, -60, "HERO", {
        fontSize: "14px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.knight.add([sprite, nameTag]);

    this.physics.add.existing(this.knight);
    const body = this.knight.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(100, 120);

    this.worldLayer.add(this.knight);
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }
    this.createFogLayer();
  }

  private showCharacterSelection() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.cameras.main.setZoom(1);
    this.selectionContainer = this.add.container(0, 0).setDepth(2000);
    const caveBg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x050505,
    );
    const card = this.add.container(width / 2, height / 2);
    const knightImg = this.add.image(0, -50, "chrono_knight").setScale(0.35);
    const glow = this.add.pointlight(0, -50, 0xff4500, 200, 0.5);
    const name = this.add
      .text(0, 150, "CHRONO KNIGHT", {
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ff4500",
      })
      .setOrigin(0.5);
    card.add([glow, knightImg, name]);
    card.setSize(250, 350).setInteractive({ useHandCursor: true });
    card.on("pointerdown", () => {
      this.cameras.main.flash(500, 255, 69, 0);
      this.selectionContainer.destroy();
      this.isPlaying = true;
      this.knight.setAlpha(1);
      this.createDashUI();
      this.cameras.main.startFollow(this.knight, true, 0.1, 0.1);
    });
    this.selectionContainer.add([caveBg, card]);
  }

  private createDashUI() {
    const { width, height } = this.scale;
    this.dashCard = this.add.container(width - 70, height - 90).setDepth(3000);
    const cardImg = this.add.image(0, 0, "card_dash").setScale(0.12);
    const cardFrame = this.add
      .rectangle(0, 0, 80, 110)
      .setStrokeStyle(2, 0xff4500);
    this.dashCard.add([cardImg, cardFrame]);
    this.dashCard.setSize(80, 110).setInteractive({ useHandCursor: true });
    this.dashCard.on("pointerdown", () => this.performDash());
  }

  private performDash() {
    if (!this.isPlaying || this.isDashing) return;

    this.isDashing = true;
    const sprite = this.knight.list[0] as Phaser.GameObjects.Sprite;
    const body = this.knight.body as Phaser.Physics.Arcade.Body;
    const direction = sprite.flipX ? -1 : 1;

    // Start the 15-frame attack animation.
    sprite.play("knight_run_fast");

    // Physical push.
    body.setVelocityX(1200 * direction);
    this.cameras.main.shake(150, 0.008);

    // Stop after the 15-frame animation completes.
    sprite.once("animationcomplete", () => {
      this.isDashing = false;
      body.setVelocityX(0);
      sprite.setTexture("spn1");
    });
  }

  update() {
    if (!this.isPlaying || !this.cursors || this.isDashing) return;

    const speed = 200;
    const body = this.knight.body as Phaser.Physics.Arcade.Body;
    const sprite = this.knight.list[0] as Phaser.GameObjects.Sprite;

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown) {
      vx = -speed;
      sprite.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      vx = speed;
      sprite.setFlipX(false);
    }
    if (this.cursors.up.isDown) {
      vy = -speed * 0.7;
    } else if (this.cursors.down.isDown) {
      vy = speed * 0.7;
    }

    body.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      // Loop the regular walk animation.
      if (
        !sprite.anims.isPlaying ||
        sprite.anims.currentAnim?.key !== "knight_run_fast"
      ) {
        sprite.play({ key: "knight_run_fast", repeat: -1 });
      }
    } else {
      sprite.stop();
      sprite.setTexture("spn1");
    }
  }

  private createFogLayer() {
    for (let i = 0; i < 5; i++) {
      const fog = this.add.ellipse(
        Phaser.Math.Between(0, 360),
        Phaser.Math.Between(400, 640),
        300,
        100,
        0x442266,
        0.1,
      );
      this.tweens.add({
        targets: fog,
        alpha: 0.3,
        duration: 2000 + i * 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
