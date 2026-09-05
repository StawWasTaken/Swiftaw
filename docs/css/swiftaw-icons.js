(function () {
'use strict';
var PER = 48;
var SWATCHES = [
['#FFF93E', 'Yellow'], ['#FF0033', 'Red'], ['#3ECF6E', 'Green'],
['#2CAFFC', 'Blue'], ['#FF77E4', 'Pink'],
['#FFFFFF', 'White'], ['#0C0F15', 'Ink']
];
function el(id) { return document.getElementById(id); }
function slugify(s) {
return String(s == null ? '' : s).toLowerCase().normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
function esc(s) {
return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
});
}
function safeBody(b) {
if (!b) return '';
if (/<\s*script/i.test(b) || /\son[a-z]+\s*=/i.test(b) ||
/javascript\s*:/i.test(b) || /<\s*(foreignobject|iframe|image|use|style)\b/i.test(b)) {
return '';
}
return b;
}
function clean(b) {
var out = String(safeBody(b) || '')
.replace(/<!--[\s\S]*?-->/g, '')
.replace(/<\s*(title|desc|metadata)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
.replace(/<\s*(title|desc|metadata)\b[^>]*\/\s*>/gi, '')
.replace(/\s(?:data-name|inkscape:[\w-]+|sodipodi:[\w-]+|serif:id|xmlns:[\w-]+)\s*=\s*(["'])[\s\S]*?\1/gi, '');
out = out.replace(/\sclass\s*=\s*(["'])[\s\S]*?\1/gi, '');
if (!/url\(\s*#/.test(out)) {
out = out.replace(/\sid\s*=\s*(["'])[\s\S]*?\1/gi, '');
} else {
var map = {}, n = 0;
out = out.replace(/\sid\s*=\s*(["'])([^"']*)\1/gi, function (m, q, id) {
if (!map[id]) map[id] = 's' + (++n);
return ' id="' + map[id] + '"';
});
out = out.replace(/url\(\s*#([^)\s"']+)\s*\)/gi, function (m, id) {
return map[id] ? 'url(#' + map[id] + ')' : m;
});
}
return out.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
}
var PAINT = ['fill', 'stroke', 'stop-color', 'fill-opacity', 'stroke-opacity',
'opacity', 'style', 'mask', 'clip-path', 'filter', 'color'];
var PAINT_TAGS = ['defs', 'linearGradient', 'radialGradient', 'pattern', 'mask',
'clipPath', 'filter', 'style', 'title', 'desc', 'metadata'];
function readSvg(text) {
var doc = new DOMParser().parseFromString(String(text || ''), 'image/svg+xml');
if (!doc.getElementsByTagName('parsererror').length &&
doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'svg') {
return doc.documentElement;
}
var alt = new DOMParser().parseFromString(String(text || ''), 'text/html');
return alt.querySelector('svg');
}
function flatten(text, weld) {
var root = readSvg(text);
if (!root) return null;
var vb = root.getAttribute('viewBox') || root.getAttribute('viewbox');
if (!vb) {
var w = parseFloat(root.getAttribute('width'));
var h = parseFloat(root.getAttribute('height'));
if (!(w > 0 && h > 0)) return null;
vb = '0 0 ' + w + ' ' + h;
}
PAINT_TAGS.forEach(function (t) {
var n = root.getElementsByTagName(t), i;
for (i = n.length - 1; i >= 0; i--) n[i].parentNode.removeChild(n[i]);
});
var ink = weld || 'currentColor';
(function walk(node) {
var kids = Array.prototype.slice.call(node.children), i;
for (i = 0; i < kids.length; i++) walk(kids[i]);
if (node === root) return;
var line = (node.getAttribute('stroke') || '').trim().toLowerCase();
var hollow = (node.getAttribute('fill') || '').trim().toLowerCase() === 'none';
PAINT.forEach(function (a) { node.removeAttribute(a); });
node.removeAttribute('id'); node.removeAttribute('class');
if (line && line !== 'none') {
node.setAttribute('stroke', ink);
if (hollow) node.setAttribute('fill', 'none');
}
})(root);
var out = '';
Array.prototype.forEach.call(root.childNodes, function (n) {
if (n.nodeType === 1) out += new XMLSerializer().serializeToString(n);
});
out = clean(out.replace(/\sxmlns(:\w+)?="[^"]*"/g, ''));
if (!out) return null;
if (weld) out = '<g fill="' + esc(weld) + '">' + out + '</g>';
return '<svg viewBox="' + esc(vb) + '">' + out + '</svg>';
}
function drawIcon(row, attrs) {
var body = clean(row.body);
if (!body) return '';
return '<svg viewBox="' + esc(row.view_box) + '" ' + attrs + '>' + body + '</svg>';
}
function catMark(c, cls) {
var body = clean(c.mark_body || c.icon_body || '');
if (body) {
return '<span class="' + cls + '" aria-hidden="true"><svg viewBox="' +
esc(c.mark_view_box || c.icon_view_box || '0 0 24 24') +
'" fill="currentColor">' + body + '</svg></span>';
}
return '<span class="' + cls + ' is-letter" aria-hidden="true">' +
esc(String(c.name || '?').trim().charAt(0).toUpperCase()) + '</span>';
}
var LICENCE = 'Free to use in your own work, on its own or changed, with no ' +
'credit required. Not for resale or for redistribution as a set.';
function stamp(row) {
var n = String(row.name || 'Icon').replace(/-{2,}/g, '-').replace(/[<>]/g, '');
return '<!-- ' + n + ' - Swiftaw Icons\n' +
'     Drawn and written out by Swiftaw. ' + LICENCE + '\n' +
'     © ' + new Date().getFullYear() + ' Swiftaw -->\n';
}
function lay(body, pad) {
var root = readSvg('<svg>' + body + '</svg>');
if (!root) return pad + body;
function line(node, depth) {
var tab = pad + new Array(depth + 1).join('  ');
var kids = Array.prototype.filter.call(node.children, function (n) {
return n.nodeType === 1;
});
var open = new XMLSerializer().serializeToString(node)
.replace(/\sxmlns(:\w+)?="[^"]*"/g, '');
if (!kids.length) return tab + open;
var name = node.nodeName;
var head = open.slice(0, open.indexOf('>') + 1);
return tab + head + '\n' +
kids.map(function (k) { return line(k, depth + 1); }).join('\n') + '\n' +
tab + '</' + name + '>';
}
return Array.prototype.map.call(root.children, function (n) {
return line(n, 0);
}).join('\n');
}
function snippet(row, kind, colour) {
var body = clean(row.body);
var vb = esc(row.view_box);
if (kind === 'html') {
return '<svg viewBox="' + vb + '" width="1em" height="1em" ' +
(row.monochrome ? 'fill="currentColor" ' : '') +
'aria-hidden="true" focusable="false">\n' +
lay(body, '  ') + '\n</svg>';
}
return stamp(row) +
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" ' +
'width="24" height="24"' +
(row.monochrome ? ' fill="' + esc(colour || '#000000') + '"' : '') +
'>\n' + lay(body, '  ') + '\n</svg>\n';
}
function copy(text) {
if (navigator.clipboard && navigator.clipboard.writeText) {
return navigator.clipboard.writeText(text);
}
return new Promise(function (res, rej) {
var t = document.createElement('textarea');
t.value = text; t.setAttribute('readonly', '');
t.style.cssText = 'position:fixed;top:-1000px';
document.body.appendChild(t); t.select();
var ok = false;
try { ok = document.execCommand('copy'); } catch (e) {}
document.body.removeChild(t);
ok ? res() : rej();
});
}
var ICO = {
search: '<svg viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>',
x: '<svg viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>',
copy: '<svg viewBox="0 0 448 512"><path d="M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z"/></svg>',
tick: '<svg viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>',
left: '<svg viewBox="0 0 320 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>',
right: '<svg viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>',
all: '<rect x="2.5" y="2.5" width="8.5" height="8.5" rx="2.2"/>' +
'<rect x="13" y="2.5" width="8.5" height="8.5" rx="2.2"/>' +
'<rect x="2.5" y="13" width="8.5" height="8.5" rx="2.2"/>' +
'<rect x="13" y="13" width="8.5" height="8.5" rx="2.2"/>'
};
var rankAsked = null;
function rankOnce(db) {
if (!rankAsked) {
rankAsked = db.rpc('icon_my_rank').then(function (r) {
return r.error ? 0 : (r.data || 0);
}, function () { return 0; });
}
return rankAsked;
}
function chrome() {
var hidden = document.querySelectorAll('[data-ic-staff]');
if (!hidden.length || !window.SwiftawAccount) return;
window.SwiftawAccount.ready(function () {
rankOnce(window.SwiftawAccount.client()).then(function (rank) {
if (rank < 2) return;
Array.prototype.forEach.call(hidden, function (n) { n.hidden = false; });
});
});
}
function browse() {
var db = null;
var state = { q: '', cat: '', page: 1, total: 0, rows: [] };
var cats = [];
var grid = el('icGrid'), pager = el('icPager'), pageN = el('icPageN');
var input = el('icQ'), searchWrap = el('icSearch'), count = el('icCount');
var catBox = el('icCats');
var timer = null;
function readUrl() {
var p = new URLSearchParams(location.search);
state.q = p.get('q') || '';
state.cat = p.get('c') || '';
state.page = Math.max(1, parseInt(p.get('p') || '1', 10) || 1);
}
function writeUrl(push) {
var p = new URLSearchParams();
if (state.q) p.set('q', state.q);
if (state.cat) p.set('c', state.cat);
if (state.page > 1) p.set('p', String(state.page));
var url = location.pathname + (p.toString() ? '?' + p : '');
history[push ? 'pushState' : 'replaceState']({}, '', url);
}
function skeletons() {
var s = '';
for (var i = 0; i < 18; i++) s += '<div class="ic-skel"></div>';
grid.innerHTML = s;
pager.hidden = true;
}
function paintCats() {
var h = '<button type="button" class="ic-cat' + (state.cat ? '' : ' is-on') +
'" data-cat="">' + catMark({ name: 'Everything', icon_body: ICO.all,
icon_view_box: '0 0 24 24' }, 'ic-cat-ico') +
'<span class="ic-cat-name">Everything</span></button>';
cats.forEach(function (c) {
h += '<button type="button" class="ic-cat' + (state.cat === c.slug ? ' is-on' : '') +
'" data-cat="' + esc(c.slug) + '">' + catMark(c, 'ic-cat-ico') +
'<span class="ic-cat-name">' + esc(c.name) + '</span></button>';
});
catBox.innerHTML = h;
}
function emptyText() {
if (state.q) {
return ['Nothing matches "' + esc(state.q) + '".',
'Try a shorter word, or clear the category.'];
}
if (state.cat) {
var name = '';
cats.forEach(function (c) { if (c.slug === state.cat) name = c.name; });
return ['Nothing in ' + esc(name || 'this category') + ' yet.',
'The category exists so icons can be filed into it. This one is waiting for its first.'];
}
return ['The library is empty.',
'Every icon here is drawn by us and uploaded through the site, so it starts at zero and grows at the speed we draw.'];
}
function paint() {
if (!state.rows.length) {
var t = emptyText();
grid.innerHTML = '<div class="ic-empty"><h3>' + t[0] + '</h3><p>' + t[1] + '</p></div>';
pager.hidden = true;
count.textContent = '';
return;
}
var h = '';
state.rows.forEach(function (r, i) {
h += '<button type="button" class="ic-tile' + (r.monochrome ? '' : ' is-colour') +
'" data-i="' + i + '" title="' + esc(r.name) + '">' +
drawIcon(r, 'aria-hidden="true"') +
'<b>' + esc(r.name) + '</b></button>';
});
grid.innerHTML = h;
var pages = Math.max(1, Math.ceil(state.total / PER));
pager.hidden = pages < 2;
pageN.textContent = state.page + ' / ' + pages;
el('icPrev').disabled = state.page <= 1;
el('icNext').disabled = state.page >= pages;
count.textContent = state.total + (state.total === 1 ? ' icon' : ' icons');
}
function load() {
skeletons();
var from = (state.page - 1) * PER;
var q = db.from('icons')
.select('slug,name,body,view_box,monochrome,tags,created_at,icon_categories(name,slug)',
{ count: 'exact' })
.eq('published', true)
.order('created_at', { ascending: false })
.range(from, from + PER - 1);
if (state.cat) {
var id = null;
cats.forEach(function (c) { if (c.slug === state.cat) id = c.id; });
q = q.eq('category_id', id || '00000000-0000-0000-0000-000000000000');
}
if (state.q) q = q.ilike('search', '%' + state.q.toLowerCase().replace(/[%_]/g, '') + '%');
q.then(function (res) {
if (res.error) {
grid.innerHTML = '<div class="ic-empty"><h3>The library did not answer.</h3><p>' +
esc(res.error.message) + '</p></div>';
pager.hidden = true;
return;
}
state.rows = res.data || [];
state.total = res.count == null ? state.rows.length : res.count;
var pages = Math.max(1, Math.ceil(state.total / PER));
if (state.page > pages && state.total) { state.page = pages; writeUrl(false); load(); return; }
paint();
});
}
function go(push) { writeUrl(push !== false); load(); }
var scrim = el('icScrim'), card = el('icCard');
var open = null, colour = null, tab = 'svg';
function paintCard() {
var r = open;
if (!r) return;
var fill = r.monochrome ? (colour || '#FFFFFF') : null;
var cat = r.icon_categories || {};
var h = '';
h += '<button class="nb-icon-btn nb-icon-btn--round ic-x" type="button" id="icClose" aria-label="Close">' + ICO.x + '</button>';
h += '<div class="ic-card-top">';
h += '<div class="ic-stage" id="icStage">' +
drawIcon(r, 'aria-hidden="true"' + (fill ? ' fill="' + esc(fill) + '"' : '')) +
'</div>';
h += '<div class="ic-card-head">';
h += '<h2>' + esc(r.name) + '</h2>';
h += '<code class="ic-slug">' + esc(r.slug) + '</code>';
h += '<div class="ic-meta">';
if (cat.name) h += '<span class="nb-tag nb-tag--yellow">' + esc(cat.name) + '</span>';
(r.tags || []).forEach(function (t) { h += '<span class="nb-tag">' + esc(t) + '</span>'; });
h += '</div>';
if (r.monochrome) {
h += '<div class="ic-colours" id="icSw">';
SWATCHES.forEach(function (s) {
h += '<button type="button" class="ic-sw' + (fill === s[0] ? ' is-on' : '') +
'" style="background:' + s[0] + '" data-c="' + s[0] + '" title="' + s[1] +
'" aria-label="' + s[1] + '"></button>';
});
h += '</div>';
} else {
h += '<p class="ic-fixed">This mark carries its own colours, so there is nothing here to change. Recolouring it would make it a different mark.</p>';
}
h += '</div></div>';
h += '<div class="ic-copy">';
h += '<div class="ic-tabs" id="icTabs">' +
'<button type="button" class="ic-tab' + (tab === 'svg' ? ' is-on' : '') + '" data-t="svg">SVG</button>' +
'<button type="button" class="ic-tab' + (tab === 'html' ? ' is-on' : '') + '" data-t="html">HTML</button>' +
'</div>';
h += '<div class="ic-code" id="icCode"><code>' + esc(snippet(r, tab, fill)) + '</code>' +
'<button class="ic-code-btn" type="button" id="icCopy" aria-label="Copy">' + ICO.copy + '</button>' +
'</div>';
h += '<div class="ic-card-foot"><span>' +
(tab === 'svg'
? 'A file on its own, at 24 pixels in the colour above.'
: 'A tag for your markup. It takes the size and colour of the text around it.') +
'</span></div>';
h += '<p class="ic-licence">Written out by Swiftaw. ' + esc(LICENCE) + '</p>';
h += '</div>';
card.innerHTML = h;
}
function openCard(r) {
open = r; colour = r.monochrome ? '#FFFFFF' : null; tab = 'svg';
scrim.hidden = false;
document.body.style.overflow = 'hidden';
paintCard();
var b = el('icClose'); if (b) b.focus();
}
function closeCard() {
open = null; scrim.hidden = true;
document.body.style.overflow = '';
}
grid.addEventListener('click', function (e) {
var t = e.target.closest('.ic-tile');
if (t) openCard(state.rows[+t.dataset.i]);
});
catBox.addEventListener('click', function (e) {
var b = e.target.closest('.ic-cat');
if (!b) return;
state.cat = b.dataset.cat; state.page = 1;
paintCats(); go();
});
input.addEventListener('input', function () {
searchWrap.classList.toggle('has-q', !!input.value);
clearTimeout(timer);
timer = setTimeout(function () {
state.q = input.value.trim(); state.page = 1;
writeUrl(false); load();
}, 220);
});
el('icClearQ').addEventListener('click', function () {
input.value = ''; searchWrap.classList.remove('has-q');
state.q = ''; state.page = 1; go(); input.focus();
});
el('icPrev').addEventListener('click', function () {
if (state.page > 1) { state.page--; go(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});
el('icNext').addEventListener('click', function () {
state.page++; go(); window.scrollTo({ top: 0, behavior: 'smooth' });
});
card.addEventListener('click', function (e) {
var sw = e.target.closest('.ic-sw');
if (sw) { colour = sw.dataset.c; paintCard(); return; }
var tb = e.target.closest('.ic-tab');
if (tb) { tab = tb.dataset.t; paintCard(); return; }
if (e.target.closest('#icClose')) { closeCard(); return; }
var cp = e.target.closest('#icCopy');
if (cp) {
copy(snippet(open, tab, colour)).then(function () {
cp.classList.add('is-done'); cp.innerHTML = ICO.tick;
setTimeout(function () { cp.classList.remove('is-done'); cp.innerHTML = ICO.copy; }, 1400);
});
}
});
scrim.addEventListener('click', function (e) { if (e.target === scrim) closeCard(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) closeCard(); });
card.addEventListener('dragstart', function (e) { if (e.target.closest('.ic-stage')) e.preventDefault(); });
card.addEventListener('contextmenu', function (e) { if (e.target.closest('.ic-stage')) e.preventDefault(); });
window.addEventListener('popstate', function () {
readUrl();
input.value = state.q;
searchWrap.classList.toggle('has-q', !!state.q);
paintCats(); load();
});
readUrl();
input.value = state.q;
searchWrap.classList.toggle('has-q', !!state.q);
el('icClearQ').innerHTML = ICO.x;
el('icSearchIco').outerHTML = ICO.search;
el('icPrev').innerHTML = ICO.left;
el('icNext').innerHTML = ICO.right;
skeletons();
window.SwiftawAccount.ready(function () {
db = window.SwiftawAccount.client();
db.rpc('icon_category_list').then(function (res) {
cats = res.data || [];
paintCats();
load();
});
var mg = el('icStaff');
if (mg) rankOnce(db).then(function (rank) {
if (rank >= 2) mg.hidden = false;
});
});
}
function upload() {
var db = null, checked = null, rank = 0, cats = [];
var gate = el('icGate'), form = el('icUpForm');
var view = el('icView'), track = el('icTrack'), rail = el('icRail');
var steps = Array.prototype.slice.call(track.children);
var editing = new URLSearchParams(location.search).get('slug') || '';
var at = 0, far = 0;
var pic = null, traceT = null;
var ink = '#FFFFFF', weld = false;
var DETAIL = [
{ eps: 1.9, word: 'Loose' }, { eps: 1.3, word: 'Easy' }, { eps: 0.9, word: 'Medium' },
{ eps: 0.6, word: 'Close' }, { eps: 0.38, word: 'Tight' }
];
function sync() {
var pad = steps[at].firstElementChild;
view.style.height = pad.offsetHeight + 'px';
}
function go(i) {
if (i < 0 || i > 2) return;
at = i;
if (i > far) far = i;
track.style.transform = 'translateX(' + (-i * 100) + '%)';
steps.forEach(function (s, n) {
s.setAttribute('aria-hidden', n === i ? 'false' : 'true');
if ('inert' in s) s.inert = n !== i;
});
Array.prototype.forEach.call(rail.children, function (p, n) {
p.classList.toggle('is-on', n === i);
p.classList.toggle('is-done', n < far || (n < i));
p.classList.toggle('is-open', n <= far);
});
el('icBack').hidden = i === 0;
el('icNext').hidden = i === 2;
el('icSave').hidden = i !== 2;
if (i === 2) paintFinal();
gateNext();
sync();
}
function gateNext() {
var ok = true;
if (at === 0) ok = !!checked;
if (at === 1) ok = !!(el('icName').value.trim() && el('icSlug').value.trim() && el('icCat').value);
el('icNext').disabled = !ok;
el('icSave').disabled = !(checked && el('icName').value.trim() &&
el('icSlug').value.trim() && el('icCat').value);
}
function verdict(kind, title, body, preview) {
var v = el('icVerdict');
v.hidden = false;
v.classList.toggle('is-bad', kind === 'bad');
v.innerHTML = (preview ? '<div class="ic-stage">' + preview + '</div>' : '<div></div>') +
'<div><b>' + esc(title) + '</b><p>' + esc(body) + '</p></div>';
sync();
}
function said(kind, title, body) {
var s = el('icSaid');
s.hidden = false;
s.classList.toggle('is-bad', kind === 'bad');
s.innerHTML = '<b>' + esc(title) + '</b><p>' + esc(body) + '</p>';
sync();
}
function composed() {
var raw = el('icSvg').value;
if (!raw.trim()) return '';
return flatten(raw, weld ? ink : null) || raw;
}
function check() {
var svg = composed();
checked = null;
gateNext();
if (!svg.trim()) { el('icVerdict').hidden = true; sync(); return; }
db.rpc('icon_check_svg', { p_svg: svg }).then(function (res) {
if (res.error) { verdict('bad', 'The check did not run.', res.error.message); return; }
var r = res.data;
if (!r.ok) { verdict('bad', 'Not accepted.', r.error); return; }
checked = r;
gateNext();
verdict('ok',
r.monochrome ? 'Accepted, one colour.' : 'Accepted, keeps its own colours.',
r.monochrome
? 'It will take the colour of the text around it, and the card will offer the colour control.'
: 'This one is welded to ' + ink + ', so the card will say the colour is part of the ' +
'mark rather than offering a control that would do nothing.',
'<svg viewBox="' + esc(r.view_box) + '" ' +
(r.monochrome ? 'fill="' + esc(ink) + '"' : '') + '>' + safeBody(r.body) + '</svg>');
});
}
function paintInk() {
var box = el('icInk');
if (!box) return;
box.innerHTML = SWATCHES.map(function (s) {
return '<button type="button" class="ic-sw' + (ink === s[0] ? ' is-on' : '') +
'" style="background:' + s[0] + '" data-c="' + s[0] + '" title="' + s[1] +
'" aria-label="' + s[1] + '"></button>';
}).join('') +
'<label class="ic-ink-own" title="Any other colour">' +
'<input type="color" id="icInkOwn" value="' + esc(ink) + '" aria-label="Any other colour">' +
'</label>';
var out = el('icTraceOut').firstElementChild;
if (out) out.setAttribute('fill', ink);
var v = el('icVerdict').querySelector('svg');
if (v && checked && checked.monochrome) v.setAttribute('fill', ink);
}
function traceOpts() {
return {
cut: parseInt(el('icCut').value, 10) / 100,
detail: DETAIL[parseInt(el('icDet').value, 10) - 1].eps,
invert: el('icInv').checked,
trim: el('icTrim').checked
};
}
function retrace() {
if (!pic) return;
var out;
try { out = window.SwiftawTrace.fromImage(pic.image, traceOpts()); }
catch (e) { out = null; }
if (!out) {
el('icTraceOut').innerHTML = '';
el('icTraceSaid').textContent =
'Nothing came back at this setting. Move the edge, or take the other half.';
el('icSvg').value = '';
check();
return;
}
el('icTraceOut').innerHTML = '<svg viewBox="' + esc(out.viewBox) +
'" fill="' + esc(ink) + '">' + out.body + '</svg>';
var note = out.shapes + (out.shapes === 1 ? ' shape' : ' shapes') + ', ' +
Math.round(out.bytes / 1024 * 10) / 10 + ' KB of outline.';
if (out.coarse) note += ' Read less finely than asked, because at that setting it came out ' +
'bigger than an icon is allowed to be.';
if (!out.flat) note += ' The artwork is not flat, so this is a silhouette of it rather than ' +
'a copy. Tracing only reads one shape out of a picture.';
el('icTraceSaid').textContent = note;
el('icSvg').value = out.svg;
check();
sync();
}
function nudge() { clearTimeout(traceT); traceT = setTimeout(retrace, 90); }
var STOP = { the: 1, and: 1, icon: 1, png: 1, svg: 1, final: 1, copy: 1, new: 1,
img: 1, image: 1, logo: 0, v1: 1, v2: 1, export: 1, artboard: 1 };
function words(fileName) {
return fileName.replace(/\.[a-z0-9]+$/i, '')
.replace(/[-_.]+/g, ' ')
.replace(/([a-z])([A-Z])/g, '$1 $2')
.toLowerCase().split(/\s+/)
.filter(function (w) { return w.length > 1 && !STOP[w] && !/^\d+$/.test(w); });
}
function seed(fileName) {
var w = words(fileName);
if (!w.length) return;
if (!el('icName').value) {
var n = w.join(' ');
el('icName').value = n.charAt(0).toUpperCase() + n.slice(1);
}
if (!el('icSlug').dataset.touched) el('icSlug').value = slugify(el('icName').value);
var hit = null;
cats.forEach(function (c) {
if (hit) return;
var cw = c.name.toLowerCase().split(/\s+/);
if (w.some(function (x) { return cw.indexOf(x) >= 0 || c.slug === x; })) hit = c.slug;
});
if (hit) { el('icCat').value = hit; window.SwiftawPick.refresh(el('icCat')); }
if (!el('icTags').value) el('icTags').value = w.join(', ');
suggest(w);
gateNext();
}
function suggest(w) {
var box = el('icTagSug');
var have = el('icTags').value.toLowerCase();
var extra = w.filter(function (x) { return have.indexOf(x) < 0; });
if (!extra.length) { box.hidden = true; return; }
box.hidden = false;
box.innerHTML = extra.map(function (x) {
return '<button type="button" class="ic-tagsug-b">+ ' + esc(x) + '</button>';
}).join('');
}
function takeFile(f) {
if (!f) return;
var isSvg = /\.svg$/i.test(f.name) || f.type === 'image/svg+xml';
el('icDrop').classList.add('has-file');
el('icDrop').querySelector('b').textContent = f.name;
if (isSvg) {
pic = null;
el('icTrace').hidden = true;
var fr = new FileReader();
fr.onload = function () {
el('icSvg').value = String(fr.result);
seed(f.name);
check();
};
fr.readAsText(f);
return;
}
window.SwiftawTrace.fromFile(f, traceOpts()).then(function (r) {
pic = { image: r.image, name: f.name };
el('icTrace').hidden = false;
el('icTraceSrc').innerHTML = '';
el('icTraceSrc').appendChild(r.image);
seed(f.name);
retrace();
}).catch(function (e) {
pic = null;
el('icTrace').hidden = true;
verdict('bad', 'That file could not be read.', e.message || String(e));
});
}
function paintFinal() {
var box = el('icFinal');
if (!checked) { box.innerHTML = ''; return; }
var vb = esc(checked.view_box), body = safeBody(checked.body);
var one = function (px) {
return '<div class="ic-final-size"><div class="ic-stage" style="width:' + px +
'px;height:' + px + 'px"><svg viewBox="' + vb + '"' +
(checked.monochrome ? ' fill="' + esc(ink) + '"' : '') + '>' + body + '</svg></div>' +
'<span>' + px + '</span></div>';
};
var cat = '';
cats.forEach(function (c) { if (c.slug === el('icCat').value) cat = c.name; });
var tags = el('icTags').value.split(',').map(function (s) { return s.trim(); })
.filter(Boolean);
box.innerHTML =
'<div class="ic-final-sizes">' + one(96) + one(40) + one(20) + '</div>' +
'<dl class="ic-final-facts">' +
'<div><dt>Name</dt><dd>' + esc(el('icName').value) + '</dd></div>' +
'<div><dt>Address</dt><dd><code>' + esc(el('icSlug').value) + '</code></dd></div>' +
'<div><dt>Category</dt><dd>' + esc(cat || 'None') + '</dd></div>' +
'<div><dt>Tags</dt><dd>' + (tags.length
? tags.map(function (t) { return '<span class="nb-tag">' + esc(t) + '</span>'; }).join('')
: 'None') + '</dd></div>' +
'<div><dt>Colour</dt><dd>' + (checked.monochrome
? 'One colour, and it takes the colour of the text around it'
: 'Welded to ' + esc(ink)) + '</dd></div>' +
'</dl>';
}
function save() {
var btn = el('icSave');
var slug = el('icSlug').value.trim().toLowerCase();
var tags = el('icTags').value.split(',').map(function (s) { return s.trim().toLowerCase(); })
.filter(function (s) { return s; });
return db.rpc('icon_upsert', {
p_slug: slug,
p_name: el('icName').value.trim(),
p_category: el('icCat').value,
p_tags: tags,
p_svg: composed(),
p_publish: el('icPub').checked
}).then(function (res) {
btn.disabled = false;
if (res.error) { said('bad', 'Not saved.', res.error.message); return; }
if (editing) {
editing = slug;
history.replaceState({}, '', location.pathname + '?slug=' + encodeURIComponent(slug));
said('ok', 'Changed.',
el('icPub').checked
? 'The library is showing the new version. Nothing needs deploying.'
: 'Saved, and it is a draft, so it is not in the library.');
return;
}
said('ok', 'Saved.',
el('icPub').checked
? 'It is in the library now. Nothing needs deploying.'
: 'Kept as a draft. It is not in the library until it is published.');
reset();
});
}
function reset() {
form.reset();
el('icSlug').dataset.touched = '';
el('icSvg').value = '';
el('icVerdict').hidden = true;
el('icTrace').hidden = true;
el('icTagSug').hidden = true;
el('icDrop').classList.remove('has-file');
el('icDrop').querySelector('b').textContent = 'Drop a file here, or pick one';
window.SwiftawPick.refresh(el('icCat'));
pic = null; checked = null; far = 0;
ink = '#FFFFFF'; weld = false;
paintInk();
go(0);
}
el('icNext').addEventListener('click', function () { go(at + 1); });
el('icBack').addEventListener('click', function () { go(at - 1); });
rail.addEventListener('click', function (e) {
var p = e.target.closest('.ic-wz-pip');
if (!p) return;
var i = parseInt(p.dataset.go, 10);
if (i <= far) go(i);
});
var t = null;
el('icSvg').addEventListener('input', function () {
pic = null;
el('icTrace').hidden = true;
clearTimeout(t); t = setTimeout(check, 300);
});
el('icName').addEventListener('input', function () {
var s = el('icSlug');
if (!s.dataset.touched) s.value = slugify(el('icName').value);
gateNext();
});
el('icSlug').addEventListener('input', function () {
el('icSlug').dataset.touched = '1'; gateNext();
});
el('icCat').addEventListener('change', gateNext);
el('icTags').addEventListener('input', gateNext);
el('icTagSug').addEventListener('click', function (e) {
var b = e.target.closest('.ic-tagsug-b');
if (!b) return;
var word = b.textContent.replace(/^\+\s*/, '');
var f = el('icTags');
f.value = (f.value.trim() ? f.value.replace(/,\s*$/, '') + ', ' : '') + word;
b.remove();
if (!el('icTagSug').children.length) el('icTagSug').hidden = true;
sync();
});
el('icFile').addEventListener('change', function (e) {
takeFile(e.target.files && e.target.files[0]);
});
['icCut', 'icDet', 'icInv', 'icTrim'].forEach(function (id) {
el(id).addEventListener('input', function () {
el('icCutN').textContent = el('icCut').value;
el('icDetN').textContent = DETAIL[parseInt(el('icDet').value, 10) - 1].word;
nudge();
});
});
el('icInk').addEventListener('click', function (e) {
var sw = e.target.closest('.ic-sw');
if (!sw) return;
ink = sw.dataset.c;
paintInk();
if (weld) check();
});
el('icInk').addEventListener('input', function (e) {
if (e.target.id !== 'icInkOwn') return;
ink = e.target.value.toUpperCase();
paintInk();
if (weld) { clearTimeout(t); t = setTimeout(check, 300); }
});
el('icWeld').addEventListener('change', function () {
weld = el('icWeld').checked;
check();
});
var drop = el('icDrop');
['dragenter', 'dragover'].forEach(function (n) {
drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
});
['dragleave', 'drop'].forEach(function (n) {
drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
});
drop.addEventListener('drop', function (e) {
takeFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
});
el('icRaw').addEventListener('toggle', sync);
window.addEventListener('resize', sync);
form.addEventListener('submit', function (e) {
e.preventDefault();
if (!checked) return;
var btn = el('icSave');
btn.disabled = true;
var slug = el('icSlug').value.trim().toLowerCase();
if (editing && slug !== editing) {
db.rpc('icon_rename', { p_from: editing, p_to: slug }).then(function (res) {
if (res.error) {
btn.disabled = false;
said('bad', 'The address did not change, so nothing else was saved either.',
res.error.message);
return;
}
editing = slug;
save();
});
return;
}
save();
});
var del = el('icDelete');
if (del) del.addEventListener('click', function () {
if (!editing) return;
if (!window.confirm('Delete "' + editing + '"? This cannot be undone. ' +
'Unpublishing takes it out of the library and keeps it.')) return;
del.disabled = true;
db.rpc('icon_delete', { p_slug: editing }).then(function (res) {
if (res.error) { del.disabled = false; said('bad', 'Not deleted.', res.error.message); return; }
location.href = '/icons/manage.html?gone=' + encodeURIComponent(editing);
});
});
function fill(row) {
el('icName').value = row.name;
el('icSlug').value = row.slug;
el('icSlug').dataset.touched = '1';
el('icTags').value = (row.tags || []).join(', ');
el('icPub').checked = !!row.published;
if (row.icon_categories && row.icon_categories.slug) {
el('icCat').value = row.icon_categories.slug;
window.SwiftawPick.refresh(el('icCat'));
}
el('icSvg').value = '<svg viewBox="' + row.view_box + '">' + row.body + '</svg>';
el('icRaw').open = true;
check();
far = 2;
go(1);
}
window.SwiftawAccount.ready(function () {
db = window.SwiftawAccount.client();
rankOnce(db).then(function (got) {
rank = got;
if (rank < 2) {
gate.hidden = false;
gate.querySelector('p').textContent = window.SwiftawAccount.user()
? 'This account cannot add or change icons. That is for Swiftaw admins.'
: 'Sign in with a Swiftaw admin account to add or change an icon.';
return;
}
form.hidden = false;
if (del && rank >= 3 && editing) del.hidden = false;
db.from('icon_categories').select('slug,name').order('position').then(function (r) {
cats = r.data || [];
el('icCat').innerHTML = cats.map(function (c) {
return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>';
}).join('');
window.SwiftawPick.wrap(el('icCat'));
paintInk();
go(0);
if (!editing) return;
var MODE = {
title: 'Edit an icon',
save: 'Save the changes',
lead: 'The drawing here is the icon as the library keeps it, not the file that was ' +
'uploaded: only the shapes and the box survived the check. Drop a new file on ' +
'the first step to replace it, or leave it and change the rest.'
};
document.querySelectorAll('[data-ic-mode]').forEach(function (n) {
if (MODE[n.dataset.icMode]) n.textContent = MODE[n.dataset.icMode];
});
db.from('icons')
.select('slug,name,body,view_box,tags,published,icon_categories(slug)')
.eq('slug', editing).limit(1)
.then(function (r2) {
var row = (r2.data || [])[0];
if (!row) { verdict('bad', 'No icon at that address.',
'It may have been deleted, or moved to another address.'); return; }
fill(row);
});
});
});
});
}
function manage() {
var db = null, rank = 0, page = 1, q = '', total = 0, rows = [];
var gate = el('icMgGate'), wrap = el('icMgWrap'), list = el('icMgList');
var timer = null, cats = [];
function catSaid(kind, text) {
var n = el('icCatSaid');
n.hidden = false;
n.classList.toggle('is-bad', kind === 'bad');
n.textContent = text;
}
function paintCats() {
var borrowed = 0, bare = 0;
cats.forEach(function (c) {
if (c.mark_from === 'first') borrowed++;
else if (!c.icon_body) bare++;
});
var said = [];
if (borrowed) said.push(borrowed + ' borrowing its first icon');
if (bare) said.push(bare + ' still without a mark');
el('icCatN').textContent = cats.length
? cats.length + (cats.length === 1 ? ' shelf' : ' shelves') +
(said.length ? ', ' + said.join(', ') : '')
: 'None yet';
el('icCatRows').innerHTML = cats.map(function (c, i) {
var why = c.icon_body ? 'Change the mark'
: c.mark_from === 'first' ? 'Borrowing its first icon. Choose one instead'
: 'Choose a mark';
return '<div class="ic-cat-row">' +
'<button type="button" class="ic-cat-mark" data-mark="' + i + '" ' +
'aria-label="Mark for ' + esc(c.name) + '" ' +
'title="' + why + '">' +
catMark(c, 'ic-cat-ico') + '</button>' +
'<input class="nb-input" data-name="' + i + '" type="text" value="' + esc(c.name) +
'" maxlength="60" aria-label="Name of ' + esc(c.name) + '">' +
'<code>' + esc(c.slug) + '</code>' +
'<input class="nb-input ic-cat-pos" data-pos="' + i + '" type="number" value="' +
(c.position == null ? 100 : c.position) + '" min="0" max="9999" step="10" ' +
'aria-label="Order of ' + esc(c.name) + '">' +
'<button type="button" class="nb-btn nb-btn--paper nb-btn--sm" data-save="' + i +
'" disabled>Save</button>' +
'</div>';
}).join('');
}
function loadCats() {
db.rpc('icon_category_list')
.then(function (r) { cats = r.data || []; paintCats(); });
}
function putCat(slug, name, pos, icon, source) {
var args = { p_slug: slug, p_name: name, p_position: pos };
if (icon !== undefined) {
args.p_icon = icon;
args.p_icon_source = source || '';
}
return db.rpc('icon_category_upsert', args);
}
var pickOn = null;
function pickShut() {
if (!pickOn) return;
document.removeEventListener('keydown', pickKey);
pickOn.remove();
pickOn = null;
}
function pickKey(e) { if (e.key === 'Escape') pickShut(); }
function pickResults(box, rows, q) {
if (!rows.length) {
box.innerHTML = '<p class="ic-pick-none">' +
(q ? 'Nothing of ours matches "' + esc(q) + '".'
: 'The library has nothing in it yet.') +
' Paste a FontAwesome one below.</p>';
return;
}
box.innerHTML = rows.map(function (r) {
return '<button type="button" class="ic-pick-i" data-slug="' + esc(r.slug) + '" ' +
'title="' + esc(r.name) + '">' +
drawIcon(r, 'aria-hidden="true" fill="currentColor"') +
'<span>' + esc(r.name) + '</span></button>';
}).join('');
}
function markPick(i) {
var c = cats[i];
if (!c) return;
pickShut();
var back = document.createElement('div');
back.className = 'nb-dialog-back';
back.innerHTML =
'<div class="nb-dialog ic-pick" role="dialog" aria-modal="true" aria-label="A mark for ' +
esc(c.name) + '">' +
'<div class="nb-dialog-head"><h2 class="nb-h4">A mark for ' + esc(c.name) + '</h2></div>' +
'<div class="nb-dialog-body">' +
'<label class="nb-label" for="icPickQ">Ours</label>' +
'<input class="nb-input" id="icPickQ" type="search" autocomplete="off" ' +
'placeholder="Search the library">' +
'<div class="ic-pick-grid" id="icPickGrid"></div>' +
'<div class="ic-pick-or"><span>Nothing above fits</span></div>' +
'<label class="nb-label" for="icPickPaste">A FontAwesome one</label>' +
'<textarea class="nb-input ic-pick-paste" id="icPickPaste" rows="3" ' +
'placeholder="Paste the whole SVG"></textarea>' +
'<p class="nb-note">It goes through the same check an uploaded icon does. ' +
'It stays on this shelf and is never handed out with the set.</p>' +
'<p class="nb-note is-bad" id="icPickSaid" hidden></p>' +
'</div>' +
'<div class="nb-dialog-foot">' +
(c.icon_body
? '<button type="button" class="nb-btn nb-btn--ghost nb-btn--sm" id="icPickOff">Take it off</button>'
: '') +
'<button type="button" class="nb-btn nb-btn--ghost nb-btn--sm" id="icPickX">Cancel</button>' +
'<button type="button" class="nb-btn nb-btn--primary nb-btn--sm" id="icPickUse">Use the pasted one</button>' +
'</div>' +
'</div>';
document.body.appendChild(back);
pickOn = back;
document.addEventListener('keydown', pickKey);
var grid = back.querySelector('#icPickGrid');
var said = back.querySelector('#icPickSaid');
var busy = false;
function moan(t) { said.hidden = false; said.textContent = t; }
function set(icon, source) {
if (busy) return;
busy = true;
putCat(c.slug, c.name, c.position == null ? 100 : c.position, icon, source)
.then(function (res) {
busy = false;
if (res.error) { moan(res.error.message); return; }
pickShut();
catSaid('ok', icon ? 'The mark on "' + c.name + '" was changed.'
: 'The mark came off "' + c.name + '".');
loadCats();
});
}
function search(q) {
var sel = db.from('icons').select('slug,name,body,view_box').limit(48)
.order('name');
if (q) sel = sel.ilike('search', '%' + q.toLowerCase() + '%');
sel.then(function (r) { pickResults(grid, r.data || [], q); });
}
grid.innerHTML = '<div class="ic-pick-wait"><span class="nb-spin"></span></div>';
search('');
var timer = null;
back.querySelector('#icPickQ').addEventListener('input', function (e) {
var q = e.target.value.trim();
clearTimeout(timer);
timer = setTimeout(function () { search(q); }, 220);
});
grid.addEventListener('click', function (e) {
var b = e.target.closest('[data-slug]');
if (!b) return;
var pick = null;
(function () {
var svg = b.querySelector('svg');
if (svg) pick = svg.outerHTML;
})();
if (!pick) { moan('That one could not be read.'); return; }
set(pick, 'swiftaw:' + b.dataset.slug);
});
back.querySelector('#icPickUse').addEventListener('click', function () {
var v = back.querySelector('#icPickPaste').value.trim();
if (!v) { moan('Paste an SVG first, or pick one above.'); return; }
set(v, 'fontawesome');
});
var off = back.querySelector('#icPickOff');
if (off) off.addEventListener('click', function () { set('', ''); });
back.querySelector('#icPickX').addEventListener('click', pickShut);
back.addEventListener('mousedown', function (e) { if (e.target === back) pickShut(); });
}
function tag(r) {
return r.published
? '<span class="nb-tag nb-tag--green">Live</span>'
: '<span class="nb-tag">Draft</span>';
}
function paint() {
if (!rows.length) {
list.innerHTML = '<div class="ic-empty"><h3>' +
(q ? 'Nothing matches "' + esc(q) + '".' : 'Nothing here yet.') +
'</h3><p>' + (q ? 'Drafts are searched too, so this is the whole library.'
: 'Add the first icon and it will appear here.') + '</p></div>';
el('icMgPager').hidden = true;
return;
}
var h = '';
rows.forEach(function (r, i) {
h += '<div class="ic-mg-row">' +
'<div class="ic-mg-prev">' + drawIcon(r, 'aria-hidden="true"' +
(r.monochrome ? ' fill="currentColor"' : '')) + '</div>' +
'<div class="ic-mg-txt"><b>' + esc(r.name) + '</b>' +
'<code>' + esc(r.slug) + '</code></div>' +
'<div class="ic-mg-tags">' + tag(r) +
(r.icon_categories ? '<span class="nb-tag nb-tag--yellow">' +
esc(r.icon_categories.name) + '</span>' : '') + '</div>' +
'<div class="ic-mg-act">' +
'<a class="nb-btn nb-btn--paper nb-btn--sm" href="/icons/upload.html?slug=' +
encodeURIComponent(r.slug) + '">Edit</a>' +
'<button type="button" class="nb-btn nb-btn--ghost nb-btn--sm" data-pub="' + i + '">' +
(r.published ? 'Unpublish' : 'Publish') + '</button>' +
(rank >= 3
? '<button type="button" class="nb-btn nb-btn--red nb-btn--sm" data-del="' + i + '">Delete</button>'
: '') +
'</div></div>';
});
list.innerHTML = h;
var pages = Math.max(1, Math.ceil(total / PER));
el('icMgPager').hidden = pages < 2;
el('icMgPageN').textContent = page + ' / ' + pages;
el('icMgPrev').disabled = page <= 1;
el('icMgNext').disabled = page >= pages;
}
function load() {
var from = (page - 1) * PER;
var sel = db.from('icons')
.select('slug,name,body,view_box,monochrome,tags,published,icon_categories(name,slug)',
{ count: 'exact' })
.order('created_at', { ascending: false })
.range(from, from + PER - 1);
if (q) sel = sel.ilike('search', '%' + q.toLowerCase().replace(/[%_]/g, '') + '%');
sel.then(function (res) {
if (res.error) {
list.innerHTML = '<div class="ic-empty"><h3>The library did not answer.</h3><p>' +
esc(res.error.message) + '</p></div>';
return;
}
rows = res.data || [];
total = res.count == null ? rows.length : res.count;
paint();
});
}
list.addEventListener('click', function (e) {
var p = e.target.closest('[data-pub]');
if (p) {
var r = rows[+p.dataset.pub];
p.disabled = true;
db.rpc('icon_set_published', { p_slug: r.slug, p_on: !r.published }).then(function (res) {
p.disabled = false;
if (res.error) { window.alert(res.error.message); return; }
r.published = !r.published;
paint();
});
return;
}
var d = e.target.closest('[data-del]');
if (d) {
var row = rows[+d.dataset.del];
if (!window.confirm('Delete "' + row.slug + '"? This cannot be undone. ' +
'Unpublishing takes it out of the library and keeps it.')) return;
d.disabled = true;
db.rpc('icon_delete', { p_slug: row.slug }).then(function (res) {
if (res.error) { d.disabled = false; window.alert(res.error.message); return; }
load();
});
}
});
el('icCatRows').addEventListener('input', function (e) {
var i = e.target.dataset.name || e.target.dataset.pos;
if (i == null || i === '') return;
var b = el('icCatRows').querySelector('[data-save="' + i + '"]');
if (b) b.disabled = false;
});
el('icCatRows').addEventListener('click', function (e) {
var m = e.target.closest('[data-mark]');
if (m) { markPick(+m.dataset.mark); return; }
var b = e.target.closest('[data-save]');
if (!b) return;
var i = +b.dataset.save, c = cats[i];
var name = el('icCatRows').querySelector('[data-name="' + i + '"]').value.trim();
var pos = parseInt(el('icCatRows').querySelector('[data-pos="' + i + '"]').value, 10);
if (!name) { catSaid('bad', 'A category needs a name.'); return; }
b.disabled = true;
putCat(c.slug, name, isNaN(pos) ? 100 : pos).then(function (res) {
if (res.error) { b.disabled = false; catSaid('bad', res.error.message); return; }
catSaid('ok', '"' + name + '" saved.');
loadCats();
});
});
el('icCatNew').addEventListener('submit', function (e) {
e.preventDefault();
var name = el('icCatName').value.trim();
var slug = el('icCatSlug').value.trim().toLowerCase();
var pos = parseInt(el('icCatPos').value, 10);
if (!name || !slug) { catSaid('bad', 'A category needs a name and an address.'); return; }
var btn = el('icCatAdd');
var had = cats.some(function (c) { return c.slug === slug; });
btn.disabled = true;
putCat(slug, name, isNaN(pos) ? 100 : pos).then(function (res) {
btn.disabled = false;
if (res.error) { catSaid('bad', res.error.message); return; }
catSaid('ok', had ? '"' + slug + '" already existed, so it was changed instead.'
: '"' + name + '" added. It is on the upload screen now. ' +
'Click its tile above to give it a mark.');
el('icCatName').value = ''; el('icCatSlug').value = ''; el('icCatPos').value = 100;
loadCats();
});
});
el('icCatName').addEventListener('input', function () {
var s = el('icCatSlug');
if (s.dataset.touched) return;
s.value = slugify(el('icCatName').value);
});
el('icCatSlug').addEventListener('input', function () {
el('icCatSlug').dataset.touched = '1';
});
el('icMgQ').addEventListener('input', function () {
clearTimeout(timer);
timer = setTimeout(function () { q = el('icMgQ').value.trim(); page = 1; load(); }, 220);
});
el('icMgPrev').addEventListener('click', function () { if (page > 1) { page--; load(); } });
el('icMgNext').addEventListener('click', function () { page++; load(); });
el('icMgPrev').innerHTML = ICO.left;
el('icMgNext').innerHTML = ICO.right;
var gone = new URLSearchParams(location.search).get('gone');
if (gone) {
var n = el('icMgSaid');
n.hidden = false;
n.textContent = '"' + gone + '" was deleted.';
}
window.SwiftawAccount.ready(function () {
db = window.SwiftawAccount.client();
rankOnce(db).then(function (got) {
rank = got;
if (rank < 2) {
gate.hidden = false;
gate.querySelector('p').textContent = window.SwiftawAccount.user()
? 'This account cannot change icons. That is for Swiftaw admins.'
: 'Sign in with a Swiftaw admin account to manage the library.';
return;
}
wrap.hidden = false;
loadCats();
load();
});
});
}
window.SwiftawIcons = {
browse: browse, upload: upload, manage: manage, chrome: chrome
};
})();
