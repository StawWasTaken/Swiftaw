(function () {
'use strict';
function slug(s) {
return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function build() {
var prose = document.querySelector('.legal-prose');
if (!prose) return;
var secs = [].slice.call(prose.querySelectorAll('.legal-sec'));
var rows = [];
secs.forEach(function (sec) {
var h2 = sec.querySelector('h2');
if (!h2) return;
var numEl = h2.querySelector('.n');
var num = numEl ? numEl.textContent.trim() : '';
var title = '';
[].forEach.call(h2.childNodes, function (n) {
if (n !== numEl) title += n.textContent;
});
title = title.trim();
if (!title) return;
if (!sec.id) sec.id = slug(title) || ('section-' + (rows.length + 1));
rows.push({ id: sec.id, num: num, title: title });
});
if (rows.length < 3) return;
var nav = document.createElement('nav');
nav.className = 'legal-toc';
nav.setAttribute('aria-label', 'On this page');
var html = '<span class="lbl">On this page</span><ol>';
rows.forEach(function (r) {
html += '<li><a href="#' + r.id + '">' +
(r.num ? '<span class="n">' + r.num + '</span>' : '') +
'<span>' + r.title.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>' +
'</a></li>';
});
html += '</ol>';
nav.innerHTML = html;
var first = prose.querySelector('.legal-sec');
prose.insertBefore(nav, first);
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', build);
} else {
build();
}
})();
