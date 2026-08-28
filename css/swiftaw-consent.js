(function (global) {
'use strict';
var KEY      = 'swft_consent_v1';
var POLICY   = 1;
var ESCALATE = 60000;
var SELF = document.currentScript ||
document.querySelector('script[src*="swiftaw-consent"]');
var SELF_SRC = (SELF && SELF.src) || '';
function beside(file, fallback) {
try { if (SELF_SRC) return new URL(file, SELF_SRC).href; } catch (e) {}
return fallback;
}
var DECO_BASE = beside('../SWFT-Deco/', 'https://swiftaw.com/SWFT-Deco/');
var SWIFTAW_PRIVACY = { label: 'Swiftaw Privacy Policy',
href: 'https://swiftaw.com/legal/privacy-policy' };
var CATALOGUE = {
necessary: {
name: 'Necessary',
required: true,
desc: 'Keeps you signed in, keeps the service working and remembers this ' +
'very choice. Cannot be switched off.'
},
preferences: {
name: 'Preferences',
desc: 'Remembers how you like things set - theme, layout, the panel you ' +
'left open.'
},
analytics: {
name: 'Analytics',
desc: 'Counts how pages and features get used so we know what to fix next.'
}
};
var state = {
cfg: null, root: null, card: null, timer: null,
open: false, escalated: false, prefsOpen: false,
lastFocus: null, choice: null
};
function read() {
try {
var raw = global.localStorage.getItem(KEY);
if (!raw) return null;
var v = JSON.parse(raw);
if (!v || v.policy !== POLICY) return null;
return v;
} catch (e) { return null; }
}
function write(granted) {
var rec = {
policy: POLICY,
at: new Date().toISOString(),
product: state.cfg.product,
granted: granted
};
try { global.localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
state.choice = rec;
emit(rec);
return rec;
}
function emit(rec) {
try {
global.dispatchEvent(new CustomEvent('swiftaw:consent', { detail: rec }));
} catch (e) {}
if (typeof state.cfg.onChange === 'function') {
try { state.cfg.onChange(rec); } catch (e) {}
}
}
function ensureCss() {
if (document.querySelector('link[data-swc-css]')) return;
var href = beside('swiftaw-consent.css',
'https://swiftaw.com/css/swiftaw-consent.css');
if (document.querySelector('link[href="' + href + '"]')) return;
var l = document.createElement('link');
l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-swc-css', '');
document.head.appendChild(l);
}
function fromScriptTag() {
if (!SELF) return {};
var d = SELF.dataset || {};
var links = [SWIFTAW_PRIVACY];
if (d.privacySelf && d.product) {
links.push({ label: d.product + ' Privacy Policy', href: d.privacySelf });
}
var out = {};
if (d.product) out.product = d.product;
if (d.theme) out.theme = d.theme;
if (d.privacySelf) out.privacyLinks = links;
if (d.categories) {
out.categories = d.categories.split(',').map(function (x) { return x.trim(); });
}
return out;
}
function resolve(opts) {
var cfg = Object.assign({
product: 'Swiftaw',
theme: 'light',
privacyLinks: [SWIFTAW_PRIVACY],
categories: ['necessary', 'preferences'],
deco: DECO_BASE + 'privacy-deco.png',
escalateAfter: ESCALATE,
onChange: null
}, fromScriptTag(), opts || {});
cfg.categories = cfg.categories.filter(function (c) { return CATALOGUE[c]; });
if (cfg.categories.indexOf('necessary') !== 0) {
cfg.categories = ['necessary'].concat(
cfg.categories.filter(function (c) { return c !== 'necessary'; }));
}
return cfg;
}
function esc(s) {
return String(s).replace(/[&<>"]/g, function (c) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
});
}
function optionalCats() {
return state.cfg.categories.filter(function (c) { return !CATALOGUE[c].required; });
}
function build() {
var cfg = state.cfg;
var root = document.createElement('div');
root.className = 'swc-root is-corner';
root.setAttribute('data-nb', cfg.theme);
var links = cfg.privacyLinks.map(function (l) {
return '<a href="' + esc(l.href) + '" target="_blank" rel="noopener">' +
esc(l.label) + '</a>';
}).join('');
var prefs = optionalCats().length
? '<div class="swc-prefs" id="swc-prefs" hidden>' +
cfg.categories.map(function (id) {
var c = CATALOGUE[id];
return '<div class="swc-pref">' +
(c.required
? '<span class="nb-box swc-pref-fixed" aria-hidden="true" ' +
'style="width:24px;height:24px;flex:none;margin-top:1px;' +
'background:var(--nb-yellow);border:var(--nb-bd);border-radius:6px"></span>'
: '<label class="nb-check" style="margin-top:1px">' +
'<input type="checkbox" data-cat="' + esc(id) + '" checked>' +
'<span class="nb-box"></span>' +
'<span class="nb-sr">' + esc(c.name) + '</span></label>') +
'<div class="swc-pref-main">' +
'<div class="swc-pref-name">' + esc(c.name) +
(c.required ? '<span class="swc-pref-lock">Always on</span>' : '') +
'</div>' +
'<div class="swc-pref-desc">' + esc(c.desc) + '</div>' +
'</div></div>';
}).join('') +
'</div>'
: '';
var manage = optionalCats().length
? '<button type="button" class="swc-manage" data-swc="manage" ' +
'aria-expanded="false" aria-controls="swc-prefs">Choose what we store</button>'
: '';
root.innerHTML =
'<div class="swc-backdrop" data-swc="backdrop"></div>' +
'<section class="swc-card" role="dialog" aria-labelledby="swc-title" ' +
'aria-describedby="swc-text">' +
'<div class="swc-stripe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
'<div class="swc-body">' +
'<div class="swc-figure">' +
'<img src="' + esc(cfg.deco) + '" alt="" aria-hidden="true" ' +
'onerror="this.style.display=\'none\'">' +
'<h2 class="swc-title" id="swc-title">We use cookies.</h2>' +
'</div>' +
'<p class="swc-text" id="swc-text">' +
'Some are needed to keep ' + esc(cfg.product) + ' working and to ' +
'remember you are signed in.' +
(optionalCats().length
? ' The rest just remember how you like things. Your call.'
: ' We do not use any others.') +
'</p>' +
'<div class="swc-links">' + links + '</div>' +
prefs +
'<div class="swc-actions">' +
'<div class="swc-actions-row">' +
'<button type="button" class="nb-btn nb-btn--primary nb-btn--lg" ' +
'data-swc="accept">Accept</button>' +
(optionalCats().length
? '<button type="button" class="nb-btn nb-btn--lg" ' +
'data-swc="necessary">Necessary only</button>'
: '') +
'</div>' +
manage +
'</div>' +
'</div>' +
'</section>';
return root;
}
function grantAll() {
var g = {};
state.cfg.categories.forEach(function (c) { g[c] = true; });
return g;
}
function grantNecessary() {
var g = {};
state.cfg.categories.forEach(function (c) { g[c] = !!CATALOGUE[c].required; });
return g;
}
function grantChosen() {
var g = { necessary: true };
state.root.querySelectorAll('input[data-cat]').forEach(function (i) {
g[i.dataset.cat] = i.checked;
});
return g;
}
function arm() {
disarm();
if (state.escalated) return;
state.timer = global.setTimeout(escalate, state.cfg.escalateAfter);
}
function disarm() {
if (state.timer) { global.clearTimeout(state.timer); state.timer = null; }
}
function escalate() {
if (!state.open || state.escalated) return;
state.escalated = true;
var root = state.root;
var card = state.card;
var go = function () {
root.classList.remove('is-leaving', 'is-corner');
root.classList.add('is-center');
card.setAttribute('aria-modal', 'true');
document.documentElement.style.overflow = 'hidden';
state.lastFocus = document.activeElement;
var accept = card.querySelector('[data-swc="accept"]');
if (accept) accept.focus({ preventScroll: true });
};
if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
go();
} else {
root.classList.add('is-leaving');
global.setTimeout(go, 190);
}
}
function decide(granted) {
disarm();
write(granted);
var root = state.root;
root.classList.add('is-done');
if (state.card) state.card.setAttribute('aria-hidden', 'true');
document.documentElement.style.overflow = '';
global.setTimeout(teardown, 320);
if (state.lastFocus && state.lastFocus.focus) {
try { state.lastFocus.focus({ preventScroll: true }); } catch (e) {}
}
}
function teardown() {
if (state.root && state.root.parentNode) state.root.parentNode.removeChild(state.root);
state.root = state.card = null;
state.open = false; state.escalated = false; state.prefsOpen = false;
document.removeEventListener('keydown', onKey, true);
}
function togglePrefs(btn) {
var panel = state.root.querySelector('#swc-prefs');
if (!panel) return;
state.prefsOpen = !state.prefsOpen;
panel.hidden = !state.prefsOpen;
btn.setAttribute('aria-expanded', String(state.prefsOpen));
btn.textContent = state.prefsOpen ? 'Hide the details' : 'Choose what we store';
var accept = state.root.querySelector('[data-swc="accept"]');
if (accept) {
accept.dataset.swc = state.prefsOpen ? 'save' : 'accept';
accept.textContent = state.prefsOpen ? 'Save my choices' : 'Accept';
}
}
function onKey(e) {
if (!state.open) return;
if (e.key === 'Tab' && state.escalated) trapFocus(e);
}
function trapFocus(e) {
var f = state.card.querySelectorAll(
'a[href], button:not([disabled]), input:not([disabled])');
if (!f.length) return;
var first = f[0], last = f[f.length - 1];
if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function show() {
if (state.open) return;
state.root = build();
document.body.appendChild(state.root);
state.card = state.root.querySelector('.swc-card');
state.open = true;
state.root.addEventListener('click', function (e) {
var t = e.target.closest('[data-swc]');
if (!t) return;
var a = t.dataset.swc;
if (a === 'accept')         decide(grantAll());
else if (a === 'necessary') decide(grantNecessary());
else if (a === 'save')      decide(grantChosen());
else if (a === 'manage')  { togglePrefs(t); disarm(); }
});
state.root.addEventListener('pointerdown', function () {
if (!state.escalated) arm();
});
document.addEventListener('keydown', onKey, true);
arm();
}
var api = {
init: function (opts) {
ensureCss();
state.cfg = resolve(opts);
var saved = read();
if (saved) { state.choice = saved; emit(saved); return saved; }
var start = function () { show(); };
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', start);
} else { start(); }
return null;
},
open: function () {
if (!state.cfg) state.cfg = resolve();
if (state.open) return;
try { global.localStorage.removeItem(KEY); } catch (e) {}
state.choice = null;
show();
},
allows: function (cat) {
var c = state.choice || read();
if (!c) return CATALOGUE[cat] ? !!CATALOGUE[cat].required : false;
return !!(c.granted && c.granted[cat]);
},
get: function () { return state.choice || read(); },
categories: CATALOGUE,
SWIFTAW_PRIVACY: SWIFTAW_PRIVACY
};
global.SwiftawConsent = api;
if (SELF && SELF.dataset && SELF.dataset.product) {
api.init();
}
})(window);
