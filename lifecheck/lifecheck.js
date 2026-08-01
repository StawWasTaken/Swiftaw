/* ════════════════════════════════════════════════════════════
   Lifecheck v1.1 — client loader / integration API
   by Swiftaw · https://swiftaw.com/lifecheck/

   Drop-in usage
   ─────────────
     <script src="https://swiftaw.com/lifecheck/lifecheck.js" async defer></script>
     <div class="lifecheck"
          data-sitekey="YOUR_SITE_KEY"
          data-callback="onLifecheckPass"></div>

   The challenge itself runs sandboxed inside an <iframe> served from
   swiftaw.com — the host page never sees (and can't copy) the detection
   logic. All it receives back is a one-time token to verify server-side.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '1.1';

  // Resolve where THIS script is served from, so the widget iframe and the
  // postMessage origin check work no matter which domain hosts Lifecheck.
  var self = document.currentScript ||
    (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var BASE = (function () {
    try { return new URL('.', self.src).href.replace(/\/$/, ''); }
    catch (e) { return 'https://swiftaw.com/lifecheck'; }
  })();
  var EMBED_URL = BASE + '/embed.html';
  var EMBED_ORIGIN = (function () { try { return new URL(EMBED_URL).origin; } catch (e) { return '*'; } })();

  var widgets = [];   // { id, el, iframe, token, sitekey, callback, expiredCallback }
  var seq = 0;

  function resolveFn(name) {
    if (typeof name === 'function') return name;
    if (!name) return null;
    // supports dotted paths like "app.onPass"
    var ref = window, parts = String(name).split('.');
    for (var i = 0; i < parts.length; i++) {
      if (ref == null) return null;
      ref = ref[parts[i]];
    }
    return typeof ref === 'function' ? ref : null;
  }

  function render(el, opts) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || el.__lifecheck) return el && el.__lifecheck;
    opts = opts || {};

    var id = ++seq;
    var w = {
      id: id,
      el: el,
      iframe: null,
      token: null,
      sitekey: opts.sitekey || el.getAttribute('data-sitekey') || '',
      callback: opts.callback || el.getAttribute('data-callback') || null,
      expiredCallback: opts['expired-callback'] || el.getAttribute('data-expired-callback') || null
    };

    // frame that hosts the sandboxed challenge
    var iframe = document.createElement('iframe');
    var src = EMBED_URL + '?v=' + VERSION + (w.sitekey ? '&k=' + encodeURIComponent(w.sitekey) : '') +
      '&host=' + encodeURIComponent(location.hostname);
    iframe.src = src;
    iframe.title = 'Lifecheck verification';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('aria-label', "Lifecheck — I'm not a robot");
    iframe.style.cssText =
      'width:100%;max-width:346px;height:74px;border:0;overflow:hidden;' +
      'color-scheme:normal;display:block;';

    // hidden field so a plain <form> POST carries the token automatically
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = el.getAttribute('data-response-field') || 'lifecheck-token';
    input.className = 'lifecheck-token';

    el.appendChild(iframe);
    el.appendChild(input);
    w.iframe = iframe;
    w.input = input;
    el.__lifecheck = w;
    widgets.push(w);
    return w;
  }

  function widgetForFrame(frameWin) {
    for (var i = 0; i < widgets.length; i++) {
      if (widgets[i].iframe && widgets[i].iframe.contentWindow === frameWin) return widgets[i];
    }
    return null;
  }

  window.addEventListener('message', function (e) {
    if (EMBED_ORIGIN !== '*' && e.origin !== EMBED_ORIGIN) return;
    var msg = e.data;
    if (!msg || msg.source !== 'swiftaw-lifecheck') return;

    var w = widgetForFrame(e.source);
    if (!w) return;

    if (msg.event === 'resize' && msg.height) {
      w.iframe.style.height = Math.max(60, msg.height) + 'px';
    } else if (msg.event === 'verified') {
      w.token = msg.token || '';
      if (w.input) w.input.value = w.token;
      w.el.setAttribute('data-lifecheck-verified', 'true');
      var cb = resolveFn(w.callback);
      if (cb) { try { cb(w.token, w); } catch (err) { /* host callback threw */ } }
      w.el.dispatchEvent(new CustomEvent('lifecheck:verified', { bubbles: true, detail: { token: w.token } }));
    } else if (msg.event === 'expired') {
      w.token = null;
      if (w.input) w.input.value = '';
      w.el.removeAttribute('data-lifecheck-verified');
      var ecb = resolveFn(w.expiredCallback);
      if (ecb) { try { ecb(w); } catch (err) {} }
    }
  });

  function getResponse(ref) {
    var w = pickWidget(ref);
    return w ? (w.token || '') : '';
  }

  function reset(ref) {
    var w = pickWidget(ref);
    if (!w) return;
    w.token = null;
    if (w.input) w.input.value = '';
    w.el.removeAttribute('data-lifecheck-verified');
    // reload the frame to get a fresh challenge
    w.iframe.src = w.iframe.src;
  }

  function pickWidget(ref) {
    if (ref == null) return widgets[0] || null;
    if (typeof ref === 'number') { for (var i = 0; i < widgets.length; i++) if (widgets[i].id === ref) return widgets[i]; return null; }
    if (typeof ref === 'string') { var el = document.getElementById(ref); return el && el.__lifecheck; }
    if (ref.__lifecheck) return ref.__lifecheck;
    return null;
  }

  function auto() {
    var nodes = document.querySelectorAll('.lifecheck:not([data-lifecheck-rendered]), [data-lifecheck]:not([data-lifecheck-rendered])');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('data-lifecheck-rendered', 'true');
      render(nodes[i]);
    }
  }

  window.Lifecheck = {
    version: VERSION,
    render: function (el, opts) { var w = render(el, opts); return w ? w.id : -1; },
    reset: reset,
    getResponse: getResponse,
    execute: function (ref) { /* reserved for invisible mode */ return pickWidget(ref); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }
})();
