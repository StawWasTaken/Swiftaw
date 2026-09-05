/* Swiftaw Icons - the library and the upload screen.

   Two entry points, one file, because they share how an icon is drawn and how
   its markup is written out, and those two are the only things in the service
   that must never disagree with each other. */
(function () {
  'use strict';

  var PER = 48;

  var SWATCHES = [
    ['#FFF93E', 'Yellow'], ['#FF0033', 'Red'], ['#3ECF6E', 'Green'],
    ['#2CAFFC', 'Blue'], ['#FF77E4', 'Pink'],
    ['#FFFFFF', 'White'], ['#0C0F15', 'Ink']
  ];

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The body was checked against an allowlist before it was allowed into the
     database, so this is the second look rather than the first. It is here
     because the cost of being wrong is a script running on somebody else's
     page, and the cost of the check is a regex. */
  function safeBody(b) {
    if (!b) return '';
    if (/<\s*script/i.test(b) || /\son[a-z]+\s*=/i.test(b) ||
        /javascript\s*:/i.test(b) || /<\s*(foreignobject|iframe|image|use|style)\b/i.test(b)) {
      return '';
    }
    return b;
  }

  function drawIcon(row, attrs) {
    var body = safeBody(row.body);
    if (!body) return '';
    return '<svg viewBox="' + esc(row.view_box) + '" ' + attrs + '>' + body + '</svg>';
  }

  /* The two snippets the card hands over. They are different on purpose: one is
     a file that stands on its own, the other is a tag that takes the size and
     colour of the text it is dropped into. */
  function snippet(row, kind, colour) {
    var body = safeBody(row.body);
    var vb = esc(row.view_box);
    if (kind === 'html') {
      return '<svg viewBox="' + vb + '" width="1em" height="1em" ' +
             (row.monochrome ? 'fill="currentColor" ' : '') +
             'aria-hidden="true" focusable="false">' + body + '</svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" ' +
           'width="24" height="24"' +
           (row.monochrome ? ' fill="' + esc(colour || '#000000') + '"' : '') +
           '>' + body + '</svg>';
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Older Safari and any page served without a secure context.
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
    right: '<svg viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>'
  };

  /* ── The library ──────────────────────────────────────────────────────── */

  function browse() {
    var db = null;
    var state = { q: '', cat: '', page: 1, total: 0, rows: [] };
    var cats = [];
    var grid = el('icGrid'), pager = el('icPager'), pageN = el('icPageN');
    var input = el('icQ'), searchWrap = el('icSearch'), count = el('icCount');
    var catBox = el('icCats');
    var timer = null;

    // The page is readable from the address, so a result someone found can be
    // sent to somebody else and a back button behaves.
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
              '" data-cat="">Everything</button>';
      cats.forEach(function (c) {
        h += '<button type="button" class="ic-cat' + (state.cat === c.slug ? ' is-on' : '') +
             '" data-cat="' + esc(c.slug) + '">' + esc(c.name) + '</button>';
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
        // A category in the address that no longer exists must not silently
        // show everything, which would look like the filter had been ignored.
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
        // Landing past the end, usually from a stale link, goes back to a page
        // that exists rather than showing an empty grid that looks broken.
        var pages = Math.max(1, Math.ceil(state.total / PER));
        if (state.page > pages && state.total) { state.page = pages; writeUrl(false); load(); return; }
        paint();
      });
    }

    function go(push) { writeUrl(push !== false); load(); }

    // ── the card ──
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
      h += '<div class="ic-code" id="icCode">' + esc(snippet(r, tab, fill)) +
           '<button class="ic-code-btn" type="button" id="icCopy" aria-label="Copy">' + ICO.copy + '</button>' +
           '</div>';
      h += '<div class="ic-card-foot"><span>' +
           (tab === 'svg'
             ? 'A file on its own, at 24 pixels in the colour above.'
             : 'A tag for your markup. It takes the size and colour of the text around it.') +
           '</span></div>';
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

    // ── wiring ──
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
        // Typing replaces rather than pushes, or every keystroke becomes an
        // entry in the history and the back button stops meaning anything.
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

    // The preview is not a file to be dragged off the page or saved from a
    // menu. Friction, not protection: the markup is in the copy box below it,
    // which is the entire point of the service.
    card.addEventListener('dragstart', function (e) { if (e.target.closest('.ic-stage')) e.preventDefault(); });
    card.addEventListener('contextmenu', function (e) { if (e.target.closest('.ic-stage')) e.preventDefault(); });

    window.addEventListener('popstate', function () {
      readUrl();
      input.value = state.q;
      searchWrap.classList.toggle('has-q', !!state.q);
      paintCats(); load();
    });

    // ── start ──
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
      db.from('icon_categories').select('id,slug,name').order('position').then(function (res) {
        cats = res.data || [];
        paintCats();
        load();
      });
      // The way in to the manage screen, for the accounts that have one. It is
      // a shortcut, not a permission: the screen checks for itself and so does
      // every write behind it.
      var mg = el('icStaff');
      if (mg) db.rpc('icon_my_rank').then(function (r) {
        if (!r.error && (r.data || 0) >= 2) mg.hidden = false;
      });
    });
  }

  /* ── The upload screen ────────────────────────────────────────────────── */

  function upload() {
    var db = null, checked = null, rank = 0;
    var gate = el('icGate'), form = el('icUpForm');
    // Set when the screen was opened on an icon that already exists. It holds
    // the address the icon had on arrival, because that is what a move has to
    // be told to move away from.
    var editing = new URLSearchParams(location.search).get('slug') || '';

    function slugify(s) {
      return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    }

    function verdict(kind, title, body, preview) {
      var v = el('icVerdict');
      v.hidden = false;
      v.classList.toggle('is-bad', kind === 'bad');
      v.innerHTML = (preview ? '<div class="ic-stage">' + preview + '</div>' : '<div></div>') +
        '<div><b>' + esc(title) + '</b><p>' + esc(body) + '</p></div>';
    }

    function check() {
      var svg = el('icSvg').value;
      checked = null;
      el('icSave').disabled = true;
      if (!svg.trim()) { el('icVerdict').hidden = true; return; }
      db.rpc('icon_check_svg', { p_svg: svg }).then(function (res) {
        if (res.error) { verdict('bad', 'The check did not run.', res.error.message); return; }
        var r = res.data;
        if (!r.ok) { verdict('bad', 'Not accepted.', r.error); return; }
        checked = r;
        el('icSave').disabled = false;
        verdict('ok',
          r.monochrome ? 'Accepted, one colour.' : 'Accepted, keeps its own colours.',
          r.monochrome
            ? 'It will take the colour of the text around it, and the card will offer the colour control.'
            : 'The card will say the colours are part of the mark rather than offering a control that would do nothing.',
          '<svg viewBox="' + esc(r.view_box) + '" ' +
          (r.monochrome ? 'fill="#FFFFFF"' : '') + '>' + safeBody(r.body) + '</svg>');
      });
    }

    var t = null;
    el('icSvg').addEventListener('input', function () { clearTimeout(t); t = setTimeout(check, 300); });

    el('icName').addEventListener('input', function () {
      var s = el('icSlug');
      // Once the address has been typed by hand it is left alone: it is what a
      // published icon is found by, and renaming the icon must not move it.
      if (!s.dataset.touched) s.value = slugify(el('icName').value);
    });
    el('icSlug').addEventListener('input', function () { el('icSlug').dataset.touched = '1'; });

    el('icFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        el('icSvg').value = String(fr.result);
        if (!el('icName').value) {
          el('icName').value = f.name.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ').trim();
          el('icName').dispatchEvent(new Event('input'));
        }
        check();
      };
      fr.readAsText(f);
    });

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
        p_svg: el('icSvg').value,
        p_publish: el('icPub').checked
      }).then(function (res) {
        btn.disabled = false;
        if (res.error) { verdict('bad', 'Not saved.', res.error.message); return; }

        if (editing) {
          editing = slug;
          history.replaceState({}, '', location.pathname + '?slug=' + encodeURIComponent(slug));
          verdict('ok', 'Changed.',
            el('icPub').checked
              ? 'The library is showing the new version. Nothing needs deploying.'
              : 'Saved, and it is a draft, so it is not in the library.');
          return;
        }
        verdict('ok', 'Saved.',
          el('icPub').checked
            ? 'It is in the library now. Nothing needs deploying.'
            : 'Kept as a draft. It is not in the library until it is published.');
        form.reset();
        el('icSlug').dataset.touched = '';
        el('icSvg').value = '';
        checked = null;
        btn.disabled = true;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checked) return;
      var btn = el('icSave');
      btn.disabled = true;
      var slug = el('icSlug').value.trim().toLowerCase();

      // Changing the address is a move, not part of the save: the upsert is
      // keyed on the address, so saving under a new one would write a second
      // icon and leave the first one where it was.
      if (editing && slug !== editing) {
        db.rpc('icon_rename', { p_from: editing, p_to: slug }).then(function (res) {
          if (res.error) {
            btn.disabled = false;
            verdict('bad', 'The address did not change, so nothing else was saved either.',
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
        if (res.error) { del.disabled = false; verdict('bad', 'Not deleted.', res.error.message); return; }
        location.href = '/icons/manage.html?gone=' + encodeURIComponent(editing);
      });
    });

    // The icon as the library holds it. The file that was uploaded is not kept
    // anywhere: only the shapes and the box survived the check, so this is the
    // honest thing to put in the box for editing.
    function fill(row) {
      el('icName').value = row.name;
      el('icSlug').value = row.slug;
      el('icSlug').dataset.touched = '1';
      el('icTags').value = (row.tags || []).join(', ');
      el('icPub').checked = !!row.published;
      if (row.icon_categories && row.icon_categories.slug) el('icCat').value = row.icon_categories.slug;
      el('icSvg').value = '<svg viewBox="' + row.view_box + '">' + row.body + '</svg>';
      check();
    }

    window.SwiftawAccount.ready(function () {
      db = window.SwiftawAccount.client();
      // The screen is drawn from what the database says the caller is, and the
      // write is refused by the database as well. Hiding the form is the
      // courtesy; the check inside icon_upsert is the part that holds.
      db.rpc('icon_my_rank').then(function (res) {
        rank = res.error ? 0 : (res.data || 0);
        if (rank < 2) {
          gate.hidden = false;
          gate.querySelector('p').textContent = window.SwiftawAccount.user()
            ? 'This account cannot add or change icons. That is for Swiftaw admins.'
            : 'Sign in with a Swiftaw admin account to add or change an icon.';
          return;
        }
        form.hidden = false;
        // Deleting sits a rank above adding, so the button is only drawn for
        // the rank that has it. The database refuses it from anyone else.
        if (del && rank >= 3 && editing) del.hidden = false;

        db.from('icon_categories').select('slug,name').order('position').then(function (r) {
          el('icCat').innerHTML = (r.data || []).map(function (c) {
            return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>';
          }).join('');

          if (!editing) return;
          var MODE = {
            title: 'Edit an icon',
            save: 'Save the changes',
            lead: 'The box below holds the icon as the library keeps it, not the file that ' +
                  'was uploaded: only the shapes and the box survived the check. Replace it ' +
                  'to change the drawing, or leave it alone and change the rest.'
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

  /* ── The manage screen ────────────────────────────────────────────────── */
  /* The library shows what is published. This shows everything, drafts
     included, because a draft nobody can see is a draft nobody can finish. */

  function manage() {
    var db = null, rank = 0, page = 1, q = '', total = 0, rows = [];
    var gate = el('icMgGate'), wrap = el('icMgWrap'), list = el('icMgList');
    var timer = null;

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
      db.rpc('icon_my_rank').then(function (res) {
        rank = res.error ? 0 : (res.data || 0);
        if (rank < 2) {
          gate.hidden = false;
          gate.querySelector('p').textContent = window.SwiftawAccount.user()
            ? 'This account cannot change icons. That is for Swiftaw admins.'
            : 'Sign in with a Swiftaw admin account to manage the library.';
          return;
        }
        wrap.hidden = false;
        load();
      });
    });
  }

  window.SwiftawIcons = { browse: browse, upload: upload, manage: manage };
})();
