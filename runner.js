/* ==========================================================================
   КЗБ РАННЕР — «САНЁК: КРАСНАЯ ПОЛЯНА» и «БОБАН: САМОКАТ»
   Один RunnerScene + конфиг LEVELS. Управление инвертировано, есть
   «рандомный увод», предметы, кукуха, босс (100 HP) и приз.
   ========================================================================== */

const GROUND_Y = 640;          // уровень земли в дизайн-координатах
const HERO_X_SCREEN = 0.30;    // доля экрана, где держится герой

const LEV = {
  sanek: {
    id: 'sanek', title: 'САНЁК: КРАСНАЯ ПОЛЯНА', hero: 'f_45',
    sub: 'БУХОВО', bossName: 'БУХОВО-МАСТЕР НА СТО',
    bossTaunts: ['МАШИНА НЕ НА ПОДЪЁМНИКЕ', 'ПРИЕЗЖАЙ ЗАВТРА', 'ЭТО НЕ К НАМ'],
    prize: 'cat', prizeText: 'КОТ СПАСЁН!', prizeSub: 'главный приз забран',
    invert: true, chaos: { min: 6000, max: 13000, chance: 0.35, durMin: 1200, durMax: 2600 },
    speed: 230, len: 9000, bg: 'polyana', sanityFrom: 8, sanityMax: 100,
    spawn: { kosyak: 900, vodka: 1400, pill: 3000 },   // период спавна, мс
    labels: { good: 'КОСЯК', bad: 'ВОДКА', heal: 'ЛЕЧЕНИЕ КУКУХИ' }
  },
  boban: {
    id: 'boban', title: 'БОБАН: САМОКАТ', hero: 'f_12',
    sub: 'МОСКВА', bossName: 'БОСС С ПРЕСС-КОНФЕРЕНЦИИ',
    bossTaunts: ['ОПТИМИЗИРУЕМ', 'ЭТО РЫНОК', 'ДЕРЖИМ КУРС'],
    prize: 'cat', prizeText: 'НОРМ КАТНУЛ!', prizeSub: 'город пройден',
    invert: true, chaos: { min: 9000, max: 18000, chance: 0.22, durMin: 900, durMax: 1800 },
    speed: 260, len: 8500, bg: 'moscow', sanityFrom: 6, sanityMax: 100, blur: true,
    overuse: 4,                                        // передоз марок
    spawn: { kosyak: 1100, vodka: 2000, pill: 3400 },
    labels: { good: 'ШИШКА / МАРКА', bad: 'ГАШИК', heal: 'ЛЕЧЕНИЕ КУКУХИ' }
  }
};

/* ---------------- иконки предметов (текстуры 32×32) ---------------- */
function makeRunnerIcons(scene) {
  const defs = {
    ic_kosyak: (g) => { g.fillStyle(0xffffff, 1); g.fillRect(13, 4, 7, 24); g.fillStyle(0xd8b070, 1); g.fillRect(14, 6, 5, 20); g.fillStyle(0xff5522, 1); g.fillRect(14, 4, 5, 3); },
    ic_vodka: (g) => { g.fillStyle(0xdddddd, 1); g.fillRect(12, 8, 9, 22); g.fillStyle(0x99ccff, 1); g.fillRect(13, 14, 7, 15); g.fillStyle(0x2255bb, 1); g.fillRect(12, 20, 9, 5); g.fillStyle(0xbbbbbb, 1); g.fillRect(14, 3, 5, 5); },
    ic_pill: (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 10); g.fillStyle(0xee3333, 1); g.fillRect(6, 14, 20, 4); },
    ic_marka: (g) => { g.fillStyle(0xf2eaff, 1); g.fillRect(6, 6, 20, 20); g.fillStyle(0x8a4fd8, 1); g.fillCircle(16, 16, 5); g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 2); },
    ic_cat: (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(16, 18, 9); g.fillTriangle(8, 12, 13, 3, 15, 12); g.fillTriangle(24, 12, 19, 3, 17, 12); g.fillStyle(0x111111, 1); g.fillCircle(13, 17, 2); g.fillCircle(19, 17, 2); },
  };
  for (const k in defs) { const g = scene.add.graphics(); defs[k](g); g.generateTexture(k, 32, 32); g.destroy(); }
}

/* ---------------- процедурный параллакс (без внешних файлов) ---------------- */
function makeParallax(scene, kind) {
  const TILE_W = 1200;
  const LAYERS = kind === 'polyana'
    ? [
        { key: 'pl_far',  depth: -80, scroll: 0.15, draw: (g) => {          // горы со снегом
            g.fillStyle(0x5a7fb5, 1);
            for (let x = -200; x < TILE_W + 400; x += 300) g.fillTriangle(x, 470, x + 150, 160 + ((x / 300) % 3) * 40, x + 300, 470);
            g.fillStyle(0xffffff, 0.85);
            for (let x = -200; x < TILE_W + 400; x += 300) g.fillTriangle(x + 115, 215, x + 150, 160 + ((x / 300) % 3) * 40, x + 185, 215);
          } },
        { key: 'pl_mid',  depth: -60, scroll: 0.35, draw: (g) => {          // лес
            g.fillStyle(0x2f6b3a, 1);
            for (let x = -100; x < TILE_W + 200; x += 84) g.fillTriangle(x, 615, x + 42, 410, x + 84, 615);
            g.fillStyle(0x255a30, 1);
            for (let x = -140; x < TILE_W + 200; x += 104) g.fillTriangle(x, 640, x + 52, 480, x + 104, 640);
          } },
        { key: 'pl_near', depth: -40, scroll: 0.75, draw: (g) => {          // трава и кусты
            g.fillStyle(0x3d8b46, 1); g.fillRect(0, GROUND_Y, TILE_W, 300);
            g.fillStyle(0x4fa05a, 1);
            for (let x = 0; x < TILE_W; x += 56) g.fillTriangle(x, GROUND_Y, x + 28, GROUND_Y - 34, x + 56, GROUND_Y);
          } }
      ]
    : [
        { key: 'ms_far',  depth: -80, scroll: 0.12, draw: (g) => {          // замыленный город
            g.fillStyle(0x8898b0, 0.72);
            for (let x = 0; x < TILE_W; x += 110) { const h = 190 + ((x * 7) % 190); g.fillRect(x, 470 - h, 88, h); }
            g.fillStyle(0x97a7bd, 0.55);
            for (let x = 40; x < TILE_W; x += 240) { g.fillRect(x, 200, 44, 122); g.fillRect(x + 9, 168, 26, 36); }
          } },
        { key: 'ms_mid',  depth: -60, scroll: 0.32, draw: (g) => {
            g.fillStyle(0x76879e, 0.82);
            for (let x = 0; x < TILE_W; x += 140) { const h = 240 + ((x * 5) % 210); g.fillRect(x, 640 - h, 108, h); }
            g.fillStyle(0xd9e6f5, 0.45);
            for (let x = 20; x < TILE_W; x += 140) for (let y = 320; y < 580; y += 46) g.fillRect(x + 14, y, 24, 26);
          } },
        { key: 'ms_near', depth: -40, scroll: 0.75, draw: (g) => {
            g.fillStyle(0x4a4a55, 1); g.fillRect(0, GROUND_Y, TILE_W, 300);
            g.fillStyle(0x9aa4b4, 1); g.fillRect(0, GROUND_Y - 6, TILE_W, 6);
            g.fillStyle(0x5c5c68, 1);
            for (let x = 0; x < TILE_W; x += 190) { g.fillRect(x + 60, GROUND_Y - 130, 9, 130); g.fillRect(x + 50, GROUND_Y - 140, 28, 12); }
          } }
      ];

  const out = [];
  LAYERS.forEach((L) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    L.draw(g);
    g.generateTexture(L.key, TILE_W, DESIGN_H);
    g.destroy();
    // два обычных спрайта вместо TileSprite: WebGL не тайлит текстуру не-степени-двойки
    const a = scene.add.image(0, 0, L.key).setOrigin(0, 0).setDepth(L.depth);
    const b = scene.add.image(0, 0, L.key).setOrigin(0, 0).setDepth(L.depth);
    scene.world.add(a); scene.world.add(b);
    out.push({ a: a, b: b, w: TILE_W, scroll: L.scroll });
  });
  return out;
}

function parallaxUpdate(layers, viewX) {
  for (const L of layers) {
    const base = ((viewX * (1 - L.scroll)) % L.w + L.w) % L.w;
    L.a.x = Math.round(base) - L.w;
    L.b.x = Math.round(base);
  }
}

/* ============================== RunnerScene ============================== */
function RunnerScene() { Phaser.Scene.call(this, { key: 'RunnerScene' }); }
RunnerScene.prototype = Object.create(Phaser.Scene.prototype);
RunnerScene.prototype.constructor = RunnerScene;

RunnerScene.prototype.init = function (data) {
  this.levelId = (data && data.level) || 'sanek';
  this.cfg = LEV[this.levelId];
};

RunnerScene.prototype.create = function () {
  const C = this.cfg, W = DESIGN_W, H = DESIGN_H;
  this.dpr = window.__dpr || 1;
  addBackdrop(this, C.bg === 'moscow' ? 0x9fb0c6 : 0x8fd0ff);
  fitScene(this);

  makeRunnerIcons(this);
  this.world = this.add.container(0, 0);           // весь уровень едет, камера стоит
  this.viewX = 0;
  this.parallax = makeParallax(this, C.bg);   // спрайты слоёв уже добавлены в мир

  // ---- герой: голова (вырезанная) + тело, нарисованное кодом ----
  this.hero = { x: 300, vx: 0, vy: 0, onGround: true, lives: 3, inv: 0, dir: 1, runPhase: 0 };
  this.heroG = this.add.container(0, 0).setDepth(5);
  this.world.add(this.heroG);
  const headKey = this.textures.exists(C.hero) ? C.hero : 'f_03';
  this.head = this.add.image(0, -62, headKey).setOrigin(0.5, 0.5);
  this.head.setDisplaySize(62, 62);
  this.body = this.add.graphics();
  this.bodyG = this.body;
  this.heroG.add([this.body, this.head]);
  this.drawHeroBody(0);

  // ---- состояние уровня ----
  this.dist = 0; this.score = 0; this.sanity = C.sanityMax; this.done = false;
  this.marks = 0; this.mudUntil = 0;
  this.chaosAt = this.pickChaosTime(); this.chaosUntil = 0;
  this.nextKosyak = 1200; this.nextVodka = 2200; this.nextPill = 4200;
  this.items = [];
  this.bossPhase = 'none';   // none → intro → fight → talk → over
  this.bossDone = false;
  this.boss = null; this.bolts = [];
  this.bossAt = C.len * 0.72;

  this.buildHUD();
  this.buildControls();

  // клавиатура (для десктопа)
  this.keys = this.input.keyboard ? this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', space: 'SPACE' }) : null;

  // тексты
  this.toast = this.add.text(W / 2, 190, '', { fontFamily: 'Arial', fontSize: '26px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(50);
  if (C.blur) {
    this.blurOverlay = this.add.rectangle(DESIGN_W / 2, DESIGN_H / 2, DESIGN_W + 300, DESIGN_H + 300, 0xffffff, 0.16).setDepth(800);
    this.mudOverlay = this.add.rectangle(DESIGN_W / 2, DESIGN_H / 2, DESIGN_W + 300, DESIGN_H + 300, 0xdde6ff, 0).setDepth(801);
  }


  // ---- ввод: тап/клик по большим зонам ----
  this.held = { left: false, right: false };
  this.input.on('pointerdown', (p) => this.onTap(p.worldX, p.worldY));
  this.input.on('pointerup', () => { this.held.left = false; this.held.right = false; });

  this.add.text(W / 2, H - 20, C.id === 'sanek' ? 'красная поляна · до конца и до кота' : 'москва · всё как в тумане', { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.6).setDepth(50);
};

RunnerScene.prototype.pickChaosTime = function () {
  const c = this.cfg.chaos;
  return Phaser.Math.Between(c.min, c.max);
};

RunnerScene.prototype.drawHeroBody = function (phase) {
  const g = this.body, c = this.cfg;
  g.clear();
  const legs = Math.sin(phase) * 9;
  const col = c.id === 'sanek' ? 0x2a3f6b : 0x3b2f4a;   // куртка/худи
  g.fillStyle(0x11111a, 1);
  g.fillRect(-9, 6, 8, 34 + legs);           // задняя нога
  g.fillStyle(0x1a1a26, 1);
  g.fillRect(2, 6, 8, 34 - legs);
  g.fillStyle(col, 1);
  g.fillRect(-16, -40, 32, 52);              // корпус
  g.fillStyle(c.id === 'sanek' ? 0xf0f0f0 : 0x22222c, 1);
  g.fillRect(-16, -40, 32, 5);
  if (c.id === 'boban') {                    // самокат
    g.fillStyle(0xdddddd, 1); g.fillRect(-26, 40, 52, 5);
    g.fillStyle(0x333333, 1); g.fillCircle(-22, 48, 9); g.fillCircle(22, 48, 9);
    g.fillStyle(0xcccccc, 1); g.fillRect(24, -46, 4, 88);
  }
};

RunnerScene.prototype.buildHUD = function () {
  const W = DESIGN_W;
  this.hearts = [];
  for (let i = 0; i < 5; i++) {
    const t = this.add.text(16 + i * 30, 22, '♥', { fontFamily: 'Arial', fontSize: '26px', color: '#ff3355', stroke: '#000000', strokeThickness: 3 }).setOrigin(0, 0.5).setDepth(60);
    this.hearts.push(t);
  }
  this.sanityLabel = this.add.text(16, 56, 'КУКУХА', { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0, 0.5).setDepth(60);
  this.add.rectangle(16, 74, 150, 10, 0x222233).setOrigin(0, 0.5).setDepth(60).setStrokeStyle(2, 0xffffff);
  this.sanityBar = this.add.rectangle(18, 74, 146, 6, 0x7ee787).setOrigin(0, 0.5).setDepth(61);
  this.scoreText = this.add.text(W - 16, 22, '0', { fontFamily: 'Arial', fontSize: '26px', color: '#ffe066', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 0.5).setDepth(60);
  this.add.rectangle(W / 2, 30, 150, 8, 0x222233).setOrigin(0.5).setDepth(60).setStrokeStyle(2, 0xffffff);
  this.progBar = this.add.rectangle(W / 2 - 74, 30, 0, 4, 0xffd93d).setOrigin(0, 0.5).setDepth(61);
  this.bossHpBg = this.add.rectangle(W / 2, 116, 300, 18, 0x222233).setOrigin(0.5).setDepth(60).setStrokeStyle(2, 0xffffff).setVisible(false);
  this.bossHp = this.add.rectangle(W / 2 - 148, 116, 296, 12, 0xcc2222).setOrigin(0, 0.5).setDepth(61).setVisible(false);
  this.bossName = this.add.text(W / 2, 92, '', { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(60).setVisible(false);
  this.bestText = this.add.text(W / 2, 100, '', { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.7).setDepth(60);
  const best = +(localStorage.getItem('vasa_best_' + this.cfg.id) || 0);
  if (best) this.bestText.setText('рекорд: ' + best);
};

RunnerScene.prototype.buildControls = function () {
  const W = DESIGN_W, H = DESIGN_H;
  this.btn = {};
  const mk = (x, y, label, key) => {
    const r = this.add.rectangle(x, y, 96, 96, 0x000000, 0.35).setStrokeStyle(3, 0xffffff).setDepth(70);
    const t = this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '40px', color: '#ffffff' }).setOrigin(0.5).setDepth(71);
    this.btn[key] = { r: r, t: t, x: x, y: y, w: 120, h: 120 };
  };
  mk(70, H - 90, '◀', 'left');
  mk(180, H - 90, '▶', 'right');
  mk(W - 70, H - 90, '⤒', 'jump');
  this.atkBtn = this.btn.jump;   // в бою эта же кнопка бьёт при удержании рядом с боссом
};

RunnerScene.prototype.setBtn = function (key, on) {
  const b = this.btn[key];
  if (!b) return;
  b.r.setFillStyle(on ? 0xffd93d : 0x000000, on ? 0.75 : 0.35);
  b.t.setColor(on ? '#101018' : '#ffffff');
};

RunnerScene.prototype.onTap = function (x, y) {
  if (this.done) { this.onFinishTap(x, y); return; }
  for (const k in this.btn) {
    const b = this.btn[k];
    if (Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2) {
      if (k === 'jump') { this.tryJump(); this.attack(); }
      else { this.held[k] = true; this.setBtn(k, true); }
      return;
    }
  }
  // тап по боссу — тоже удар (экранные координаты = design, мир сдвинут на viewX)
  if (this.boss && this.bossPhase === 'fight' && Math.abs(x - (this.boss.x - this.viewX)) < 150) this.attack(true);
};

RunnerScene.prototype.onFinishTap = function (x, y) {
  if (!this.endBtns) return;
  for (const b of this.endBtns) {
    if (Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2) { b.cb(); return; }
  }
};

RunnerScene.prototype.tryJump = function () {
  if (!this.hero.onGround || this.done) return;
  this.hero.vy = -540; this.hero.onGround = false;
};

RunnerScene.prototype.attack = function (force) {
  if (this.bossPhase !== 'fight' || !this.boss) return;
  const now = this.time.now;
  if (now < (this.lastAtk || 0) + 380) return;
  const dx = Math.abs(this.hero.x + 40 - this.boss.x);
  const dy = Math.abs((GROUND_Y - 60) - this.boss.y);
  if (!force && (dx > 190 || dy > 190)) return;
  this.lastAtk = now;
  const dmg = Phaser.Math.Between(4, 9);
  this.boss.hp = Math.max(0, this.boss.hp - dmg);
  this.score += 25;
  this.boss.img.setTint(0xff8888);
  this.time.delayedCall(90, () => this.boss && this.boss.img.clearTint());
  this.cameras.main.shake(90, 0.006);
  this.floatText(this.boss.x, this.boss.y - 60, '-' + dmg, '#ff4444');
  if (this.boss.hp === 0) this.bossDefeated();
};

RunnerScene.prototype.floatText = function (x, y, txt, color) {
  const t = this.add.text(x, y, txt, { fontFamily: 'Arial', fontSize: '20px', color: color || '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(80);
  this.world.add(t);
  this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 700, onComplete: () => t.destroy() });
};

RunnerScene.prototype.spawnItem = function (kind) {
  const key = kind === 'kosyak' ? (this.cfg.id === 'sanek' ? 'ic_kosyak' : 'ic_marka') : kind === 'vodka' ? (this.cfg.id === 'sanek' ? 'ic_vodka' : 'ic_marka') : 'ic_pill';
  const bad = kind === 'vodka';
  const y = bad ? GROUND_Y - 120 : GROUND_Y - Phaser.Math.Between(40, 150);
  const img = this.add.image(this.hero.x + DESIGN_W + 120, y, key).setDisplaySize(34, 34).setDepth(4);
  this.world.add(img);
  this.items.push({ img: img, kind: kind, bad: bad, x: img.x, y: y });
};

RunnerScene.prototype.update = function (time, delta) {
  if (this.done || this.scene.isActive() === false) return;
  const C = this.cfg, dt = Math.min(delta, 50) / 1000;
  const h = this.hero;

  // ---- ввод (инверсия + рандомный увод) ----
  let left = this.held.left || (this.keys && this.keys.left.isDown);
  let right = this.held.right || (this.keys && this.keys.right.isDown);
  const chaosActive = time < this.chaosUntil;
  if (chaosActive) { const r = Math.random(); left = r < 0.45; right = r > 0.55; }
  if (C.invert) { const t = left; left = right; right = t; }
  let want = (right ? 1 : 0) - (left ? 1 : 0);
  if (time > this.chaosAt && this.bossPhase === 'none') {
    if (Math.random() < C.chaos.chance) {
      this.chaosUntil = time + Phaser.Math.Between(C.chaos.durMin, C.chaos.durMax);
      this.chaosAt = this.chaosUntil + this.pickChaosTime();
      this.toast.setText(C.id === 'sanek' ? 'САНЁК ПОТЕРЯЛСЯ' : 'ЗРЕНИЕ ПОДВЕЛО');
      this.time.delayedCall(1400, () => this.toast.setText(''));
    } else { this.chaosAt = time + this.pickChaosTime(); }
  }
  const mud = time < this.mudUntil;
  let spd = C.speed * (mud ? 0.55 : 1);
  h.vx = want * spd * 1.35;
  h.x += h.vx * dt;
  if (h.x < 90) h.x = 90;
  if (want !== 0) { h.dir = want; h.runPhase += dt * 12; }

  // ---- прыжок/гравитация ----
  if ((this.keys && (this.keys.up.isDown || this.keys.space.isDown))) this.tryJump();
  h.vy += 1500 * dt;
  h.y = (h.y || GROUND_Y) + h.vy * dt;
  if (h.y >= GROUND_Y) { h.y = GROUND_Y; h.vy = 0; h.onGround = true; }

  // ---- автопрогресс (бежит вперёд сам, управление = смещение по экрану) ----
  if (this.bossPhase === 'none') {
    h.x += C.speed * 0.45 * dt;         // «дорога уезжает»
    this.dist = Math.max(this.dist, h.x - 300);
  }

  // ---- мир едет, камера неподвижна (HUD/кнопки всегда на месте) ----
  this.viewX = Math.max(0, h.x - DESIGN_W * HERO_X_SCREEN);
  this.world.x = -Math.round(this.viewX);
  parallaxUpdate(this.parallax, this.viewX);

  // ---- герой рисуется ----
  this.heroG.x = h.x; this.heroG.y = h.y;
  this.head.setFlipX(h.dir < 0);
  this.drawHeroBody(h.onGround ? h.runPhase : 1.4);
  h.inv = Math.max(0, h.inv - dt);

  // ---- предметы ----
  this.nextKosyak -= delta; this.nextVodka -= delta; this.nextPill -= delta;
  if (this.nextKosyak <= 0) { this.spawnItem('kosyak'); this.nextKosyak = C.spawn.kosyak + Phaser.Math.Between(-250, 400); }
  if (this.nextVodka <= 0) { this.spawnItem('vodka'); this.nextVodka = C.spawn.vodka + Phaser.Math.Between(-300, 500); }
  if (this.nextPill <= 0) { this.spawnItem('pill'); this.nextPill = C.spawn.pill + Phaser.Math.Between(-600, 900); }
  for (let i = this.items.length - 1; i >= 0; i--) {
    const it = this.items[i];
    if (Math.abs(it.img.x - h.x) < 44 && Math.abs(it.img.y - (h.y - 25)) < 68) {
      this.pickup(it); it.img.destroy(); this.items.splice(i, 1); continue;
    }
    if (it.img.x < h.x - 500) { it.img.destroy(); this.items.splice(i, 1); }
  }

  // ---- кукуха ----
  this.sanityBar.width = 146 * (this.sanity / C.sanityMax);
  this.sanityBar.fillColor = this.sanity > 50 ? 0x7ee787 : this.sanity > 25 ? 0xffc107 : 0xff4444;
  if (this.sanity <= 20 && !this.mudUntil && C.id === 'sanek') this.mudUntil = time + 0; // эффект только у Бобана
  if (this.sanity <= 0 && !this.lostSanity) {
    this.lostSanity = true;
    this.toast.setText('КУКУХА УЕХАЛА');
    this.invertExtra = true;
  }

  // ---- HUD ----
  this.scoreText.setText(String(this.score));
  this.progBar.width = 148 * Math.min(1, this.dist / C.len);
  this.hearts.forEach((t, i) => t.setAlpha(i < h.lives ? 1 : 0.18));

  // ---- босс ----
  const bp = (this.dist / C.len);
  if (!this.bossDone && this.bossPhase === 'none' && bp >= 0.72) this.startBoss();
  if (this.bossPhase === 'fight') this.updateBossFight(time, dt, delta);
  if (this.bossPhase === 'none' && this.dist >= C.len) this.finish();

  // ---- «мыло» у Бобана ----
  if (C.blur) {
    this.blurOverlay.setAlpha(this.mudUntil > time ? 0.42 : 0.16);
    this.mudOverlay.setAlpha(this.mudUntil > time ? 0.25 : 0);
  }
};

RunnerScene.prototype.pickup = function (it) {
  const C = this.cfg, h = this.hero;
  const good = it.kind !== 'vodka';
  if (it.kind === 'pill') {
    this.sanity = Math.min(C.sanityMax, this.sanity + 22);
    this.floatText(h.x, h.y - 90, 'КУКУХА +22', '#7ee787');
    return;
  }
  if (it.kind === 'kosyak') {
    if (C.id === 'boban') {
      this.marks++;
      this.sanity = Math.min(C.sanityMax, this.sanity + 8);
      if (this.marks > C.overuse) { this.mudUntil = this.time.now + 3000; this.floatText(h.x, h.y - 90, 'ПЕРЕДОЗ', '#ff9944'); }
      else this.floatText(h.x, h.y - 90, 'ТОНУС +', '#7ee787');
    } else {
      h.lives = Math.min(5, h.lives + 1);
      this.floatText(h.x, h.y - 90, 'ЖИЗНЬ +1', '#7ee787');
    }
  }
  if (it.kind === 'vodka') {
    h.lives -= 1;
    this.sanity = Math.max(0, this.sanity - C.sanityFrom);
    this.floatText(h.x, h.y - 90, 'ЖИЗНЬ -1', '#ff4444');
    this.cameras.main.shake(160, 0.01);
  }
  this.score += good ? 10 : -5;
  if (h.lives <= 0) this.gameOver();
};

RunnerScene.prototype.gameOver = function () {
  if (this.done) return;
  this.done = true;
  this.showEnd('САНЁК ДОШЁЛ', 'жизни кончились', false);
};

RunnerScene.prototype.finish = function () {
  if (this.done) return;
  this.done = true;
  this.score += 500;
  this.showEnd(this.cfg.prizeText, this.cfg.prizeSub, true);
  if (this.textures.exists('cat_prize')) {
    const cat = this.add.image(DESIGN_W / 2, 502, 'cat_prize').setDepth(95);
    cat.setDisplaySize(150, 160);
    this.tweens.add({ targets: cat, y: cat.y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
};

/* ---------------- босс ---------------- */
RunnerScene.prototype.startBoss = function () {
  const C = this.cfg, W = DESIGN_W;
  this.bossPhase = 'intro';
  this.hero.x += 0;
  this.boss = { hp: 100, max: 100, x: this.hero.x + 300, y: GROUND_Y - 110, phase: 1, nextAtk: 0 };
  const key = this.textures.exists(C.id === 'sanek' ? 'buhovo_boss' : 'gref_boss') ? (C.id === 'sanek' ? 'buhovo_boss' : 'gref_boss') : 'f_76';
  this.boss.img = this.add.image(this.boss.x, this.boss.y, key).setDepth(6);
  this.world.add(this.boss.img);
  this.boss.img.setDisplaySize(C.id === 'sanek' ? 190 : 150, C.id === 'sanek' ? 190 : 300);
  this.bossName.setText(C.bossName).setVisible(true);
  this.bossHpBg.setVisible(true); this.bossHp.setVisible(true);
  this.toast.setText(C.bossName);
  this.tweens.add({ targets: this.boss.img, y: this.boss.y - 10, duration: 800, yoyo: true, repeat: -1 });
  this.time.delayedCall(1600, () => { this.bossPhase = 'fight'; this.toast.setText('ЖМИ КНОПКУ — БЕЙ!'); this.time.delayedCall(1500, () => this.toast.setText('')); });
};

RunnerScene.prototype.updateBossFight = function (time, dt, delta) {
  const C = this.cfg, b = this.boss, h = this.hero;
  // герой не уходит за экран боя
  const left = this.viewX + 90, right = this.viewX + DESIGN_W * 0.55;
  h.x = Phaser.Math.Clamp(h.x, left, right);
  b.img.x = b.x; b.img.y = b.y;
  this.bossHp.width = 296 * (b.hp / b.max);
  // атаки босса
  if (time > b.nextAtk) {
    b.nextAtk = time + Phaser.Math.Between(1100, 1900);
    const key = C.id === 'sanek' ? 'ic_vodka' : 'ic_pill';
    const bolt = this.add.image(b.x - 60, b.y, key).setDisplaySize(30, 30).setDepth(4);
    this.world.add(bolt);
    this.bolts.push({ img: bolt, vx: -420 });
    this.floatText(b.x, b.y - 90, C.bossTaunts[(b.phase - 1) % C.bossTaunts.length], '#ffdd66');
  }
  // фазы
  const p = b.hp > 66 ? 1 : b.hp > 33 ? 2 : 3;
  if (p !== b.phase) { b.phase = p; b.nextAtk = time + 1400; }
  for (let i = this.bolts.length - 1; i >= 0; i--) {
    const bo = this.bolts[i];
    bo.img.x += bo.vx * dt;
    if (Math.abs(bo.img.x - h.x) < 34 && Math.abs(bo.img.y - (h.y - 25)) < 60) {
      bo.img.destroy(); this.bolts.splice(i, 1);
      h.lives -= 1; this.sanity = Math.max(0, this.sanity - 10);
      this.cameras.main.shake(140, 0.01);
      this.floatText(h.x, h.y - 90, 'ПОПАЛИ', '#ff4444');
      if (h.lives <= 0) this.gameOver();
      continue;
    }
    if (bo.img.x < this.viewX - 100) { bo.img.destroy(); this.bolts.splice(i, 1); }
  }
};

RunnerScene.prototype.bossDefeated = function () {
  const C = this.cfg;
  this.bossDone = true;              // второй раз босс не появится
  this.bossPhase = 'over';
  this.bolts.forEach(b => b.img.destroy()); this.bolts = [];
  this.toast.setText(C.id === 'sanek' ? 'ЛАДНО, ПРИЕЗЖАЙ ЗАВТРА. ТАЧКА ГОТОВА' : 'КУРС ДЕРЖИМ. СХЕМА ЗАКРЫТА');
  this.tweens.killTweensOf(this.boss.img);
  this.tweens.add({ targets: this.boss.img, x: this.boss.img.x + 260, alpha: 0, duration: 1200, onComplete: () => { if (this.boss && this.boss.img.active) this.boss.img.destroy(); } });
  this.bossHpBg.setVisible(false); this.bossHp.setVisible(false); this.bossName.setVisible(false);
  this.score += 300;
  this.time.delayedCall(1400, () => { this.toast.setText(''); this.dist = C.len - 400; this.bossPhase = 'none'; });
};

/* ---------------- финальный экран ---------------- */
RunnerScene.prototype.showEnd = function (title, sub, win) {
  const W = DESIGN_W, H = DESIGN_H;
  this.overlay = this.add.rectangle(0, 0, W * 3, H * 3, 0x05050f, 0.72).setDepth(90).setScrollFactor(0);
  this.add.text(W / 2, 250, title, { fontFamily: 'Arial', fontSize: '30px', color: win ? '#ffd93d' : '#ff6666', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(95).setScrollFactor(0);
  this.add.text(W / 2, 296, sub, { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setDepth(95).setScrollFactor(0);
  this.add.text(W / 2, 340, 'ОЧКИ: ' + this.score, { fontFamily: 'Arial', fontSize: '22px', color: '#00e5ff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(95).setScrollFactor(0);
  const key = 'vasa_best_' + this.cfg.id, best = +(localStorage.getItem(key) || 0);
  if (this.score > best) { localStorage.setItem(key, String(this.score)); this.add.text(W / 2, 372, 'НОВЫЙ РЕКОРД!', { fontFamily: 'Arial', fontSize: '16px', color: '#7ee787' }).setOrigin(0.5).setDepth(95).setScrollFactor(0); }
  this.endBtns = [];
  const mkBtn = (y, label, color, cb) => {
    const r = this.add.rectangle(W / 2, y, 260, 62, color, 0.9).setStrokeStyle(3, 0xffffff).setDepth(95).setScrollFactor(0);
    const t = this.add.text(W / 2, y, label, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(96).setScrollFactor(0);
    this.endBtns.push({ x: W / 2, y: y, w: 260, h: 62, cb: cb });
  };
  const next = this.cfg.id === 'sanek' ? 'boban' : 'sanek';
  if (win) mkBtn(H - 220, this.cfg.id === 'sanek' ? 'ДАЛЬШЕ: БОБАН →' : 'ЗА САНЬКА →', 0x00a86b, () => this.scene.start('RunnerScene', { level: next }));
  mkBtn(H - 150, 'ПОВТОРИТЬ', 0x2b6cb0, () => this.scene.start('RunnerScene', { level: this.cfg.id }));
  mkBtn(H - 80, 'В МЕНЮ', 0x444455, () => this.scene.start('MenuScene'));
};
