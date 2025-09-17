(() => {
  const gameEl    = document.getElementById('game');
  const playerEl  = document.getElementById('player');
  const scoreEl   = document.getElementById('score');
  const overlay   = document.getElementById('overlay');
  const neighSfx  = document.getElementById('neigh');
  const gallopBgm = document.getElementById('gallop');
  const musicBgm  = document.getElementById('music');

  const GROUND_Y = 70;
  const GRAVITY  = 2200;
  const JUMP_VY  = 760;
  const BASE_SPEED = 360;
  const SPEED_INCREASE = 0.05;
  const SPAWN_MIN = 0.9;
  const SPAWN_MAX = 1.8;
  const PLAYER = { w: 100, h: 100, x: 64 };  // bigger player

  let running = false;
  let gameOver = false;
  let vy = 0;
  let y = 0;
  let canJump = true;
  let lastT = 0;
  let speed = BASE_SPEED;
  let score = 0;
  let jumps = 0;
  let obstacles = [];
  let spawnT = 0;
  let nextSpawnIn = randRange(SPAWN_MIN, SPAWN_MAX);

  function randRange(a, b){ return a + Math.random() * (b - a); }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function reset() {
    running = false;
    gameOver = false;
    vy = 0;
    y = 0;
    canJump = true;
    lastT = 0;
    speed = BASE_SPEED;
    score = 0;
    jumps = 0;
    spawnT = 0;
    nextSpawnIn = randRange(SPAWN_MIN, SPAWN_MAX);

    obstacles.forEach(o => o.el.remove());
    obstacles = [];

    scoreEl.textContent = '0';
    playerEl.style.transform = `translateY(0px)`;

    overlay.classList.add('show');
    overlay.innerHTML = `
      <h1>Press <kbd>Space</kbd> to Jump</h1>
      <p>Avoid the jumps. Every 5 jumps: neigh! 🐴</p>
      <small>Press <kbd>Enter</kbd> or click to start</small>
    `;

    gallopBgm.pause(); gallopBgm.currentTime = 0;
    musicBgm.pause();  musicBgm.currentTime = 0;
  }

  function start() {
    if (running) return;
    overlay.classList.remove('show');
    running = true;
    gameOver = false;
    lastT = performance.now();

    gallopBgm.play().catch(()=>{});
    musicBgm.play().catch(()=>{});

    requestAnimationFrame(loop);
  }

  function end() {
    running = false;
    gameOver = true;

    overlay.classList.add('show');
    overlay.innerHTML = `
      <h1>Game Over</h1>
      <p class="final">Score: <strong>${Math.floor(score)}</strong></p>
      <small>Press <kbd>Enter</kbd> or click to restart</small>
    `;

    gallopBgm.pause();
    musicBgm.pause();
  }

  function playNeigh() {
    try {
      const a = neighSfx.cloneNode(true);
      a.currentTime = 0;
      a.play().catch(()=>{});
    } catch {}
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.keyCode === 32) e.preventDefault();

    if ((e.code === 'Enter' || e.key === 'Enter') && overlay.classList.contains('show')) {
      reset();
      start();
      return;
    }

    if ((e.code === 'Space' || e.keyCode === 32) && overlay.classList.contains('show')) {
      reset();
      start();
      return;
    }

    if ((e.code === 'Space' || e.keyCode === 32) && running) {
      if (canJump) {
        vy = JUMP_VY;
        canJump = false;
        jumps++;
        if (jumps % 5 === 0) playNeigh();
      }
    }
  }, { passive:false });

  overlay.addEventListener('click', () => {
    reset();
    start();
  });

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.032, (t - lastT) / 1000);
    lastT = t;

    speed += SPEED_INCREASE * dt * 60;
    score += dt * Math.round(speed * 0.3);
    scoreEl.textContent = Math.floor(score);

    vy -= GRAVITY * dt;
    y += vy * dt;
    if (y <= 0) { y = 0; vy = 0; canJump = true; }
    playerEl.style.transform = `translateY(${-y}px)`;

    spawnT += dt;
    if (spawnT >= nextSpawnIn) {
      spawnT = 0;
      nextSpawnIn = randRange(SPAWN_MIN, SPAWN_MAX) * clamp(1.0 - (speed - BASE_SPEED)/900, 0.5, 1.0);
      spawnObstacle();
    }

    const pxLeft   = PLAYER.x + 10;
    const pxRight  = PLAYER.x + PLAYER.w - 10;
    const pxTop    = GROUND_Y + y + 10;
    const pxBottom = GROUND_Y + y + PLAYER.h - 10;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt;
      o.el.style.left = `${o.x}px`;

      const insetW = o.w * 0.15;
      const insetH = o.h * 0.15;
      const ox1 = o.x + insetW;
      const ox2 = o.x + o.w - insetW;
      const oy1 = GROUND_Y + insetH;
      const oy2 = GROUND_Y + o.h - insetH;

      const intersects =
        pxRight > ox1 && pxLeft < ox2 &&
        pxBottom > oy1 && pxTop < oy2;

      if (intersects) { end(); return; }

      if (o.x + o.w < -80) {
        o.el.remove();
        obstacles.splice(i, 1);
      }
    }

    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const el = document.createElement('div');
    el.className = 'obstacle';
    const w = 70;
    const h = 80;
    const startX = gameEl.clientWidth + 20;
    el.style.left = `${startX}px`;
    gameEl.appendChild(el);
    obstacles.push({ el, x: startX, w, h });
  }

  reset();
})();
