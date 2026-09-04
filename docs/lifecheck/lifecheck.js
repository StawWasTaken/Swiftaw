/*!
 * Lifecheck v1.3 loader
 * Swiftaw - https://swiftaw.com/lifecheck/
 * Docs: https://swiftaw.com/lifecheck/docs
 */
(function () {
  'use strict';

  var VERSION = '1.3';

  var BUILD = '2026.08.28.1';
  var CACHE_BUST = BUILD + '.' + Math.floor(Date.now() / 3600000);

  var self = document.currentScript ||
    (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var BASE = (function () {
    try { return new URL('.', self.src).href.replace(/\/$/, ''); }
    catch (e) { return 'https://swiftaw.com/lifecheck'; }
  })();
  var EMBED_URL = BASE + '/embed.html';
  var EMBED_ORIGIN = (function () { try { return new URL(EMBED_URL).origin; } catch (e) { return '*'; } })();

  var widgets = [];   
  var seq = 0;

  function resolveFn(name) {
    if (typeof name === 'function') return name;
    if (!name) return null;

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
      expiredCallback: opts['expired-callback'] || el.getAttribute('data-expired-callback') || null,

      errorCallback: opts['error-callback'] || el.getAttribute('data-error-callback') || null,

      invisible: (opts.size || el.getAttribute('data-size') || '') === 'invisible',
      expanded: false
    };

    var iframe = document.createElement('iframe');
    var src = EMBED_URL + '?v=' + VERSION + '&b=' + encodeURIComponent(CACHE_BUST) +
      (w.sitekey ? '&k=' + encodeURIComponent(w.sitekey) : '') +
      (w.invisible ? '&mode=invisible' : '') +
      '&host=' + encodeURIComponent(location.hostname);
    iframe.src = src;
    iframe.title = 'Lifecheck verification';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('aria-label', "Lifecheck: I'm not a robot");
    iframe.style.cssText =
      'width:100%;max-width:402px;height:74px;border:0;overflow:hidden;' +
      'color-scheme:normal;display:block;';
    if (w.invisible) {
      iframe.style.height = '0px';
      iframe.style.display = 'none';
      startHostSampling();
    }

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

      if (!w.invisible || w.expanded) w.iframe.style.height = Math.max(60, msg.height) + 'px';
    } else if (msg.event === 'expand') {

      w.expanded = true;
      w.iframe.style.display = 'block';
      w.iframe.style.height = '260px';
      w.el.setAttribute('data-lifecheck-expanded', 'true');
      w.el.dispatchEvent(new CustomEvent('lifecheck:expand', { bubbles: true }));
    } else if (msg.event === 'collapse') {
      w.expanded = false;
      w.iframe.style.display = 'none';
      w.iframe.style.height = '0px';
      w.el.removeAttribute('data-lifecheck-expanded');
    } else if (msg.event === 'verified') {
      w.token = msg.token || '';
      if (w.input) w.input.value = w.token;
      w.el.setAttribute('data-lifecheck-verified', 'true');
      var cb = resolveFn(w.callback);
      if (cb) { try { cb(w.token, w); } catch (err) {  } }
      w.el.dispatchEvent(new CustomEvent('lifecheck:verified', { bubbles: true, detail: { token: w.token } }));
    } else if (msg.event === 'expired') {
      w.token = null;
      if (w.input) w.input.value = '';
      w.el.removeAttribute('data-lifecheck-verified');
      var ecb = resolveFn(w.expiredCallback);
      if (ecb) { try { ecb(w); } catch (err) {} }
    } else if (msg.event === 'error') {
      w.token = null;
      if (w.input) w.input.value = '';
      w.el.removeAttribute('data-lifecheck-verified');
      w.el.setAttribute('data-lifecheck-error', msg.code || 'error');
      var errCb = resolveFn(w.errorCallback);
      if (errCb) { try { errCb({ code: msg.code || 'error', message: msg.message || '' }, w); } catch (err) {} }
      w.el.dispatchEvent(new CustomEvent('lifecheck:error', {
        bubbles: true, detail: { code: msg.code || 'error', message: msg.message || '' }
      }));
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
    w.el.removeAttribute('data-lifecheck-error');
    w.el.removeAttribute('data-lifecheck-expanded');
    if (w.invisible) {
      w.expanded = false;
      w.iframe.style.display = 'none';
      w.iframe.style.height = '0px';
    }

    w.iframe.src = w.iframe.src;
  }

  var hostSamples = [];
  var hostStart = Date.now();
  var sampling = false;
  function startHostSampling() {
    if (sampling) return;
    sampling = true;
    var last = 0;
    document.addEventListener('pointermove', function (e) {
      var t = Date.now() - hostStart;
      if (t - last < 30) return;
      last = t;
      hostSamples.push([e.clientX, e.clientY, t]);
      if (hostSamples.length > 400) hostSamples.shift();
    }, { passive: true });
  }

  function execute(ref) {
    var w = pickWidget(ref);
    if (!w || !w.iframe || !w.iframe.contentWindow) return null;
    var target = EMBED_ORIGIN === '*' ? '*' : EMBED_ORIGIN;
    try {
      w.iframe.contentWindow.postMessage(
        { source: 'swiftaw-lifecheck-host', event: 'signals', samples: hostSamples.slice(-400) }, target);
      w.iframe.contentWindow.postMessage(
        { source: 'swiftaw-lifecheck-host', event: 'execute' }, target);
    } catch (e) {}
    return w;
  }

  function prune() {
    for (var i = widgets.length - 1; i >= 0; i--) {
      var f = widgets[i].iframe;
      if (!f || !f.isConnected) {
        if (widgets[i].el) { try { delete widgets[i].el.__lifecheck; } catch (e) { widgets[i].el.__lifecheck = null; } }
        widgets.splice(i, 1);
      }
    }
  }

  function pickWidget(ref) {
    prune();
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
    execute: execute
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }
})();
