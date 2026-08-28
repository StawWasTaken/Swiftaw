/* ════════════════════════════════════════════════════════════
   Swiftaw Accounts - shared auth + multi-account switcher
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

  /* currentScript is only readable while this file is executing, so the tag is
     captured now rather than looked up later. Every Swiftaw property is dark
     today, so dark is the default and a light page opts out explicitly with
     data-theme="light". */
  var SELF = document.currentScript;
  var THEME = (SELF && SELF.getAttribute('data-theme')) || 'dark';

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
  function reAuth(acc) {
    location.href = ACCOUNT_PAGE + '?next=' + encodeURIComponent(location.pathname + location.search) +
      '&hint=' + encodeURIComponent(acc.email || '');
  }

  function switchTo(id) {
    // The click can land before Supabase has finished booting, and a button
    // that silently does nothing reads as a broken feature.
    if (!isReady) { readyCbs.push(function () { switchTo(id); }); return; }
    var acc = readRoster().filter(function (a) { return a.id === id; })[0];
    if (!acc || !client) return;
    if (!acc.refresh_token) { reAuth(acc); return; }

    snapshot().then(function () {
      return client.auth.setSession({
        access_token: acc.access_token || '',
        refresh_token: acc.refresh_token
      });
    }).then(function (r) {
      var sess = r && r.data && r.data.session;
      if (!r || r.error || !sess) {
        // The stored access token can be spent while the refresh token is
        // still good, so ask the server for a fresh pair before giving up.
        return client.auth.refreshSession({ refresh_token: acc.refresh_token });
      }
      return r;
    }).then(function (r) {
      var sess = r && r.data && r.data.session;
      if (!r || r.error || !sess || (sess.user && sess.user.id !== id)) {
        // Whatever we held for this account no longer opens it. Drop the dead
        // tokens so the next click goes straight to signing in, and keep the
        // entry so the account still shows up by name.
        var roster = readRoster();
        for (var k = 0; k < roster.length; k++) {
          if (roster[k].id === id) { roster[k].access_token = null; roster[k].refresh_token = null; }
        }
        writeRoster(roster);
        reAuth(acc);
        return;
      }
      upsertRoster(sess);
      location.reload();
    }).catch(function () { reAuth(acc); });
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
    // Supabase unreachable - we cannot know who you are, so draw the
    // signed-out button rather than no button. The launcher beside it would
    // otherwise sit alone with a gap where the account belongs, and the
    // route it points at is the one place that can recover the session.
    injectStyle(); renderWidget(); swapNavCta(); fireChange();
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

  /* ══════════════════════════════════════════════════════════════════════
     THE ACCOUNT BUTTON
     Its own control, sitting beside the app launcher in the shared dock -
     two buttons, the way Google does it. They were one thing briefly and
     that was wrong twice over: it hid the account behind a products menu,
     and a launcher holding your session is exactly what makes people
     assume the products share one.

     Drawn in the Neo-Brutalist system: black stroke, black hard shadow,
     paper fill on every ground. The styles are injected here rather than
     pulled from nb.css because this file loads on pages that have not been
     rebuilt on the system yet, and an account control has to render.
     ══════════════════════════════════════════════════════════════════════ */

  var DOCK_ID = 'swiftaw-dock';

  /* Shared with swiftaw-launcher.js by id. Whichever script arrives first
     creates it; the other finds it. Positioned inline so it is correct
     before any stylesheet has resolved. */
  function dock() {
    var d = document.getElementById(DOCK_ID);
    if (!d) {
      d = document.createElement('div');
      d.id = DOCK_ID;
      d.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9300;' +
                        'display:flex;align-items:center;gap:10px';
      document.body.appendChild(d);
    }
    return d;
  }

  function avatarHtml(acc, cls) {
    var url = acc.avatar_url || (acc.user_metadata && acc.user_metadata.avatar_url);
    var nm = acc.username || nameOf(acc);
    if (url) return '<span class="' + cls + '" style="background-image:url(' + esc(url) + ')"></span>';
    return '<span class="' + cls + ' initials">' + esc(initials(nm)) + '</span>';
  }

  function injectStyle() {
    if (document.getElementById('swiftaw-acct-style')) return;
    var L = 'var(--swa-line)', S = 'var(--swa-surface)', S2 = 'var(--swa-surf-2)';
    var css =
    /* Black stroke + black shadow on every ground; only the fill changes. */
    /* flex, not inline-block. An inline-block sits on a text baseline, and
       its own baseline depends on what is inside it - so the button lined up
       signed out and drifted a couple of pixels up the moment signing in
       swapped the anchor for a button and added the panel. A flex box has no
       baseline to sit on, so the alignment cannot depend on the state. */
    '#swiftaw-acct{position:relative;display:flex;align-items:center;' +
      '--swa-line:#000;--swa-surface:#fff;--swa-surf-2:#F4F4EF;' +
      '--swa-fg:#000;--swa-muted:#4A4A4A;--swa-yellow:var(--nb-yellow,#FFF93E);' +
      'font-family:var(--nb-font-body,system-ui,-apple-system,sans-serif);}' +
    /* Dark describes the page this sits on, and the panel goes dark with it -
       a lighter dark than the page, so the black stroke reads in the seam.
       Matching nb.css [data-nb="dark"]. */
    '#swiftaw-acct[data-theme="dark"]{--swa-line:#000;--swa-surface:#161B24;' +
      '--swa-surf-2:#1F2634;--swa-fg:#FFFFFF;--swa-muted:#97A1B4;}' +

    /* trigger - 42px square to match the launcher button beside it */
    '#swiftaw-acct .swa-btn{display:grid;place-items:center;width:42px;height:42px;padding:3px;' +
      'background:' + S + ';border:var(--nb-bd-w,3px) solid ' + L + ';' +
      'border-radius:var(--nb-r-sm,10px);box-shadow:var(--nb-sh-sm,2px 3px 0 #000);' +
      'cursor:pointer;color:var(--swa-fg);text-decoration:none;overflow:hidden;' +
      'transition:transform .14s,box-shadow .14s;}' +
    '#swiftaw-acct .swa-btn:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 #000;}' +
    '#swiftaw-acct .swa-btn:active,#swiftaw-acct .swa-btn[aria-expanded="true"]' +
      '{transform:translate(2px,3px);box-shadow:1px 2px 0 #000;}' +
    '#swiftaw-acct .swa-btn > svg{width:20px;height:20px;fill:currentColor;}' +

    /* The avatar is a rounded square, not a circle. Nothing else in this
       system is round, and a circle floating inside a rounded square reads as
       two shapes fighting over the same 42px. */
    '#swiftaw-acct .av{border-radius:var(--nb-r-sm,10px);background-size:cover;' +
      'background-position:center;flex-shrink:0;display:grid;place-items:center;' +
      'border:2px solid ' + L + ';background-color:var(--swa-yellow);color:#000;' +
      'font-family:var(--nb-font-head,\'Syne\',sans-serif);font-weight:700;}' +
    /* On the trigger it FILLS the button: no padding to sit in, no stroke of
       its own (the button already has one), and an inner radius that is the
       outer radius less the border it is pressed against, so the two curves
       are concentric instead of one cutting across the other. */
    '#swiftaw-acct .swa-btn--av{padding:0;}' +
    '#swiftaw-acct .swa-btn .av{width:100%;height:100%;font-size:16px;border:0;' +
      'border-radius:calc(var(--nb-r-sm,10px) - 3px);}' +

    /* panel */
    '#swiftaw-acct .swa-panel{position:absolute;top:calc(100% + 12px);right:0;z-index:9400;' +
      'width:300px;background:' + S + ';color:var(--swa-fg);' +
      'border:var(--nb-bd-w,3px) solid ' + L + ';border-radius:var(--nb-r,18px);' +
      'box-shadow:var(--nb-sh-lg,8px 10px 0 #000);overflow:hidden;' +
      'animation:swaIn .2s cubic-bezier(.2,.9,.25,1) backwards;}' +
    '#swiftaw-acct .swa-panel[hidden]{display:none;}' +
    '@keyframes swaIn{from{opacity:0;transform:translateY(-8px);}}' +
    '#swiftaw-acct .swa-stripe{display:flex;height:7px;}' +
    '#swiftaw-acct .swa-stripe > i{flex:1;}' +
    '#swiftaw-acct .swa-stripe > i:nth-child(1){background:var(--nb-red,#FF0033);}' +
    '#swiftaw-acct .swa-stripe > i:nth-child(2){background:var(--nb-green,#3ECF6E);}' +
    '#swiftaw-acct .swa-stripe > i:nth-child(3){background:var(--nb-blue,#2CAFFC);}' +
    '#swiftaw-acct .swa-stripe > i:nth-child(4){background:var(--nb-yellow,#FFF93E);}' +
    '#swiftaw-acct .swa-stripe > i:nth-child(5){background:var(--nb-pink,#FF77E4);}' +

    /* The header reads in Google's order, because that order is right: the
       address first, small, because on a machine with three accounts saved
       the ONLY question you have when you open this is which one you are
       currently signed in as. Then the face, then the name, then the one
       thing you came here to do. */
    '#swiftaw-acct .swa-cur{display:flex;flex-direction:column;align-items:center;' +
      'text-align:center;gap:0;padding:14px 18px 16px;}' +
    '#swiftaw-acct .swa-cur .e{display:block;font-size:12px;color:var(--swa-muted);max-width:100%;' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:12px;}' +
    '#swiftaw-acct .swa-cur .av{width:66px;height:66px;font-size:26px;border-width:3px;' +
      'border-radius:var(--nb-r,18px);box-shadow:2px 3px 0 #000;margin-bottom:9px;}' +
    '#swiftaw-acct .swa-cur .n{display:block;font-family:var(--nb-font-head,\'Syne\',sans-serif);' +
      'font-weight:700;font-size:17px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    /* Yellow with black on it. It was a paper button on a paper panel, which
       is the one combination in this system that has no fill of its own to
       show - a 3px stroke drawing a rectangle around nothing. Yellow is the
       primary Rainbaw and this is the panel's primary action, so it is the
       one thing in here allowed to be loud. Smaller too: it sat at the same
       weight as the avatar above it and outranked the account it belongs to.
       Black text is not a choice - nothing else is readable on #FFF93E. */
    '#swiftaw-acct .swa-manage{margin-top:12px;display:inline-flex;align-items:center;' +
      'justify-content:center;padding:6px 14px;background:var(--swa-yellow);color:#000;' +
      'font-family:var(--nb-font-head,\'Syne\',sans-serif);font-weight:700;font-size:12px;' +
      'text-decoration:none;border:2px solid #000;' +
      'border-radius:var(--nb-r-pill,999px);box-shadow:2px 3px 0 #000;' +
      'transition:transform .14s,box-shadow .14s;}' +
    '#swiftaw-acct .swa-manage:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 #000;}' +
    '#swiftaw-acct .swa-manage:active{transform:translate(2px,3px);box-shadow:1px 1px 0 #000;}' +

    '#swiftaw-acct .swa-rows{border-top:2px solid ' + L + ';padding:8px;background:' + S2 + ';}' +
    '#swiftaw-acct .swa-row{display:flex;align-items:center;gap:11px;width:100%;' +
      'padding:9px 10px;border:2px solid transparent;border-radius:var(--nb-r-sm,10px);' +
      'background:none;cursor:pointer;text-align:left;color:var(--swa-fg);' +
      'font-size:13.5px;font-family:inherit;text-decoration:none;' +
      'transition:background .14s,border-color .14s,transform .14s;}' +
    '#swiftaw-acct .swa-row:hover,#swiftaw-acct .swa-row:focus-visible' +
      '{background:' + S + ';border-color:' + L + ';transform:translateX(2px);}' +
    '#swiftaw-acct .swa-row .av{width:28px;height:28px;font-size:12px;}' +
    /* display:block on both, or the two <span>s run together on one line and
       the row reads "otherstawother@swiftaw.com". */
    '#swiftaw-acct .swa-row .lbl{min-width:0;flex:1;display:block;}' +
    '#swiftaw-acct .swa-row .lbl .n{display:block;font-weight:600;' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .swa-row .lbl .e{display:block;font-size:11px;color:var(--swa-muted);' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#swiftaw-acct .swa-row .ic{width:28px;height:28px;flex-shrink:0;display:grid;place-items:center;}' +
    '#swiftaw-acct .swa-row .ic svg{width:15px;height:15px;fill:currentColor;}' +
    '#swiftaw-acct .swa-row.out{color:var(--nb-red,#FF0033);}' +
    '#swiftaw-acct .swa-seclabel{font-family:var(--nb-font-head,\'Syne\',sans-serif);' +
      'font-weight:700;font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;' +
      'color:var(--swa-muted);padding:5px 10px 6px;}' +
    '#swiftaw-acct .swa-note{border-top:2px solid ' + L + ';padding:11px 16px 10px;' +
      'font-size:11px;line-height:1.45;color:var(--swa-muted);background:' + S + ';}' +
    /* Real routes, both of them - /legal/privacy-policy and
       /legal/terms-of-service exist in this repo. Absolute to swiftaw.com
       because this panel also renders on Lifecheck and Supernova, where a
       root-relative path would land somewhere else entirely. */
    '#swiftaw-acct .swa-legal{display:flex;justify-content:center;gap:6px;' +
      'padding:0 16px 12px;background:' + S + ';font-size:10.5px;color:var(--swa-muted);}' +
    '#swiftaw-acct .swa-legal a{color:inherit;text-decoration:none;}' +
    '#swiftaw-acct .swa-legal a:hover{text-decoration:underline;}' +
    '#swiftaw-acct .swa-legal i{font-style:normal;opacity:.6;}' +

    '#swiftaw-acct .swa-backdrop{position:fixed;inset:0;z-index:9390;background:rgba(0,0,0,.45);}' +
    '@media(max-width:560px){' +
      '#swiftaw-acct .swa-panel{position:fixed;top:auto;bottom:0;left:0;right:0;width:auto;' +
        'border-radius:var(--nb-r,18px) var(--nb-r,18px) 0 0;border-bottom:0;}}' +
    '@media(prefers-reduced-motion:reduce){' +
      '#swiftaw-acct .swa-panel{animation:none;}' +
      '#swiftaw-acct .swa-btn,#swiftaw-acct .swa-row,#swiftaw-acct .swa-manage{transition:none;}}';
    var st = document.createElement('style'); st.id = 'swiftaw-acct-style'; st.textContent = css;
    document.head.appendChild(st);
  }

  var IC_ADD  = '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>';
  var IC_GEAR = '<svg viewBox="0 0 512 512" aria-hidden="true"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>';
  var IC_OUT  = '<svg viewBox="0 0 512 512" aria-hidden="true"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/></svg>';
  var IC_USER = '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/></svg>';

  /* The one line that keeps this honest. It is a fact about the products,
     not fine print to be trimmed when the panel gets crowded. */
  var NOTE = 'Swiftaw, Fortized and Hereld accounts are separate. ' +
             'Signing in here does not sign you into a product.';

  /* Two independent scripts own the two buttons in the dock, and each stops
     its own click from reaching document - which is exactly why the other
     one's outside-click listener never hears it. So opening announces itself
     on document and every other popover stands down. Decoupled on purpose:
     neither script has to know the other exists, or load first. */
  var POPOVER_EVT = 'swiftaw:popover';

  var host = null, panelOpen = false, onDoc = null, onKey = null, backdrop = null;

  function closePanel() {
    if (!panelOpen || !host) return;
    panelOpen = false;
    var p = host.querySelector('.swa-panel');
    var b = host.querySelector('.swa-btn');
    if (p) p.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
    if (backdrop) { backdrop.remove(); backdrop = null; }
    document.removeEventListener('click', onDoc);
    document.removeEventListener('keydown', onKey);
  }
  function openPanel() {
    if (panelOpen || !host) return;
    panelOpen = true;
    host.querySelector('.swa-panel').hidden = false;
    host.querySelector('.swa-btn').setAttribute('aria-expanded', 'true');
    if (window.matchMedia && window.matchMedia('(max-width:560px)').matches) {
      backdrop = document.createElement('div');
      backdrop.className = 'swa-backdrop';
      backdrop.addEventListener('click', closePanel);
      host.appendChild(backdrop);
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    document.dispatchEvent(new CustomEvent(POPOVER_EVT, { detail: { id: 'account' } }));
  }

  document.addEventListener(POPOVER_EVT, function (e) {
    if (!e.detail || e.detail.id !== 'account') closePanel();
  });

  function ensureHost() {
    if (host && host.isConnected) return host;
    host = document.getElementById('swiftaw-acct');
    if (!host) {
      host = document.createElement('div');
      host.id = 'swiftaw-acct';
      host.setAttribute('data-swa-dock-item', '');
      // A page can place it itself; otherwise it joins the shared dock. A
      // page-provided slot is ordinary markup, so it still carries a line box
      // that would push the button off centre. Neutralise it here rather than
      // asking five sites to remember.
      var slot = document.querySelector('[data-swiftaw-account]');
      if (slot) { slot.style.display = 'flex'; slot.style.alignItems = 'center'; }
      (slot || dock()).appendChild(host);
    }
    host.setAttribute('data-theme', THEME);
    onDoc = function (e) { if (!host.contains(e.target)) closePanel(); };
    onKey = function (e) {
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
        var b = host.querySelector('.swa-btn');
        if (b) b.focus();
      }
    };
    return host;
  }

  function renderWidget() {
    ensureHost();
    closePanel();

    /* Signed out: a plain link, not a menu. There is nothing to choose
       between, and a dropdown holding one row is a door with a hallway. */
    if (!activeUser) {
      host.innerHTML =
        '<a class="swa-btn" href="' + ACCOUNT_PAGE + '" ' +
           'aria-label="Sign in to Swiftaw" title="Sign in to Swiftaw">' +
          IC_USER +
        '</a>';
      return;
    }

    var u = activeUser, uname = nameOf(u);
    var meta = u.user_metadata || {};
    var others = readRoster().filter(function (a) { return a.id !== u.id; });
    var othersHtml = others.length
      ? '<div class="swa-seclabel">Your other accounts</div>' +
        others.map(function (a) {
          return '<button class="swa-row" type="button" data-switch="' + esc(a.id) + '">' +
            avatarHtml(a, 'av') +
            '<span class="lbl"><span class="n">' +
              esc(a.username || (a.email || '').split('@')[0]) +
            '</span><span class="e">' + esc(a.email || '') + '</span></span>' +
          '</button>';
        }).join('')
      : '';

    host.innerHTML =
      '<button class="swa-btn swa-btn--av" type="button" aria-expanded="false" aria-haspopup="true" ' +
              'aria-label="Swiftaw account: ' + esc(uname) + '">' +
        avatarHtml({ avatar_url: meta.avatar_url, username: uname }, 'av') +
      '</button>' +
      '<div class="swa-panel" hidden role="dialog" aria-label="Swiftaw account">' +
        '<div class="swa-stripe"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="swa-cur">' +
          '<span class="e">' + esc(u.email || '') + '</span>' +
          avatarHtml({ avatar_url: meta.avatar_url, username: uname }, 'av') +
          '<span class="n">' + esc(uname) + '</span>' +
          '<a class="swa-manage" href="' + ACCOUNT_PAGE + '?view=settings">' +
            'Manage your Swiftaw account</a>' +
        '</div>' +
        '<div class="swa-rows">' +
          othersHtml +
          '<button class="swa-row" type="button" data-add>' +
            '<span class="ic">' + IC_ADD + '</span>' +
            '<span class="lbl"><span class="n">Add another account</span></span>' +
          '</button>' +
          '<button class="swa-row" type="button" data-settings>' +
            '<span class="ic">' + IC_GEAR + '</span>' +
            '<span class="lbl"><span class="n">Account settings</span></span>' +
          '</button>' +
          '<button class="swa-row out" type="button" data-out>' +
            '<span class="ic">' + IC_OUT + '</span>' +
            '<span class="lbl"><span class="n">Log out</span></span>' +
          '</button>' +
        '</div>' +
        '<div class="swa-note">' + NOTE + '</div>' +
        '<div class="swa-legal">' +
          '<a href="https://swiftaw.com/legal/privacy-policy">Privacy Policy</a>' +
          '<i>&bull;</i>' +
          '<a href="https://swiftaw.com/legal/terms-of-service">Terms of Service</a>' +
        '</div>' +
      '</div>';

    host.querySelector('.swa-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      panelOpen ? closePanel() : openPanel();
    });
    host.querySelector('[data-settings]').addEventListener('click', function () {
      location.href = ACCOUNT_PAGE + '?view=settings';
    });
    host.querySelector('[data-add]').addEventListener('click', addAccount);
    host.querySelector('[data-out]').addEventListener('click', signOut);
    host.querySelectorAll('[data-switch]').forEach(function (b) {
      b.addEventListener('click', function () { switchTo(b.getAttribute('data-switch')); });
    });
  }
})();
