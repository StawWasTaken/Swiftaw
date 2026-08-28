/* ══════════════════════════════════════════════════════════════════════════
   SWIFTAW — LEGAL PAGES
   One job: build the "On this page" list from the page's own <h2>s.

   It is generated rather than hand-written on purpose. A contents list that
   is typed out separately from the document drifts the first time a section
   is renumbered, and a legal page that lists a clause it does not contain is
   worse than one with no contents list at all.
   ══════════════════════════════════════════════════════════════════════════ */
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

      /* The number lives in its own <span class="n">, so the title is what is
         left once that span is out of the way. */
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

    /* Two sections do not need a map. */
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

    /* Before the first section, so the sticky column starts level with the
       body of the document rather than halfway down it. */
    var first = prose.querySelector('.legal-sec');
    prose.insertBefore(nav, first);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
