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

  // Parallax tilt on stickers with data-tilt
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

// ════════════════════════════════════════════
//   Reactions module
//   - Supabase realtime if SUPABASE_URL + KEY are set on window.SWIFTAW_CFG
//   - Falls back to localStorage (single device) when not configured
// ════════════════════════════════════════════
window.SwiftawReactions = (function () {
  const KEYS = ['stoked', 'stunned', 'loved'];
  // The only fake reactions on the whole site (133, as agreed).
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
    let remote = null;     // counts from supabase
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
        s.style.top = '50%';
        s.style.left = '30px';
        host.appendChild(s);
        requestAnimationFrame(() => s.classList.add('go'));
        setTimeout(() => s.remove(), 1000);
      }
    }

    // ───── Remote (Supabase) wiring ─────
    let client = null;
    async function setupRemote() {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      // initial fetch
      const { data, error } = await client
        .from('swiftaw_reactions')
        .select('key,count');
      if (error || !data) {
        return false;
      }
      remote = {};
      KEYS.forEach(k => { remote[k] = SEED[k]; });
      data.forEach(row => { if (KEYS.includes(row.key)) remote[row.key] = row.count; });
      render();

      // subscribe to live updates
      client.channel('swiftaw_reactions_live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'swiftaw_reactions' }, payload => {
          const k = payload.new.key;
          const prev = remote[k];
          remote[k] = payload.new.count;
          if (prev !== payload.new.count) {
            render(k);
            if (feedEl) {
              feedEl.textContent = randomFeedLine();
            }
          }
        })
        .subscribe();
      if (liveEl) {
        liveEl.classList.remove('offline');
        liveEl.querySelector('.label').textContent = 'Live';
      }
      return true;
    }

    async function bumpRemote(key, delta) {
      if (!client) return;
      try {
        await client.rpc(delta > 0 ? 'swiftaw_inc_reaction' : 'swiftaw_dec_reaction', { k: key });
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
      'one more vote',
    ];
    function randomFeedLine() { return FEED_LINES[Math.floor(Math.random() * FEED_LINES.length)]; }

    // ───── Wire buttons ─────
    btns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const prev = pick;
        if (pick === key) {
          // un-react
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
        // optimistic render: re-render after a tick so remote update can come through
        render(key);
        if (feedEl) feedEl.textContent = pick ? 'you reacted just now' : 'reaction removed';
      });
    });

    // boot
    if (useRemote) {
      setupRemote().then(ok => {
        if (!ok) {
          // remote failed, behave as local
          render();
        }
      });
    } else {
      if (liveEl) {
        liveEl.classList.add('offline');
        liveEl.querySelector('.label').textContent = 'Demo';
      }
      render();
    }
  }

  return { init };
})();

// Auto-init every widget on the page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-react-widget]').forEach(el => window.SwiftawReactions.init(el));
});
