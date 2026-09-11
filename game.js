
// ---------- COVER-скейл: общий хелпер для всех сцен ----------
function applyCoverScale(scene) {
  const cw = window.game.scale.canvas.clientWidth || window.innerWidth;
  const ch = window.game.scale.canvas.clientHeight || window.innerHeight;
  const aspect = cw / ch;
  // Портрет/квадрат → COVER (заполнить весь экран). Ландшафт (aspect>0.9) → FIT чтобы не резать контент.
  const zoom = aspect > 0.9
    ? Math.min(cw / DESIGN_W, ch / DESIGN_H)                  // FIT
    : Math.max(cw / DESIGN_W, ch / DESIGN_H);                 // COVER
  scene.cameras.main.setZoom(zoom);
  scene.cameras.main.centerOn(DESIGN_W / 2, DESIGN_H / 2);
  scene.cameras.main.setBackgroundColor(scene.scene.key === 'BootScene' ? '#ffffff' : '#0a0a1a');
}
// VASA Games — «Тык в щёку» (Phaser 4.2, Approach D ретина)
/* global Phaser, STICKERS */
window.__dpr = Math.min(window.devicePixelRatio || 1, 3);
const DESIGN_W = 390, DESIGN_H = 844;

const config = {
  type: Phaser.WEBGL,
  width: DESIGN_W * window.__dpr,
  height: DESIGN_H * window.__dpr,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight, autoRound: true },
  render: { antialias: true },
  backgroundColor: '#0a0a1a',
  scene: [BootScene, MenuScene, GameScene, SelectScene, FightScene]
};

const game = new Phaser.Game(config);
window.game = game;

// ---------- Меню выбора игр (стиль Dendy/Sega) ----------
function MenuScene() { Phaser.Scene.call(this, { key: 'MenuScene' }); }
MenuScene.prototype = Object.create(Phaser.Scene.prototype);
MenuScene.prototype.constructor = MenuScene;

const GAMES = [
  { id: 'poke', title: 'ТЫКАЙ В ЩЁКУ', desc: 'Тапай по щеке!', playable: true },
  { id: 'fight', title: 'КЗБ АРЕНА', desc: '1v1 бой на головах!', playable: true }
];

MenuScene.prototype.create = function () {
  const dpr = window.__dpr || 1;
  this.dpr = dpr;
  const W = DESIGN_W, H = DESIGN_H;
  applyCoverScale(this);
  const origAddText = this.add.text.bind(this.add);
  this.add.text = (x, y, text, style) => { style = style || {}; style.resolution = dpr; return origAddText(x, y, text, style); };

  this.add.rectangle(W / 2, H / 2, W + 20, H + 20, 0x0a0a1a);

  this.add.text(W / 2, 70, 'VASA GAMES', { fontFamily: 'Arial', fontSize: '38px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  this.add.text(W / 2, 108, 'ВЫБЕРИ ИГРУ', { fontFamily: 'Arial', fontSize: '18px', color: '#00e5ff' }).setOrigin(0.5);

  // Карусель карточек
  this.selIndex = 0;
  this.cards = [];
  const cardW = 250, cardH = 150, gapY = 170;
  GAMES.forEach((g, i) => {
    const y = 210 + i * gapY;
    const card = this.add.container(W / 2, y);
    const bg = this.add.rectangle(0, 0, cardW, cardH, 0x1a1a3a).setStrokeStyle(3, 0x00e5ff);
    const t1 = this.add.text(0, -18, g.title, { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(0, 22, g.desc, { fontFamily: 'Arial', fontSize: '16px', color: '#8888aa' }).setOrigin(0.5);
    const t3 = this.add.text(0, 55, g.playable ? '▶ ИГРАТЬ' : '🔒 СКОРО', { fontFamily: 'Arial', fontSize: '15px', color: g.playable ? '#00e5ff' : '#555577' }).setOrigin(0.5);
    card.add([bg, t1, t2, t3]);
    this.cards.push(card);
  });

  this.add.text(W / 2, H - 50, '© VASA GAMES 2026', { fontFamily: 'Arial', fontSize: '13px', color: '#333355' }).setOrigin(0.5);

  this.select(0, false);
  // scene-wide tap по карточкам (надёжно при zoom=dpr)
  this.cardZones = GAMES.map((g, i) => ({ x: W/2, y: 210 + i * gapY, w: cardW, h: cardH, i: i }));
  this.input.on('pointerdown', (pointer) => {
    for (const z of this.cardZones) {
      if (Math.abs(pointer.worldX - z.x) < z.w/2 && Math.abs(pointer.worldY - z.y) < z.h/2) {
        this.select(z === this.cardZones[0] ? 0 : this.cardZones.indexOf(z), true);
        return;
      }
    }
  });
};

MenuScene.prototype.select = function (i, go) {
  const g = GAMES[i];
  if (!g) return;
  this.selIndex = i;
  // подсветка выбранной
  this.cards.forEach((c, j) => {
    const bg = c.list[0];
    bg.setStrokeStyle(j === i ? 5 : 3, j === i ? 0xffd93d : 0x00e5ff);
    c.setScale(j === i ? 1.06 : 1);
  });
  if (go) {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (g.id === 'poke') this.scene.start('GameScene');
      if (g.id === 'fight') this.scene.start('SelectScene');
    });
  }
};

// ---------- Boot: загрузка стикеров ----------
function BootScene() { Phaser.Scene.call(this, { key: 'BootScene' }); }
BootScene.prototype = Object.create(Phaser.Scene.prototype);
BootScene.prototype.constructor = BootScene;

BootScene.prototype.preload = function () {
  const g = this.add.graphics();
  g.fillStyle(0x00e5ff, 1); g.fillRect(0, 0, 10, 10); g.generateTexture('px', 10, 10); g.destroy();
  this.load.image('logo', 'assets/logo.webp');
  FIGHTERS.forEach(f => this.load.image(f.key, 'assets/fighters/' + f.file));

  // Экран загрузки: белый фон, лого сверху-в-центре, тонкий лоадер внизу
  const dpr = window.__dpr || 1;
  const w = 390 * dpr, h = 844 * dpr;
  this.cameras.main.setBackgroundColor('#ffffff');

  // лого (сразу, маленькое)
  const logo = this.add.image(w / 2, h / 2 - 40 * dpr, 'logo');
  logo.setScale(0.42 * dpr);

  // тонкий лоадер внизу
  this.barBg = this.add.rectangle(w / 2, h - 70 * dpr, 180 * dpr, 4 * dpr, 0xe0e0e8).setOrigin(0.5);
  this.bar = this.add.rectangle(w / 2 - 90 * dpr, h - 70 * dpr, 0, 4 * dpr, 0x2244cc).setOrigin(0, 0.5);

  this.load.on('progress', v => {
    this.bar.width = Math.max(2, 180 * dpr * v);
  });
  STICKERS.forEach(s => this.load.image(s.key, 'assets/' + s.key));
};

BootScene.prototype.create = function () {
  // Заставка EA-style: лого вырастает со вспышкой + бас-удар, «PRESS ANY» → в меню
  const dpr = window.__dpr || 1;
  const w = 390 * dpr, h = 844 * dpr;
  this.cameras.main.setBackgroundColor('#ffffff');
  const logo = this.add.image(w / 2, h / 2, 'logo');
  logo.setScale(0.25 * dpr);
  logo.setAlpha(0);

  const flash = this.add.rectangle(w/2, h/2, w*2, h*2, 0x000000, 1).setDepth(50);
  this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

  this.tweens.add({
    targets: logo,
    alpha: 1, scale: 0.55 * dpr,
    duration: 700, ease: 'Back.easeOut',
    onComplete: () => {
      // покачивание живого лого
      this.tweens.add({ targets: logo, scale: 0.57 * dpr, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const tap = this.add.text(w/2, h - 90*dpr, '— нажми чтобы продолжить —', { fontFamily: 'Arial', fontSize: (14*dpr) + 'px', color: '#4455aa' }).setOrigin(0.5);
      this.tweens.add({ targets: tap, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
      // автопереход через 4с ИЛИ тап
      this.autoTimer = this.time.delayedCall(4000, () => this.toMenu());
      this.input.once('pointerdown', () => this.toMenu());
    }
  });
};

BootScene.prototype.toMenu = function () {
  this.tweens.killAll();
  this.cameras.main.fadeOut(350, 255, 255, 255);
  this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
};

// ---------- Game ----------
function GameScene() { Phaser.Scene.call(this, { key: 'GameScene' }); }
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.init = function () {
  this.score = 0;
  this.combo = 0;
  this.lastTapTime = 0;
  this.currentSticker = null;
  this.faceSprite = null;
  this.isSquishing = false;
};

GameScene.prototype.create = function () {
  const dpr = window.__dpr || 1;
  this.dpr = dpr;
  const W = DESIGN_W, H = DESIGN_H; // design-координаты

  // camera zoom (Approach D)
  applyCoverScale(this);

  // text monkey-patch
  const origAddText = this.add.text.bind(this.add);
  this.add.text = (x, y, text, style) => { style = style || {}; style.resolution = dpr; return origAddText(x, y, text, style); };

  // фон
  this.add.rectangle(W / 2, H / 2, W + 20, H + 20, 0x0a0a1a);

  // title
  this.add.text(W / 2, 60, 'ТЫКАЙ В ЩЁКУ', { fontFamily: 'Arial', fontSize: '34px', color: '#00e5ff', fontStyle: 'bold' }).setOrigin(0.5);

  // score
  this.scoreText = this.add.text(W / 2, 110, '0', { fontFamily: 'Arial', fontSize: '64px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  this.comboText = this.add.text(W / 2, 158, '', { fontFamily: 'Arial', fontSize: '22px', color: '#ffd93d', fontStyle: 'bold' }).setOrigin(0.5);

  // лицо
  this.spawnFace();

  // подсказка
  this.hint = this.add.text(W / 2, H - 90, 'Тыкай в щёку!', { fontFamily: 'Arial', fontSize: '24px', color: '#666688' }).setOrigin(0.5);
  this.tweens.add({ targets: this.hint, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

  // audio (lazy init в pointerdown)
  this.input.on('pointerdown', () => SoundSystem.init());

  // кнопка «другой персонаж»
  const nextBtn = this.add.text(W - 24, 24, '⟳', { fontFamily: 'Arial', fontSize: '36px', color: '#00e5ff', backgroundColor: '#1a1a3a', padding: { x: 10, y: 6 } }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
  nextBtn.on('pointerdown', () => { this.spawnFace(true); });
};

GameScene.prototype.squish = function (s, dir) {
  if (this.isSquishing) return;
  this.isSquishing = true;
  const baseScale = s.scaleX;
  this.tweens.add({
    targets: s,
    scaleX: baseScale * 0.75,
    scaleY: baseScale * 1.15,
    x: s.x - dir * 12,
    duration: 70, yoyo: true, ease: 'Sine.easeOut',
    onComplete: () => {
      this.tweens.add({ targets: s, scaleX: baseScale, x: s.x, duration: 120, ease: 'Elastic.easeOut' });
      this.isSquishing = false;
    }
  });
};

GameScene.prototype._newFace = function () {
  const W = DESIGN_W, H = DESIGN_H;
  const pick = STICKERS[Math.floor(Math.random() * STICKERS.length)];
  this.currentSticker = pick;
  const sc = this._lastScale || 1;
  this.faceSprite = this.add.image(W / 2, H / 2 + 40, pick.key);
  const maxW = 300, maxH = 340;
  const targetScale = Math.min(maxW / this.faceSprite.width, maxH / this.faceSprite.height);
  this._lastScale = targetScale;
  this.faceSprite.setScale(targetScale);
  this.tweens.add({ targets: this.faceSprite, scale: targetScale, alpha: { from: 0, to: 1 }, duration: 250, ease: 'Back.easeOut' });
};

// ---------- Морф щеки: настоящая mesh-деформация по точке тыка ----------
// Разрезаем фото на сетку N×N (Phaser Rope-подход через quad mesh недоступен в 4.2 API сцен,
// поэтому деформируем через два слоя: elastic squish от точки тыка + локальный «пузырь» выпуклости.
GameScene.prototype.morphCheek = function (s, worldX, worldY, dir) {
  if (this.isSquishing) return;
  this.isSquishing = true;
  const baseScale = s.scaleX;

  // локальные координаты тыка относительно центра лица (в пикселях текстуры)
  const lx = (worldX - s.x) / baseScale;   // -w/2..w/2
  const ly = (worldY - s.y) / baseScale;   // -h/2..h/2

  // 1) общий squish лица в сторону тыка (щёка «втягивается»)
  this.tweens.add({
    targets: s,
    scaleX: baseScale * 0.82,
    scaleY: baseScale * 1.08,
    x: s.x - dir * 10,
    y: s.y + 6,
    duration: 80, yoyo: true, ease: 'Sine.easeOut',
    onComplete: () => {
      this.tweens.add({ targets: s, scaleX: baseScale, x: s.x, y: s.y, duration: 150, ease: 'Elastic.easeOut' });
      this.isSquishing = false;
    }
  });

  // 2) «пузырь» на месте тыка — красный отпечаток пальца, растёт и сдувается
  if (!this.cheekBlob || !this.cheekBlob.active) {
    this.cheekBlob = this.add.ellipse(0, 0, 10, 10, 0xff5566, 0.45).setDepth(5);
  }
  this.cheekBlob.setPosition(worldX, worldY);
  this.cheekBlob.setAlpha(0.5);
  this.cheekBlob.setScale(0.3);
  this.tweens.add({
    targets: this.cheekBlob,
    scaleX: 3.2, scaleY: 2.2, alpha: 0,
    duration: 350, ease: 'Cubic.easeOut'
  });

  // 3) волновая рябь по лицу — лёгкий сдвиг-качание, зависящий от точки
  this.tweens.add({
    targets: s,
    angle: dir * 2.5,
    duration: 90, yoyo: true, ease: 'Sine.easeOut'
  });
};

GameScene.prototype.spawnFace = function (animated) {
  if (this.faceSprite) {
    if (animated) {
      this.tweens.add({ targets: this.faceSprite, scale: this._lastScale * 0.6, alpha: 0, duration: 180, ease: 'Back.easeIn',
        onComplete: () => { this.faceSprite.destroy(); this._newFace(); } });
      return;
    }
    this.faceSprite.destroy();
  }
  this._newFace();
};

GameScene.prototype.update = function (time) {
  ComboSystem.checkTimeout(this, time);
};

// ---------- Щёлканье по щеке ----------
// Щека ≈ левая/правая нижняя треть лица. Зона: эллипс вокруг точки (offsetX, +h/4)
GameScene.prototype.tryPoke = function (worldX, worldY) {
  const s = this.faceSprite;
  if (!s) return;
  // попадание в лицо?
  const dx = worldX - s.x, dy = worldY - s.y;
  const halfW = s.displayWidth / 2, halfH = s.displayHeight / 2;
  if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) { this.missTap(); return; }

  // щека: зона в нижней половине лица, не центр (не рот/нос)
  const isCheek = dy > halfH * 0.05 && Math.abs(dx) > halfW * 0.12;
  if (!isCheek) { this.missTap(); return; }

  const now = this.time.now;
  const combo = ComboSystem.onClick(this, now);
  const tier = RewardSystem.rollReward();
  const points = Math.round(tier.value * combo.multiplier);

  this.score += points;
  this.scoreText.setText(String(this.score));
  this.showCombo(combo);
  this.morphCheek(s, worldX, worldY, dx < 0 ? -1 : 1);
  SoundSystem.play(tier.tier);
  FxSystem.tapFeedback(this, worldX, worldY, tier, points);

  if (this.score > 0 && this.score % 50 === 0) {
    // смена персонажа каждые 50 очков
    this.hint.setText('Новый персонаж!');
    this.time.delayedCall(600, () => { this.spawnFace(true); this.hint.setText('Тыкай в щёку'); });
  }
};

GameScene.prototype.missTap = function () {
  this.combo = 0;
  this.comboTextFlash && this.comboTextFlash();
  SoundSystem.play('miss');
};

GameScene.prototype.showCombo = function (combo) {
  if (combo.comboCount >= 5) {
    this.comboText.setText('КОМБО ×' + combo.multiplier.toFixed(1));
    this.comboText.setAlpha(1);
  } else {
    this.comboText.setAlpha(0);
  }
};

// ---------- Combo ----------
const ComboSystem = {
  timeout: 1500,
  onClick(scene, now) {
    const broken = now - scene.lastTapTime > this.timeout && scene.combo > 0;
    if (broken) scene.combo = 0;
    scene.combo++;
    scene.lastTapTime = now;
    const multiplier = 1 + Math.floor(scene.combo / 10) * 0.1;
    return { comboCount: scene.combo, broken, multiplier };
  },
  checkTimeout(scene, time) {
    if (scene.combo > 0 && time - scene.lastTapTime > this.timeout) {
      scene.combo = 0;
      scene.comboText.setAlpha(0);
    }
  }
};

// ---------- Reward ----------
const RewardSystem = {
  rollReward() {
    const base = 1;
    const r = Math.random();
    if (r < 0.70) return { value: base, tier: 'normal' };
    if (r < 0.90) return { value: base * 2, tier: 'crit2' };
    if (r < 0.98) return { value: base * 5, tier: 'crit5' };
    return { value: base * 10, tier: 'crit10' };
  }
};

// ---------- Sound (Web Audio, без файлов) ----------
const SoundSystem = {
  _ctx: null,
  init() {
    if (this._ctx) { if (this._ctx.state === 'suspended') this._ctx.resume(); return; }
    try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
  },
  play(tier) {
    if (!this._ctx) return;
    const ctx = this._ctx, now = ctx.currentTime;
    const freqMap = { normal: 440, crit2: 660, crit5: 880, crit10: 1200, miss: 180 };
    const freq = freqMap[tier] || 440;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = tier === 'miss' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.08);
  }
};

// ---------- FX ----------
const FxSystem = {
  tapFeedback(scene, x, y, tier, points) {
    // +N текст
    const colors = { normal: '#ffffff', crit2: '#ffd93d', crit5: '#ff8800', crit10: '#ff2255' };
    const txt = scene.add.text(x, y - 30, '+' + points, { fontFamily: 'Arial', fontSize: tier.tier === 'normal' ? '24px' : '32px', color: colors[tier.tier], fontStyle: 'bold' }).setOrigin(0.5);
    scene.tweens.add({ targets: txt, y: y - 90, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => txt.destroy() });
    // частицы
    const colorsHex = { normal: 0xffffff, crit2: 0xffd93d, crit5: 0xff8800, crit10: 0xff2255 };
    const emitter = scene.add.particles(x, y, 'px', {
      lifespan: 400, speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 }, tint: colorsHex[tier.tier], quantity: tier.tier === 'normal' ? 8 : 18,
      emitting: false
    });
    emitter.explode(tier.tier === 'normal' ? 8 : 18);
    scene.time.delayedCall(600, () => emitter.destroy());
    // крит-эффекты
    if (tier.tier === 'crit5') { scene.cameras.main.shake(150, 0.008); }
    if (tier.tier === 'crit10') {
      scene.cameras.main.shake(200, 0.015);
      const flash = scene.add.rectangle(DESIGN_W / 2, DESIGN_H / 2, DESIGN_W * 2, DESIGN_H * 2, 0xff2255, 0.35).setDepth(9999);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
    }
  }
};

// ---------- ввод: различаем тап по лицу через мировые координаты ----------
(function wireInput() {
  const origCreate = GameScene.prototype.create;
  GameScene.prototype.create = function () {
    origCreate.call(this);
    this.input.on('pointerdown', (pointer) => this.tryPoke(pointer.worldX, pointer.worldY));
  };
})();