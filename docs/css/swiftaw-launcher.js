(function () {
'use strict';
if (window.SwiftawLauncher) return;
var FAV_KEY = 'swiftaw.launcher.favourites.v1';
var ORIGIN  = 'https://swiftaw.com';
var POPOVER_EVT = 'swiftaw:popover';
var BASE = (function () {
var s = document.currentScript ||
document.querySelector('script[src*="swiftaw-launcher"]');
try { if (s && s.src) return new URL('../', s.src).href.replace(/\/$/, ''); }
catch (e) {  }
return ORIGIN;
})();
var ENTRIES = [
{
id: 'fortized', name: 'Fortized', kind: 'product',
what: 'Bastions, channels and DMs',
href: 'https://fortized.com',
icon: BASE + '/product-logos/Fortized%20icon.png'
},
{
id: 'hereld', name: 'Hereld', kind: 'product',
what: 'A professional network',
href: null, soon: true,
icon: BASE + '/product-logos/Hereld%20icon.png'
},
{
id: 'lifecheck', name: 'Lifecheck', kind: 'service',
what: 'Human verification',
href: ORIGIN + '/lifecheck/',
icon: BASE + '/product-logos/Lifecheck%20icon.png'
},
{
id: 'workstation', name: 'Workstation', kind: 'service',
what: 'Icons, and the rest of the bench',
href: ORIGIN + '/icons/',
icon: BASE + '/Workstation%20logo.png', crop: 'left'
},
{
id: 'supernova', name: 'Supernova', kind: 'service',
what: 'The AI service',
href: ORIGIN + '/supernova/',
icon: BASE + '/product-logos/Supernova%20icon.png'
}
];
var STAR_ON  = '<svg viewBox="0 0 576 512" aria-hidden="true"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>';
var STAR_OFF = '<svg viewBox="0 0 576 512" aria-hidden="true"><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>';
function readFavs() {
try {
var v = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
return Array.isArray(v) ? v.filter(function (id) { return byId(id); }) : [];
} catch (e) { return []; }
}
function writeFavs(list) {
try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
}
function byId(id) {
for (var i = 0; i < ENTRIES.length; i++) if (ENTRIES[i].id === id) return ENTRIES[i];
return null;
}
function esc(s) {
return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
});
}
function Launcher(host, opts) {
opts = opts || {};
this.host = host;
this.current = (opts.current || '').toLowerCase();
this.theme = opts.theme || '';
this.align = opts.align || 'right';
this.open_ = false;
this.build();
}
Launcher.prototype.build = function () {
var self = this;
var root = document.createElement('div');
root.className = 'swl-root' + (this.align === 'left' ? ' align-left' : '');
if (this.theme) root.setAttribute('data-theme', this.theme);
root.innerHTML =
'<button class="swl-btn" type="button" aria-expanded="false" ' +
'aria-haspopup="true" aria-label="Swiftaw products and services">' +
'<i></i><i></i><i></i><i></i>' +
'</button>' +
'<div class="swl-panel" hidden role="dialog" aria-label="Swiftaw ecosystem">' +
'<div class="swl-stripe"><i></i><i></i><i></i><i></i><i></i></div>' +
'<div class="swl-scroll"></div>' +
'</div>';
this.root  = root;
this.btn   = root.querySelector('.swl-btn');
this.panel = root.querySelector('.swl-panel');
this.body  = root.querySelector('.swl-scroll');
this.btn.addEventListener('click', function (e) {
e.stopPropagation();
self.toggle();
});
this._onDoc = function (e) { if (!root.contains(e.target)) self.close(); };
this._onKey = function (e) {
if (e.key === 'Escape' && self.open_) { self.close(); self.btn.focus(); }
};
this.host.appendChild(root);
this.render();
};
Launcher.prototype.sectionHTML = function (label, items, favs) {
if (!items.length) return '';
var self = this;
return '<div class="swl-sec"><div class="swl-sec-label">' + esc(label) + '</div>' +
'<div class="swl-grid">' +
items.map(function (e) { return self.tileHTML(e, favs); }).join('') +
'</div></div>';
};
Launcher.prototype.tileHTML = function (e, favs) {
var here = this.current && this.current === e.id;
var fav  = favs.indexOf(e.id) >= 0;
var soon = !!e.soon || !e.href;
var tag  = soon ? 'div' : 'a';
var attr = ' title="' + esc(e.name + ' - ' + e.what) + '"' + (soon
? ' class="swl-tile is-soon"'
: ' class="swl-tile" href="' + esc(e.href) + '"' +
(here ? '' : ' rel="noopener"'));
var flag = here ? '<span class="swl-flag swl-flag--here">You\'re here</span>'
: soon ? '<span class="swl-flag swl-flag--soon">Coming soon</span>'
: '';
return '<' + tag + attr + ' data-id="' + esc(e.id) + '">' +
'<img class="swl-ico' + (e.crop ? ' swl-ico--' + esc(e.crop) : '') + '" src="' +
esc(e.icon) + '" alt="" width="52" height="52" loading="lazy">' +
'<span class="swl-meta">' +
'<span class="swl-name">' + esc(e.name) + '</span>' + flag +
'</span>' +
'<button class="swl-star' + (fav ? ' on' : '') + '" type="button" ' +
'data-fav="' + esc(e.id) + '" aria-pressed="' + (fav ? 'true' : 'false') + '" ' +
'aria-label="' + (fav ? 'Unpin ' : 'Pin ') + esc(e.name) + ' from favourites">' +
(fav ? STAR_ON : STAR_OFF) +
'</button>' +
'</' + tag + '>';
};
Launcher.prototype.render = function () {
var favs = readFavs();
var self = this;
function unstarred(kind) {
return ENTRIES.filter(function (e) {
return e.kind === kind && favs.indexOf(e.id) < 0;
});
}
var favItems = favs.map(byId).filter(Boolean);
var products = unstarred('product');
var services = unstarred('service');
var favSection = favItems.length
? this.sectionHTML('Favourites', favItems, favs)
: '<div class="swl-sec"><div class="swl-sec-label">Favourites</div>' +
'<div class="swl-empty">Nothing pinned yet. Star anything below and it lands up here.</div></div>';
this.body.innerHTML =
favSection +
this.sectionHTML('Swiftaw Products', products, favs) +
this.sectionHTML('Swiftaw Services', services, favs);
this.body.querySelectorAll('[data-fav]').forEach(function (b) {
b.addEventListener('click', function (ev) {
ev.preventDefault(); ev.stopPropagation();
self.toggleFav(b.getAttribute('data-fav'));
});
});
};
Launcher.prototype.toggleFav = function (id) {
var favs = readFavs(), i = favs.indexOf(id);
if (i >= 0) favs.splice(i, 1); else favs.push(id);
writeFavs(favs);
this.render();
};
Launcher.prototype.open = function () {
if (this.open_) return;
this.open_ = true;
this.render();
this.panel.hidden = false;
this.btn.setAttribute('aria-expanded', 'true');
if (window.matchMedia && window.matchMedia('(max-width: 560px)').matches) {
this.backdrop = document.createElement('div');
this.backdrop.className = 'swl-backdrop';
this.backdrop.addEventListener('click', this.close.bind(this));
document.body.appendChild(this.backdrop);
}
document.addEventListener('click', this._onDoc);
document.addEventListener('keydown', this._onKey);
document.dispatchEvent(new CustomEvent(POPOVER_EVT, { detail: { id: 'launcher' } }));
};
Launcher.prototype.close = function () {
if (!this.open_) return;
this.open_ = false;
this.panel.hidden = true;
this.btn.setAttribute('aria-expanded', 'false');
if (this.backdrop) { this.backdrop.remove(); this.backdrop = null; }
document.removeEventListener('click', this._onDoc);
document.removeEventListener('keydown', this._onKey);
};
Launcher.prototype.toggle = function () { this.open_ ? this.close() : this.open(); };
document.addEventListener(POPOVER_EVT, function (e) {
if (instance && (!e.detail || e.detail.id !== 'launcher')) instance.close();
});
var instance = null;
function ensureCss(src) {
if (document.querySelector('link[data-swl-css]')) return;
var l = document.createElement('link');
l.rel = 'stylesheet'; l.href = src; l.setAttribute('data-swl-css', '');
document.head.appendChild(l);
}
function mount(el, opts) {
instance = new Launcher(el, opts);
return instance;
}
function dock() {
var d = document.getElementById('swiftaw-dock');
if (!d) {
d = document.createElement('div');
d.id = 'swiftaw-dock';
d.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9300;' +
'display:flex;align-items:center;gap:10px';
document.body.appendChild(d);
}
return d;
}
function autoMount() {
var s = document.currentScript ||
document.querySelector('script[src*="swiftaw-launcher"]');
var d = (s && s.dataset) || {};
if (!document.querySelector('link[data-swl-css]') && s && s.src) {
try { ensureCss(new URL('swiftaw-launcher.css', s.src).href); } catch (e) {}
}
var slot = document.querySelector('[data-swiftaw-launcher]');
if (slot) { slot.style.display = 'flex'; slot.style.alignItems = 'center'; }
if (!slot) {
slot = document.createElement('div');
slot.setAttribute('data-swl-dock-item', '');
dock().appendChild(slot);
}
mount(slot, {
current: d.current || '',
theme:   d.theme   || '',
align:   d.align   || 'right'
});
}
window.SwiftawLauncher = {
mount: mount,
open:  function () { instance && instance.open(); },
close: function () { instance && instance.close(); },
toggle:function () { instance && instance.toggle(); },
favourites: readFavs,
entries: ENTRIES
};
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', autoMount);
} else {
autoMount();
}
})();
