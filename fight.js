// VASA Games — FightScene: «КЗБ Арена» 1v1 (головы-фото на болванках)
/* Файлы бойцов: assets/fighters/<name>_cut.webp (8 шт, альфа-вырезка) */

const FIGHTERS = [
  { key: 'f_03', file: '03_😃_cut.webp', name: 'СМЕШАРЬ' },
  { key: 'f_05', file: '05_🤢_cut.webp', name: 'ТОШНИК' },
  { key: 'f_06', file: '06_🥴_cut.webp', name: 'ХАТТОР' },
  { key: 'f_07', file: '07_😬_cut.webp', name: 'ЖМУР' },
  { key: 'f_12', file: '12_📸_cut.webp', name: 'ФОТОГРАФ' },
  { key: 'f_45', file: '45_🤣_cut.webp', name: 'ЗДОРОВАЧ' },
  { key: 'f_76', file: '76_🖕_cut.webp', name: 'ГНЕВНЫЙ' },
  { key: 'f_01', file: '01_😳_cut.webp', name: 'ШОКИРОВАННЫЙ' }
];

// пре-лоад бойцов в BootScene (добавить в preload):
// FIGHTERS.forEach(f => this.load.image(f.key, 'assets/fighters/' + f.file));

function FightScene() { Phaser.Scene.call(this, { key: 'FightScene' }); }
FightScene.prototype = Object.create(Phaser.Scene.prototype);
FightScene.prototype.constructor = FightScene;

FightScene.prototype.init = function (data) {
  this.pIdx = data.player ?? 0;
  this.eIdx = data.enemy ?? ((data.player ?? 0) + 3) % FIGHTERS.length;
};

FightScene.prototype.create = function () {
  const dpr = window.__dpr || 1;
  this.dpr = dpr;
  const W = DESIGN_W, H = DESIGN_H;
  this.cameras.main.setZoom(dpr);
  this.cameras.main.centerOn(W / 2, H / 2);
  const origAddText = this.add.text.bind(this.add);
  this.add.text = (x, y, text, style) => { style = style || {}; style.resolution = dpr; return origAddText(x, y, text, style); };

  // Арена
  this.add.rectangle(W/2, H/2, W+20, H+20, 0x1a1030);
  this.add.rectangle(W/2, H - 205, W, 130, 0x241543);           // ринг-пол
  this.add.rectangle(W/2, 60, W+20, 70, 0x120a20);              // небо-панель

  // HP-бары
  this.pHp = 100; this.eHp = 100;
  this.pHpMax = 100; this.eHpMax = 100;
  const barW = 140, barH = 16;
  this.pHpBg = this.add.rectangle(24, 40, barW, barH, 0x333344).setOrigin(0, 0.5);
  this.pHpBar = this.add.rectangle(24, 40, barW, barH - 4, 0x33ff66).setOrigin(0, 0.5);
  this.barW = barW; this.barH = barH;
  this.eHpBg = this.add.rectangle(W - 24, 40, barW, barH, 0x333344).setOrigin(1, 0.5);
  this.eHpBar = this.add.rectangle(W - 24, 40, barW, barH - 4, 0xff4455).setOrigin(1, 0.5);
  this.pName = this.add.text(24, 62, FIGHTERS[this.pIdx].name, { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);
  this.eName = this.add.text(W - 24, 62, FIGHTERS[this.eIdx].name, { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5);
  // VS
  this.add.text(W/2, 46, 'VS', { fontFamily: 'Arial', fontSize: '24px', color: '#ffd93d', fontStyle: 'bold' }).setOrigin(0.5);

  // Бойцы: головы на телах-болванках
  this.pBody = this.makeFighter(FIGHTERS[this.pIdx].key, 105, H - 305, false);
  this.eBody = this.makeFighter(FIGHTERS[this.eIdx].key, W - 105, H - 305, true);

  // Кнопки атак
  this.makeAttackBtn(70,  H - 60, '👊 ПАНЧ', 6, () => this.attack('punch'));
  this.makeAttackBtn(190, H - 60, '🦵 ПИНОК', 9, () => this.attack('kick'), 0xff8800);
  this.makeUltBtn(W - 70, H - 60);

  this.ult = 0;           // 0..100
  this.isBusy = false;
  this.msg = this.add.text(W/2, H/2 - 120, 'Бой!', { fontFamily: 'Arial', fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);

  // AI-таймер
  this.time.addEvent({ delay: 1400, loop: true, callback: () => this.enemyTurn() });
};

FightScene.prototype.makeFighter = function (texKey, x, y, flip) {
  const c = this.add.container(x, y);
  // тело-болванка
  const body = this.add.rectangle(0, 55, 70, 110, 0x3344aa).setStrokeStyle(3, 0x222266);
  const armL = this.add.rectangle(-42, 30, 16, 60, 0x3344aa).setAngle(10);
  const armR = this.add.rectangle(42, 30, 16, 60, 0x3344aa).setAngle(-10);
  const head = this.add.image(0, -12, texKey);
  const headScale = Math.min(84 / head.width, 84 / head.height);
  head.setScale(headScale);
  c.add([body, armL, armR, head]);
  c.head = head;
  c.armL = armL; c.armR = armR;
  if (flip) {
    body.scaleX = -1;
    head.setFlipX(true);
  }
  c.setScale(1.1);
  return c;
};

FightScene.prototype.makeAttackBtn = function (x, y, label, dmg, cb, color) {
  const b = this.add.text(x, y, label, {
    fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', backgroundColor: '#3344aa',
    padding: { x: 14, y: 10 }
  }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
  b.on('pointerdown', () => { if (!this.isBusy) cb(); });
  return b;
};

FightScene.prototype.makeUltBtn = function (x, y) {
  this.ultBtn = this.add.text(x, y, '🖕 УЛЬТА', {
    fontFamily: 'Arial', fontSize: '20px', color: '#666', backgroundColor: '#222244',
    padding: { x: 14, y: 10 }
  }).setOrigin(0.5).setDepth(10);
  this.ultBtn.on('pointerdown', () => {
    if (this.ult >= 100 && !this.isBusy) {
      this.ult = 0; this.updateUlt();
      this.doAttack(this.pBody, this.eBody, 30, '🖕 УЛЬТА!');
      this.cameras.main.shake(300, 0.02);
    }
  });
  this.updateUlt();
};

FightScene.prototype.updateUlt = function () {
  const r = this.ult / 100;
  this.ultBtn.setColor(r >= 1 ? '#ffd93d' : '#666');
  this.ultBtn.setBackgroundColor(r >= 1 ? '#886611' : '#222244');
};

FightScene.prototype.attack = function (type) {
  if (this.isBusy) return;
  const dmg = type === 'punch' ? Phaser.Math.Between(6, 12) : Phaser.Math.Between(10, 18);
  this.doAttack(this.pBody, this.eBody, dmg, type === 'punch' ? '👊' : '🦵');
  // charge ult
  this.ult = Math.min(100, this.ult + 18); this.updateUlt();
};

FightScene.prototype.enemyTurn = function () {
  if (this.isBusy || this.gameOver) return;
  const dmg = Phaser.Math.Between(5, 14);
  this.doAttack(this.eBody, this.pBody, dmg, '💥');
};

FightScene.prototype.doAttack = function (attacker, target, dmg, label) {
  this.isBusy = true;
  this.time.delayedCall(600, () => { this.isBusy = false; });  // страховка
  // анимация рывка
  this.tweens.add({
    targets: attacker, x: attacker.x + (attacker === this.pBody ? 60 : -60),
    duration: 120, yoyo: true, ease: 'Quad.easeIn',
    onComplete: () => {
      // урон
      if (attacker === this.pBody) {
        this.eHp = Math.max(0, this.eHp - dmg);
        this.eHpBar.width = this.barW * (this.eHp / this.eHpMax);
      } else {
        this.pHp = Math.max(0, this.pHp - dmg);
        this.pHpBar.width = this.barW * (this.pHp / this.pHpMax);
      }
      this.showHit(attacker === this.pBody ? this.eBody : this.pBody, dmg, label);
      SoundSystem.play('normal');
      if (this.eHp <= 0 || this.pHp <= 0) { this.endFight(); return; }
    }
  });
};

FightScene.prototype.showHit = function (target, dmg, label) {
  const txt = this.add.text(target.x, target.y - 60, '-' + dmg, { fontFamily: 'Arial', fontSize: '26px', color: '#ff4455', fontStyle: 'bold' }).setOrigin(0.5);
  this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
  this.tweens.add({ targets: target, x: target.x + Phaser.Math.Between(-12, 12), duration: 60, yoyo: true });
};

FightScene.prototype.endFight = function () {
  this.gameOver = true;
  const win = this.eHp <= 0;
  this.msg.setText(win ? 'ПОБЕДА! 🏆' : 'ПОРАЖЕНия…').setAlpha(1);
  if (win) SoundSystem.play('crit10');
  this.time.delayedCall(1800, () => this.scene.start('MenuScene'));
};