// Shared icon sprite, injected once.
(function () {
  if (document.getElementById('swiftaw-sprite')) return;
  const wrap = document.createElement('div');
  wrap.id = 'swiftaw-sprite';
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
  wrap.innerHTML = [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    '<symbol id="i-fortized" viewBox="0 0 512 512">',
      '<path d="M64 96 L256 32 L448 96 L448 256 C448 362 360 456 256 480 C152 456 64 362 64 256 Z M256 156 ',
      'C204 156 162 198 162 250 C162 302 204 344 256 344 C308 344 350 302 350 250 C350 198 308 156 256 156 Z" />',
      '<path d="M256 196 L286 256 L256 316 L226 256 Z" />',
    '</symbol>',
    '<symbol id="i-fire-g" viewBox="0 0 448 512"><path d="M160.5-26.4c9.3-7.8 23-7.5 31.9 .9 12.3 11.6 23.3 24.4 33.9 37.4 13.5 16.5 29.7 38.3 45.3 64.2 5.2-6.8 10-12.8 14.2-17.9 1.1-1.3 2.2-2.7 3.3-4.1 7.9-9.8 17.7-22.1 30.8-22.1 13.4 0 22.8 11.9 30.8 22.1 1.3 1.7 2.6 3.3 3.9 4.8 10.3 12.4 24 30.3 37.7 52.4 27.2 43.9 55.6 106.4 55.6 176.6 0 123.7-100.3 224-224 224S0 411.7 0 288c0-91.1 41.1-170 80.5-225 19.9-27.7 39.7-49.9 54.6-65.1 8.2-8.4 16.5-16.7 25.5-24.2zM225.7 416c25.3 0 47.7-7 68.8-21 42.1-29.4 53.4-88.2 28.1-134.4-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5-17.3-22.1-49.1-62.4-65.3-83-5.4-6.9-15.2-8-21.5-1.9-18.3 17.8-51.5 56.8-51.5 104.3 0 68.6 50.6 109.2 113.7 109.2z"/></symbol>',
    '<symbol id="i-heart" viewBox="0 0 512 512"><path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.1C461.5 58.6 512 119.2 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9z"/></symbol>',
    '<symbol id="i-star" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 339 113.2 483.9c-2 11.9 3 24 12.9 31.1s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.1L438.5 339 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></symbol>',
    '</svg>'
  ].join('');
  if (document.body) document.body.prepend(wrap);
  else document.addEventListener('DOMContentLoaded', () => document.body.prepend(wrap));
})();

// Account widget.
(function () {
  if (window.SwiftawAccount || document.getElementById('swiftaw-acct-loader')) return;
  const s = document.createElement('script');
  s.id = 'swiftaw-acct-loader';
  s.src = '/css/swiftaw-account.js';
  s.defer = true;
  document.head.appendChild(s);
})();

// Launcher + consent. The site is read from the path: one origin, three products.
(function () {
  const path = location.pathname;
  const site = path.indexOf('/lifecheck') === 0 ? 'Lifecheck'
             : path.indexOf('/supernova') === 0 ? 'Supernova'
             : 'Swiftaw';

  function load(id, src, data) {
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id; s.src = src; s.defer = true;
    Object.keys(data).forEach(k => s.dataset[k] = data[k]);
    document.head.appendChild(s);
  }

  load('swiftaw-launcher-loader', '/css/swiftaw-launcher.js', {
    current: site === 'Swiftaw' ? '' : site.toLowerCase(),
    theme: 'dark'
  });

  load('swiftaw-consent-loader', '/css/swiftaw-consent.js', {
    product: site,
    theme: 'dark'
  });
})();

// Copy button on code blocks.
(function () {
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var blocks = document.querySelectorAll('pre.code, .code-block');
    if (!blocks.length) return;
    if (!document.getElementById('swiftaw-copy-style')) {
      var st = document.createElement('style'); st.id = 'swiftaw-copy-style';
      st.textContent =
        '.swiftaw-codewrap{position:relative;}' +
        '.swiftaw-codewrap > pre.code, .swiftaw-codewrap > .code-block{padding-top:40px;}' +
        '.swiftaw-copy{position:absolute;top:9px;right:9px;z-index:2;display:inline-flex;align-items:center;gap:6px;font-family:var(--font-display,sans-serif);font-weight:700;font-size:11px;color:#cbd5e1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:5px 9px;cursor:pointer;transition:color .15s,border-color .15s,background .15s;opacity:.85;}' +
        '.swiftaw-copy:hover{color:#fff;border-color:rgba(254,248,61,.4);background:rgba(255,255,255,.1);opacity:1;}' +
        '.swiftaw-copy.done{color:#86efac;border-color:rgba(134,239,172,.5);}' +
        '.swiftaw-copy svg{width:12px;height:12px;fill:currentColor;}';
      document.head.appendChild(st);
    }
    var COPY = '<svg viewBox="0 0 448 512"><path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg>';
    var CHK = '<svg viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>';
    blocks.forEach(function (block) {
      if (block.closest('.swiftaw-codewrap')) return;
      var wrap = document.createElement('div'); wrap.className = 'swiftaw-codewrap';
      block.parentNode.insertBefore(wrap, block); wrap.appendChild(block);
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'swiftaw-copy';
      btn.innerHTML = COPY + '<span>Copy</span>';
      btn.addEventListener('click', function () {
        var text = block.innerText.replace(/\n{3,}/g, '\n\n');
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('done'); btn.innerHTML = CHK + '<span>Copied</span>';
          setTimeout(function () { btn.classList.remove('done'); btn.innerHTML = COPY + '<span>Copy</span>'; }, 1400);
        }).catch(function () {});
      });
      wrap.appendChild(btn);
    });
  });
})();

(function () {
  const nav = document.querySelector('.nav-root');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Legacy pages: a separate .mobile-menu element.
  const burger = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  const nbNav = document.querySelector('.nb-nav');
  const nbBurger = nbNav && nbNav.querySelector('.nb-nav-burger');
  const nbLinks = nbNav && nbNav.querySelector('.nb-nav-links');
  if (nbNav && nbBurger && nbLinks) {
    nbBurger.addEventListener('click', () => {
      const open = nbNav.classList.toggle('is-open');
      nbBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) closeDrops();
    });
    // In-page anchors do not reload, so close on navigation.
    nbLinks.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nbNav.classList.remove('is-open');
        nbBurger.setAttribute('aria-expanded', 'false');
        closeDrops();
      }
    });
  }

  // Nav dropdowns.
  //
  // Pointer opens on hover with a short close delay so a diagonal cursor path
  // from the trigger to the panel does not lose it. Keyboard, touch and the
  // collapsed mobile bar all go through the same click toggle, so there is one
  // open state and not two.
  const drops = Array.from(document.querySelectorAll('.nb-nav-item'))
    .filter(it => it.querySelector('.nb-drop'));

  function closeDrops(except) {
    drops.forEach(it => {
      if (it === except) return;
      it.classList.remove('is-open');
      const t = it.querySelector('.nb-nav-link');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  function setDrop(item, open) {
    item.classList.toggle('is-open', open);
    const t = item.querySelector('.nb-nav-link');
    if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) closeDrops(item);
  }

  if (drops.length) {
    const hoverable = window.matchMedia('(hover: hover) and (min-width: 881px)');
    let closeT = null;

    drops.forEach(item => {
      const trigger = item.querySelector('.nb-nav-link');

      item.addEventListener('mouseenter', () => {
        if (!hoverable.matches) return;
        clearTimeout(closeT);
        setDrop(item, true);
      });
      item.addEventListener('mouseleave', () => {
        if (!hoverable.matches) return;
        clearTimeout(closeT);
        closeT = setTimeout(() => setDrop(item, false), 140);
      });

      if (trigger) {
        trigger.addEventListener('click', e => {
          e.preventDefault();
          const open = item.classList.contains('is-open');
          // On a desktop the pointer opened this on the way to clicking it, so
          // a plain toggle here shuts the menu on the click that was meant to
          // open it. While the pointer is still on the group, the click leaves
          // it alone; leaving, Escape and a click outside all still close it.
          // Keyboard and touch never match :hover, so they keep the toggle.
          if (open && hoverable.matches && item.matches(':hover')) return;
          setDrop(item, !open);
        });
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.nb-nav-item')) closeDrops();
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = drops.find(it => it.classList.contains('is-open'));
      if (!open) return;
      setDrop(open, false);
      const t = open.querySelector('.nb-nav-link');
      if (t) t.focus();
    });
    // Leaving the group by keyboard should close it the same way leaving it by
    // pointer does.
    drops.forEach(item => {
      item.addEventListener('focusout', e => {
        if (!item.contains(e.relatedTarget)) setDrop(item, false);
      });
    });
  }

  // Two separate thresholds. The bar takes its shadow as soon as the page
  // moves, but the wordmark holds on for a while longer - swapping it on the
  // first notch of the wheel reads as a glitch rather than a decision. The
  // gap between 260 and 180 is there so a scroll that idles on the boundary
  // cannot flip it back and forth.
  if (nbNav) {
    const onNbScroll = () => {
      const y = window.scrollY;
      nbNav.classList.toggle('is-scrolled', y > 24);
      if (y > 260) nbNav.classList.add('is-far');
      else if (y < 180) nbNav.classList.remove('is-far');
    };
    onNbScroll();
    window.addEventListener('scroll', onNbScroll, { passive: true });
  }

  // Reveal on scroll. Two class names: .reveal/.visible on the legacy pages,
  // .nb-reveal/.is-in on the rebuilt ones.
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add(
        e.target.classList.contains('nb-reveal') ? 'is-in' : 'visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });

  const observeReveals = root =>
    (root || document).querySelectorAll('.reveal, .nb-reveal')
      .forEach(el => {
        if (!el.classList.contains('visible') && !el.classList.contains('is-in')) {
          io.observe(el);
        }
      });
  observeReveals();
  window.SwiftawObserveReveals = observeReveals;

  // Deco you can play with. All of it is decoration, so none of it is
  // required for the page to work and none of it is announced.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // .nb-poke cycles the Rainbaw on click.
  const RAINBAW = ['--nb-red', '--nb-green', '--nb-blue', '--nb-yellow', '--nb-pink'];
  document.addEventListener('click', e => {
    const poke = e.target.closest('.nb-poke');
    if (!poke) return;
    const i = (parseInt(poke.dataset.hue || '0', 10) + 1) % RAINBAW.length;
    poke.dataset.hue = String(i);
    const prop = poke.classList.contains('nb-shape--tri')
      ? 'border-bottom-color' : 'background';
    poke.style.setProperty(prop, 'var(' + RAINBAW[i] + ')');
  });
  document.querySelectorAll('.nb-poke').forEach(el => {
    // An aria-hidden shape must stay out of the tab order.
    if (el.getAttribute('aria-hidden') === 'true') return;
    if (el.tabIndex < 0) el.tabIndex = 0;
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); el.click(); }
    });
  });

  // .nb-float drifts against the pointer; .nb-magnet leans toward it.
  // Images sit this one out: the shapes are furniture and can move, an
  // illustration is content and drifting it just makes the page feel loose.
  const floats = Array.from(document.querySelectorAll('.nb-float:not(img), .nb-magnet:not(img)'));
  if (floats.length && !reduced.matches && matchMedia('(hover: hover)').matches) {
    let queued = false, mx = 0, my = 0;
    window.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        floats.forEach(el => {
          const magnet = el.classList.contains('nb-magnet');
          const depth = parseFloat(el.dataset.depth || (magnet ? '10' : '14'));
          let dx, dy;
          if (magnet) {
            const r = el.getBoundingClientRect();
            // Past a screen-width away the pull is nothing, so clamp it.
            dx = Math.max(-1, Math.min(1, (mx - (r.left + r.width / 2)) / 260)) * depth;
            dy = Math.max(-1, Math.min(1, (my - (r.top + r.height / 2)) / 260)) * depth;
          } else {
            dx = -((mx - cx) / cx) * depth;
            dy = -((my - cy) / cy) * depth;
          }
          // Offsets only. The rotation and scale belong to the CSS.
          el.style.setProperty('--nb-tx', dx.toFixed(1) + 'px');
          el.style.setProperty('--nb-ty', dy.toFixed(1) + 'px');
        });
      });
    }, { passive: true });
  }

  function runTwemoji() {
    if (window.twemoji) {
      window.twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    }
  }
  if (window.twemoji) runTwemoji();
  else {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = runTwemoji;
    document.head.appendChild(s);
  }
})();

// Reactions: Supabase realtime, with a localStorage fallback.
window.SwiftawReactions = (function () {
  const KEYS = ['stoked', 'stunned', 'loved'];
  const SEED = { stoked: 53, stunned: 37, loved: 43 };

  const STORAGE_PICK  = 'swiftaw.reactions.pick.v2';
  const STORAGE_LOCAL = 'swiftaw.reactions.localcounts.v2';

  function init(rootEl) {
    if (!rootEl) return;

    const cfg = window.SWIFTAW_CFG || {};
    let useRemote = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

    function demoteToLocal(reason) {
      if (!useRemote) return;
      console.warn('[swiftaw reactions] falling back to local mode:', reason);
      useRemote = false;
      if (liveEl) {
        liveEl.classList.add('offline');
        const lab = liveEl.querySelector('.label');
        if (lab) lab.textContent = 'Demo';
      }
    }

    const btns = Array.from(rootEl.querySelectorAll('.react-btn'));
    const totalEl = rootEl.querySelector('[data-react-total]');
    const feedEl  = rootEl.querySelector('[data-react-feed]');
    const liveEl  = rootEl.querySelector('[data-live-chip]');

    let pick = localStorage.getItem(STORAGE_PICK) || null;
    let remote = null;
    let localDrift = JSON.parse(localStorage.getItem(STORAGE_LOCAL) || '{"stoked":0,"stunned":0,"loved":0}');

    function liveCounts() {
      const out = {};
      KEYS.forEach(k => {
        if (remote) out[k] = remote[k] ?? SEED[k];
        else out[k] = SEED[k] + (localDrift[k] || 0);
      });
      return out;
    }

    function tween(el, to, dur = 600) {
      const from = parseInt((el.textContent || '0').replace(/\D/g, ''), 10) || 0;
      if (from === to) { el.textContent = to.toLocaleString(); return; }
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function render(bumpKey) {
      const c = liveCounts();
      const tot = KEYS.reduce((s, k) => s + c[k], 0);
      btns.forEach(btn => {
        const key = btn.dataset.key;
        const isPicked = pick === key;
        btn.classList.toggle('picked', isPicked);
        btn.setAttribute('aria-pressed', isPicked ? 'true' : 'false');
        const countEl = btn.querySelector('[data-count]');
        const pctEl   = btn.querySelector('[data-pct]');
        const barEl   = btn.querySelector('[data-bar]');
        tween(countEl, c[key]);
        const pct = tot ? Math.round((c[key] / tot) * 100) : 0;
        if (pctEl) pctEl.textContent = pct + '%';
        if (barEl) barEl.style.width = pct + '%';
        // The stacked bar shows every option against the others, so its
        // segments take the raw share rather than the rounded one.
        const segEl = rootEl.querySelector('[data-share="' + key + '"]');
        if (segEl) segEl.style.width = (tot ? (c[key] / tot) * 100 : 0) + '%';
        if (bumpKey === key) {
          countEl.classList.remove('bump');
          void countEl.offsetWidth;
          countEl.classList.add('bump');
        }
      });
      if (totalEl) tween(totalEl, tot, 700);
    }

    function burst(btn) {
      const host = btn.querySelector('.react-burst');
      if (!host) return;
      for (let i = 0; i < 16; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        const angle = (Math.PI * 2) * (i / 16) + Math.random() * 0.3;
        const dist = 60 + Math.random() * 70;
        s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        s.style.background =
          ['#FF0033', '#3ECF6E', '#2CAFFC', '#FFF93E', '#FF77E4'][i % 5];
        s.style.top = '43px'; s.style.left = '43px';
        host.appendChild(s);
        requestAnimationFrame(() => s.classList.add('go'));
        setTimeout(() => s.remove(), 1000);
      }
    }

    let client = null;

    async function fetchOnce() {
      if (!client) return false;
      const { data, error } = await client
        .from('swiftaw_reactions')
        .select('key,count');
      if (error) {
        console.warn('[swiftaw reactions] SELECT failed:', error.message || error);
        return false;
      }
      if (!data || data.length === 0) {
        console.warn('[swiftaw reactions] SELECT returned 0 rows - did you re-run supabase-reactions.sql? RLS may be blocking the anon role.');
        return false;
      }
      const next = {};
      KEYS.forEach(k => { next[k] = SEED[k]; });
      data.forEach(row => { if (KEYS.includes(row.key)) next[row.key] = row.count; });
      remote = next;
      return true;
    }

    async function setupRemote() {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const ok = await fetchOnce();
      if (!ok) return false;

      client.channel('swiftaw_reactions_live_' + Math.random().toString(36).slice(2, 8))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'swiftaw_reactions' }, payload => {
          const k = payload.new.key;
          const prev = remote[k];
          remote[k] = payload.new.count;
          if (prev !== payload.new.count) {
            render(k);
            if (feedEl) feedEl.textContent = randomFeedLine();
          }
        })
        .subscribe();

      setInterval(() => { fetchOnce().then(ok => { if (ok) render(); }); }, 1000);

      if (liveEl) {
        liveEl.classList.remove('offline');
        const lab = liveEl.querySelector('.label');
        if (lab) lab.textContent = 'Live';
      }
      return true;
    }

    async function bumpRemote(key, delta) {
      if (!client) return;
      try {
        const { error } = await client.rpc(
          delta > 0 ? 'swiftaw_inc_reaction' : 'swiftaw_dec_reaction',
          { k: key }
        );
        if (error) {
          console.warn('[swiftaw reactions] RPC error:', error.message || error);
          fetchOnce().then(ok => { if (ok) render(key); });
        }
      } catch (e) {
        console.warn('[swiftaw reactions] RPC threw:', e);
      }
    }

    function bumpLocal(key, delta) {
      localDrift[key] = (localDrift[key] || 0) + delta;
      if (SEED[key] + localDrift[key] < 0) localDrift[key] = -SEED[key];
      localStorage.setItem(STORAGE_LOCAL, JSON.stringify(localDrift));
    }

    const FEED_LINES = [
      'someone just reacted',
      '+1 from somewhere',
      'fresh reaction in',
      'live tap',
      'one more vote'
    ];
    function randomFeedLine() { return FEED_LINES[Math.floor(Math.random() * FEED_LINES.length)]; }

    // Optimistic: the 1s heartbeat reconciles.
    function applyOptimistic(key, delta) {
      if (useRemote) {
        if (!remote) remote = { ...SEED };
        remote[key] = Math.max(0, (remote[key] || 0) + delta);
      } else {
        bumpLocal(key, delta);
      }
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const prev = pick;

        if (pick === key) {
          pick = null;
          localStorage.removeItem(STORAGE_PICK);
          applyOptimistic(key, -1);
          if (useRemote) bumpRemote(key, -1);
        } else {
          pick = key;
          localStorage.setItem(STORAGE_PICK, pick);
          burst(btn);
          if (prev) {
            applyOptimistic(prev, -1);
            if (useRemote) bumpRemote(prev, -1);
          }
          applyOptimistic(key, 1);
          if (useRemote) bumpRemote(key, 1);
        }
        render(key);
        if (feedEl) feedEl.textContent = pick ? 'you reacted just now' : 'reaction removed';
      });
    });

    if (useRemote) {
      setupRemote().then(ok => {
        if (!ok) {
          demoteToLocal('initial Supabase fetch failed - did you run supabase-reactions.sql?');
        }
        render();
      });
    } else {
      if (liveEl) {
        liveEl.classList.add('offline');
        const lab = liveEl.querySelector('.label');
        if (lab) lab.textContent = 'Demo';
      }
      render();
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-react-widget]').forEach(el => window.SwiftawReactions.init(el));
});
