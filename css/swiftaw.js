// ════════════════════════════════════════════
//   Shared icon sprite - injected once
// ════════════════════════════════════════════
(function () {
  if (document.getElementById('swiftaw-sprite')) return;
  const wrap = document.createElement('div');
  wrap.id = 'swiftaw-sprite';
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
  wrap.innerHTML = [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    // Fortized logo as an SVG icon (simplified fortress mark)
    '<symbol id="i-fortized" viewBox="0 0 512 512">',
      '<path d="M64 96 L256 32 L448 96 L448 256 C448 362 360 456 256 480 C152 456 64 362 64 256 Z M256 156 ',
      'C204 156 162 198 162 250 C162 302 204 344 256 344 C308 344 350 302 350 250 C350 198 308 156 256 156 Z" />',
      '<path d="M256 196 L286 256 L256 316 L226 256 Z" />',
    '</symbol>',
    // Standard icons (subset, ensure availability everywhere)
    '<symbol id="i-fire-g" viewBox="0 0 448 512"><path d="M160.5-26.4c9.3-7.8 23-7.5 31.9 .9 12.3 11.6 23.3 24.4 33.9 37.4 13.5 16.5 29.7 38.3 45.3 64.2 5.2-6.8 10-12.8 14.2-17.9 1.1-1.3 2.2-2.7 3.3-4.1 7.9-9.8 17.7-22.1 30.8-22.1 13.4 0 22.8 11.9 30.8 22.1 1.3 1.7 2.6 3.3 3.9 4.8 10.3 12.4 24 30.3 37.7 52.4 27.2 43.9 55.6 106.4 55.6 176.6 0 123.7-100.3 224-224 224S0 411.7 0 288c0-91.1 41.1-170 80.5-225 19.9-27.7 39.7-49.9 54.6-65.1 8.2-8.4 16.5-16.7 25.5-24.2zM225.7 416c25.3 0 47.7-7 68.8-21 42.1-29.4 53.4-88.2 28.1-134.4-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5-17.3-22.1-49.1-62.4-65.3-83-5.4-6.9-15.2-8-21.5-1.9-18.3 17.8-51.5 56.8-51.5 104.3 0 68.6 50.6 109.2 113.7 109.2z"/></symbol>',
    '<symbol id="i-heart" viewBox="0 0 512 512"><path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.1C461.5 58.6 512 119.2 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9z"/></symbol>',
    '<symbol id="i-star" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 339 113.2 483.9c-2 11.9 3 24 12.9 31.1s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.1L438.5 339 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></symbol>',
    '</svg>'
  ].join('');
  if (document.body) document.body.prepend(wrap);
  else document.addEventListener('DOMContentLoaded', () => document.body.prepend(wrap));
})();

// ════════════════════════════════════════════
//   Swiftaw - shared site interactions
// ════════════════════════════════════════════

(function () {
  // Nav scroll polish
  const nav = document.querySelector('.nav-root');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  const burger = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  // Reveal-on-scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Twemoji - parse all emoji to SVGs
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

// ════════════════════════════════════════════
//   Reactions module - real-time via Supabase
//   - subscribes to swiftaw_reactions table
//   - polls every 1s as a heartbeat so the total
//     stays visibly alive
//   - falls back to localStorage if no creds
// ════════════════════════════════════════════
window.SwiftawReactions = (function () {
  const KEYS = ['stoked', 'stunned', 'loved'];
  // The 133 fake seed reactions. Everything beyond this is real users.
  const SEED = { stoked: 53, stunned: 37, loved: 43 }; // sum = 133
  const STORAGE_PICK  = 'swiftaw.reactions.pick.v2';
  const STORAGE_LOCAL = 'swiftaw.reactions.localcounts.v2';

  function init(rootEl) {
    if (!rootEl) return;

    const cfg = window.SWIFTAW_CFG || {};
    const useRemote = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

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
        s.style.background = ['#fef83d', '#fff000', '#ffffff', '#ff8ab4'][i % 4];
        s.style.top = '50%'; s.style.left = '30px';
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
      if (error || !data) return false;
      const next = {};
      KEYS.forEach(k => { next[k] = SEED[k]; });
      data.forEach(row => { if (KEYS.includes(row.key)) next[row.key] = row.count; });
      const changed = !remote || KEYS.some(k => remote[k] !== next[k]);
      remote = next;
      if (changed) render();
      return true;
    }

    async function setupRemote() {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const ok = await fetchOnce();
      if (!ok) return false;

      // subscribe to live row updates
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

      // heartbeat - re-fetch every 1s so the total feels alive even if realtime drops
      setInterval(fetchOnce, 1000);

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
        await client.rpc(delta > 0 ? 'swiftaw_inc_reaction' : 'swiftaw_dec_reaction', { k: key });
        // optimistically reflect right away
        if (remote) {
          remote[key] = Math.max(0, (remote[key] || 0) + delta);
          render(key);
        }
        fetchOnce();
      } catch (e) { /* ignore */ }
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

    btns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const prev = pick;
        if (pick === key) {
          pick = null;
          localStorage.removeItem(STORAGE_PICK);
          if (useRemote) bumpRemote(key, -1);
          else bumpLocal(key, -1);
        } else {
          pick = key;
          localStorage.setItem(STORAGE_PICK, pick);
          burst(btn);
          if (prev) {
            if (useRemote) bumpRemote(prev, -1);
            else bumpLocal(prev, -1);
          }
          if (useRemote) bumpRemote(key, 1);
          else bumpLocal(key, 1);
        }
        render(key);
        if (feedEl) feedEl.textContent = pick ? 'you reacted just now' : 'reaction removed';
      });
    });

    if (useRemote) {
      setupRemote().then(ok => { if (!ok) render(); });
    } else {
      if (liveEl) {
        liveEl.classList.add('offline');
        const lab = liveEl.querySelector('.label');
        if (lab) lab.textContent = 'Demo';
      }
      render();
      // local heartbeat too - keeps the total feeling alive
      setInterval(() => render(), 1000);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-react-widget]').forEach(el => window.SwiftawReactions.init(el));
});
