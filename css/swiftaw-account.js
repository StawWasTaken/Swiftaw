/* ════════════════════════════════════════════════════════════
   Swiftaw Accounts — shared auth + multi-account switcher
   Loaded on every Swiftaw page (via swiftaw.js). One Supabase
   client, one session shared across swiftaw.com and /lifecheck/.

   NOTE: Swiftaw accounts are separate from Fortized accounts,
   even though Fortized is a Swiftaw product.

   Public API (window.SwiftawAccount):
     .ready(cb)              run cb once the session is resolved
     .client()              the shared supabase client
     .user()                the active user object, or null
     .onChange(cb)          cb(user) on every auth change
     .signInWithPassword(c) wrapper
     .signUp(a)             wrapper
     .signOut()             log out active account (switch to next if any)
     .switchTo(userId)      switch active account
     .addAccount()          go add another account
     .accounts()            saved account roster
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.SwiftawAccount) return;

  var SUPA_URL = 'https://mwszvynzzugbowdngzab.supabase.co';
  var SUPA_KEY = 'sb_publishable_dqsqX2klo1j4xSyEFA7O1w_UjM8lEGf';
  var SUPA_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var ACCOUNT_PAGE = '/account';
  var ROSTER_KEY = 'swiftaw.accounts.v1';

  var client = null, activeUser = null, isReady = false;
  var readyCbs = [], changeCbs = [];

  // ── expose API immediately (calls queue until ready) ──
  window.SwiftawAccount = {
    ready: function (cb) { if (isReady) cb(); else readyCbs.push(cb); },
    client: function () { return client; },
    user: function () { return activeUser; },
    onChange: function (cb) { changeCbs.push(cb); },
    signInWithPassword: function (c) { return client.auth.signInWithPassword(c); },
    signUp: function (a) { return client.auth.signUp(a); },
    signOut: signOut,
    switchTo: switchTo,
    addAccount: addAccount,
    accounts: readRoster,
    accountPage: ACCOUNT_PAGE
  };

  // ── helpers ──
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function ensureSupabase() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return loadScript(SUPA_CDN);
  }
  function readRoster() { try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]'); } catch (e) { return []; } }
  function writeRoster(r) { try { localStorage.setItem(ROSTER_KEY, JSON.stringify(r)); } catch (e) {} }
  function upsertRoster(session) {
    if (!session || !session.user) return;
    var u = session.user, meta = u.user_metadata || {};
    var entry = {
      id: u.id, email: u.email,
      username: meta.username || null,
      avatar_url: meta.avatar_url || null,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      ts: Date.now()
    };
    var r = readRoster(), i = -1;
    for (var k = 0; k < r.length; k++) if (r[k].id === u.id) { i = k; break; }
    if (i >= 0) r[i] = entry; else r.push(entry);
    writeRoster(r);
  }
  function removeFromRoster(id) { writeRoster(readRoster().filter(function (a) { return a.id !== id; })); }
  function initials(s) { return (s || 'S').trim().charAt(0).toUpperCase(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function nameOf(u) { var m = u && u.user_metadata || {}; return m.username || (u && u.email ? u.email.split('@')[0] : 'account'); }
  function fireChange() { changeCbs.forEach(function (cb) { try { cb(activeUser); } catch (e) {} }); }

  // ── multi-account actions ──
  function snapshot() {
    if (!client) return Promise.resolve();
    return client.auth.getSession().then(function (r) { if (r.data.session) upsertRoster(r.data.session); }).catch(function () {});
  }
  function switchTo(id) {
    var acc = readRoster().filter(function (a) { return a.id === id; })[0];
    if (!acc || !client) return;
    snapshot().then(function () {
      return client.auth.setSession({ access_token: acc.access_token, refresh_token: acc.refresh_token });
    }).then(function (r) {
      if (r && r.error) {
        // token stale — send to account page to re-auth this address
        location.href = ACCOUNT_PAGE + '?next=' + encodeURIComponent(location.pathname + location.search) + '&hint=' + encodeURIComponent(acc.email || '');
      } else {
        location.reload();
      }
    });
  }
  function addAccount() {
    location.href = ACCOUNT_PAGE + '?next=' + encodeURIComponent(location.pathname + location.search) + '&add=1';
  }
  function signOut() {
    var cur = activeUser;
    return client.auth.signOut().then(function () {
      if (cur) removeFromRoster(cur.id);
      var rest = readRoster();
      if (rest.length) switchTo(rest[0].id);
      else location.reload();
    });
  }

  // ── init ──
  ensureSupabase().then(function () {
    client = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'swiftaw-auth' }
    });
    return client.auth.getSession();
  }).then(function (r) {
    var session = r.data.session;
    activeUser = session ? session.user : null;
    if (session) upsertRoster(session);

    client.auth.onAuthStateChange(function (event, sess) {
      activeUser = sess ? sess.user : null;
      if (sess) upsertRoster(sess);
      renderWidget(); swapNavCta(); fireChange();
    });

    window.addEventListener('pagehide', snapshot);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') snapshot(); });

    isReady = true;
    readyCbs.forEach(function (cb) { try { cb(); } catch (e) {} });
    readyCbs = [];
    injectStyle(); renderWidget(); swapNavCta(); fireChange();
  }).catch(function (e) {
    isReady = true; readyCbs.forEach(function (cb) { try { cb(); } catch (e2) {} }); readyCbs = [];
  });

  // ── main-site nav CTA: "Create an account" when logged out ──
  function swapNavCta() {
    var cta = document.querySelector('.nav-root .nav-btn-cta');
    if (!cta) return;
    if (!cta.dataset.origHref) { cta.dataset.origHref = cta.getAttribute('href') || ''; cta.dataset.origText = cta.textContent.trim(); }
    // only touch the main-site Fortized CTA, never the Lifecheck ones
    if ((cta.dataset.origHref || '').indexOf('fortized.com') < 0) return;
    if (activeUser) { cta.textContent = cta.dataset.origText; cta.setAttribute('href', cta.dataset.origHref); }
    else { cta.textContent = 'Create an account'; cta.setAttribute('href', ACCOUNT_PAGE); }
  }

  // ── detached top-right account widget (shown when logged in) ──
  function avatarHtml(acc, cls) {
    var url = acc.avatar_url || (acc.user_metadata && acc.user_metadata.avatar_url);
    var nm = acc.username || nameOf(acc);
    if (url) return '<span class="' + cls + '" style="background-image:url(' + esc(url) + ')"></span>';
    return '<span class="' + cls + ' initials">' + esc(initials(nm)) + '</span>';
  }
  function injectStyle() {
    if (document.getElementById('swiftaw-acct-style')) return;
    var css =
    '#swiftaw-acct{position:fixed;top:16px;right:16px;z-index:400;font-family:var(--font-body,sans-serif);}' +
    '#swiftaw-acct .chip{display:flex;align-items:center;gap:9px;padding:6px 10px 6px 6px;background:rgba(22,28,40,.82);backdrop-filter:blur(20px) saturate(160%);border:1px solid rgba(255,255,255,.10);border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.4);cursor:pointer;transition:border-color .2s,transform .12s;}' +
    '#swiftaw-acct .chip:hover{border-color:rgba(254,248,61,.30);transform:translateY(-1px);}' +
    '#swiftaw-acct .av{width:30px;height:30px;border-radius:50%;background-size:cover;background-position:center;flex-shrink:0;display:flex;align-items:center;justify-content:center;}' +
    '#swiftaw-acct .av.initials{background:linear-gradient(135deg,var(--accent,#fef83d),var(--accent-2,#fff000));color:#0d1117;font-family:var(--font-display,sans-serif);font-weight:800;font-size:14px;}' +
    '#swiftaw-acct .uname{font-family:var(--font-display,sans-serif);font-weight:700;font-size:13.5px;color:#fff;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .cv{width:9px;height:9px;fill:#8b96a8;transition:transform .2s;}' +
    '#swiftaw-acct.open .cv{transform:rotate(180deg);}' +
    '#swiftaw-acct .panel{position:absolute;top:calc(100% + 8px);right:0;width:290px;background:rgba(18,23,31,.97);backdrop-filter:blur(22px) saturate(160%);border:1px solid rgba(255,255,255,.10);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.55);padding:8px;opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .18s,transform .18s;}' +
    '#swiftaw-acct.open .panel{opacity:1;transform:none;pointer-events:auto;}' +
    '#swiftaw-acct .cur{display:flex;align-items:center;gap:12px;padding:12px 12px 12px;}' +
    '#swiftaw-acct .cur .av{width:44px;height:44px;font-size:18px;}' +
    '#swiftaw-acct .cur .who{min-width:0;}' +
    '#swiftaw-acct .cur .who .n{font-family:var(--font-display,sans-serif);font-weight:800;font-size:15px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .cur .who .e{font-size:12px;color:#8b96a8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .sep{height:1px;background:rgba(255,255,255,.08);margin:6px 4px;}' +
    '#swiftaw-acct .row{display:flex;align-items:center;gap:11px;width:100%;padding:9px 11px;border-radius:11px;background:none;border:0;cursor:pointer;text-align:left;color:#d5dce8;font-size:13.5px;font-family:inherit;transition:background .15s;}' +
    '#swiftaw-acct .row:hover{background:rgba(255,255,255,.06);}' +
    '#swiftaw-acct .row .av{width:28px;height:28px;font-size:12px;}' +
    '#swiftaw-acct .row .lbl{min-width:0;flex:1;}' +
    '#swiftaw-acct .row .lbl .n{font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .row .lbl .e{font-size:11px;color:#8b96a8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .row .ic{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
    '#swiftaw-acct .row .ic svg{width:13px;height:13px;fill:#8b96a8;}' +
    '#swiftaw-acct .row.out{color:#ff8ea3;}' +
    '#swiftaw-acct .row.out .ic svg{fill:#ff8ea3;}' +
    '#swiftaw-acct .foot{padding:9px 12px 7px;font-size:10.5px;color:#5b6678;line-height:1.4;}' +
    '@media(max-width:520px){#swiftaw-acct .uname{display:none;}#swiftaw-acct .panel{width:260px;}}';
    var st = document.createElement('style'); st.id = 'swiftaw-acct-style'; st.textContent = css;
    document.head.appendChild(st);
  }

  var CV = '<svg class="cv" viewBox="0 0 384 512"><path d="M169.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L192 205.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160z"/></svg>';
  var IC_ADD = '<svg viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>';
  var IC_OUT = '<svg viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/></svg>';

  function renderWidget() {
    var host = document.getElementById('swiftaw-acct');
    if (!activeUser) { if (host) host.remove(); return; }
    if (!host) { host = document.createElement('div'); host.id = 'swiftaw-acct'; document.body.appendChild(host); }

    var u = activeUser, uname = nameOf(u);
    var others = readRoster().filter(function (a) { return a.id !== u.id; });
    var othersHtml = others.map(function (a) {
      return '<button class="row" data-switch="' + esc(a.id) + '">' +
        avatarHtml(a, 'av') +
        '<span class="lbl"><div class="n">' + esc(a.username || (a.email || '').split('@')[0]) + '</div><div class="e">' + esc(a.email || '') + '</div></span>' +
        '</button>';
    }).join('');

    host.innerHTML =
      '<div class="chip" data-toggle>' + avatarHtml({ avatar_url: (u.user_metadata || {}).avatar_url, username: uname }, 'av') +
        '<span class="uname">' + esc(uname) + '</span>' + CV +
      '</div>' +
      '<div class="panel">' +
        '<div class="cur">' + avatarHtml({ avatar_url: (u.user_metadata || {}).avatar_url, username: uname }, 'av') +
          '<div class="who"><div class="n">' + esc(uname) + '</div><div class="e">' + esc(u.email || '') + '</div></div>' +
        '</div>' +
        (othersHtml ? '<div class="sep"></div>' + othersHtml : '') +
        '<div class="sep"></div>' +
        '<button class="row" data-add><span class="ic">' + IC_ADD + '</span><span class="lbl"><div class="n">Add another account</div></span></button>' +
        '<button class="row out" data-out><span class="ic">' + IC_OUT + '</span><span class="lbl"><div class="n">Log out</div></span></button>' +
        '<div class="foot">Swiftaw accounts are separate from Fortized accounts.</div>' +
      '</div>';

    var toggle = host.querySelector('[data-toggle]');
    toggle.addEventListener('click', function (e) { e.stopPropagation(); host.classList.toggle('open'); });
    host.querySelector('[data-add]').addEventListener('click', addAccount);
    host.querySelector('[data-out]').addEventListener('click', signOut);
    host.querySelectorAll('[data-switch]').forEach(function (b) {
      b.addEventListener('click', function () { switchTo(b.getAttribute('data-switch')); });
    });
    document.addEventListener('click', function () { host.classList.remove('open'); });
  }
})();
