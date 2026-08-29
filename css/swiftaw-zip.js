(function (w) {
'use strict';
var TABLE = null;
function table() {
if (TABLE) return TABLE;
TABLE = new Uint32Array(256);
for (var n = 0; n < 256; n++) {
var c = n;
for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
TABLE[n] = c >>> 0;
}
return TABLE;
}
function crc32(buf) {
var t = table();
var c = 0xFFFFFFFF;
for (var i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
return (c ^ 0xFFFFFFFF) >>> 0;
}
var enc = new TextEncoder();
function stamp() {
var d = new Date();
return {
time: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF,
date: (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF
};
}
function zip(entries) {
var s = stamp();
var items = entries.map(function (e) {
var data = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
var name = enc.encode(e.name);
return { name: name, data: data, crc: crc32(data), off: 0 };
});
var size = 22;
items.forEach(function (it) { size += 30 + it.name.length + it.data.length + 46 + it.name.length; });
var out = new Uint8Array(size);
var view = new DataView(out.buffer);
var p = 0;
items.forEach(function (it) {
it.off = p;
view.setUint32(p, 0x04034B50, true);
view.setUint16(p + 4, 20, true);
view.setUint16(p + 6, 0x0800, true);
view.setUint16(p + 8, 0, true);
view.setUint16(p + 10, s.time, true);
view.setUint16(p + 12, s.date, true);
view.setUint32(p + 14, it.crc, true);
view.setUint32(p + 18, it.data.length, true);
view.setUint32(p + 22, it.data.length, true);
view.setUint16(p + 26, it.name.length, true);
view.setUint16(p + 28, 0, true);
p += 30;
out.set(it.name, p); p += it.name.length;
out.set(it.data, p); p += it.data.length;
});
var dirAt = p;
items.forEach(function (it) {
view.setUint32(p, 0x02014B50, true);
view.setUint16(p + 4, 20, true);
view.setUint16(p + 6, 20, true);
view.setUint16(p + 8, 0x0800, true);
view.setUint16(p + 10, 0, true);
view.setUint16(p + 12, s.time, true);
view.setUint16(p + 14, s.date, true);
view.setUint32(p + 16, it.crc, true);
view.setUint32(p + 20, it.data.length, true);
view.setUint32(p + 24, it.data.length, true);
view.setUint16(p + 28, it.name.length, true);
view.setUint16(p + 30, 0, true);
view.setUint16(p + 32, 0, true);
view.setUint16(p + 34, 0, true);
view.setUint16(p + 36, 0, true);
view.setUint32(p + 38, 0, true);
view.setUint32(p + 42, it.off, true);
p += 46;
out.set(it.name, p); p += it.name.length;
});
view.setUint32(p, 0x06054B50, true);
view.setUint16(p + 4, 0, true);
view.setUint16(p + 6, 0, true);
view.setUint16(p + 8, items.length, true);
view.setUint16(p + 10, items.length, true);
view.setUint32(p + 12, p - dirAt, true);
view.setUint32(p + 16, dirAt, true);
view.setUint16(p + 20, 0, true);
return new Blob([out], { type: 'application/zip' });
}
w.SwiftawZip = zip;
})(window);
