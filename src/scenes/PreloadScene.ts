import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.cameras.main.setBackgroundColor(0x07070f);

    const { width, height } = this.scale;
    const loadingText = this.add
      .text(width / 2, height / 2 - 20, "Loading assets...", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 120, height / 2 + 10, 240, 20);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 118, height / 2 + 12, 236 * value, 16);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.setText("Assets loaded. Starting...");
    });

    // Load character images
    this.load.image("chrono_knight", "/characters/chrono_knight.png");
    this.load.image("ether_rogue", "/characters/ether_rogue.png");
    this.load.image("aether_mage", "/characters/aether_mage.png");

    // Load environment images
    this.load.image("mist_valley_bg", "/environments/mist_valley.png");
    this.load.image("golden_palace_bg", "/environments/golden_palace.png");
    this.load.image("crystal_temple_bg", "/environments/crystal_temple.png");
    this.load.image("void_gate_bg", "/environments/void_gate.png");

    // Storyboard reference screens
    this.load.image("ref_splash", "/reference/splash_ref.png");
    this.load.image("ref_character", "/reference/character_ref.png");
    this.load.image("ref_hub", "/reference/hub_ref.png");
    this.load.image("ref_map", "/reference/map_ref.png");
    this.load.image("ref_result", "/reference/result_ref.png");
    this.load.image("ref_castle", "/reference/castle_ref.png");
    this.load.image("ref_battle", "/reference/battle_ref.png");

    // UI and hub chrome
    this.load.image("hub_bg", "/hub/hub_bg.png");
    this.load.image("hub_castle", "/hub/hub_castle.png");
    this.load.image("hub_fog", "/hub/hub_fog.png");
    this.load.image("hub_glow", "/hub/hub_glow.png");
    this.load.image("ui_bottom_nav", "/ui/bottom_nav.png");
    this.load.image("ui_resource_bar", "/ui/resource_bar.png");
    this.load.image("ui_menu_button", "/ui/menu_button.png");
    this.load.image("ui_gold_icon", "/ui/gold_icon.png");
    this.load.image("ui_food_icon", "/ui/food_icon.png");
    this.load.image("ui_crystal_icon", "/ui/crystal_icon.png");

    // Fallback placeholder assets
    this.load.image(
      "player",
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJyZWQiLz48L3N2Zz4=",
    );
    this.load.image(
      "enemy",
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJibHVlIi8+PC9zdmc+",
    );
    this.load.image(
      "background",
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMjgyODI4Ii8+PC9zdmc+",
    );
    this.load.image(
      "tiles",
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJncmVlbiIvPjwvc3ZnPg==",
    );
  }

  create() {
    this.time.delayedCall(250, () => {
      this.scene.start("SplashScene");
    });
  }
}
