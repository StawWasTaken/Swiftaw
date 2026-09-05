window.SwiftawTrace = (function () {
'use strict';
var WORK = 400;
var BUDGET = 92000;
function sample(img, cap) {
var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
if (!w || !h) throw new Error('The picture has no size.');
var k = Math.min(1, cap / Math.max(w, h));
var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
var c = document.createElement('canvas');
c.width = cw; c.height = ch;
var x = c.getContext('2d', { willReadFrequently: true });
x.imageSmoothingEnabled = true;
x.imageSmoothingQuality = 'high';
x.drawImage(img, 0, 0, cw, ch);
return { w: cw, h: ch, data: x.getImageData(0, 0, cw, ch).data, sw: w, sh: h };
}
function readMode(px) {
var d = px.data, n = px.w * px.h, i, o;
var clear = 0, minX = px.w, minY = px.h, maxX = -1, maxY = -1, solid = 0;
for (i = 0; i < n; i++) {
if (d[i * 4 + 3] < 200) { clear++; continue; }
solid++;
var x = i % px.w, y = (i / px.w) | 0;
if (x < minX) minX = x; if (x > maxX) maxX = x;
if (y < minY) minY = y; if (y > maxY) maxY = y;
}
var cut = clear / n > 0.02;
var box = maxX < 0 ? 0 : (maxX - minX + 1) * (maxY - minY + 1);
if (cut && box && solid / box < 0.92) return { mode: 'alpha' };
if (maxX < 0) { minX = 0; minY = 0; maxX = px.w - 1; maxY = px.h - 1; }
var r = 0, g = 0, b = 0, k = 0;
function edge(x, y) {
var p = (y * px.w + x) * 4;
if (d[p + 3] < 200) return;
r += d[p]; g += d[p + 1]; b += d[p + 2]; k++;
}
for (var xx = minX; xx <= maxX; xx += 1) { edge(xx, minY); edge(xx, maxY); }
for (var yy = minY; yy <= maxY; yy += 1) { edge(minX, yy); edge(maxX, yy); }
if (!k) return { mode: 'alpha' };
var ground = [r / k, g / k, b / k];
var top = 0;
for (i = 0; i < n; i++) {
o = i * 4;
if (d[o + 3] < 128) continue;
var dist = Math.abs(d[o] - ground[0]) + Math.abs(d[o + 1] - ground[1]) +
Math.abs(d[o + 2] - ground[2]);
if (dist > top) top = dist;
}
return { mode: 'ink', ground: ground, scale: Math.max(40, top), plate: cut };
}
function grid(px, read, cut, invert) {
var d = px.data, n = px.w * px.h, g = new Uint8Array(n), i, v, o;
for (i = 0; i < n; i++) {
o = i * 4;
if (read.mode === 'alpha') {
v = d[o + 3] / 255;
} else if (d[o + 3] < 128) {
v = 0;
} else {
v = (Math.abs(d[o] - read.ground[0]) + Math.abs(d[o + 1] - read.ground[1]) +
Math.abs(d[o + 2] - read.ground[2])) / read.scale;
}
g[i] = (invert ? 1 - v : v) >= cut ? 1 : 0;
}
return g;
}
function contours(g, w, h) {
function on(x, y) { return x >= 0 && y >= 0 && x < w && y < h && g[y * w + x] === 1; }
var out = new Map(), key;
function edge(x1, y1, x2, y2) {
key = x1 + ',' + y1;
var e = out.get(key);
if (e) e.push([x2, y2]); else out.set(key, [[x2, y2]]);
}
for (var y = 0; y < h; y++) {
for (var x = 0; x < w; x++) {
if (!on(x, y)) continue;
if (!on(x, y - 1)) edge(x, y, x + 1, y);
if (!on(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
if (!on(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
if (!on(x - 1, y)) edge(x, y + 1, x, y);
}
}
var loops = [];
out.forEach(function (list, from) {
while (list.length) {
var start = from.split(',').map(Number);
var pts = [[start[0], start[1]]];
var cur = list.shift();
var guard = 0;
while (cur && guard++ < 400000) {
pts.push([cur[0], cur[1]]);
if (cur[0] === start[0] && cur[1] === start[1]) break;
var next = out.get(cur[0] + ',' + cur[1]);
if (!next || !next.length) break;
cur = next.shift();
}
if (pts.length > 3) loops.push(pts);
}
});
return loops;
}
function area(p) {
var a = 0;
for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
a += (p[j][0] * p[i][1]) - (p[i][0] * p[j][1]);
}
return Math.abs(a) / 2;
}
function far(p, a, b) {
var x = b[0] - a[0], y = b[1] - a[1];
var len = Math.sqrt(x * x + y * y);
if (!len) { x = p[0] - a[0]; y = p[1] - a[1]; return Math.sqrt(x * x + y * y); }
return Math.abs((p[0] - a[0]) * y - (p[1] - a[1]) * x) / len;
}
function thin(pts, eps) {
if (pts.length < 3) return pts.slice();
var keep = new Uint8Array(pts.length);
keep[0] = keep[pts.length - 1] = 1;
var stack = [[0, pts.length - 1]];
while (stack.length) {
var seg = stack.pop(), a = seg[0], b = seg[1], best = -1, at = -1;
for (var i = a + 1; i < b; i++) {
var d = far(pts[i], pts[a], pts[b]);
if (d > best) { best = d; at = i; }
}
if (best > eps && at > 0) { keep[at] = 1; stack.push([a, at], [at, b]); }
}
var out = [];
for (var j = 0; j < pts.length; j++) if (keep[j]) out.push(pts[j]);
return out;
}
function turn(a, b, c) {
var x1 = b[0] - a[0], y1 = b[1] - a[1], x2 = c[0] - b[0], y2 = c[1] - b[1];
var l1 = Math.hypot(x1, y1), l2 = Math.hypot(x2, y2);
if (!l1 || !l2) return 0;
var d = (x1 * x2 + y1 * y2) / (l1 * l2);
return Math.acos(Math.max(-1, Math.min(1, d)));
}
function curve(pts, smooth, corner) {
var n = pts.length;
if (n < 3) return '';
var sharp = [], i;
for (i = 0; i < n; i++) {
sharp.push(turn(pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n]) > corner);
}
var d = 'M' + num(pts[0][0]) + ' ' + num(pts[0][1]);
for (i = 0; i < n; i++) {
var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
if (sharp[i] && sharp[(i + 1) % n]) { d += 'L' + num(p2[0]) + ' ' + num(p2[1]); continue; }
var t1 = sharp[i] ? 0 : smooth, t2 = sharp[(i + 1) % n] ? 0 : smooth;
var c1 = [p1[0] + (p2[0] - p0[0]) * t1, p1[1] + (p2[1] - p0[1]) * t1];
var c2 = [p2[0] - (p3[0] - p1[0]) * t2, p2[1] - (p3[1] - p1[1]) * t2];
d += 'C' + num(c1[0]) + ' ' + num(c1[1]) + ' ' + num(c2[0]) + ' ' + num(c2[1]) +
' ' + num(p2[0]) + ' ' + num(p2[1]);
}
return d + 'Z';
}
function num(v) {
var r = Math.round(v * 100) / 100;
return String(r === 0 ? 0 : r);
}
function run(px, o) {
var read = readMode(px);
var g = grid(px, read, o.cut, o.invert);
var loops = contours(g, px.w, px.h);
var floor = Math.max(4, (px.w * px.h) * (o.speck || 0.0004));
loops = loops.filter(function (p) { return area(p) >= floor; });
if (!loops.length) return null;
var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
loops.forEach(function (p) {
p.forEach(function (q) {
if (q[0] < minX) minX = q[0]; if (q[0] > maxX) maxX = q[0];
if (q[1] < minY) minY = q[1]; if (q[1] > maxY) maxY = q[1];
});
});
var ox = 0, oy = 0, bw = px.w, bh = px.h;
if (o.trim) { ox = minX; oy = minY; bw = Math.max(1, maxX - minX); bh = Math.max(1, maxY - minY); }
var k = 512 / Math.max(bw, bh);
var vw = Math.round(bw * k), vh = Math.round(bh * k);
var eps = o.detail, d = '', tries = 0;
do {
d = loops.map(function (p) {
var t = thin(p, eps).map(function (q) {
return [(q[0] - ox) * k, (q[1] - oy) * k];
});
if (t.length > 2 && t[0][0] === t[t.length - 1][0] && t[0][1] === t[t.length - 1][1]) t.pop();
return t.length > 2 ? curve(t, o.smooth, o.corner) : '';
}).filter(Boolean).join('');
if (d.length > BUDGET) eps *= 1.7;
} while (d.length > BUDGET && ++tries < 6);
if (!d) return null;
return {
viewBox: '0 0 ' + vw + ' ' + vh,
body: '<path fill-rule="evenodd" d="' + d + '"/>',
svg: '<svg viewBox="0 0 ' + vw + ' ' + vh + '"><path fill-rule="evenodd" d="' + d + '"/></svg>',
shapes: loops.length,
bytes: d.length,
coarse: tries > 0,
read: read.mode,
flat: read.mode === 'alpha' ? true : read.spread < 24
};
}
function fromImage(img, opts) {
var o = opts || {};
var px = sample(img, o.work || WORK);
return run(px, {
cut: o.cut == null ? 0.5 : o.cut,
invert: !!o.invert,
trim: o.trim !== false,
detail: o.detail == null ? 0.9 : o.detail,
smooth: o.smooth == null ? 0.28 : o.smooth,
corner: o.corner == null ? 0.72 : o.corner,
speck: o.speck
});
}
function fromFile(file, opts) {
return new Promise(function (res, rej) {
var url = URL.createObjectURL(file);
var img = new Image();
img.onload = function () {
URL.revokeObjectURL(url);
try { res({ image: img, traced: fromImage(img, opts) }); }
catch (e) { rej(e); }
};
img.onerror = function () {
URL.revokeObjectURL(url);
rej(new Error('That file could not be read as a picture.'));
};
img.src = url;
});
}
return { fromImage: fromImage, fromFile: fromFile };
})();
