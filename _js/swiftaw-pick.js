/* The Swiftaw dropdown.

   A native select draws whatever the operating system feels like drawing, so
   the one control on a Swiftaw form that never matched the rest of it was the
   one that opened. This replaces the list without replacing the field: the
   select stays in the page, keeps the value, and keeps working for anything
   reading it, which is why nothing else has to change to use this.

   The menu is put in the body rather than beside its button. A dropdown inside
   a card that clips its own overflow gets cut off at the card's edge, and the
   sliding step view on the upload screen clips by design. */
window.SwiftawPick = (function () {
  'use strict';

  var CHEV = '<svg viewBox="0 0 512 512" aria-hidden="true"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>';
  var TICK = '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>';

  var open = null;
  var seq = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function options(sel) {
    return Array.prototype.filter.call(sel.options, function (o) { return !o.disabled; });
  }

  function wrap(sel) {
    if (!sel || sel.dataset.picked) return null;
    sel.dataset.picked = '1';

    var id = 'pick' + (++seq);
    var host = document.createElement('div');
    host.className = 'nb-pick';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nb-pick-btn';
    btn.id = id + 'b';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (sel.id) {
      var lab = document.querySelector('label[for="' + sel.id + '"]');
      if (lab) {
        if (!lab.id) lab.id = id + 'l';
        btn.setAttribute('aria-labelledby', lab.id + ' ' + btn.id);
      }
    }

    sel.parentNode.insertBefore(host, sel);
    host.appendChild(sel);
    host.appendChild(btn);
    // Kept in the page and kept working. It is hidden from sight and from the
    // tab order, and it is still the thing that holds the value.
    sel.classList.add('nb-pick-native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var menu = null, opts = [], at = -1;

    function label() {
      var o = sel.options[sel.selectedIndex];
      var text = o ? o.textContent : '';
      btn.innerHTML = '<span class="nb-pick-val">' +
        (text ? esc(text) : '<i>' + esc(sel.dataset.placeholder || 'Pick one') + '</i>') +
        '</span>' + CHEV;
      btn.classList.toggle('is-empty', !text);
    }

    function place() {
      if (!menu) return;
      var r = btn.getBoundingClientRect();
      var space = window.innerHeight - r.bottom - 12;
      var h = menu.offsetHeight;
      // Upwards when there is not room below, which is the difference between
      // a menu you can read and a menu with two rows showing.
      var up = space < h && r.top - 12 > space;
      menu.style.left = Math.round(r.left) + 'px';
      menu.style.width = Math.round(r.width) + 'px';
      menu.style.maxHeight = Math.max(120, (up ? r.top - 16 : space)) + 'px';
      menu.style.top = up ? '' : Math.round(r.bottom + 6) + 'px';
      menu.style.bottom = up ? Math.round(window.innerHeight - r.top + 6) + 'px' : '';
      menu.classList.toggle('is-up', up);
    }

    function paint() {
      menu.innerHTML = opts.map(function (o, i) {
        return '<div class="nb-pick-opt' + (o.selected ? ' is-on' : '') + '" role="option" ' +
          'aria-selected="' + (o.selected ? 'true' : 'false') + '" data-i="' + i + '">' +
          '<span>' + esc(o.textContent) + '</span>' + (o.selected ? TICK : '') + '</div>';
      }).join('');
      move(at, true);
    }

    function move(i, quiet) {
      var was = menu.querySelector('.is-at');
      if (was) was.classList.remove('is-at');
      at = Math.max(0, Math.min(opts.length - 1, i));
      var n = menu.children[at];
      if (!n) return;
      n.classList.add('is-at');
      menu.setAttribute('aria-activedescendant', '');
      if (!quiet) n.scrollIntoView({ block: 'nearest' });
    }

    function show() {
      if (open) open.close();
      opts = options(sel);
      if (!opts.length) return;
      menu = document.createElement('div');
      menu.className = 'nb-pick-menu';
      menu.setAttribute('role', 'listbox');
      menu.tabIndex = -1;
      document.body.appendChild(menu);
      at = Math.max(0, opts.indexOf(sel.options[sel.selectedIndex]));
      paint();
      place();
      requestAnimationFrame(function () { if (menu) menu.classList.add('is-in'); });
      btn.setAttribute('aria-expanded', 'true');
      open = api;
      menu.querySelector('.is-at') && menu.querySelector('.is-at').scrollIntoView({ block: 'nearest' });
    }

    function close(focus) {
      if (!menu) return;
      menu.remove(); menu = null;
      btn.setAttribute('aria-expanded', 'false');
      if (open === api) open = null;
      if (focus) btn.focus();
    }

    function take(i) {
      var o = opts[i];
      if (!o) return;
      sel.value = o.value;
      label();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }

    var typed = '', typeT = null;
    function type(k) {
      clearTimeout(typeT);
      typed += k.toLowerCase();
      typeT = setTimeout(function () { typed = ''; }, 700);
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].textContent.toLowerCase().indexOf(typed) === 0) {
          if (menu) move(i); else { sel.selectedIndex = sel.options.length ? Array.prototype.indexOf.call(sel.options, opts[i]) : 0; label(); }
          return;
        }
      }
    }

    btn.addEventListener('click', function () { menu ? close(true) : show(); });

    btn.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (!menu) { show(); return; }
        if (k === 'Enter' || k === ' ') { take(at); return; }
        move(at + (k === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (k === 'Escape' && menu) { e.preventDefault(); close(true); return; }
      if (k === 'Home' && menu) { e.preventDefault(); move(0); return; }
      if (k === 'End' && menu) { e.preventDefault(); move(opts.length - 1); return; }
      if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { type(k); }
    });

    document.addEventListener('mousedown', function (e) {
      if (!menu) return;
      if (menu.contains(e.target) || host.contains(e.target)) return;
      close(false);
    });

    document.addEventListener('click', function (e) {
      if (!menu) return;
      var o = e.target.closest && e.target.closest('.nb-pick-opt');
      if (o && menu.contains(o)) take(parseInt(o.dataset.i, 10));
    });

    document.addEventListener('mouseover', function (e) {
      if (!menu) return;
      var o = e.target.closest && e.target.closest('.nb-pick-opt');
      if (o && menu.contains(o)) move(parseInt(o.dataset.i, 10), true);
    });

    window.addEventListener('resize', function () { close(false); });
    // Capture, because the thing that scrolls is usually not the window.
    window.addEventListener('scroll', function () { if (menu) place(); }, true);

    var api = {
      close: function () { close(false); },
      refresh: function () { label(); if (menu) { opts = options(sel); paint(); place(); } },
      select: sel, button: btn
    };
    sel.__pick = api;
    label();
    return api;
  }

  function auto(root) {
    (root || document).querySelectorAll('select.nb-select').forEach(function (s) {
      if (s.dataset.pick !== 'off' && !s.multiple) wrap(s);
    });
  }

  /* A select whose options were written after the page loaded, which is most of
     them, has to say so. */
  function refresh(sel) { if (sel && sel.__pick) sel.__pick.refresh(); }

  document.addEventListener('DOMContentLoaded', function () { auto(); });

  return { wrap: wrap, auto: auto, refresh: refresh };
})();
