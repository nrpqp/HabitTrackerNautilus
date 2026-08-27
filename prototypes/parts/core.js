/* ============================================================
   Nautilus FX Lab — core engine
   Geometría calcada de src/utils/svg.js + src/constants.js.
   Diferencia clave con la app actual: el SVG se construye UNA vez
   con la DOM API y después sólo se mutan atributos. Nada de
   innerHTML replace — así ninguna animación en curso se destruye.
   ============================================================ */
const FX = (() => {

  // ── Config (idéntica a src/constants.js) ──────────────────
  const CFG = {
    DAYS: 21,
    startAngle: -90,
    sweep: 300,
    innerR: 60,
    cell: 24,
    gap: 3,
    pad: 40,
  };
  const DEG = Math.PI / 180;

  const ELEMENTS = [
    { id:'fire',      name:'Fuego',  icon:'🔥', h0:10,  s0:70, l0:55, h1:35,  s1:100, l1:48, rgb:[255,107,53],  shape:'spark',   speed:1.5,  gravity:0.07,  up:true  },
    { id:'water',     name:'Agua',   icon:'💧', h0:200, s0:55, l0:60, h1:195, s1:90,  l1:38, rgb:[0,180,216],   shape:'ripple',  speed:0.9,  gravity:-0.02, up:false },
    { id:'plant',     name:'Planta', icon:'🌿', h0:140, s0:45, l0:55, h1:120, s1:80,  l1:33, rgb:[82,183,136],  shape:'leaf',    speed:0.8,  gravity:-0.03, up:false },
    { id:'lightning', name:'Rayo',   icon:'⚡', h0:48,  s0:80, l0:60, h1:55,  s1:100, l1:50, rgb:[255,214,10],  shape:'bolt',    speed:3.0,  gravity:0,     up:false },
    { id:'ice',       name:'Hielo',  icon:'❄️', h0:195, s0:40, l0:75, h1:190, s1:70,  l1:55, rgb:[168,218,220], shape:'crystal', speed:0.7,  gravity:0.02,  up:false },
    { id:'earth',     name:'Tierra', icon:'🪨', h0:30,  s0:45, l0:55, h1:25,  s1:65,  l1:35, rgb:[196,154,108], shape:'chunk',   speed:1.1,  gravity:0.18,  up:false },
    { id:'air',       name:'Aire',   icon:'💨', h0:270, s0:40, l0:75, h1:265, s1:65,  l1:55, rgb:[199,125,255], shape:'swirl',   speed:0.65, gravity:-0.04, up:false },
  ];
  const byId = (id) => ELEMENTS.find(e => e.id === id) || ELEMENTS[0];

  // ── Geometría ─────────────────────────────────────────────
  function metrics(n) {
    n = Math.max(1, n);
    const outerR = CFG.innerR + n * CFG.cell + (n - 1) * CFG.gap;
    const size = (outerR + CFG.pad) * 2;
    return { outerR, size, cx: size / 2, cy: size / 2 };
  }

  function polar(cx, cy, r, deg) {
    const a = deg * DEG;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function sector(cx, cy, ri, ro, a0, a1) {
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sw = a1 > a0 ? 1 : 0;
    const p0o = polar(cx, cy, ro, a0), p1o = polar(cx, cy, ro, a1);
    const p1i = polar(cx, cy, ri, a1), p0i = polar(cx, cy, ri, a0);
    return `M ${p0o.x} ${p0o.y} A ${ro} ${ro} 0 ${large} ${sw} ${p1o.x} ${p1o.y} ` +
           `L ${p1i.x} ${p1i.y} A ${ri} ${ri} 0 ${large} ${sw ^ 1} ${p0i.x} ${p0i.y} Z`;
  }

  function elColor(elId, day, dl = 0) {
    const e = byId(elId);
    const t = day / (CFG.DAYS - 1);
    const h = e.h0 + (e.h1 - e.h0) * t;
    const s = e.s0 + (e.s1 - e.s0) * t;
    const l = Math.max(0, Math.min(100, e.l0 + (e.l1 - e.l0) * t + dl));
    return `hsl(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%)`;
  }

  function elRGB(elId, day) {
    // Aproximación RGB del color interpolado, para el canvas.
    const e = byId(elId);
    const t = day / (CFG.DAYS - 1);
    const h = (e.h0 + (e.h1 - e.h0) * t) / 360;
    const s = (e.s0 + (e.s1 - e.s0) * t) / 100;
    const l = (e.l0 + (e.l1 - e.l0) * t) / 100;
    const q = l < .5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (tc) => {
      tc = (tc + 1) % 1;
      if (tc < 1/6) return p + (q - p) * 6 * tc;
      if (tc < 1/2) return q;
      if (tc < 2/3) return p + (q - p) * (2/3 - tc) * 6;
      return p;
    };
    return [Math.round(f(h + 1/3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1/3) * 255)];
  }

  // ── Detección de capacidades y tier ───────────────────────
  // Tier 0 · Calma   → sin movimiento (reduced-motion / save-data)
  // Tier 1 · Lite    → sólo CSS transform/opacity, sin canvas pesado
  // Tier 2 · Estándar→ canvas 2D + blending aditivo, presupuesto medio
  // Tier 3 · Máximo  → todo, con presupuestos altos y capas extra
  const caps = (() => {
    const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
    return {
      reducedMotion: mm('(prefers-reduced-motion: reduce)'),
      hover: mm('(hover: hover)'),
      coarse: mm('(pointer: coarse)'),
      cores: navigator.hardwareConcurrency || null,
      memory: navigator.deviceMemory || null,
      dpr: Math.min(window.devicePixelRatio || 1, 3),
      saveData: !!(navigator.connection && navigator.connection.saveData),
      vibrate: typeof navigator.vibrate === 'function',
      gyro: typeof window.DeviceOrientationEvent !== 'undefined',
      gyroNeedsPermission: typeof window.DeviceOrientationEvent !== 'undefined' &&
                           typeof window.DeviceOrientationEvent.requestPermission === 'function',
      touch: navigator.maxTouchPoints > 0,
    };
  })();

  function autoTier() {
    if (caps.reducedMotion || caps.saveData) return 0;
    let score = 2;
    if (caps.cores !== null) {
      if (caps.cores >= 8) score += 1;
      else if (caps.cores <= 4) score -= 1;
    }
    if (caps.memory !== null) {
      if (caps.memory >= 8) score += 1;
      else if (caps.memory <= 4) score -= 1;
    }
    // Sin deviceMemory (Safari/Firefox) y pantalla táctil → asumir gama media.
    if (caps.memory === null && caps.coarse) score -= 1;
    return Math.max(1, Math.min(3, score));
  }

  const TIER_NAMES = ['Calma', 'Lite', 'Estándar', 'Máximo'];

  const tier = {
    auto: autoTier(),
    value: autoTier(),
    forced: false,
    listeners: [],
    set(v, forced = true) {
      this.value = Math.max(0, Math.min(3, v));
      this.forced = forced;
      document.documentElement.dataset.tier = this.value;
      this.listeners.forEach(fn => fn(this.value));
      const b = document.querySelector('.tier-badge');
      if (b) {
        b.dataset.tier = this.value;
        b.textContent = `T${this.value} · ${TIER_NAMES[this.value]}${this.forced ? '' : ' (auto)'}`;
      }
    },
    onChange(fn) { this.listeners.push(fn); },
    // Presupuesto de partículas por burst, escalado por tier.
    budget(base) { return Math.round(base * [0, .35, 1, 1.8][this.value]); },
  };

  // Gobernador de FPS: si el dispositivo no sostiene ~50fps, baja un tier.
  function startGovernor(onDowngrade) {
    if (tier.value === 0) return;
    let frames = 0, t0 = performance.now(), strikes = 0;
    function tick(t) {
      frames++;
      if (t - t0 >= 1000) {
        const fps = frames * 1000 / (t - t0);
        frames = 0; t0 = t;
        if (fps < 46) strikes++; else strikes = Math.max(0, strikes - 1);
        if (strikes >= 3 && !tier.forced && tier.value > 1) {
          tier.set(tier.value - 1, false);
          strikes = 0;
          if (onDowngrade) onDowngrade(fps);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Háptica (Android/Chrome; iOS Safari no expone vibrate) ─
  const haptics = {
    enabled: true,
    tap()      { this.go(12); },
    success()  { this.go([14, 40, 26]); },
    milestone(){ this.go([18, 50, 18, 50, 60]); },
    denied()   { this.go([8, 30, 8]); },
    go(pattern) {
      if (!this.enabled || !caps.vibrate || tier.value === 0) return;
      try { navigator.vibrate(pattern); } catch (_) {}
    },
  };

  // ── Canvas con DPR correcto ───────────────────────────────
  function makeCanvas(host) {
    const c = document.createElement('canvas');
    c.className = 'fx';
    host.appendChild(c);
    const ctx = c.getContext('2d');
    let w = 0, h = 0;
    function fit() {
      const r = host.getBoundingClientRect();
      // Cap del DPR a 2: en pantallas 3x el coste de fill-rate se dispara
      // sin ganancia perceptible para partículas difusas.
      const d = Math.min(window.devicePixelRatio || 1, tier.value >= 3 ? 2 : 1.5);
      w = r.width; h = r.height;
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host);
    else window.addEventListener('resize', fit);
    return { el: c, ctx, fit, get w() { return w; }, get h() { return h; } };
  }

  // ── Nautilus: construcción una vez, mutación después ───────
  class Nautilus {
    constructor(host, habits, opts = {}) {
      this.host = host;
      this.habits = habits;
      this.opts = opts;
      this.m = metrics(habits.length);
      this.cells = [];      // [habitIdx][day] -> <path>
      this.rings = [];      // [habitIdx] -> {rIn, rOut, rMid, g}
      this.build();
    }

    // Ángulos de cada día (idénticos a render/svg.js)
    static angles() {
      const step = CFG.sweep / CFG.DAYS;
      const cellA = step - Math.max(0.0001, step * 0.08);
      const arcGap = step - cellA;
      return Array.from({ length: CFG.DAYS }, (_, d) => {
        const a0 = CFG.startAngle + d * step + arcGap / 2;
        return { a0, a1: a0 + cellA, mid: a0 + cellA / 2, day: d + 1 };
      });
    }

    build() {
      const { size, cx, cy, outerR } = this.m;
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      this.svg = svg;
      this.NS = NS;
      const angles = Nautilus.angles();
      this.angles = angles;

      this.defs = document.createElementNS(NS, 'defs');
      svg.appendChild(this.defs);

      // Capa de fondo para efectos que viven dentro del SVG
      this.underlay = document.createElementNS(NS, 'g');
      this.underlay.setAttribute('class', 'underlay');
      svg.appendChild(this.underlay);

      // Guías centrales
      const g1 = document.createElementNS(NS, 'circle');
      g1.setAttribute('cx', cx); g1.setAttribute('cy', cy);
      g1.setAttribute('r', CFG.innerR - 12);
      g1.setAttribute('fill', 'none');
      g1.setAttribute('stroke', 'var(--guide-stroke)');
      svg.appendChild(g1);

      const core = document.createElementNS(NS, 'circle');
      core.setAttribute('cx', cx); core.setAttribute('cy', cy);
      core.setAttribute('r', CFG.innerR - 8);
      core.setAttribute('fill', 'var(--center-fill)');
      core.setAttribute('stroke', 'var(--center-stroke)');
      core.setAttribute('stroke-width', '1.2');
      core.setAttribute('class', 'core');
      svg.appendChild(core);
      this.core = core;

      // Anillos
      this.habits.forEach((habit, hi) => {
        const rOut = CFG.innerR + (hi + 1) * CFG.cell + hi * CFG.gap;
        const rIn = rOut - CFG.cell;
        const rMid = rIn + CFG.cell / 2;
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'ring');
        g.dataset.habit = hi;
        this.rings.push({ rIn, rOut, rMid, g });
        this.cells.push([]);

        angles.forEach(({ a0, a1 }, d) => {
          const p = document.createElementNS(NS, 'path');
          p.setAttribute('d', sector(cx, cy, rIn, rOut, a0, a1));
          p.setAttribute('class', 'day-cell');
          p.dataset.habit = hi;
          p.dataset.day = d;
          p.style.transformBox = 'fill-box';
          p.style.transformOrigin = 'center';
          p.addEventListener('click', (e) => this.click(e, hi, d));
          g.appendChild(p);
          this.cells[hi].push(p);
        });

        svg.appendChild(g);

        // Etiqueta curva en el hueco de 60°
        const arcR = rIn + 2;
        const s = polar(cx, cy, arcR, 210), e = polar(cx, cy, arcR, 270);
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('id', `arc-${hi}`);
        path.setAttribute('d', `M ${s.x} ${s.y} A ${arcR} ${arcR} 0 0 1 ${e.x} ${e.y}`);
        path.setAttribute('fill', 'none');
        this.defs.appendChild(path);

        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('font-size', Math.max(9, Math.floor(CFG.innerR * .2)));
        txt.setAttribute('font-weight', '600');
        txt.setAttribute('fill', elColor(habit.element, 10));
        txt.setAttribute('pointer-events', 'none');
        txt.dataset.label = hi;
        const tp = document.createElementNS(NS, 'textPath');
        tp.setAttribute('href', `#arc-${hi}`);
        tp.setAttribute('startOffset', '50%');
        tp.setAttribute('text-anchor', 'middle');
        tp.textContent = habit.name;
        txt.appendChild(tp);
        svg.appendChild(txt);
      });

      // Capa por encima de las celdas para ondas, cometas, etc.
      this.overlay = document.createElementNS(NS, 'g');
      this.overlay.setAttribute('class', 'overlay');
      this.overlay.setAttribute('pointer-events', 'none');
      svg.appendChild(this.overlay);

      // Números de día
      const labelR = outerR + 16;
      angles.forEach(({ mid, day }) => {
        const p = polar(cx, cy, labelR, mid);
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', p.x); t.setAttribute('y', p.y);
        t.setAttribute('font-size', '13');
        t.setAttribute('font-weight', '700');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('fill', 'var(--day-label-fill)');
        t.setAttribute('class', 'day-num');
        t.textContent = day;
        svg.appendChild(t);
      });

      this.host.appendChild(svg);
      this.paint();
    }

    todayIndex(hi) {
      const p = this.habits[hi].progress;
      const i = p.indexOf(false);
      return i === -1 ? CFG.DAYS - 1 : i;
    }

    // Sólo muta atributos — nunca reconstruye el DOM.
    paint() {
      this.habits.forEach((habit, hi) => {
        const today = this.todayIndex(hi);
        this.cells[hi].forEach((p, d) => {
          const done = habit.progress[d];
          const locked = d > today;
          if (done) {
            p.setAttribute('fill', elColor(habit.element, d));
            p.setAttribute('stroke', elColor(habit.element, d, -12));
            p.setAttribute('stroke-width', '1.5');
          } else if (locked) {
            p.setAttribute('fill', 'var(--locked-cell-fill)');
            p.setAttribute('stroke', 'var(--locked-cell-stroke)');
            p.setAttribute('stroke-width', '.6');
          } else {
            p.setAttribute('fill', 'var(--empty-cell-fill)');
            p.setAttribute('stroke', 'var(--empty-cell-stroke)');
            p.setAttribute('stroke-width', '.8');
          }
          p.classList.toggle('locked', locked);
          p.classList.toggle('done', done);
          p.classList.toggle('is-today', d === today && !done);
          const phase = d < 7 ? 1 : d < 14 ? 2 : 3;
          p.dataset.phase = done ? phase : '';
        });
        const label = this.svg.querySelector(`text[data-label="${hi}"]`);
        if (label) label.setAttribute('fill', elColor(habit.element, 10));
      });
      if (this.opts.onPaint) this.opts.onPaint(this);
    }

    click(e, hi, d) {
      const today = this.todayIndex(hi);
      if (d > today) {
        if (this.opts.onDenied) this.opts.onDenied(e, hi, d);
        haptics.denied();
        return;
      }
      const prev = this.habits[hi].progress[d];
      this.habits[hi].progress[d] = !prev;
      this.paint();
      if (this.opts.onCell) this.opts.onCell(e, hi, d, prev);
    }

    setElement(hi, elId) {
      this.habits[hi].element = elId;
      this.paint();
    }

    // Centro de una celda, en coordenadas SVG.
    cellCenter(hi, d) {
      const { cx, cy } = this.m;
      const { rMid } = this.rings[hi];
      return polar(cx, cy, rMid, this.angles[d].mid);
    }

    // Centro de una celda, en píxeles CSS relativos al host.
    cellCenterPx(hi, d) {
      const c = this.cellCenter(hi, d);
      return this.toPx(c.x, c.y);
    }

    toPx(x, y) {
      const r = this.host.getBoundingClientRect();
      const k = r.width / this.m.size;
      return { x: x * k, y: y * k, k };
    }

    centerPx() { return this.toPx(this.m.cx, this.m.cy); }

    // Fracción del reto completada (0..1) sumando todos los hábitos.
    completion() {
      let done = 0, total = 0;
      this.habits.forEach(h => {
        total += CFG.DAYS;
        done += h.progress.filter(Boolean).length;
      });
      return total ? done / total : 0;
    }

    // Racha actual del hábito: días consecutivos completados hasta hoy.
    streak(hi) {
      const p = this.habits[hi].progress;
      let n = 0;
      for (let i = 0; i < p.length; i++) { if (p[i]) n++; else break; }
      return n;
    }
  }

  // ── Sistema de partículas compartido ──────────────────────
  class Particles {
    constructor(canvas, opts = {}) {
      this.cv = canvas;
      this.list = [];
      this.raf = null;
      this.additive = opts.additive !== false;
      this.trails = !!opts.trails;
      this.max = opts.max || 400;
      this.draw = opts.draw || null;   // (ctx, p) => void
      this.step = opts.step || null;   // (p) => void
    }

    emit(n, factory) {
      const room = this.max - this.list.length;
      n = Math.min(n, Math.max(0, room));
      for (let i = 0; i < n; i++) this.list.push(factory(i, n));
      this.start();
    }

    start() {
      if (!this.raf) this.raf = requestAnimationFrame(this.frame.bind(this));
    }

    clear() {
      this.list.length = 0;
      this.cv.ctx.clearRect(0, 0, this.cv.w, this.cv.h);
    }

    frame() {
      const { ctx, w, h } = this.cv;
      if (this.trails) {
        // Rastro: en vez de borrar, oscurecemos lo anterior.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = this.additive ? 'lighter' : 'source-over';

      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.life++;
        // life negativo = retardo de entrada; la partícula existe pero aún no actúa.
        if (p.life < 0) continue;
        if (this.step) this.step(p);
        else {
          p.x += p.vx; p.y += p.vy;
          p.vy += p.g || 0;
          p.vx *= p.drag || 1; p.vy *= p.drag || 1;
          p.rot = (p.rot || 0) + (p.spin || 0);
        }
        p.t = p.life / p.maxLife;
        if (p.t >= 1) { this.list.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rot) ctx.rotate(p.rot);
        if (this.draw) this.draw(ctx, p);
        ctx.restore();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (this.list.length) {
        this.raf = requestAnimationFrame(this.frame.bind(this));
      } else {
        this.raf = null;
        // Un par de frames extra para que el rastro se apague del todo.
        if (this.trails) {
          ctx.clearRect(0, 0, w, h);
        }
      }
    }
  }

  // Sprite radial cacheado — mucho más barato que un gradiente por partícula.
  const glowCache = new Map();
  function glowSprite(rgb, size = 64) {
    const key = rgb.join(',') + '|' + size;
    if (glowCache.has(key)) return glowCache.get(key);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grd.addColorStop(0,    `rgba(255,255,255,1)`);
    grd.addColorStop(0.25, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},.95)`);
    grd.addColorStop(0.6,  `rgba(${rgb[0]},${rgb[1]},${rgb[2]},.28)`);
    grd.addColorStop(1,    `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    glowCache.set(key, c);
    return c;
  }

  // ── Demo state ────────────────────────────────────────────
  function demoHabits() {
    const mk = (name, element, done) => ({
      name, element,
      progress: Array.from({ length: CFG.DAYS }, (_, i) => i < done),
    });
    return [
      mk('Leer',    'water', 5),
      mk('Correr',  'fire',  12),
      mk('Meditar', 'plant', 18),
    ];
  }

  // ── Chrome de la página (barra, dock, toast) ──────────────
  function toast(ico, title, sub, ms = 2600) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<span class="t-ico"></span><div class="t-title"></div><div class="t-sub"></div>';
      document.body.appendChild(el);
    }
    el.querySelector('.t-ico').textContent = ico;
    el.querySelector('.t-title').textContent = title;
    el.querySelector('.t-sub').textContent = sub;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms);
  }

  function initTheme() {
    const saved = localStorage.getItem('fxlab-theme');
    const dark = saved ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('fxlab-theme', next);
  }

  // Grupo de chips reutilizable.
  function chipGroup(label, items, active, onPick) {
    const g = document.createElement('div');
    g.className = 'dock-group';
    if (label) {
      const l = document.createElement('span');
      l.className = 'dock-label';
      l.textContent = label;
      g.appendChild(l);
    }
    items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'chip' + (it.value === active ? ' on' : '');
      b.textContent = it.label;
      if (it.title) b.title = it.title;
      b.dataset.value = it.value;
      b.addEventListener('click', () => {
        g.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
        onPick(it.value, b);
      });
      g.appendChild(b);
    });
    return g;
  }

  function actionBtn(label, onClick, title) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener('click', onClick);
    const g = document.createElement('div');
    g.className = 'dock-group';
    g.appendChild(b);
    return g;
  }

  // Selector de tier, presente en todas las maquetas.
  function tierGroup() {
    const g = chipGroup('Tier', [
      { value: 0, label: '0 Calma',  title: 'Sin movimiento — prefers-reduced-motion' },
      { value: 1, label: '1 Lite',   title: 'Sólo transform/opacity' },
      { value: 2, label: '2 Estándar', title: 'Canvas 2D + blending aditivo' },
      { value: 3, label: '3 Máximo', title: 'Presupuestos altos, capas extra' },
    ], tier.value, (v) => tier.set(Number(v)));
    return g;
  }

  function setup({ title, subtitle }) {
    initTheme();
    document.documentElement.dataset.tier = tier.value;

    const bar = document.createElement('header');
    bar.className = 'lab-bar';
    bar.innerHTML = `
      <a class="lab-back" href="./index.html">← Lab</a>
      <div class="lab-title">${title}<small>${subtitle || ''}</small></div>
      <div class="lab-spacer"></div>
      <span class="tier-badge" data-tier="${tier.value}">T${tier.value} · ${TIER_NAMES[tier.value]} (auto)</span>
      <button class="icon-btn" id="theme-btn" title="Cambiar tema" aria-label="Cambiar tema">◐</button>
    `;
    document.body.prepend(bar);
    bar.querySelector('#theme-btn').addEventListener('click', toggleTheme);
    tier.set(tier.value, false);
    return bar;
  }

  return {
    CFG, DEG, ELEMENTS, byId, metrics, polar, sector, elColor, elRGB,
    caps, tier, TIER_NAMES, autoTier, startGovernor, haptics,
    makeCanvas, Nautilus, Particles, glowSprite,
    demoHabits, toast, initTheme, toggleTheme, chipGroup, actionBtn, tierGroup, setup,
  };
})();
