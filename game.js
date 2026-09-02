(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const startScreen = document.getElementById('start-screen');
  const pauseScreen = document.getElementById('pause-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');
  const bestScoreEl = document.getElementById('best-score');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  const BEST_SCORE_KEY = 'nebula-runner-best-score';

  const STATE = { START: 'start', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };
  let state = STATE.START;

  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'KeyP' && (state === STATE.PLAYING || state === STATE.PAUSED)) {
      togglePause();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  function isDown(...codes) {
    return codes.some((c) => keys.has(c));
  }

  // ---------- Audio (simple synthesized SFX, no external assets) ----------
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }
  function beep({ freq = 440, duration = 0.08, type = 'square', volume = 0.05, slide = 0 }) {
    const ac = ensureAudio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, ac.currentTime + duration);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }
  const sfx = {
    shoot: () => beep({ freq: 720, duration: 0.06, type: 'square', volume: 0.04, slide: 300 }),
    enemyShoot: () => beep({ freq: 260, duration: 0.08, type: 'sawtooth', volume: 0.03, slide: -80 }),
    explosion: () => beep({ freq: 140, duration: 0.25, type: 'triangle', volume: 0.08, slide: -100 }),
    hit: () => beep({ freq: 90, duration: 0.3, type: 'sawtooth', volume: 0.09, slide: -60 }),
  };

  // ---------- Utility ----------
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ---------- Starfield (parallax background) ----------
  class Starfield {
    constructor() {
      this.layers = [
        { speed: 20, size: 1, count: 80, color: 'rgba(255,255,255,0.4)', stars: [] },
        { speed: 45, size: 1.5, count: 50, color: 'rgba(180,210,255,0.6)', stars: [] },
        { speed: 90, size: 2, count: 30, color: 'rgba(200,230,255,0.9)', stars: [] },
      ];
      for (const layer of this.layers) {
        for (let i = 0; i < layer.count; i++) {
          layer.stars.push({ x: rand(0, W), y: rand(0, H) });
        }
      }
    }
    update(dt) {
      for (const layer of this.layers) {
        for (const s of layer.stars) {
          s.x -= layer.speed * dt;
          if (s.x < 0) {
            s.x = W;
            s.y = rand(0, H);
          }
        }
      }
    }
    draw() {
      for (const layer of this.layers) {
        ctx.fillStyle = layer.color;
        for (const s of layer.stars) {
          ctx.fillRect(s.x, s.y, layer.size, layer.size);
        }
      }
    }
  }

  // ---------- Particles (explosions) ----------
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 220);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = rand(0.3, 0.7);
      this.maxLife = this.life;
      this.color = color;
      this.size = rand(1.5, 3.5);
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.life -= dt;
      return this.life > 0;
    }
    draw() {
      const alpha = clamp(this.life / this.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Entities ----------
  class Bullet {
    constructor(x, y, vx, w = 10, h = 3, color = '#7fe3ff') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.w = w;
      this.h = h;
      this.color = color;
      this.dead = false;
    }
    update(dt) {
      this.x += this.vx * dt;
      if (this.x < -20 || this.x > W + 20) this.dead = true;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.shadowBlur = 0;
    }
  }

  class Player {
    constructor() {
      this.w = 44;
      this.h = 22;
      this.x = 90;
      this.y = H / 2 - this.h / 2;
      this.speed = 320;
      this.cooldown = 0;
      this.fireRate = 0.18;
      this.invuln = 0;
      this.thrust = 0;
    }
    get hitbox() {
      return { x: this.x + 6, y: this.y + 5, w: this.w - 16, h: this.h - 10 };
    }
    update(dt) {
      let dx = 0;
      let dy = 0;
      if (isDown('ArrowUp', 'KeyW', 'KeyZ')) dy -= 1;
      if (isDown('ArrowDown', 'KeyS')) dy += 1;
      if (isDown('ArrowLeft', 'KeyA', 'KeyQ')) dx -= 1;
      if (isDown('ArrowRight', 'KeyD')) dx += 1;
      this.thrust = dx > 0 ? 1 : 0;

      const len = Math.hypot(dx, dy) || 1;
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
      this.x = clamp(this.x, 4, W - this.w - 4);
      this.y = clamp(this.y, 4, H - this.h - 4);

      this.cooldown -= dt;
      if (isDown('Space') && this.cooldown <= 0) {
        this.shoot();
        this.cooldown = this.fireRate;
      }

      if (this.invuln > 0) this.invuln -= dt;
    }
    shoot() {
      const y = this.y + this.h / 2 - 1.5;
      bullets.push(new Bullet(this.x + this.w, y, 640));
      sfx.shoot();
    }
    hit() {
      if (this.invuln > 0) return false;
      this.invuln = 1.6;
      return true;
    }
    draw() {
      if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;
      const x = this.x;
      const y = this.y;
      // engine flame
      const flameLen = 10 + Math.sin(performance.now() / 40) * 4 + (this.thrust ? 6 : 0);
      ctx.fillStyle = '#ff9d3c';
      ctx.beginPath();
      ctx.moveTo(x, y + this.h * 0.3);
      ctx.lineTo(x - flameLen, y + this.h / 2);
      ctx.lineTo(x, y + this.h * 0.7);
      ctx.closePath();
      ctx.fill();

      // hull
      ctx.fillStyle = '#8fe8ff';
      ctx.beginPath();
      ctx.moveTo(x + this.w, y + this.h / 2);
      ctx.lineTo(x + this.w * 0.55, y);
      ctx.lineTo(x, y + this.h * 0.25);
      ctx.lineTo(x + this.w * 0.2, y + this.h / 2);
      ctx.lineTo(x, y + this.h * 0.75);
      ctx.lineTo(x + this.w * 0.55, y + this.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#245a7a';
      ctx.fillRect(x + this.w * 0.35, y + this.h * 0.35, this.w * 0.3, this.h * 0.3);
    }
  }

  const ENEMY_TYPES = {
    grunt: { w: 34, h: 24, hp: 1, speed: 140, score: 100, color: '#ff5d7a', shootChance: 0.35 },
    wave: { w: 30, h: 26, hp: 2, speed: 160, score: 200, color: '#ffcf5c', shootChance: 0.5 },
    tank: { w: 44, h: 36, hp: 4, speed: 90, score: 350, color: '#c07bff', shootChance: 0.7 },
  };

  class Enemy {
    constructor(type, x, y) {
      const def = ENEMY_TYPES[type];
      this.type = type;
      this.def = def;
      this.w = def.w;
      this.h = def.h;
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.hp = def.hp;
      this.speed = def.speed * rand(0.85, 1.15);
      this.t = rand(0, Math.PI * 2);
      this.shootTimer = rand(0.6, 1.8);
      this.dead = false;
    }
    update(dt) {
      this.t += dt;
      this.x -= this.speed * dt;
      if (this.type === 'wave') {
        this.y = this.baseY + Math.sin(this.t * 3) * 60;
      } else if (this.type === 'tank') {
        this.y = this.baseY + Math.sin(this.t * 1.2) * 20;
      }
      this.y = clamp(this.y, 4, H - this.h - 4);

      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && this.x < W - 40 && this.x > 40) {
        this.shootTimer = rand(1.2, 2.4);
        if (Math.random() < this.def.shootChance) {
          enemyBullets.push(new Bullet(this.x, this.y + this.h / 2 - 1.5, -360, 10, 3, '#ff5d7a'));
          sfx.enemyShoot();
        }
      }

      if (this.x < -this.w - 10) this.dead = true;
    }
    get hitbox() {
      return { x: this.x + 3, y: this.y + 3, w: this.w - 6, h: this.h - 6 };
    }
    takeHit() {
      this.hp -= 1;
      return this.hp <= 0;
    }
    draw() {
      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w * 0.35, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h * 0.2);
      ctx.lineTo(this.x + this.w, this.y + this.h * 0.8);
      ctx.lineTo(this.x + this.w * 0.35, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(this.x + this.w * 0.3, this.y + this.h * 0.35, this.w * 0.3, this.h * 0.3);
    }
  }

  // ---------- Game state containers ----------
  let player, bullets, enemyBullets, enemies, particles, starfield;
  let score = 0;
  let lives = 3;
  let spawnTimer = 0;
  let difficultyTimer = 0;
  let spawnInterval = 1.4;
  let lastTime = 0;

  function resetGame() {
    player = new Player();
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    starfield = new Starfield();
    score = 0;
    lives = 3;
    spawnTimer = 0;
    difficultyTimer = 0;
    spawnInterval = 1.4;
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = `Score : ${score}`;
    livesEl.textContent = `Vies : ${'❤️'.repeat(Math.max(lives, 0))}`;
  }

  function spawnEnemy() {
    const roll = Math.random();
    let type = 'grunt';
    if (roll > 0.85) type = 'tank';
    else if (roll > 0.55) type = 'wave';
    const def = ENEMY_TYPES[type];
    const y = rand(20, H - def.h - 20);
    enemies.push(new Enemy(type, W + def.w, y));
  }

  function spawnExplosion(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
  }

  function togglePause() {
    if (state === STATE.PLAYING) {
      state = STATE.PAUSED;
      pauseScreen.classList.remove('hidden');
    } else if (state === STATE.PAUSED) {
      state = STATE.PLAYING;
      pauseScreen.classList.add('hidden');
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function startGame() {
    ensureAudio();
    resetGame();
    state = STATE.PLAYING;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame() {
    state = STATE.OVER;
    const best = Math.max(score, Number(localStorage.getItem(BEST_SCORE_KEY) || 0));
    localStorage.setItem(BEST_SCORE_KEY, String(best));
    finalScoreEl.textContent = `Score final : ${score}`;
    bestScoreEl.textContent = `Meilleur score : ${best}`;
    gameOverScreen.classList.remove('hidden');
  }

  // ---------- Main update/draw ----------
  function update(dt) {
    starfield.update(dt);
    player.update(dt);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = spawnInterval;
    }
    difficultyTimer += dt;
    if (difficultyTimer > 8) {
      difficultyTimer = 0;
      spawnInterval = Math.max(0.5, spawnInterval - 0.12);
    }

    for (const b of bullets) b.update(dt);
    for (const b of enemyBullets) b.update(dt);
    for (const e of enemies) e.update(dt);
    particles = particles.filter((p) => p.update(dt));

    // player bullets vs enemies
    for (const b of bullets) {
      if (b.dead) continue;
      for (const e of enemies) {
        if (e.dead) continue;
        if (rectsOverlap({ x: b.x, y: b.y, w: b.w, h: b.h }, e.hitbox)) {
          b.dead = true;
          if (e.takeHit()) {
            e.dead = true;
            score += e.def.score;
            updateHud();
            spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.def.color);
            sfx.explosion();
          }
          break;
        }
      }
    }

    // enemy bullets vs player
    if (player.invuln <= 0) {
      for (const b of enemyBullets) {
        if (b.dead) continue;
        if (rectsOverlap({ x: b.x, y: b.y, w: b.w, h: b.h }, player.hitbox)) {
          b.dead = true;
          damagePlayer();
          break;
        }
      }
      // enemy body collision
      for (const e of enemies) {
        if (e.dead) continue;
        if (rectsOverlap(player.hitbox, e.hitbox)) {
          e.dead = true;
          spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.def.color);
          damagePlayer();
        }
      }
    }

    bullets = bullets.filter((b) => !b.dead);
    enemyBullets = enemyBullets.filter((b) => !b.dead);
    enemies = enemies.filter((e) => !e.dead);
  }

  function damagePlayer() {
    if (!player.hit()) return;
    lives -= 1;
    updateHud();
    spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, '#8fe8ff', 24);
    sfx.hit();
    if (lives <= 0) {
      spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 40);
      endGame();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050414');
    grad.addColorStop(1, '#0a0f2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    starfield.draw();
    for (const b of bullets) b.draw();
    for (const b of enemyBullets) b.draw();
    for (const e of enemies) e.draw();
    player.draw();
    for (const p of particles) p.draw();
  }

  function loop(now) {
    if (state !== STATE.PLAYING) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // Render an idle starfield behind the start screen
  (function idlePreview() {
    starfield = new Starfield();
    let t0 = performance.now();
    function frame(t) {
      const dt = Math.min((t - t0) / 1000, 0.05);
      t0 = t;
      if (state === STATE.START) {
        starfield.update(dt);
        ctx.clearRect(0, 0, W, H);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#050414');
        grad.addColorStop(1, '#0a0f2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        starfield.draw();
      }
      if (state === STATE.START || state === STATE.OVER) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  })();
})();
