
// ---------- Выбор бойца ----------
function SelectScene() { Phaser.Scene.call(this, { key: 'SelectScene' }); }
SelectScene.prototype = Object.create(Phaser.Scene.prototype);
SelectScene.prototype.constructor = SelectScene;

SelectScene.prototype.create = function () {
  const dpr = window.__dpr || 1;
  this.dpr = dpr;
  const W = DESIGN_W, H = DESIGN_H;
  this.cameras.main.setZoom(dpr);
  this.cameras.main.centerOn(W / 2, H / 2);
  const origAddText = this.add.text.bind(this.add);
  this.add.text = (x, y, text, style) => { style = style || {}; style.resolution = dpr; return origAddText(x, y, text, style); };

  this.add.rectangle(W/2, H/2, W+20, H+20, 0x0a0a1a);
  this.add.text(W/2, 60, 'ВЫБЕРИ БОЙЦА', { fontFamily: 'Arial', fontSize: '30px', color: '#ffd93d', fontStyle: 'bold' }).setOrigin(0.5);

  // превью выбранного
  this.preview = this.add.container(W/2, 200);
  this.pvHead = this.add.image(0, 0, FIGHTERS[0].key);
  const hs = Math.min(150 / this.pvHead.width, 150 / this.pvHead.height);
  this.pvHead.setScale(hs);
  this.pvName = this.add.text(0, 105, FIGHTERS[0].name, { fontFamily: 'Arial', fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  const pvStats = this.add.text(0, 140, 'СИЛА 7 • ТЕМП 6', { fontFamily: 'Arial', fontSize: '14px', color: '#8888aa' }).setOrigin(0.5);
  this.preview.add([this.pvHead, this.pvName, pvStats]);
  this.pvStats = pvStats;

  // сетка 4×2
  this.selIdx = 0;
  this.cards = [];
  FIGHTERS.forEach((f, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = W/2 + (col - 1.5) * 78, y = 300 + row * 95;
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 70, 85, 0x1a1a3a).setStrokeStyle(2, 0x444466);
    const head = this.add.image(0, -8, f.key);
    head.setScale(Math.min(52 / head.width, 52 / head.height));
    c.add([bg, head]);
    this.cards.push(c);
  });

  // кнопки боя
  this.fightBtn = this.add.text(W/2, H - 120, 'В БОЙ!', { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', backgroundColor: '#cc2222', padding: { x: 40, y: 14 } }).setOrigin(0.5).setDepth(10);
  this.add.text(W/2, H - 60, '← назад', { fontFamily: 'Arial', fontSize: '15px', color: '#555577' }).setOrigin(0.5);

  this.select(0);
  // scene-wide tap: сетка + кнопка В БОЙ + назад
  this.cellZones = FIGHTERS.map((f, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    return { x: W/2 + (col - 1.5) * 78, y: 300 + row * 95, w: 78, h: 95, i: i };
  });
  this.fightZone = { x: W/2, y: H - 120, w: 180, h: 60 };
  this.backZone  = { x: W/2, y: H - 60, w: 120, h: 40 };
  this.input.on('pointerdown', (pointer) => {
    const wx = pointer.worldX, wy = pointer.worldY;
    const hit = (z) => Math.abs(wx - z.x) < z.w/2 && Math.abs(wy - z.y) < z.h/2;
    if (hit(this.fightZone)) {
      SoundSystem.play('crit2');
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('FightScene', { player: this.selIdx, enemy: this.pickEnemy() }));
      return;
    }
    if (hit(this.backZone)) { this.scene.start('MenuScene'); return; }
    for (const z of this.cellZones) {
      if (hit(z)) { this.select(z.i); return; }
    }
  });
};

SelectScene.prototype.pickEnemy = function () {
  // противник ≠ игрок
  let e = Phaser.Math.Between(0, FIGHTERS.length - 1);
  if (e === this.selIdx) e = (e + 1) % FIGHTERS.length;
  return e;
};

SelectScene.prototype.select = function (i) {
  this.selIdx = i;
  const f = FIGHTERS[i];
  this.pvHead.setTexture(f.key);
  const hs = Math.min(150 / this.pvHead.width, 150 / this.pvHead.height);
  this.pvHead.setScale(hs);
  this.pvName.setText(f.name);
  // stats по индексу: сила 5..9, ловкость 5..9
  const power = 5 + (i * 7) % 5, speed = 5 + (i * 3) % 5;
  this.pvStats.setText('СИЛА ' + power + ' · СКОРОСТЬ ' + speed);
  this.cards.forEach((c, j) => {
    const bg = c.list[0];
    bg.setStrokeStyle(j === i ? 4 : 2, j === i ? 0xffd93d : 0x444466);
    c.setScale(j === i ? 1.12 : 1);
  });
  SoundSystem.init();
  SoundSystem.play('normal');
};

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
  // статы: сила и скорость зависят от бойца
  this.pStats = { power: 5 + (this.pIdx * 7) % 5, speed: 5 + (this.pIdx * 3) % 5 };
  this.eStats = { power: 5 + (this.eIdx * 7) % 5, speed: 5 + (this.eIdx * 3) % 5 };
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

  // Кнопки атак (scene-wide tap handler — надёжно при camera zoom)
  this.attackButtons = [];
  this.makeAttackBtn(70,  H - 60, '👊 ПАНЧ', 6, () => this.attack('punch'));
  this.makeAttackBtn(190, H - 60, '🦵 ПИНОК', 9, () => this.attack('kick'), 0xff8800);
  this.makeUltBtn(W - 70, H - 60);
  this.input.on('pointerdown', (pointer) => this.handleTap(pointer.worldX, pointer.worldY));

  this.ult = 0;           // 0..100
  this.isBusy = false;
  this.msg = this.add.text(W/2, H/2 - 120, 'Бой!', { fontFamily: 'Arial', fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);

  // AI-таймер
  this.time.addEvent({ delay: Math.round(1600 - this.eStats.speed * 90), loop: true, callback: () => this.enemyTurn() });
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
  }).setOrigin(0.5).setDepth(10);
  b.hitCb = cb;
  this.actionButtons = this.attackButtons || [];
  b.getBounds && (b._hb = { x: x, y: y, w: b.width + 20, h: b.height + 20 });
  this.attackButtons = this.attackButtons || [];
  this.attackButtons.push(b);
  return b;
};

// scene-wide tap: переводим pointer в дизайн-координаты и ищем кнопку
FightScene.prototype.handleTap = function (worldX, worldY) {
  // worldX/worldY уже в дизайн-координатах (zoom компенсируется камерой)
  const btns = this.attackButtons || [];
  for (const b of btns) {
    if (b._hb && Math.abs(worldX - b._hb.x) < b._hb.w/2 && Math.abs(worldY - b._hb.y) < b._hb.h/2) {
      if (b === this.ultBtn) { this.ultCheck(); } else { if (!this.isBusy) b.hitCb(); }
      b.setScale(0.92); this.time.delayedCall(120, () => b.setScale(1));
      return true;
    }
  }
  return false;
};

FightScene.prototype.ultCheck = function () {
  if (this.ult >= 100 && !this.isBusy) {
    this.ult = 0;
    this.time.delayedCall(0, () => this.updateUlt());
    this.doAttack(this.pBody, this.eBody, 30, '🖕 УЛЬТА!');
    this.cameras.main.shake(300, 0.02);
  }
};

FightScene.prototype.makeUltBtn = function (x, y) {
  this.ultBtn = this.add.text(x, y, '🖕 УЛЬТА', {
    fontFamily: 'Arial', fontSize: '20px', color: '#666', backgroundColor: '#222244',
    padding: { x: 14, y: 10 }
  }).setOrigin(0.5).setDepth(10);
  this.attackButtons.push(this.ultBtn);
  this.ultBtn._hb = { x: x, y: y, w: this.ultBtn.width + 20, h: this.ultBtn.height + 20 };
  this.updateUlt();
};

FightScene.prototype.updateUlt = function () {
  const r = this.ult / 100;
  this.ultBtn.setColor(r >= 1 ? '#ffd93d' : '#666');
  this.ultBtn.setBackgroundColor(r >= 1 ? '#886611' : '#222244');
  this.ultBtn.setText(r >= 1 ? '🖕 УЛЬТА!' : '🖕 ' + Math.floor(r * 100) + '%');
};

FightScene.prototype.attack = function (type) {
  if (this.isBusy) return;
  this.combo = (this.time.now - (this.lastHit || 0) < 1800) ? (this.combo || 0) + 1 : 1;
  this.lastHit = this.time.now;
  if (this.combo >= 3) this.showMsg('КОМБО ×' + this.combo + '!', '#ffd93d');
  const base = type === 'punch' ? Phaser.Math.Between(6, 12) : Phaser.Math.Between(10, 18);
  let dmg = Math.round(base * (this.pStats.power / 7));
  const crit = Math.random() < 0.12;
  if (crit) { dmg = Math.round(dmg * 2); this.showMsg('КРИТ!', '#ff4455'); }   // сила 5..9 → множитель 0.71..1.28
  this.doAttack(this.pBody, this.eBody, dmg, type === 'punch' ? '👊' : '🦵');
  this.ult = Math.min(100, this.ult + 18); this.updateUlt();
};

FightScene.prototype.enemyTurn = function () {
  if (this.isBusy || this.gameOver) return;
  // уклонение игрока по скорости
  if (Math.random() < this.pStats.speed * 0.015) {
    this.showMsg('УКЛОН!', '#33ff66');
    this.tweens.add({ targets: this.pBody, x: this.pBody.x - 18, duration: 90, yoyo: true });
    return;
  }
  const taunts = ['Ха!', 'Слабак', 'Мимо', 'Ещё?', 'КЗБ рулит'];
  if (Math.random() < 0.3) this.showMsg(Phaser.Utils.Array.GetRandom(taunts), '#8899ff');
  const dmg = Math.round(Phaser.Math.Between(5, 12) * (this.eStats.power / 7));
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

FightScene.prototype.showMsg = function (text, color) {
  if (!this.msg) return;
  this.msg.setText(text).setColor(color || '#ffffff').setAlpha(1);
  this.tweens.killTweensOf(this.msg);
  this.msg.setScale(1);
  this.tweens.add({ targets: this.msg, scale: 1.15, duration: 120, yoyo: true });
  this.time.delayedCall(900, () => { if (this.msg) this.msg.setAlpha(0); });
};

FightScene.prototype.showHit = function (target, dmg, label) {
  const txt = this.add.text(target.x, target.y - 110, '-' + dmg, { fontFamily: 'Arial', fontSize: '26px', color: '#ff4455', fontStyle: 'bold' }).setOrigin(0.5);
  this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
  this.tweens.add({ targets: target, x: target.x + Phaser.Math.Between(-12, 12), duration: 60, yoyo: true });
};

FightScene.prototype.pickEnemy = function () {
  let e = Phaser.Math.Between(0, FIGHTERS.length - 1);
  if (e === this.pIdx) e = (e + 1) % FIGHTERS.length;
  return e;
};

FightScene.prototype.endFight = function () {
  this.gameOver = true;
  const win = this.eHp <= 0;
  this.msg.setText(win ? 'ПОБЕДА! 🏆' : 'ПОРАЖЕНИЕ…').setAlpha(1);
  if (win) SoundSystem.play('crit10');
  // эмоция победителя крупно
  const emoKey = win ? this.pIdx : this.eIdx;
  const emo = this.add.image(DESIGN_W/2, DESIGN_H/2, FIGHTERS[emoKey].key).setDepth(20);
  emo.setScale(0.5);
  emo.setAlpha(0);
  this.tweens.add({ targets: emo, scale: 1.2, alpha: 1, duration: 400, ease: 'Back.easeOut' });
  this.remBtn = this.add.text(DESIGN_W/2, DESIGN_H/2 + 130, win ? '↻ ЕЩЁ БОЙ' : '↻ РЕВАНШ', { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff', backgroundColor: '#cc2222', padding: { x: 30, y: 12 } }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
  this.remBtn.on('pointerdown', () => {
    this.gameOver = false;
    this.scene.restart({ player: this.pIdx, enemy: this.pickEnemy() });
  });
  this.time.delayedCall(4000, () => { if (emo && emo.active) emo.destroy(); this.scene.start('MenuScene'); });
};