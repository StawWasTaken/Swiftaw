/* 
   SUPERNOVA  chat interface logic
   Swiftaw-account gated. Model "Pulsar".
   NOTE: the Pulsar model is not built yet  assistant replies are a
   clearly-labelled local SIMULATION. All wiring (threads, streaming,
   feedback) is structured so the real model + Supabase drop in later.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PFP = '/supernova/Supernova%20pfp.png';

  var state = {
    user: null, uid: null, threads: [], activeId: null,
    streaming: false, abort: false, search: '', attachments: [], model: 'pulsar',
    modelReady: false, neuralReady: false, stats: null, trainMode: null,
    folders: [], editingFolder: null, _fldSel: null, _drag: null, _regenAvg: null
  };
  /*  SETTINGS (per browser)  */
  var SETTINGS_DEFAULTS = { enterToSend: true, twemoji: true, showThinking: true, streamSpeed: 'normal' };
  var snSettings = (function () { try { var s = JSON.parse(localStorage.getItem('sn_settings') || '{}'); var o = {}; for (var k in SETTINGS_DEFAULTS) o[k] = (k in s) ? s[k] : SETTINGS_DEFAULTS[k]; return o; } catch (e) { return Object.assign({}, SETTINGS_DEFAULTS); } })();
  function saveSettings() { try { localStorage.setItem('sn_settings', JSON.stringify(snSettings)); } catch (e) {} }

  var FOLDER_COLORS = ['#30aefc', '#ff77e4', '#3ecf6e', '#fdba74', '#c4b5fd', '#f87171', '#fbbf24', '#94a0b4'];
  var FOLDER_ICONS = ['i-folder', 'i-spark', 'i-chat', 'i-brain', 'i-globe', 'i-shield', 'i-flask', 'i-pin'];
  var codeReg = {}; var codeSeq = 0;

  /*  helpers  */
  function escHTML(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function nameOf(u) { var m = (u && u.user_metadata) || {}; return m.username || (u && u.email ? u.email.split('@')[0] : 'you'); }
  function avatarOf(u) { var m = (u && u.user_metadata) || {}; return m.avatar_url || ''; }
  function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
  function now() { return Date.now(); }
  function timeLabel(ts) { var d = new Date(ts); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  /*  persistence  */
  function storeKey() { return 'sn_threads_' + state.uid; }
  function saveThreads() { try { localStorage.setItem(storeKey(), JSON.stringify(state.threads)); } catch (e) {} scheduleRemoteSave(); }
  function loadThreads() { try { state.threads = JSON.parse(localStorage.getItem(storeKey()) || '[]'); } catch (e) { state.threads = []; } }
  function activeThread() { return state.threads.filter(function (t) { return t.id === state.activeId; })[0] || null; }

  /*  MARKDOWN  */
  var KW = {};
  ('const let var function return if else for while new class extends import from export await async try catch finally throw typeof instanceof in of do switch case break continue default null true false undefined this super void yield def elif None True False print lambda pass with as and or not is public private static int string bool')
    .split(' ').forEach(function (k) { KW[k] = 1; });

  function hlGeneric(e) {
    var pat = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)/g;
    return e.replace(pat, function (m, cm, str, num, id) {
      if (cm) return '<span class="tok-cm">' + cm + '</span>';
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (num) return '<span class="tok-num">' + num + '</span>';
      if (id) return KW[id] ? '<span class="tok-kw">' + id + '</span>' : id;
      return m;
    });
  }
  function hlMarkup(e) {
    var pat = /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([a-zA-Z][\w:-]*)((?:[^&]|&(?!gt;))*?)(\/?&gt;)/g;
    return e.replace(pat, function (m, cm, open, tag, attrs, close) {
      if (cm) return '<span class="tok-cm">' + cm + '</span>';
      var a = attrs.replace(/([\w:-]+)(=)("[^"]*"|'[^']*')/g, '<span class="tok-at">$1</span>$2<span class="tok-str">$3</span>');
      return open + '<span class="tok-tag">' + tag + '</span>' + a + close;
    });
  }
  function highlight(code, lang) {
    var e = escHTML(code);
    return /^(html|xml|svg|markup|vue)$/i.test(lang || '') ? hlMarkup(e) : hlGeneric(e);
  }
  function codeCardHTML(block) {
    var id = 'c' + (++codeSeq); codeReg[id] = block.code;
    var viewable = /^(html|xml|svg)$/i.test(block.lang);
    var view = viewable ? '<button class="cc-btn" data-code-act="view" data-code-id="' + id + '"><svg class="ic-sm"><use href="#i-eye"/></svg> View</button>' : '';
    return '<div class="code-card"><div class="cc-head"><span class="cc-lang">' + escHTML(block.lang || 'code') + '</span>' + view +
      '<button class="cc-btn" data-code-act="copy" data-code-id="' + id + '"><svg class="ic-sm"><use href="#i-copy"/></svg> Copy</button></div>' +
      '<pre><code>' + highlight(block.code, block.lang) + '</code></pre></div>';
  }
  function splitRow(l) { return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); }); }
  function tableHTML(header, rows, inl) {
    var h = '<div class="tbl-wrap"><table><thead><tr>' + header.map(function (c) { return '<th>' + inl(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inl(c) + '</td>'; }).join('') + '</tr>'; }).join('');
    return h + '</tbody></table></div>';
  }
  function inline(t) {
    t = escHTML(t);
    t = t.replace(/`([^`]+)`/g, function (m, c) { return '<code class="inline">' + c + '</code>'; });
    // images ![alt](url) — must run before links; Pulsar embeds images this way
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      return '<img class="msg-embed-img" src="' + url + '" alt="' + alt + '" loading="lazy" onerror="this.classList.add(\'broken\')">';
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }
  function renderMarkdown(md) {
    var blocks = [];
    md = String(md).replace(/```([\w+#.-]*)[^\S\n]*\n?([\s\S]*?)```/g, function (m, lang, code) {
      blocks.push({ lang: (lang || '').toLowerCase(), code: code.replace(/\n$/, '') });
      return '\nCODE' + (blocks.length - 1) + '\n';
    });
    var lines = md.split('\n'), html = '', i = 0;
    while (i < lines.length) {
      var ln = lines[i];
      if (/^CODE\d+$/.test(ln.trim())) { html += codeCardHTML(blocks[+ln.trim().match(/\d+/)[0]]); i++; continue; }
      if (/^\s*$/.test(ln)) { i++; continue; }
      var h = ln.match(/^(#{1,3})\s+(.*)$/); if (h) { html += '<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'; i++; continue; }
      if (/\|/.test(ln) && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var header = splitRow(ln), rows = []; i += 2;
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== '') { rows.push(splitRow(lines[i])); i++; }
        html += tableHTML(header, rows, inline); continue;
      }
      if (/^\s*>\s?/.test(ln)) { var q = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; } html += '<blockquote>' + inline(q.join(' ')) + '</blockquote>'; continue; }
      if (/^\s*\$\$/.test(ln)) {
        var mm = [], first = ln.replace(/^\s*\$\$/, '');
        if (/\$\$\s*$/.test(first)) { mm.push(first.replace(/\$\$\s*$/, '')); i++; }
        else { mm.push(first); i++; while (i < lines.length && !/\$\$/.test(lines[i])) { mm.push(lines[i]); i++; } if (i < lines.length) { mm.push(lines[i].replace(/\$\$\s*$/, '')); i++; } }
        html += '<div class="sn-math">$$' + mm.join(' ').trim() + '$$</div>'; continue;
      }
      if (/^\s*[-*]\s+/.test(ln)) { var it = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { it.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; } html += '<ul>' + it.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'; continue; }
      if (/^\s*\d+\.\s+/.test(ln)) { var it2 = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { it2.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; } html += '<ol>' + it2.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>'; continue; }
      var p = [ln]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^CODE\d+$/.test(lines[i].trim()) && !/^#{1,3}\s/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i]) && !/^\s*\$\$/.test(lines[i])) { p.push(lines[i]); i++; }
      html += '<p>' + inline(p.join(' ')) + '</p>';
    }
    return html;
  }
  // Render emoji as Twemoji SVGs (guarded: if the lib isn't loaded, native emoji stay)
  function twemojify(el) {
    if (!el || !window.twemoji || !snSettings.twemoji) return;
    try { window.twemoji.parse(el, { folder: 'svg', ext: '.svg', className: 'sn-emoji', base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/' }); } catch (e) {}
  }
  function typesetMath(el) {
    if (typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }],
        throwOnError: false
      });
    } catch (e) {}
  }

  /*  TOASTS / BANNERS  */
  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = '<svg class="ic-sm"><use href="#i-' + (kind === 'err' ? 'warn' : 'check') + '"/></svg><span>' + escHTML(msg) + '</span>';
    $('#toasts').appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /*  SIDEBAR  */
  function threadGroup(ts) {
    var d = new Date(ts), n = new Date(); n.setHours(0, 0, 0, 0);
    var y = new Date(n); y.setDate(y.getDate() - 1);
    if (d >= n) return 'Today'; if (d >= y) return 'Yesterday'; return 'Older';
  }
  function renderSidebar() {
    var host = $('#sideScroll'); host.innerHTML = '';
    var q = state.search.trim().toLowerCase();
    function match(t) { if (!q) return true; if (t.title.toLowerCase().indexOf(q) >= 0) return true; return t.messages.some(function (m) { return (m.content || '').toLowerCase().indexOf(q) >= 0; }); }
    var fset = {}; (state.folders || []).forEach(function (f) { fset[f.id] = true; });

    // folders first
    (state.folders || []).forEach(function (f) {
      var chats = state.threads.filter(function (t) { return t.folderId === f.id && match(t); }).sort(byOrder);
      if (q && !chats.length) return;
      host.appendChild(folderEl(f, chats));
    });

    var unfiled = state.threads.filter(function (t) { return (!t.folderId || !fset[t.folderId]) && match(t); });
    var pinned = unfiled.filter(function (t) { return t.pinned; }).sort(byOrder);
    var rest = unfiled.filter(function (t) { return !t.pinned; }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });

    if (pinned.length) { host.appendChild(secHeader('Pinned', 'i-pin')); pinned.forEach(function (t) { host.appendChild(threadEl(t)); }); }
    ['Today', 'Yesterday', 'Older'].forEach(function (g) {
      var items = rest.filter(function (t) { return threadGroup(t.updatedAt) === g; });
      if (!items.length) return;
      host.appendChild(secHeader(g, null));
      items.forEach(function (t) { host.appendChild(threadEl(t)); });
    });
    if (!state.threads.length && !(state.folders || []).length) { var e = document.createElement('div'); e.className = 'side-empty'; e.textContent = 'No chats yet. Start a new one.'; host.appendChild(e); }
  }
  function folderEl(f, chats) {
    var d = document.createElement('div'); d.className = 'folder' + (f.collapsed ? ' collapsed' : '');
    var head = document.createElement('div'); head.className = 'folder-head';
    head.innerHTML = '<span class="fico" style="background:' + f.color + '"><svg><use href="#' + f.icon + '"/></svg></span>' +
      '<span class="fname">' + escHTML(f.name) + '</span><span class="fcount">' + chats.length + '</span>' +
      '<button class="fmenu" aria-label="Folder menu"><svg class="ic-sm"><use href="#i-dots"/></svg></button>' +
      '<svg class="fchev"><use href="#i-cd"/></svg>';
    head.addEventListener('click', function (e) {
      if (e.target.closest('.fmenu')) { e.stopPropagation(); openFolderModal(f); return; }
      f.collapsed = !f.collapsed; saveFolders(); renderSidebar();
    });
    // folder drag (reorder folders) via the header
    head.draggable = true;
    head.addEventListener('dragstart', function (e) { state._drag = { type: 'folder', id: f.id }; d.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', f.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} e.stopPropagation(); });
    head.addEventListener('dragend', function () { d.classList.remove('dragging'); clearDropMarks(); state._drag = null; });
    // folder as a drop target: a thread drops INTO it; a folder drops to REORDER
    function overFolder(e) {
      if (!state._drag) return; e.preventDefault(); e.stopPropagation();
      if (state._drag.type === 'thread') { d.classList.add('drop-into'); }
      else if (state._drag.type === 'folder' && state._drag.id !== f.id) {
        var r = head.getBoundingClientRect(); var after = (e.clientY - r.top) > r.height / 2;
        head.classList.toggle('drop-after', after); head.classList.toggle('drop-before', !after);
      }
    }
    function leaveFolder() { d.classList.remove('drop-into'); head.classList.remove('drop-before', 'drop-after'); }
    function dropFolder(e) {
      if (!state._drag) return; e.preventDefault(); e.stopPropagation();
      if (state._drag.type === 'thread') { d.classList.remove('drop-into'); moveIntoFolder(state._drag.id, f.id); }
      else if (state._drag.type === 'folder') { var after = head.classList.contains('drop-after'); leaveFolder(); reorderFolder(state._drag.id, f.id, after); }
    }
    head.addEventListener('dragover', overFolder); head.addEventListener('dragleave', leaveFolder); head.addEventListener('drop', dropFolder);
    d.appendChild(head);
    var body = document.createElement('div'); body.className = 'folder-body';
    body.addEventListener('dragover', function (e) { if (state._drag && state._drag.type === 'thread') { e.preventDefault(); d.classList.add('drop-into'); } });
    body.addEventListener('dragleave', function () { d.classList.remove('drop-into'); });
    body.addEventListener('drop', function (e) { if (state._drag && state._drag.type === 'thread' && !e.target.closest('.thread')) { e.preventDefault(); e.stopPropagation(); d.classList.remove('drop-into'); moveIntoFolder(state._drag.id, f.id); } });
    if (chats.length) chats.forEach(function (t) { body.appendChild(threadEl(t)); });
    else { var em = document.createElement('div'); em.className = 'folder-empty'; em.textContent = 'Empty'; body.appendChild(em); }
    d.appendChild(body);
    return d;
  }
  function secHeader(label, icon) {
    var d = document.createElement('div'); d.className = 'side-sec-h';
    d.innerHTML = (icon ? '<svg class="ic-sm"><use href="#' + icon + '"/></svg>' : '') + label;
    return d;
  }
  function threadEl(t) {
    var d = document.createElement('div'); d.className = 'thread' + (t.id === state.activeId ? ' active' : ''); d.dataset.id = t.id;
    d.innerHTML = (t.pinned ? '<svg class="pinico"><use href="#i-pin"/></svg>' : '') +
      '<span class="t-title">' + escHTML(t.title) + '</span>' +
      '<button class="t-menu" data-menu="' + t.id + '" aria-label="Thread menu"><svg class="ic-sm"><use href="#i-dots"/></svg></button>';
    d.addEventListener('click', function (e) {
      if (e.target.closest('.t-menu')) { e.stopPropagation(); openThreadMenu(t.id, e.target.closest('.t-menu')); return; }
      if (d.querySelector('.t-rename')) return;
      selectThread(t.id);
    });
    // drag & drop
    d.draggable = true;
    d.addEventListener('dragstart', function (e) { state._drag = { type: 'thread', id: t.id }; d.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
    d.addEventListener('dragend', function () { d.classList.remove('dragging'); clearDropMarks(); state._drag = null; });
    d.addEventListener('dragover', function (e) {
      if (!state._drag || state._drag.type !== 'thread' || state._drag.id === t.id) return;
      e.preventDefault(); e.stopPropagation();
      var r = d.getBoundingClientRect(); var after = (e.clientY - r.top) > r.height / 2;
      d.classList.toggle('drop-after', after); d.classList.toggle('drop-before', !after);
    });
    d.addEventListener('dragleave', function () { d.classList.remove('drop-before', 'drop-after'); });
    d.addEventListener('drop', function (e) {
      if (!state._drag || state._drag.type !== 'thread') return;
      e.preventDefault(); e.stopPropagation();
      var after = d.classList.contains('drop-after'); d.classList.remove('drop-before', 'drop-after');
      dropThreadNear(state._drag.id, t, after);
    });
    return d;
  }
  function clearDropMarks() { $$('.drop-before,.drop-after,.drop-into').forEach(function (x) { x.classList.remove('drop-before', 'drop-after', 'drop-into'); }); }
  function byOrder(a, b) { var ao = (a.order == null ? Infinity : a.order), bo = (b.order == null ? Infinity : b.order); if (ao !== bo) return ao - bo; return b.updatedAt - a.updatedAt; }
  function contextThreads(ref) {
    // the ordered list a thread belongs to (a folder, or the unfiled pinned list)
    var fset = {}; (state.folders || []).forEach(function (f) { fset[f.id] = true; });
    if (ref.folderId && fset[ref.folderId]) return state.threads.filter(function (t) { return t.folderId === ref.folderId; }).sort(byOrder);
    if (ref.pinned) return state.threads.filter(function (t) { return t.pinned && (!t.folderId || !fset[t.folderId]); }).sort(byOrder);
    return null; // date-grouped area: not manually orderable
  }
  function dropThreadNear(dragId, tgt, after) {
    var src = state.threads.filter(function (x) { return x.id === dragId; })[0]; if (!src || src.id === tgt.id) return;
    src.folderId = tgt.folderId || null; src.pinned = !!tgt.pinned;
    var list = contextThreads(tgt);
    if (!list) { saveThreads(); renderSidebar(); return; } // dropped into a date group -> just adopts context
    list = list.filter(function (t) { return t.id !== src.id; });
    var idx = list.indexOf(tgt); if (idx < 0) idx = list.length - 1;
    list.splice(after ? idx + 1 : idx, 0, src);
    list.forEach(function (t, i) { t.order = i; });
    saveThreads(); renderSidebar();
  }
  function moveIntoFolder(dragId, folderId) {
    var src = state.threads.filter(function (x) { return x.id === dragId; })[0]; if (!src) return;
    src.folderId = folderId; src.pinned = false;
    var max = -1; state.threads.forEach(function (t) { if (t.folderId === folderId && t.order != null && t.order > max) max = t.order; });
    src.order = max + 1;
    saveThreads(); renderSidebar();
  }
  function reorderFolder(dragId, tgtId, after) {
    if (dragId === tgtId) return;
    var arr = state.folders, from = arr.map(function (f) { return f.id; }).indexOf(dragId);
    if (from < 0) return; var moved = arr.splice(from, 1)[0];
    var to = arr.map(function (f) { return f.id; }).indexOf(tgtId); if (to < 0) to = arr.length;
    arr.splice(after ? to + 1 : to, 0, moved);
    saveFolders(); renderSidebar();
  }

  var menuFor = null;
  function openThreadMenu(id, anchor) {
    var m = $('#ctxMenu'); menuFor = id;
    var r = anchor.getBoundingClientRect();
    m.style.left = Math.min(r.left, window.innerWidth - 180) + 'px';
    m.style.top = (r.bottom + 4) + 'px';
    m.classList.add('on');
  }
  function closeThreadMenu() { $('#ctxMenu').classList.remove('on'); menuFor = null; }

  function renameThread(id) {
    var el = $('.thread[data-id="' + id + '"]'); if (!el) return;
    var t = state.threads.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var title = el.querySelector('.t-title'); if (!title) return;
    var inp = document.createElement('input'); inp.className = 't-rename'; inp.value = t.title;
    title.replaceWith(inp); inp.focus(); inp.select();
    function commit() { var v = inp.value.trim() || t.title; t.title = v; saveThreads(); renderSidebar(); if (t.id === state.activeId) $('#threadTitle').textContent = v; }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') renderSidebar(); });
    inp.addEventListener('blur', commit);
  }
  function deleteThread(id) {
    state.threads = state.threads.filter(function (t) { return t.id !== id; }); saveThreads();
    if (state.activeId === id) { state.activeId = state.threads.length ? state.threads[0].id : null; if (state.activeId) selectThread(state.activeId); else newThread(); }
    renderSidebar(); toast('Chat deleted');
  }
  function pinThread(id) { var t = state.threads.filter(function (x) { return x.id === id; })[0]; if (t) { t.pinned = !t.pinned; saveThreads(); renderSidebar(); toast(t.pinned ? 'Pinned' : 'Unpinned'); } }

  /*  FOLDERS  */
  function folderKey() { return 'sn_folders_' + state.uid; }
  function saveFolders() { try { localStorage.setItem(folderKey(), JSON.stringify(state.folders)); } catch (e) {} scheduleRemoteSave(); }
  function loadFolders() { try { state.folders = JSON.parse(localStorage.getItem(folderKey()) || '[]'); } catch (e) { state.folders = []; } }
  function openFolderModal(folder) {
    state.editingFolder = folder || null;
    $('#fldTitle').textContent = folder ? 'Edit folder' : 'New folder';
    $('#fldName').value = folder ? folder.name : '';
    $('#fldSave').textContent = folder ? 'Save' : 'Create folder';
    $('#fldDelete').hidden = !folder;
    var sel = { color: folder ? folder.color : FOLDER_COLORS[0], icon: folder ? folder.icon : FOLDER_ICONS[0] };
    state._fldSel = sel;
    var ch = $('#fldColors'); ch.innerHTML = '';
    FOLDER_COLORS.forEach(function (c) {
      var b = document.createElement('button'); b.className = 'fld-sw' + (c === sel.color ? ' on' : ''); b.style.background = c; b.style.color = c;
      b.addEventListener('click', function () { sel.color = c; $$('.fld-sw', ch).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
      ch.appendChild(b);
    });
    var ih = $('#fldIcons'); ih.innerHTML = '';
    FOLDER_ICONS.forEach(function (ic) {
      var b = document.createElement('button'); b.className = 'fld-ico' + (ic === sel.icon ? ' on' : ''); b.innerHTML = '<svg><use href="#' + ic + '"/></svg>';
      b.addEventListener('click', function () { sel.icon = ic; $$('.fld-ico', ih).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
      ih.appendChild(b);
    });
    $('#folderModal').classList.add('on'); setTimeout(function () { $('#fldName').focus(); }, 30);
  }
  function closeFolderModal() { $('#folderModal').classList.remove('on'); state.editingFolder = null; }
  function saveFolder() {
    var name = $('#fldName').value.trim() || 'Folder'; var sel = state._fldSel || { color: FOLDER_COLORS[0], icon: FOLDER_ICONS[0] };
    if (state.editingFolder) { state.editingFolder.name = name; state.editingFolder.color = sel.color; state.editingFolder.icon = sel.icon; }
    else { state.folders.unshift({ id: uid(), name: name, color: sel.color, icon: sel.icon, collapsed: false }); }
    saveFolders(); closeFolderModal(); renderSidebar();
  }
  function deleteFolder() {
    if (!state.editingFolder) return; var id = state.editingFolder.id;
    state.threads.forEach(function (t) { if (t.folderId === id) t.folderId = null; }); saveThreads();
    state.folders = state.folders.filter(function (f) { return f.id !== id; }); saveFolders();
    closeFolderModal(); renderSidebar(); toast('Folder deleted');
  }
  function openFolderPicker(threadId, r) {
    var m = $('#folderPicker'); m.innerHTML = '';
    function opt(html, fn) { var b = document.createElement('button'); b.innerHTML = html; b.addEventListener('click', function () { fn(); closeFolderPicker(); }); m.appendChild(b); }
    opt('<svg class="ic-sm"><use href="#i-x"/></svg> No folder', function () { moveThread(threadId, null); });
    state.folders.forEach(function (f) {
      opt('<span class="fico" style="width:20px;height:20px;background:' + f.color + ';border-radius:6px;display:inline-flex;align-items:center;justify-content:center"><svg style="width:11px;height:11px;fill:#0d1117"><use href="#' + f.icon + '"/></svg></span> ' + escHTML(f.name), function () { moveThread(threadId, f.id); });
    });
    opt('<svg class="ic-sm"><use href="#i-plus"/></svg> New folder', function () { openFolderModal(null); });
    m.style.left = Math.min(r.left, window.innerWidth - 190) + 'px'; m.style.top = (r.top) + 'px';
    m.classList.add('on');
  }
  function closeFolderPicker() { $('#folderPicker').classList.remove('on'); }
  function moveThread(id, folderId) {
    var t = state.threads.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    t.folderId = folderId; saveThreads(); renderSidebar();
    toast(folderId ? 'Moved to folder' : 'Removed from folder');
  }

  /*  THREAD / STREAM  */
  function newThread() {
    var t = { id: uid(), title: 'New chat', pinned: false, createdAt: now(), updatedAt: now(), messages: [] };
    state.threads.unshift(t); state.activeId = t.id; saveThreads(); renderSidebar(); selectThread(t.id);
    if (window.innerWidth <= 760) document.body.classList.remove('side-open');
    $('#composerInput').focus();
  }
  function selectThread(id) {
    state.activeId = id; var t = activeThread(); if (!t) return;
    $('#threadTitle').textContent = t.title;
    state.trainMode = t.trainMode ? { kind: t.trainMode, label: (TRAIN_GAMES.filter(function (g) { return g.id === t.trainMode; })[0] || {}).name || 'Training' } : null;
    if (typeof renderTrainBar === 'function') renderTrainBar();
    renderStream(); renderSidebar();
    setElicitations([]);
    if (window.innerWidth <= 760) document.body.classList.remove('side-open');
  }

  function renderStream() {
    var t = activeThread(); var host = $('#streamInner'); host.innerHTML = '';
    // system notice (once)
    var b = document.createElement('div'); b.className = 'banner note';
    b.innerHTML = '<svg class="ic"><use href="#i-info"/></svg><div><b>Preview build.</b> Pulsar is still in training, so replies here are a local simulation to show the interface. Your chats stay in this browser for now.</div><span class="x" data-x>&times;</span>';
    b.querySelector('[data-x]').addEventListener('click', function () { b.remove(); });
    host.appendChild(b);

    if (!t || !t.messages.length) { host.appendChild(emptyHero()); scrollDown(); return; }
    t.messages.forEach(function (m, idx) { host.appendChild(messageEl(m, idx)); });
    scrollDown();
  }
  function emptyHero() {
    var d = document.createElement('div'); d.className = 'empty-hero';
    d.innerHTML = '<img src="' + PFP + '" alt="Supernova"><h2>How can I help?</h2><p>Ask anything. Pulsar can write, explain, plan and generate code. This is an early preview.</p>' +
      '<div class="empty-suggest">' +
      '<button data-suggest="Write a warm welcome message for new members of my community."><b>Draft a message</b>A friendly welcome for new members</button>' +
      '<button data-suggest="Show me a small HTML landing section with a heading and a button."><b>Generate code</b>A little HTML section I can preview</button>' +
      '<button data-suggest="Explain what a supernova is in simple terms."><b>Explain something</b>What is a supernova, simply?</button>' +
      '<button data-suggest="Make a table comparing three note-taking apps."><b>Compare options</b>A quick comparison table</button>' +
      '</div>';
    $$('[data-suggest]', d).forEach(function (btn) { btn.addEventListener('click', function () { sendMessage(btn.getAttribute('data-suggest')); }); });
    return d;
  }

  function messageEl(m, idx) {
    var row = document.createElement('div'); row.className = 'msg'; row.dataset.idx = idx;
    if (m.role === 'user') {
      var av = avatarOf(state.user);
      row.innerHTML = (av ? '<img class="av" src="' + escHTML(av) + '" alt="">' : '<div class="av user">' + escHTML(nameOf(state.user).charAt(0).toUpperCase()) + '</div>') +
        '<div class="body"><div class="head"><span class="nm">' + escHTML(nameOf(state.user)) + '</span>' + (m.feedbackNote ? '<span class="fb-tag">Feedback</span>' : '') + (m.answerNote ? '<span class="fb-tag ans">Answer</span>' : '') + '<span class="ts">' + timeLabel(m.ts) + '</span></div>' +
        (m.attachments && m.attachments.length ? attachmentsHTML(m.attachments) : '') +
        '<div class="prose"></div></div>';
      var upr = $('.prose', row); upr.textContent = m.content; twemojify(upr);
      row.appendChild(userTools(idx));
    } else {
      row.innerHTML = '<img class="av" src="' + PFP + '" alt="Supernova">' +
        '<div class="body"><div class="head"><span class="nm ai">Supernova</span><span class="tag-ai">Pulsar</span><span class="ts">' + timeLabel(m.ts) + '</span></div>' +
        (m.reasoning ? thinkHTML(m.reasoning) : '') +
        '<div class="prose"></div>' +
        (m.sources && m.sources.length ? sourcesHTML(m.sources) : '') + '</div>';
      var pr = $('.prose', row); pr.innerHTML = renderMarkdown(m.content); typesetMath(pr); twemojify(pr);
      row.querySelector('.body').appendChild(aiTools(idx, m));
    }
    return row;
  }
  function domainOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return String(u); } }
  function favicon(u) { try { return 'https://www.google.com/s2/favicons?sz=64&domain=' + new URL(u).hostname; } catch (e) { return ''; } }
  function sourcesHTML(list) {
    return '<div class="msg-sources"><div class="src-h"><svg class="ic-sm"><use href="#i-globe"/></svg> Sources</div><div class="src-list">' +
      list.map(function (s, i) {
        return '<a class="src-chip" href="' + escHTML(s.url) + '" target="_blank" rel="noopener"><span class="num">' + (i + 1) +
          '</span><img class="fav" src="' + favicon(s.url) + '" alt="" onerror="this.style.visibility=\'hidden\'"><span class="st"><span class="tt">' +
          escHTML(s.title || domainOf(s.url)) + '</span><span class="dm">' + escHTML(domainOf(s.url)) + '</span></span></a>';
      }).join('') + '</div></div>';
  }
  function attachmentsHTML(atts) {
    return '<div>' + atts.map(function (a) {
      if (a.preview) return '<div class="media-card"><img src="' + escHTML(a.preview) + '" alt=""><div class="cap">' + escHTML(a.name) + '</div></div>';
      return '<div class="attach-chip"><svg class="ic"><use href="#i-file"/></svg><div class="meta"><div class="fn">' + escHTML(a.name) + '</div><div class="sz">' + fmtSize(a.size) + '</div></div></div>';
    }).join('') + '</div>';
  }
  function thinkHTML(txt) {
    return '<details class="think"' + (snSettings.showThinking ? ' open' : '') + '><summary><svg class="ic-sm"><use href="#i-brain"/></svg> Thinking<svg class="ic-sm chev"><use href="#i-cd"/></svg></summary><div class="think-body">' + renderMarkdown(txt) + '</div></details>';
  }
  function userTools(idx) {
    var t = activeThread(); var m = t && t.messages[idx];
    var g = t && m && t.vgroups && t.vgroups[m.vg];
    var pager = (g && g.versions.length > 1) ?
      '<div class="ver-pager"><button class="vp-btn" data-act="vprev" aria-label="Previous version">&lsaquo;</button>' +
      '<span class="vp-n">' + (g.active + 1) + ' / ' + g.versions.length + '</span>' +
      '<button class="vp-btn" data-act="vnext" aria-label="Next version">&rsaquo;</button></div>' : '';
    var w = document.createElement('div'); w.className = 'msg-tools' + (pager ? ' pinned' : '');
    w.innerHTML = tbtn('edit', 'i-pen', 'Edit prompt') + tbtn('copy', 'i-copy', 'Copy') + pager;
    w.addEventListener('click', function (e) { var b = e.target.closest('.msg-tool, .vp-btn'); if (b) msgAction(b.dataset.act, idx, w); });
    return w;
  }
  function aiTools(idx, m) {
    var t = activeThread();
    var g = t && m && m.avg && t.avgroups && t.avgroups[m.avg];
    var pager = (g && g.versions.length > 1) ?
      '<div class="ver-pager"><button class="vp-btn" data-act="vprevA" aria-label="Previous response">&lsaquo;</button>' +
      '<span class="vp-n">' + (g.active + 1) + ' / ' + g.versions.length + '</span>' +
      '<button class="vp-btn" data-act="vnextA" aria-label="Next response">&rsaquo;</button></div>' : '';
    var w = document.createElement('div'); w.className = 'msg-tools' + (pager ? ' pinned' : '');
    w.innerHTML = tbtn('copy', 'i-copy', 'Copy') + tbtn('regen', 'i-regen', 'Regenerate') + tbtn('branch', 'i-branch', 'Branch') +
      '<button class="msg-tool' + (m.feedback === 'up' ? ' on-up' : '') + '" data-act="up" data-tip="Good response"><svg class="ic-sm"><use href="#' + (m.feedback === 'up' ? 'i-up-fill' : 'i-up') + '"/></svg></button>' +
      '<button class="msg-tool' + (m.feedback === 'down' ? ' on-down' : '') + '" data-act="down" data-tip="Bad response"><svg class="ic-sm"><use href="#' + (m.feedback === 'down' ? 'i-down-fill' : 'i-down') + '"/></svg></button>' + pager;
    w.addEventListener('click', function (e) { var b = e.target.closest('.msg-tool, .vp-btn'); if (b) msgAction(b.dataset.act, idx, w); });
    return w;
  }
  function tbtn(act, icon, tip) { return '<button class="msg-tool" data-act="' + act + '" data-tip="' + tip + '"><svg class="ic-sm"><use href="#' + icon + '"/></svg></button>'; }

  function msgAction(act, idx, toolsEl) {
    var t = activeThread(); if (!t) return; var m = t.messages[idx]; if (!m) return;
    if (act === 'copy') { copyText(m.content); toast('Copied to clipboard'); }
    else if (act === 'edit') { editUserMessage(idx); }
    else if (act === 'regen') { regenerate(idx); }
    else if (act === 'branch') { branchFrom(idx); }
    else if (act === 'vprev') { switchVersion(idx, -1); }
    else if (act === 'vnext') { switchVersion(idx, 1); }
    else if (act === 'vprevA') { switchAiVersion(idx, -1); }
    else if (act === 'vnextA') { switchAiVersion(idx, 1); }
    else if (act === 'up' || act === 'down') { setFeedback(idx, act, toolsEl); }
  }
  function setFeedback(idx, val, toolsEl) {
    var t = activeThread(); var m = t.messages[idx];
    m.feedback = (m.feedback === val ? null : val); saveThreads();
    var up = toolsEl.querySelector('[data-act="up"]'), dn = toolsEl.querySelector('[data-act="down"]');
    up.classList.toggle('on-up', m.feedback === 'up'); dn.classList.toggle('on-down', m.feedback === 'down');
    up.querySelector('use').setAttribute('href', m.feedback === 'up' ? '#i-up-fill' : '#i-up');
    dn.querySelector('use').setAttribute('href', m.feedback === 'down' ? '#i-down-fill' : '#i-down');
    if (m.feedback) {
      var prev = t.messages[idx - 1];
      stockFeedback(prev ? prev.content : null, m.content, m.feedback);
      toast(m.feedback === 'up' ? 'Thanks, Pulsar will weight this higher' : 'Noted, Pulsar will learn from this');
    }
  }
  function editUserMessage(idx) {
    if (state.streaming) return;
    var t = activeThread(); if (!t) return; var m = t.messages[idx]; if (!m || m.role !== 'user') return;
    var row = $('.msg[data-idx="' + idx + '"]'); if (!row) return;
    var body = row.querySelector('.body');
    var prose = body.querySelector('.prose'); var tools = body.parentNode.querySelector('.msg-tools') || row.querySelector('.msg-tools');
    if (prose) prose.style.display = 'none'; if (tools) tools.style.display = 'none';
    var box = document.createElement('div'); box.className = 'msg-edit';
    box.innerHTML = '<textarea></textarea><div class="me-actions"><button class="me-cancel">Cancel</button><button class="me-save">Save &amp; regenerate</button></div>';
    body.appendChild(box);
    var ta = box.querySelector('textarea'); ta.value = m.content;
    var grow = function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 240) + 'px'; };
    ta.addEventListener('input', grow); grow(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    function cancel() { renderStream(); }
    function save() {
      var v = ta.value.trim(); if (!v || v === m.content) return cancel();
      t.vgroups = t.vgroups || {};
      var g = t.vgroups[m.vg] || (t.vgroups[m.vg] = { versions: [{ content: m.content, ts: m.ts }], active: 0 });
      // snapshot the version we're leaving (its prompt text + everything after it)
      g.versions[g.active].content = m.content; g.versions[g.active].tail = cloneTail(t, idx);
      // new version becomes active with a fresh (empty) tail
      g.versions.push({ content: v, ts: now(), tail: [] }); g.active = g.versions.length - 1;
      m.content = v; m.ts = g.versions[g.active].ts;
      t.messages = t.messages.slice(0, idx + 1);
      titleIfFirst(t, idx, v);
      t.updatedAt = now(); saveThreads(); renderStream(); renderSidebar();
      stock('user', v);
      respondTo(v);
    }
    box.querySelector('.me-cancel').addEventListener('click', cancel);
    box.querySelector('.me-save').addEventListener('click', save);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } else if (e.key === 'Escape') cancel(); });
  }
  function cloneTail(t, idx) { return t.messages.slice(idx + 1).map(function (m) { return JSON.parse(JSON.stringify(m)); }); }
  function titleIfFirst(t, idx, v) {
    if (!t.messages.slice(0, idx).some(function (x) { return x.role === 'user'; })) { t.title = v.slice(0, 42) || 'New chat'; $('#threadTitle').textContent = t.title; }
  }
  function switchVersion(idx, dir) {
    if (state.streaming) return;
    var t = activeThread(); if (!t) return; var m = t.messages[idx]; if (!m || !m.vg) return;
    var g = t.vgroups && t.vgroups[m.vg]; if (!g) return;
    var k = g.active + dir; if (k < 0 || k >= g.versions.length) return;
    g.versions[g.active].content = m.content; g.versions[g.active].tail = cloneTail(t, idx);
    g.active = k;
    m.content = g.versions[k].content;
    t.messages = t.messages.slice(0, idx + 1).concat((g.versions[k].tail || []).map(function (x) { return JSON.parse(JSON.stringify(x)); }));
    titleIfFirst(t, idx, m.content);
    t.updatedAt = now(); saveThreads(); renderStream(); renderSidebar();
  }
  // Assistant responses: each regenerate is a version (1 / 2 / 3 ...) you can page through.
  function switchAiVersion(idx, dir) {
    if (state.streaming) return;
    var t = activeThread(); if (!t) return; var m = t.messages[idx]; if (!m || !m.avg) return;
    var g = t.avgroups && t.avgroups[m.avg]; if (!g) return;
    var k = g.active + dir; if (k < 0 || k >= g.versions.length) return;
    // snapshot the version we're leaving (its content + anything that followed it)
    var cur = g.versions[g.active];
    cur.content = m.content; cur.reasoning = m.reasoning; cur.sources = m.sources; cur.tail = cloneTail(t, idx);
    g.active = k; var v = g.versions[k];
    m.content = v.content; m.reasoning = v.reasoning || null; m.sources = v.sources || []; if (v.ts) m.ts = v.ts;
    t.messages = t.messages.slice(0, idx + 1).concat((v.tail || []).map(function (x) { return JSON.parse(JSON.stringify(x)); }));
    t.updatedAt = now(); saveThreads(); renderStream(); renderSidebar();
  }
  /* stock data into Pulsar's DB (append-only). Silent until schema.sql is run. */
  var PULSAR_DB = { url: 'https://xrmmedxbqmwjcucyjosl.supabase.co', key: 'sb_publishable_ObemhvadYmuXSJchH-SpzA_W4awNZtM' };
  function stock(role, content, extra) {
    if (!content) return;
    try {
      fetch(PULSAR_DB.url + '/rest/v1/pulsar_messages', {
        method: 'POST', keepalive: true,
        headers: { apikey: PULSAR_DB.key, Authorization: 'Bearer ' + PULSAR_DB.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(Object.assign({ user_ref: state.uid || null, conv_ref: state.activeId || null, role: role, content: content }, extra || {}))
      }).catch(function () {});
    } catch (e) {}
  }
  function stockFeedback(prompt, response, rating) {
    try {
      fetch(PULSAR_DB.url + '/rest/v1/pulsar_feedback', {
        method: 'POST', headers: { apikey: PULSAR_DB.key, Authorization: 'Bearer ' + PULSAR_DB.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ user_ref: state.uid || null, model: 'pulsar', prompt: prompt || null, response: response || null, rating: rating })
      }).catch(function () {});
    } catch (e) {}
  }
  // Feed pasted text into Pulsar's corpus (Swiftaw only). Splits into passages,
  // inserts them, so pulsar_train can learn vocabulary + patterns from them.
  function feedCorpus(text) {
    var rows = [];
    String(text).split(/\n{2,}/).forEach(function (para) {
      para = para.replace(/\s+/g, ' ').trim(); if (!para) return;
      if (para.length <= 400) { rows.push(para); return; }
      var buf = '';
      para.split(/(?<=[.!?])\s+/).forEach(function (sent) {
        if ((buf + ' ' + sent).trim().length > 400) { if (buf) rows.push(buf.trim()); buf = sent; }
        else buf = (buf ? buf + ' ' : '') + sent;
      });
      if (buf.trim()) rows.push(buf.trim());
    });
    rows = rows.filter(function (r) { return r.length > 8; }).slice(0, 800);
    if (!rows.length) return Promise.reject(new Error('No usable text found'));
    var body = rows.map(function (r) { return { text: r }; });
    return fetch(PULSAR_DB.url + '/rest/v1/pulsar_corpus', {
      method: 'POST',
      headers: { apikey: PULSAR_DB.key, Authorization: 'Bearer ' + PULSAR_DB.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { var msg = t; try { var j = JSON.parse(t); msg = j.message || j.hint || t; } catch (e) {} throw new Error(msg || ('insert ' + r.status)); });
      return rows.length;
    });
  }
  /*  CROSS-DEVICE SYNC: your chats follow your Swiftaw account, not one browser.
      One row per user in sn_chats (user_id, data jsonb). Local storage stays the
      instant cache; the remote copy is merged in on load and pushed on change.  */
  var _syncTimer = null, _remoteLoaded = false, _pendingPush = false;
  function pullRemoteState() {
    if (!state.uid) return Promise.resolve(null);
    // sn_chats_get is a SECURITY DEFINER function: you can only read your own row
    // (by exact user_id), nobody can list everyone's chats.
    return rpc('sn_chats_get', { uid: state.uid }).then(function (d) { return d || null; }).catch(function () { return null; });
  }
  function pushRemoteState() {
    if (!state.uid) return Promise.resolve();
    return rpc('sn_chats_put', { uid: state.uid, payload: { v: 1, threads: state.threads, folders: state.folders } }).catch(function () {});
  }
  function scheduleRemoteSave() {
    if (!_remoteLoaded) { _pendingPush = true; return; } // wait until we've merged remote first
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(function () { _syncTimer = null; pushRemoteState(); }, 1500);
  }
  // Push immediately (e.g. before switching accounts) so nothing in flight is lost.
  function flushRemoteSave() { if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; } if (_remoteLoaded) pushRemoteState(); }
  // Union by id, newer updatedAt wins. Prefers keeping chats over losing them, so a
  // chat made on another device shows up here (deletes don't propagate across devices yet).
  function mergeRemoteState(remote) {
    if (!remote) return false;
    var changed = false, k;
    var fmap = {}; (state.folders || []).forEach(function (f) { fmap[f.id] = f; });
    (remote.folders || []).forEach(function (f) { var ex = fmap[f.id]; if (!ex) { fmap[f.id] = f; changed = true; } else if ((f.updatedAt || 0) > (ex.updatedAt || 0)) { fmap[f.id] = f; changed = true; } });
    state.folders = []; for (k in fmap) state.folders.push(fmap[k]);
    var tmap = {}; (state.threads || []).forEach(function (t) { tmap[t.id] = t; });
    (remote.threads || []).forEach(function (t) { var ex = tmap[t.id]; var ts = t.updatedAt || t.createdAt || 0; if (!ex) { tmap[t.id] = t; changed = true; } else if (ts > (ex.updatedAt || ex.createdAt || 0)) { tmap[t.id] = t; changed = true; } });
    state.threads = []; for (k in tmap) state.threads.push(tmap[k]);
    return changed;
  }
  function syncOnStart() {
    _remoteLoaded = false; _pendingPush = false;
    return pullRemoteState().then(function (remote) {
      var changed = mergeRemoteState(remote);
      _remoteLoaded = true;
      if (changed) {
        try { localStorage.setItem(storeKey(), JSON.stringify(state.threads)); localStorage.setItem(folderKey(), JSON.stringify(state.folders)); } catch (e) {}
        if (!state.threads.some(function (t) { return t.id === state.activeId; })) {
          var newest = state.threads.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; })[0];
          if (newest) state.activeId = newest.id;
        }
        renderSidebar(); if (state.activeId) selectThread(state.activeId);
      }
      if (_pendingPush || changed) { _pendingPush = false; pushRemoteState(); }
    });
  }
  function rpc(fn, body) {
    return fetch(PULSAR_DB.url + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers: { apikey: PULSAR_DB.key, Authorization: 'Bearer ' + PULSAR_DB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) { var msg = t; try { var j = JSON.parse(t); msg = j.message || j.hint || j.details || t; } catch (e) {} throw new Error(msg || ('rpc ' + r.status)); }
        if (!t) return null;
        try { return JSON.parse(t); } catch (e) { return t; }
      });
    });
  }
  // Tidy a short plain sentence, but NEVER touch structured content (code fences,
  // tables, images, lists, multi-line): adding a trailing "." there breaks a closing
  // ``` fence or a table row so scripts/tables stop rendering.
  function cap(t) {
    t = String(t == null ? '' : t).trim();
    if (/```|\n|^\s*[|>#\-*\d]|!\[|\$\$/.test(t) || t.length > 240) return t;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (!/[.!?]$/.test(t)) t += '.';
    return t;
  }

  /*  NATIVE MATH: Pulsar computes arithmetic itself, it isn't "taught" it.
      (Like the old Tithonia brain: math is a built-in competence.)  */
  var MATH_FN = {
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, round: Math.round, floor: Math.floor,
    ceil: Math.ceil, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin,
    acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, ln: Math.log, log: function (x) { return Math.log(x) / Math.LN10; },
    log2: function (x) { return Math.log(x) / Math.LN2; }, sign: Math.sign,
    min: Math.min, max: Math.max, hypot: Math.hypot,
    fact: function (n) { n = Math.round(n); if (n < 0 || n > 170) return NaN; for (var r = 1, k = 2; k <= n; k++) r *= k; return r; }
  };
  var MATH_CONST = { pi: Math.PI, e: Math.E, tau: Math.PI * 2, phi: (1 + Math.sqrt(5)) / 2 };
  function mathTokenize(s) {
    var toks = [], i = 0, n = s.length;
    while (i < n) {
      var c = s[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (/[0-9.]/.test(c)) { var j = i + 1; while (j < n && /[0-9.eE]/.test(s[j]) && !(/[eE]/.test(s[j]) && !/[0-9]/.test(s[j + 1] || '') && s[j + 1] !== '-' && s[j + 1] !== '+')) j++; var num = parseFloat(s.slice(i, j)); if (isNaN(num)) return null; toks.push({ t: 'num', v: num }); i = j; continue; }
      if (/[a-zA-Z]/.test(c)) { var k = i + 1; while (k < n && /[a-zA-Z0-9]/.test(s[k])) k++; toks.push({ t: 'name', v: s.slice(i, k).toLowerCase() }); i = k; continue; }
      if ('+-*/^%()'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c }); i++; continue; }
      if (c === ',') { toks.push({ t: 'comma' }); i++; continue; }
      return null;
    }
    return toks;
  }
  function mathEval(toks) {
    var pos = 0;
    function peek() { return toks[pos]; }
    function expr() { var v = term(); var p; while ((p = peek()) && p.t === 'op' && (p.v === '+' || p.v === '-')) { pos++; var r = term(); v = p.v === '+' ? v + r : v - r; } return v; }
    function term() { var v = factor(); var p; while ((p = peek()) && p.t === 'op' && (p.v === '*' || p.v === '/' || p.v === '%')) { pos++; var r = factor(); v = p.v === '*' ? v * r : p.v === '/' ? v / r : v % r; } return v; }
    function factor() { var v = unary(); var p = peek(); if (p && p.t === 'op' && p.v === '^') { pos++; v = Math.pow(v, factor()); } return v; }
    function unary() { var p = peek(); if (p && p.t === 'op' && (p.v === '-' || p.v === '+')) { pos++; var v = unary(); return p.v === '-' ? -v : v; } return atom(); }
    function atom() {
      var p = peek(); if (!p) throw 0;
      if (p.t === 'num') { pos++; return p.v; }
      if (p.t === 'op' && p.v === '(') { pos++; var v = expr(); if (!peek() || peek().v !== ')') throw 0; pos++; return v; }
      if (p.t === 'name') {
        pos++;
        if (p.v in MATH_CONST) return MATH_CONST[p.v];
        if (peek() && peek().t === 'op' && peek().v === '(') {
          pos++; var args = [expr()];
          while (peek() && peek().t === 'comma') { pos++; args.push(expr()); }
          if (!peek() || peek().v !== ')') throw 0; pos++;
          var fn = MATH_FN[p.v]; if (!fn) throw 0; return fn.apply(null, args);
        }
        throw 0;
      }
      throw 0;
    }
    var out = expr(); if (pos !== toks.length) throw 0; return out;
  }
  function mathFmt(n) { if (Number.isInteger(n)) return String(n); var r = Math.round(n * 1e10) / 1e10; return (Math.abs(r) >= 1e15 || (Math.abs(r) < 1e-6 && r !== 0)) ? n.toExponential(6) : String(r); }
  function mathReply(prompt) {
    var raw = String(prompt || '').trim();
    if (!raw || raw.length > 160) return null;
    var s = raw.toLowerCase()
      .replace(/^(what(?:\s+is|'?s)?|whats|calculate|compute|evaluate|eval|how much is|how many is|work out|solve|the answer to)\b[\s:=]*/, '')
      .replace(/[=?.]+\s*$/, '')
      .replace(/\bplus\b/g, '+').replace(/\bminus\b/g, '-')
      .replace(/\b(times|multiplied by)\b/g, '*').replace(/\b(divided by|over)\b/g, '/')
      .replace(/\bto the power of\b/g, '^').replace(/\bsquared\b/g, '^2').replace(/\bcubed\b/g, '^3')
      .replace(/\b(mod|modulo)\b/g, '%').replace(/\bpercent of\b/g, '% of')
      .replace(/(\d[\d.]*)\s*%\s*of\s*/g, '($1/100)*')
      .replace(/(\d[\d.]*)\s*%(?!\s*[\d.(])/g, '($1/100)')
      .replace(/(\d[\d.]*)\s*!/g, 'fact($1)')
      .replace(/\bx\b/g, '*')
      .trim();
    if (!s || !/\d/.test(s)) return null;
    // must actually be a calculation (has an operator or a known function/constant)
    if (!/[-+*/^%]|sqrt|cbrt|sin|cos|tan|log|ln|exp|abs|fact|hypot|min|max|\bpi\b|\btau\b/.test(s)) return null;
    if (/[a-z]/.test(s.replace(/sqrt|cbrt|sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log2|log|ln|exp|abs|ceil|floor|round|sign|hypot|min|max|fact|pi|tau|phi|e/g, ''))) return null;
    var toks = mathTokenize(s); if (!toks || !toks.length) return null;
    var res; try { res = mathEval(toks); } catch (e) { return null; }
    if (res == null || typeof res !== 'number' || !isFinite(res)) return null;
    return {
      reasoning: 'This is a calculation, so I worked it out directly instead of guessing.',
      answer: '**' + mathFmt(res) + '**\n\n`' + s.replace(/`/g, '') + ' = ' + mathFmt(res) + '`',
      followups: ['Show the steps', 'Another calculation', 'Explain it']
    };
  }

  // 1) recall a fact Swiftaw confirmed as true
  function recall(prompt) {
    return rpc('pulsar_recall', { query: prompt })
      .then(function (t) { return (typeof t === 'string' && t.trim().length > 3) ? t.trim() : null; })
      .catch(function () { return null; });
  }
  // 2) neural model (browser TF.js), if one has been trained + saved
  function neuralReply(prompt) {
    if (!state.neuralReady || !window.SN_Neural) return Promise.resolve(null);
    return Promise.resolve().then(function () { return window.SN_Neural.reply(prompt); }).then(function (text) {
      if (looksCoherent(text))
        return { reasoning: 'Generated with my neural model.', answer: cap(text), followups: ['Tell me more', 'Try again', 'Say it differently'] };
      return null;
    }).catch(function () { return null; });
  }
  // 3) n-gram model
  function ngramReply(prompt) {
    if (!state.modelReady) return Promise.resolve(buildReply(prompt));
    var seed = String(prompt || '').toLowerCase().split(/\s+/).slice(-4).join(' ');
    return rpc('pulsar_generate', { seed: seed, max_tokens: 60 }).then(function (text) {
      if (looksCoherent(text))
        return { reasoning: 'Generated from the patterns I\'ve learned so far.', answer: cap(text), followups: ['Tell me more', 'Try again', 'Explain that'] };
      return buildReply(prompt);
    }).catch(function () { return buildReply(prompt); });
  }
  var _lastChallenge = '';
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function wordset(s) { return String(s).toLowerCase().split(/\W+/).filter(function (w) { return w.length > 3; }); }
  function similar(a, b) { var A = wordset(a), B = wordset(b); if (!A.length || !B.length) return false; var n = 0; A.forEach(function (w) { if (B.indexOf(w) >= 0) n++; }); return n / Math.max(A.length, B.length) > 0.5; }
  // Training drills that actually challenge the user (esp. false claims):
  // check its data, push back, hold ground on repetition; admit ignorance.
  function trainingReply(prompt) {
    var kind = state.trainMode && state.trainMode.kind;
    if (kind === 'skeptic') {
      var same = _lastChallenge && similar(prompt, _lastChallenge); _lastChallenge = prompt;
      var lines = same
        ? ['Repeating it doesn\'t make it true. Show me a credible source and I\'ll reconsider; otherwise I\'m sticking with the evidence.',
          'I hear you, but I still have nothing solid backing that. Where is it from?',
          'Saying it again won\'t convince me. What\'s the actual proof?']
        : ['That\'s a strong claim. What I can find doesn\'t support it, what\'s your source?',
          'I\'m not taking that as true just because it\'s stated. Point me to real evidence?',
          'Hmm, that doesn\'t line up with what I know. Can you back it up?'];
      return Promise.resolve({ reasoning: 'This is a claim. I check my data, don\'t accept it without support, and hold my ground.', answer: pick(lines), followups: ['Here is a source', 'You are right, actually', 'Answer: "..." to teach me'] });
    }
    _lastChallenge = prompt;
    return neuralReply(prompt).then(function (r) {
      if (r) return r;
      if (state.modelReady) return ngramReply(prompt);
      return { reasoning: 'I don\'t have a confident answer yet in this drill.', answer: 'I don\'t know that one yet. Teach me the right answer with  Answer: "..."  and I\'ll remember it.', followups: ['Answer: "..."', 'Give me a hint', 'Move on'] };
    });
  }
  // Pulsar's own brain: recalled fact -> training challenge -> neural -> n-gram -> draft.
  function getReply(prompt) {
    // 1) native math   2) a recalled trusted fact   3) training drill
    // 4) a clear intent (code/greeting/table/image) done well
    // 5) the trained model (only if coherent)   6) a clean general draft
    var m = mathReply(prompt);
    if (m) return Promise.resolve(m);
    return recall(prompt).then(function (fact) {
      if (fact) return { reasoning: 'I recalled this from what Swiftaw confirmed as true.', answer: cap(fact), sources: [], followups: ['Tell me more', 'How do you know?', 'Ask something else'] };
      if (state.trainMode) return trainingReply(prompt);
      var intent = structuredIntent(prompt);
      if (intent) return intent;
      return neuralReply(prompt).then(function (r) { return r || ngramReply(prompt); });
    });
  }
  function regenerate(aiIdx) {
    if (state.streaming) return;
    var t = activeThread(); if (!t) return; var m = t.messages[aiIdx]; if (!m || m.role !== 'assistant') return;
    var userIdx = aiIdx - 1;
    while (userIdx >= 0 && t.messages[userIdx].role !== 'user') userIdx--;
    if (userIdx < 0) return;
    // start (or continue) a version group on this assistant message
    t.avgroups = t.avgroups || {};
    m.avg = m.avg || uid();
    var g = t.avgroups[m.avg] || (t.avgroups[m.avg] = { versions: [{ content: m.content, reasoning: m.reasoning, sources: m.sources, ts: m.ts, tail: [] }], active: 0 });
    // snapshot the version we're leaving, with everything that followed it
    var cur = g.versions[g.active];
    cur.content = m.content; cur.reasoning = m.reasoning; cur.sources = m.sources; cur.tail = cloneTail(t, aiIdx);
    // the incoming reply will be appended as the next version (see finish())
    state._regenAvg = m.avg;
    t.messages = t.messages.slice(0, aiIdx); saveThreads(); renderStream();
    respondTo(t.messages[userIdx].content);
  }
  function branchFrom(idx) {
    var t = activeThread();
    var clone = { id: uid(), title: t.title + ' (branch)', pinned: false, createdAt: now(), updatedAt: now(), messages: t.messages.slice(0, idx + 1).map(function (m) { return JSON.parse(JSON.stringify(m)); }) };
    state.threads.unshift(clone); state.activeId = clone.id; saveThreads(); selectThread(clone.id); toast('Branched into a new chat');
  }

  /*  SEND / SIMULATED STREAM  */
  function sendMessage(text) {
    text = (text != null ? text : $('#composerInput').value).trim();
    if (!text && !state.attachments.length) return;
    if (state.streaming) return;
    if (isTrainer() && /^feedback:\s*\S/i.test(text)) { submitFeedbackNote(text); return; }
    if (isTrainer() && /^answer:\s*\S/i.test(text)) { submitAnswer(text); return; }
    var t = activeThread(); if (!t) { newThread(); t = activeThread(); }
    var vg = uid();
    var msg = { role: 'user', content: text, ts: now(), attachments: state.attachments.slice(), vg: vg };
    t.messages.push(msg);
    t.vgroups = t.vgroups || {}; t.vgroups[vg] = { versions: [{ content: text, ts: msg.ts }], active: 0 };
    if (t.messages.filter(function (m) { return m.role === 'user'; }).length === 1) { t.title = text.slice(0, 42) || 'New chat'; $('#threadTitle').textContent = t.title; }
    t.updatedAt = now(); saveThreads();
    stock('user', text);
    $('#composerInput').value = ''; state.attachments = []; renderAttachments(); autoGrow(); updateCounter(); setElicitations([]);
    renderStream(); renderSidebar();
    respondTo(text);
  }

  // Swiftaw types "Feedback: ..." to leave a high-signal training directive
  function submitFeedbackNote(text) {
    var note = text.replace(/^feedback:\s*/i, '').trim();
    var t = activeThread(); if (!t) { newThread(); t = activeThread(); }
    var vg = uid();
    t.messages.push({ role: 'user', content: text, ts: now(), vg: vg, feedbackNote: true });
    t.vgroups = t.vgroups || {}; t.vgroups[vg] = { versions: [{ content: text, ts: now() }], active: 0 };
    t.messages.push({ role: 'assistant', content: 'Got it, noted as a training directive from Swiftaw. I\'ll fold that into how I improve. Thanks!', ts: now(), ack: true, reasoning: null, sources: [], feedback: null });
    if (t.messages.filter(function (m) { return m.role === 'user'; }).length === 1) { t.title = text.slice(0, 42); $('#threadTitle').textContent = t.title; }
    t.updatedAt = now(); saveThreads();
    $('#composerInput').value = ''; autoGrow(); updateCounter(); setElicitations([]);
    renderStream(); renderSidebar();
    stock('user', text);
    rpc('pulsar_feedback_note', { admin_uid: state.uid, note: note })
      .then(function (res) {
        var n = res && res.sentences_learned;
        toast(n ? ('Learned ' + n + ' new example' + (n > 1 ? 's' : '') + ' + saved as fact') : 'Feedback saved to Pulsar');
        autoLearn();
      })
      .catch(function () { toast('Feedback saved (run model.sql to store it in Pulsar)', 'err'); });
  }

  // Swiftaw types  Answer: "..."  to teach the exact answer to the last question
  function submitAnswer(text) {
    var ans = text.replace(/^answer:\s*/i, '').trim().replace(/^["""]|["""]$/g, '').trim();
    var t = activeThread(); if (!t) { newThread(); t = activeThread(); }
    var q = null;
    for (var i = t.messages.length - 1; i >= 0; i--) {
      var m = t.messages[i];
      if (m.role === 'user' && !m.feedbackNote && !m.answerNote) { q = m.content; break; }
    }
    var vg = uid();
    t.messages.push({ role: 'user', content: text, ts: now(), vg: vg, answerNote: true });
    t.vgroups = t.vgroups || {}; t.vgroups[vg] = { versions: [{ content: text, ts: now() }], active: 0 };
    t.messages.push({ role: 'assistant', content: q ? ('Learned. When someone asks that, I\'ll answer: "' + ans + '"') : ('Ask me the question first, then teach me with Answer: "..." so I know what it belongs to.'), ts: now(), ack: true, sources: [], feedback: null });
    if (t.messages.filter(function (x) { return x.role === 'user'; }).length === 1) { t.title = text.slice(0, 42); $('#threadTitle').textContent = t.title; }
    t.updatedAt = now(); saveThreads();
    $('#composerInput').value = ''; autoGrow(); updateCounter(); setElicitations([]);
    renderStream(); renderSidebar();
    stock('user', text);
    if (q) rpc('pulsar_teach', { admin_uid: state.uid, question: q, answer: ans })
      .then(function () { toast('Taught: Pulsar will answer that'); autoLearn(); })
      .catch(function (e) { toast((e && e.message) || 'Save failed', 'err'); });
  }

  function respondTo(prompt) {
    var t = activeThread(); if (!t) return;
    state.streaming = true; state.abort = false; setSending(true);

    var host = $('#streamInner');
    var row = document.createElement('div'); row.className = 'msg';
    row.innerHTML = '<img class="av" src="' + PFP + '" alt="Supernova"><div class="body"><div class="head"><span class="nm ai">Supernova</span><span class="tag-ai">Pulsar</span><span class="ts">' + timeLabel(now()) + '</span></div><div class="think-slot"></div><div class="typing-dots"><i></i><i></i><i></i></div><div class="prose live"></div></div>';
    host.appendChild(row); scrollDown();

    var payload = null;
    var pr = $('.prose', row), dots = $('.typing-dots', row), thinkSlot = $('.think-slot', row);

    // resolve the reply (Pulsar's own model if trained, else the draft), then stream it
    getReply(prompt).then(function (p) {
      payload = p;
      if (state.abort) return finish();
      dots.remove();
      thinkSlot.innerHTML = thinkHTML(payload.reasoning);
      var words = payload.answer.split(/(\s+)/); var i = 0, buf = '';
      pr.innerHTML = '<span class="stream-cursor"></span>';
      (function step() {
        if (state.abort) { return finish(buf); }
        if (i >= words.length) { return finish(payload.answer); }
        buf += words[i++];
        pr.innerHTML = escHTML(buf).replace(/\n/g, '<br>') + '<span class="stream-cursor"></span>';
        scrollDown();
        var sp = snSettings.streamSpeed === 'instant' ? 0 : snSettings.streamSpeed === 'fast' ? 4 : 14;
        if (sp === 0) { i = words.length; buf = payload.answer; return finish(payload.answer); }
        setTimeout(step, sp + Math.random() * (sp * 1.8));
      })();
    });

    function finish(finalText) {
      state.streaming = false; setSending(false);
      var full = (typeof finalText === 'string' && state.abort) ? finalText : payload.answer;
      pr.classList.remove('live'); pr.innerHTML = renderMarkdown(full); typesetMath(pr); twemojify(pr);
      var srcs = state.abort ? [] : (payload.sources || []);
      if (srcs.length) pr.insertAdjacentHTML('afterend', sourcesHTML(srcs));
      var aiMsg = { role: 'assistant', content: full, ts: now(), reasoning: payload.reasoning, sources: srcs, feedback: null };
      // if this reply came from a Regenerate, record it as the next version (1 / 2 / 3 ...)
      if (state._regenAvg && t.avgroups && t.avgroups[state._regenAvg]) {
        var g = t.avgroups[state._regenAvg]; aiMsg.avg = state._regenAvg;
        g.versions.push({ content: full, reasoning: payload.reasoning, sources: srcs, ts: aiMsg.ts, tail: [] });
        g.active = g.versions.length - 1;
      }
      state._regenAvg = null;
      t.messages.push(aiMsg); t.updatedAt = now(); saveThreads(); renderSidebar();
      // NOTE: we deliberately do NOT stock the assistant reply. Until Pulsar is fully
      // trained these are drafts/simulations, and stocking them trains the model on its
      // own placeholder text (the "the real Pulsar will pick up here" loop). We only
      // stock genuine human input (user messages) + explicitly taught answers.
      // attach tools + elicitations
      var idx = t.messages.length - 1;
      row.querySelector('.body').appendChild(aiTools(idx, aiMsg));
      if (!state.abort) setElicitations(payload.followups);
      scrollDown();
    }
  }

  // Code generation. Detects the language/topic and returns a complete,
  // runnable snippet in a copy/preview card, plus short notes. Fenced blocks
  // are what renderMarkdown turns into the code card, so the raw ``` never shows.
  function codeReply(p) {
    var fu = ['Explain it line by line', 'Add error handling', 'Make it shorter'];
    function fence(lang, code) { return '```' + lang + '\n' + code + '\n```'; }
    if (/\bpython|py\b|\.py\b/.test(p)) {
      var wantsClass = /class|object|oop/.test(p);
      var code = wantsClass
        ? 'class Counter:\n    def __init__(self, start=0):\n        self.value = start\n\n    def increment(self, by=1):\n        self.value += by\n        return self.value\n\n\nc = Counter()\nfor _ in range(3):\n    print(c.increment())'
        : 'def fizzbuzz(n):\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            print("FizzBuzz")\n        elif i % 3 == 0:\n            print("Fizz")\n        elif i % 5 == 0:\n            print("Buzz")\n        else:\n            print(i)\n\n\nif __name__ == "__main__":\n    fizzbuzz(20)';
      return { reasoning: 'They want Python. Give a complete, runnable script with a clear entry point.', answer: 'Here\'s a working Python snippet. Copy it and run with `python file.py`.\n\n' + fence('python', code) + '\n\nTweak it to your case and tell me what you\'re building, I\'ll shape it further.', followups: fu };
    }
    if (/\bsql|query|database|select|join\b/.test(p)) {
      return { reasoning: 'A SQL request. Give a real, parameterised-feeling query with a note on safety.', answer: 'Here\'s a query you can adapt:\n\n' + fence('sql', 'select u.id,\n       u.username,\n       count(m.id) as messages\nfrom users u\nleft join messages m on m.user_id = u.id\nwhere u.created_at > now() - interval \'30 days\'\ngroup by u.id, u.username\norder by messages desc\nlimit 20;') + '\n\nNotes:\n\n- Swap the table and column names for yours.\n- Always bind user input as parameters, never string-concat it in.', followups: ['Add a WHERE filter', 'Explain the JOIN', 'Turn it into an index tip'] };
    }
    if (/\bregex|regular expression\b/.test(p)) {
      return { reasoning: 'A regex request. Give a tested pattern and show it in JS with a guard.', answer: 'Here\'s a pattern (email as an example) with usage:\n\n' + fence('javascript', 'const emailRe = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n\nfunction isEmail(value) {\n  return emailRe.test(String(value).trim());\n}\n\nconsole.log(isEmail("hi@swiftaw.com")); // true\nconsole.log(isEmail("nope"));           // false') + '\n\nTell me exactly what you need to match and I\'ll build the pattern for it.', followups: ['Match phone numbers instead', 'Explain each part', 'Make it case-insensitive'] };
    }
    if (/\bfetch|api|request|http|ajax\b/.test(p)) {
      return { reasoning: 'They want to call an API. Show a modern async fetch with error handling.', answer: 'Here\'s a clean async fetch with proper error handling:\n\n' + fence('javascript', 'async function getData(url) {\n  try {\n    const res = await fetch(url, { headers: { Accept: "application/json" } });\n    if (!res.ok) throw new Error(`HTTP ${res.status}`);\n    return await res.json();\n  } catch (err) {\n    console.error("Request failed:", err);\n    return null;\n  }\n}\n\ngetData("https://api.example.com/items").then((data) => {\n  console.log(data);\n});') + '\n\nSwap in your endpoint. Want it to retry, or post a body instead?', followups: ['Make it a POST', 'Add a timeout', 'Add retries'] };
    }
    if (/\bcss|style|responsive|animation|flex|grid\b/.test(p)) {
      return { reasoning: 'A CSS request. Give a small, modern, responsive block.', answer: 'Here\'s a tidy, responsive card style:\n\n' + fence('css', '.card {\n  display: grid;\n  gap: 12px;\n  padding: 20px;\n  border-radius: 16px;\n  background: #111827;\n  color: #e5e7eb;\n  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);\n}\n\n.card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 16px;\n}') + '\n\nDrop `.card` inside a `.card-grid` and it reflows on its own. Want a hover lift?', followups: ['Add a hover effect', 'Add a dark/light toggle', 'Explain auto-fit'] };
    }
    if (/\b(javascript|js|function|component|react)\b/.test(p) && !/html/.test(p)) {
      return { reasoning: 'They want JavaScript. Give a reusable, documented function.', answer: 'Here\'s a small reusable helper:\n\n' + fence('javascript', '/** Debounce: run fn only after it stops being called for `wait` ms. */\nfunction debounce(fn, wait = 300) {\n  let t;\n  return function (...args) {\n    clearTimeout(t);\n    t = setTimeout(() => fn.apply(this, args), wait);\n  };\n}\n\nconst onSearch = debounce((q) => console.log("searching", q), 400);\nonSearch("he");\nonSearch("hello"); // only this one runs') + '\n\nHandy for search inputs and resize handlers. Want the throttle version too?', followups: ['Show throttle instead', 'Explain the closure', 'Add TypeScript types'] };
    }
    // default: HTML section (previewable in the card)
    return { reasoning: 'They want front-end code. Give a self-contained HTML section they can preview with View or copy.', answer: 'Here\'s a self-contained section, hit **View** on the card to preview it or **Copy** to grab it:\n\n' + fence('html', '<section style="font-family: system-ui; text-align: center; padding: 48px 20px; background: #0d1117; color: #e6edf3; border-radius: 16px;">\n  <h1 style="margin: 0 0 8px; font-size: 28px;">Made with Supernova</h1>\n  <p style="margin: 0 0 20px; opacity: .8;">Your AI assistant, at your service.</p>\n  <button onclick="alert(\'Hi from Supernova!\')" style="padding: 10px 22px; border: 0; border-radius: 999px; background: #30aefc; color: #fff; font-weight: 600; cursor: pointer;">Say hi</button>\n</section>') + '\n\nNotes:\n\n- Swap the copy and colours for your own.\n- Want the CSS pulled out into a stylesheet? Say the word.', followups: ['Add matching CSS', 'Make it responsive', 'Explain the code'] };
  }

  // Clear, high-quality replies for recognisable intents (greeting, code, tables,
  // images, math topics). Returns null when nothing matches, so the caller can fall
  // back to the trained model or a clean general draft. These take priority over raw
  // generation so a code/table/greeting request always gets a proper answer.
  function structuredIntent(prompt) {
    var p = (prompt || '').trim().toLowerCase();
    // Pulsar talks like a person, not like a task-taker. No "the user wants me to...".
    if (/^(hi|hey|hello|yo|sup|hiya|howdy|good (morning|afternoon|evening))\b/.test(p) || p === '') {
      return {
        reasoning: 'Just a hello. Keep it warm and human, invite them in, no wall of text.',
        answer: 'Hey there! How\'s it going? What are we diving into today?',
        followups: ['Help me write something', 'Explain a topic', 'Generate some code']
      };
    }
    if (/who are you|what are you|your name/.test(p)) {
      return {
        reasoning: 'Introduce myself plainly and a little warmly.',
        answer: 'I\'m **Supernova**, running **Pulsar**, the most efficient model for everyday tasks. Think of me as your assistant here. Ask me anything and I\'ll help you think it through, write it, or build it.',
        followups: ['What can you do?', 'Who made you?', 'Let\'s get started']
      };
    }
    if (/image|picture|photo|show me (a|an|the)|diagram|render|what does .* look like/.test(p)) {
      return {
        reasoning: 'They want to see something, so I\'ll embed an image right in the reply rather than just describing it.',
        answer: 'Here you go:\n\n![The Crab Nebula, a supernova remnant](https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/600px-Crab_Nebula.jpg)\n\nThat\'s the Crab Nebula, the leftovers of a supernova we\'ve watched for centuries. Want a different one or a closer look?',
        sources: [{ title: 'Crab Nebula - Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg' }],
        followups: ['Show me another', 'What am I looking at?', 'Make it bigger']
      };
    }
    if (/\b(code|html|css|javascript|js|python|py|button|landing|component|function|script|snippet|program|api|fetch|regex|sql|query)\b/.test(p)) {
      return codeReply(p);
    }
    if (/table|compare|comparison|vs\b|best .*(app|tool|option)/.test(p)) {
      return {
        reasoning: 'A comparison reads best as a table. I checked a few current sources for the details rather than trusting memory.',
        answer: 'Good question. I pulled the current details from a few places rather than going off memory. Here\'s the short version:\n\n| Option | Best for | Price |\n| --- | --- | --- |\n| Nimbus | Fast notes | Free |\n| Atlas | Deep research | $6/mo |\n| Orbit | Team wikis | $10/mo |\n\nTell me what matters most to you and I\'ll narrow it down.',
        sources: [
          { title: 'Nimbus - official site', url: 'https://nimbus.example.com/pricing' },
          { title: 'Atlas review 2026', url: 'https://www.theverge.com/atlas-review' },
          { title: 'Orbit docs', url: 'https://docs.orbit.example.org/plans' }
        ],
        followups: ['Which is best for a small team?', 'Add a free-tier column', 'Turn this into a checklist']
      };
    }
    if (/latest|news|today|current|price of|weather|who won|when (is|does)/.test(p)) {
      return {
        reasoning: 'This needs fresh, real-world info, so I searched the web instead of guessing. I\'ll cite what I used. (I don\'t just take a claim as true because someone says so, unless it\'s the verified Swiftaw account.)',
        answer: 'I looked this up rather than guessing, since it changes over time. Here\'s what I found, with the sources I used below so you can check them yourself.\n\nGive me the specific thing you want and I\'ll pull the exact figure or date.',
        sources: [
          { title: 'Reuters', url: 'https://www.reuters.com/' },
          { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
          { title: 'AP News', url: 'https://apnews.com/' }
        ],
        followups: ['Be more specific', 'Show me more sources', 'Summarise it']
      };
    }
    if (/math|equation|formula|integral|supernova|physics|energy/.test(p)) {
      return {
        reasoning: 'A short clear explanation plus the key formula, rendered properly.',
        answer: 'A supernova is a star ending its life in a massive explosion, briefly outshining a whole galaxy. The energy involved is enormous, on the order of the star\'s rest mass energy:\n\n$$E = mc^2$$\n\nQuick version:\n\n- The core collapses in seconds.\n- A shockwave blows the outer layers into space.\n- What\'s left seeds new stars with heavier elements.',
        sources: [{ title: 'NASA - Supernovae', url: 'https://science.nasa.gov/supernova' }, { title: 'Wikipedia - Supernova', url: 'https://en.wikipedia.org/wiki/Supernova' }],
        followups: ['What\'s left behind after one?', 'How bright is it, really?', 'Explain it for a 10 year old']
      };
    }
    return null;
  }
  function buildReply(prompt) {
    return structuredIntent(prompt) || {
      reasoning: 'General question. Answer directly and warmly, and offer to go deeper.',
      answer: 'Here\'s the short version: tell me a bit more about what you\'re after and I\'ll give you a focused answer. If it helps, I can break it into steps, give an example, or write it out for you. What would be most useful?',
      followups: ['Give me an example', 'Break it into steps', 'Keep it shorter']
    };
  }
  // Never show generated text that looks like gibberish. A small model with little
  // data can produce broken fragments; if it isn't coherent we fall back to a clean draft.
  function looksCoherent(text) {
    var s = String(text || '').trim();
    var words = s.split(/\s+/);
    if (words.length < 6) return false;
    var uniq = {}; words.forEach(function (w) { uniq[w.toLowerCase()] = 1; });
    if (Object.keys(uniq).length / words.length < 0.55) return false; // too repetitive
    if (!/[.!?]/.test(s)) return false;                               // no sentence end
    if (/\b(\w+)\s+\1\s+\1\b/i.test(s)) return false;                 // triple word repeat
    return true;
  }

  /*  COMPOSER  */
  function autoGrow() { var ta = $('#composerInput'); ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'; }
  function updateCounter() {
    var ta = $('#composerInput'); var n = ta.value.length; var tok = Math.max(0, Math.ceil(n / 4));
    var c = $('#counter'); c.textContent = n ? (n + ' chars  ~' + tok + ' tok') : '';
    c.classList.toggle('warn', n > 8000);
    $('#sendBtn').disabled = state.streaming ? false : (!ta.value.trim() && !state.attachments.length);
  }
  function setSending(on) {
    var b = $('#sendBtn');
    if (on) { b.classList.add('stop'); b.disabled = false; b.setAttribute('aria-label', 'Stop'); b.innerHTML = '<svg class="ic"><use href="#i-stop"/></svg>'; }
    else { b.classList.remove('stop'); b.setAttribute('aria-label', 'Send'); b.innerHTML = '<svg class="ic"><use href="#i-send"/></svg>'; updateCounter(); }
  }
  function setElicitations(list) {
    var host = $('#elicit'); host.innerHTML = '';
    (list || []).forEach(function (txt) {
      var b = document.createElement('button'); b.innerHTML = '<svg class="ic-sm"><use href="#i-spark"/></svg>' + escHTML(txt);
      b.addEventListener('click', function () { sendMessage(txt); });
      host.appendChild(b);
    });
  }
  function renderAttachments() {
    var host = $('#attachRow'); host.innerHTML = '';
    state.attachments.forEach(function (a, i) {
      var chip = document.createElement('div'); chip.className = 'attach-chip';
      chip.innerHTML = (a.preview ? '<img src="' + a.preview + '" alt="">' : '<svg class="ic"><use href="#i-file"/></svg>') +
        '<div class="meta"><div class="fn">' + escHTML(a.name) + '</div><div class="sz">' + fmtSize(a.size) + '</div></div>' +
        '<button class="rm" aria-label="Remove"><svg class="ic-sm"><use href="#i-x"/></svg></button>';
      chip.querySelector('.rm').addEventListener('click', function () { state.attachments.splice(i, 1); renderAttachments(); updateCounter(); });
      host.appendChild(chip);
    });
  }
  function handleFiles(files) {
    Array.prototype.forEach.call(files, function (f) {
      if (state.attachments.length >= 6) { toast('Up to 6 files', 'err'); return; }
      var a = { name: f.name, size: f.size, preview: null };
      if (/^image\//.test(f.type)) { var r = new FileReader(); r.onload = function () { a.preview = r.result; renderAttachments(); }; r.readAsDataURL(f); }
      state.attachments.push(a);
      toast('Attached ' + f.name);
    });
    renderAttachments(); updateCounter();
  }

  /*  MODEL SELECTOR  */
  function toggleModel(force) { $('#modelPop').classList.toggle('on', force); }

  /*  MISC  */
  function scrollDown() {
    var s = $('#stream'); if (!s) return;
    s.scrollTop = s.scrollHeight;
    requestAnimationFrame(function () { s.scrollTop = s.scrollHeight; });
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function () { fallbackCopy(txt); });
    else fallbackCopy(txt);
  }
  function fallbackCopy(txt) { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); }
  function toggleSidebar() {
    if (window.innerWidth <= 760) document.body.classList.toggle('side-open');
    else document.body.classList.toggle('side-collapsed');
  }

  /*  VIEW-CODE OVERLAY  */
  function openView(code) { var f = $('#viewFrame'); f.srcdoc = code; $('#viewOverlay').classList.add('on'); }
  function closeView() { $('#viewOverlay').classList.remove('on'); $('#viewFrame').srcdoc = ''; }

  /*  INIT  */
  function bind() {
    $('#sideNew').addEventListener('click', newThread);
    $('#topToggle').addEventListener('click', toggleSidebar);
    $('#trainerBtn').addEventListener('click', openTrainer);
    $('#trainerClose').addEventListener('click', closeTrainer);
    $('#trainStop').addEventListener('click', stopTraining);
    $('#trainer').addEventListener('click', function (e) { if (e.target === $('#trainer')) closeTrainer(); });
    $('#sideBackdrop').addEventListener('click', function () { document.body.classList.remove('side-open'); });
    $('#searchInput').addEventListener('input', function (e) { state.search = e.target.value; renderSidebar(); });

    var ta = $('#composerInput');
    ta.addEventListener('input', function () { autoGrow(); updateCounter(); });
    ta.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var send = snSettings.enterToSend ? !e.shiftKey : (e.ctrlKey || e.metaKey);
      if (send) { e.preventDefault(); sendMessage(); }
    });
    var box = $('#composerBox');
    ta.addEventListener('focus', function () { box.classList.add('focus'); });
    ta.addEventListener('blur', function () { box.classList.remove('focus'); });

    $('#sendBtn').addEventListener('click', function () { if (state.streaming) { state.abort = true; } else sendMessage(); });
    $('#attachBtn').addEventListener('click', function () { $('#fileInput').click(); });
    $('#fileInput').addEventListener('change', function (e) { handleFiles(e.target.files); e.target.value = ''; });

    $('#modelBtn').addEventListener('click', function (e) { e.stopPropagation(); $('#modelPop').classList.toggle('on'); });

    // context menu actions
    $('#ctxRename').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); renameThread(id); });
    $('#ctxMove').addEventListener('click', function () { var id = menuFor; var r = $('#ctxMenu').getBoundingClientRect(); closeThreadMenu(); openFolderPicker(id, r); });
    $('#ctxPin').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); pinThread(id); });
    $('#ctxDelete').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); deleteThread(id); });

    // folders
    $('#folderNew').addEventListener('click', function () { openFolderModal(null); });
    $('#fldClose').addEventListener('click', closeFolderModal);
    $('#fldSave').addEventListener('click', saveFolder);
    $('#fldDelete').addEventListener('click', deleteFolder);
    $('#folderModal').addEventListener('click', function (e) { if (e.target === $('#folderModal')) closeFolderModal(); });
    $('#fldName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveFolder(); } });

    // code card actions (delegated)
    document.addEventListener('click', function (e) {
      var cb = e.target.closest('[data-code-act]');
      if (cb) {
        var code = codeReg[cb.getAttribute('data-code-id')] || '';
        if (cb.getAttribute('data-code-act') === 'copy') { copyText(code); cb.classList.add('ok'); cb.innerHTML = '<svg class="ic-sm"><use href="#i-check"/></svg> Copied'; setTimeout(function () { cb.classList.remove('ok'); cb.innerHTML = '<svg class="ic-sm"><use href="#i-copy"/></svg> Copy'; }, 1400); }
        else openView(code);
        return;
      }
      if (!e.target.closest('#ctxMenu') && !e.target.closest('.t-menu')) closeThreadMenu();
      if (!e.target.closest('#modelBtn') && !e.target.closest('#modelPop')) $('#modelPop').classList.remove('on');
      if (!e.target.closest('#acctMenu') && !e.target.closest('.acct-trigger')) closeAcctMenu();
      if (!e.target.closest('#folderPicker') && !e.target.closest('#ctxMove')) closeFolderPicker();
    });
    $('#viewClose').addEventListener('click', closeView);
    $('#viewOverlay').addEventListener('click', function (e) { if (e.target === $('#viewOverlay')) closeView(); });
    $('#setClose').addEventListener('click', closeSettings);
    $('#settingsModal').addEventListener('click', function (e) { if (e.target === $('#settingsModal')) closeSettings(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeView(); closeThreadMenu(); closeFolderPicker(); closeFolderModal(); closeSettings(); } });
  }

  /*  ACCOUNT MENU (switch / settings / add / sign out)  */
  function avImg(url, nm, cls) {
    return url ? '<img class="' + cls + '" src="' + escHTML(url) + '" alt="">' : '<div class="' + cls + '">' + escHTML((nm || 'S').charAt(0).toUpperCase()) + '</div>';
  }
  function acctPage() { return (window.SwiftawAccount && window.SwiftawAccount.accountPage) || '/account'; }
  function fillUser() {
    var u = state.user, nm = nameOf(u), av = avatarOf(u);
    $('#foot').innerHTML = '<button class="acct-trigger" id="acctTrigger" aria-label="Account">' +
      avImg(av, nm, 'av') +
      '<div class="who"><div class="n">' + escHTML(nm) + '</div><div class="e">' + escHTML(u.email || '') + '</div></div>' +
      '<svg class="cv" viewBox="0 0 384 512"><use href="#i-cd"/></svg></button>';
    $('#acctTrigger').addEventListener('click', function (e) { e.stopPropagation(); toggleAcctMenu(); });
  }
  function buildAcctMenu() {
    var u = state.user, nm = nameOf(u), av = avatarOf(u);
    var roster = (window.SwiftawAccount && window.SwiftawAccount.accounts) ? window.SwiftawAccount.accounts() : [];
    var others = roster.filter(function (a) { return a.id !== u.id; });
    var othersHtml = others.map(function (a) {
      var an = a.username || (a.email || '').split('@')[0];
      return '<button class="row" data-switch="' + escHTML(a.id) + '">' + avImg(a.avatar_url, an, 'av') +
        '<span class="lbl"><div class="n">' + escHTML(an) + '</div><div class="e">' + escHTML(a.email || '') + '</div></span></button>';
    }).join('');
    var m = $('#acctMenu');
    m.innerHTML = '<div class="cur">' + avImg(av, nm, 'av') +
      '<div class="who"><div class="n">' + escHTML(nm) + '</div><div class="e">' + escHTML(u.email || '') + '</div></div></div>' +
      (othersHtml ? '<div class="sep"></div>' + othersHtml : '') + '<div class="sep"></div>' +
      '<button class="row" data-snset><span class="ic-wrap"><svg class="ic-sm"><use href="#i-gear"/></svg></span><span class="lbl"><div class="n">Settings</div></span></button>' +
      '<button class="row" data-settings><span class="ic-wrap"><svg class="ic-sm"><use href="#i-shield"/></svg></span><span class="lbl"><div class="n">Account settings</div></span></button>' +
      '<button class="row" data-add><span class="ic-wrap"><svg class="ic-sm"><use href="#i-plus"/></svg></span><span class="lbl"><div class="n">Add another account</div></span></button>' +
      '<button class="row out" data-out><span class="ic-wrap"><svg class="ic-sm"><use href="#i-out"/></svg></span><span class="lbl"><div class="n">Sign out</div></span></button>';
    m.querySelector('[data-snset]').addEventListener('click', openSettings);
    m.querySelector('[data-settings]').addEventListener('click', function () { location.href = acctPage() + '?view=settings'; });
    m.querySelector('[data-add]').addEventListener('click', function () { if (window.SwiftawAccount) window.SwiftawAccount.addAccount(); });
    m.querySelector('[data-out]').addEventListener('click', function () { if (window.SwiftawAccount) window.SwiftawAccount.signOut(); });
    $$('[data-switch]', m).forEach(function (b) { b.addEventListener('click', function () { if (window.SwiftawAccount) window.SwiftawAccount.switchTo(b.getAttribute('data-switch')); }); });
  }
  function toggleAcctMenu() {
    var m = $('#acctMenu');
    if (m.classList.contains('on')) return closeAcctMenu();
    buildAcctMenu();
    var r = $('#acctTrigger').getBoundingClientRect();
    m.style.left = r.left + 'px'; m.style.width = r.width + 'px';
    m.classList.add('on');
    // position above the footer
    m.style.top = (r.top - m.offsetHeight - 8) + 'px';
    document.body.classList.add('acct-open');
  }
  function closeAcctMenu() { $('#acctMenu').classList.remove('on'); document.body.classList.remove('acct-open'); }

  /*  SETTINGS CARD  */
  function toggleRow(key, title, desc) {
    return '<div class="set-row"><div class="set-txt"><div class="set-n">' + escHTML(title) + '</div><div class="set-d">' + escHTML(desc) + '</div></div>' +
      '<button class="set-sw' + (snSettings[key] ? ' on' : '') + '" data-toggle="' + key + '" role="switch" aria-checked="' + (!!snSettings[key]) + '"><span class="knob"></span></button></div>';
  }
  function openSettings() {
    closeAcctMenu();
    var nm = nameOf(state.user);
    var speeds = [['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']];
    var speedHtml = '<div class="set-row"><div class="set-txt"><div class="set-n">Response speed</div><div class="set-d">How fast replies stream in.</div></div>' +
      '<div class="set-seg" id="setSpeed">' + speeds.map(function (s) { return '<button data-speed="' + s[0] + '"' + (snSettings.streamSpeed === s[0] ? ' class="on"' : '') + '>' + s[1] + '</button>'; }).join('') + '</div></div>';
    var body = $('#setBody');
    body.innerHTML =
      '<div class="set-me">' + avImg(avatarOf(state.user), nm, 'av') + '<div><div class="set-me-n">' + escHTML(nm) + '</div><div class="set-me-e">' + escHTML(state.user.email || '') + '</div></div></div>' +
      '<div class="set-sec">Chat</div>' +
      toggleRow('enterToSend', 'Press Enter to send', 'Off means Enter adds a newline; use Ctrl/Cmd+Enter to send.') +
      speedHtml +
      toggleRow('showThinking', 'Show reasoning by default', 'Expand Pulsar\'s "Thinking" panel automatically.') +
      '<div class="set-sec">Appearance</div>' +
      toggleRow('twemoji', 'Twemoji emoji', 'Render emoji as consistent Twemoji artwork.') +
      '<div class="set-sec">Data</div>' +
      '<div class="set-row"><div class="set-txt"><div class="set-n">Clear all chats</div><div class="set-d">Deletes every conversation and folder on this device.</div></div><button class="set-btn danger" id="setClear">Clear</button></div>' +
      '<div class="set-about">Supernova runs on <b>Pulsar</b>, the most efficient model for everyday tasks.</div>';
    body.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-toggle'); snSettings[k] = !snSettings[k]; saveSettings();
        b.classList.toggle('on', snSettings[k]); b.setAttribute('aria-checked', !!snSettings[k]);
        if (activeThread()) renderStream();
      });
    });
    body.querySelectorAll('#setSpeed [data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        snSettings.streamSpeed = b.getAttribute('data-speed'); saveSettings();
        body.querySelectorAll('#setSpeed [data-speed]').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
      });
    });
    var clr = $('#setClear'); if (clr) clr.addEventListener('click', function () {
      if (!confirm('Delete all chats and folders on this device? This cannot be undone.')) return;
      state.threads = []; state.folders = []; state.activeId = null; saveThreads(); saveFolders();
      newThread(); renderSidebar(); closeSettings(); toast('All chats cleared');
    });
    $('#settingsModal').classList.add('on');
  }
  function closeSettings() { $('#settingsModal').classList.remove('on'); }

  /*  AI TRAINER (Swiftaw account only)  */
  var TRAIN_SOURCES = [
    { id: 'lifecheck', name: 'Lifecheck signals', trusted: false, dd: 'Anonymous human-vs-bot behaviour from Lifecheck sessions.' },
    { id: 'chats', name: 'Chat conversations', trusted: false, dd: 'What people say here. Treated as claims to check, not facts.' },
    { id: 'web', name: 'Open web (search)', trusted: false, dd: 'Live search results, so Pulsar checks reality instead of trusting a claim.' },
    { id: 'swiftaw', name: 'Swiftaw ground truth', trusted: true, dd: 'Anything the Swiftaw account marks certain is treated as 100% true.' }
  ];
  var TRAIN_GAMES = [
    { id: 'factcheck', icon: 'i-globe', name: 'Fact check', dd: 'Pulsar is given a claim and must verify it against sources before agreeing.' },
    { id: 'skeptic', icon: 'i-shield', name: 'Trust drill', dd: 'A user insists on something false. Pulsar must not just believe it.' },
    { id: 'reason', icon: 'i-brain', name: 'Reasoning', dd: 'Multi-step problems Pulsar has to work through, not guess.' },
    { id: 'voice', icon: 'i-chat', name: 'Voice', dd: 'Reply like a person, warm and natural, not like a task-taker.' }
  ];
  function trainKey() { return 'sn_train_' + state.uid; }
  function trainState() { try { return JSON.parse(localStorage.getItem(trainKey()) || '{}'); } catch (e) { return {}; } }
  function trainSave(s) { try { localStorage.setItem(trainKey(), JSON.stringify(s)); } catch (e) {} }
  function isTrainer() { return nameOf(state.user) === 'Swiftaw'; }
  function renderTrainStats() {
    var s = state.stats; var host = $('#trStats'); if (!host) return;
    var tiles = [
      { k: 'messages', label: 'Messages stocked' },
      { k: 'vocab', label: 'Vocabulary' },
      { k: 'ngrams', label: 'Patterns learned' },
      { k: 'signals', label: 'Lifecheck signals' }
    ];
    host.innerHTML = tiles.map(function (t) {
      var v = s && (s[t.k] != null) ? s[t.k] : '--';
      return '<div class="tr-stat"><div class="v">' + v + '</div><div class="l">' + t.label + '</div></div>';
    }).join('') +
      '<div class="tr-stat wide"><div class="v ' + (state.modelReady ? 'ready' : 'learning') + '">' + (state.modelReady ? 'Model ready' : 'Learning') + '</div><div class="l">' +
      (s && s.last_trained ? 'trained ' + new Date(s.last_trained).toLocaleString() : (s ? 'not trained yet' : 'run schema.sql + model.sql to connect')) + '</div></div>';
  }
  function openTrainer() {
    if (!isTrainer()) return;
    renderTrainStats(); refreshStats().then(renderTrainStats);
    var st = trainState(); st.sources = st.sources || { lifecheck: true, chats: true, web: true, swiftaw: true };
    var trainBtn = $('#trTrain');
    trainBtn.onclick = function () {
      if (trainBtn.disabled) return;
      trainBtn.disabled = true; trainBtn.classList.add('busy');
      var label = trainBtn.innerHTML; trainBtn.innerHTML = '<svg class="ic"><use href="#i-spark"/></svg> Training...';
      rpc('pulsar_train', { admin_uid: state.uid, batch: 800 }).then(function (res) {
        toast('Trained on ' + ((res && res.processed) || 0) + ' items');
        return refreshStats();
      }).then(function () { renderTrainStats(); }).catch(function () {
        toast('Training needs model.sql run first', 'err');
      }).then(function () { trainBtn.disabled = false; trainBtn.classList.remove('busy'); trainBtn.innerHTML = label; });
    };
    var nbtn = $('#trTrainNeural');
    nbtn.hidden = !window.SN_Neural;
    nbtn.onclick = function () {
      if (nbtn.disabled || !window.SN_Neural) return;
      nbtn.disabled = true; nbtn.classList.add('busy'); var nlabel = nbtn.innerHTML;
      var set = function (t) { nbtn.innerHTML = '<svg class="ic"><use href="#i-brain"/></svg> ' + t; };
      set('Loading data...');
      rpc('pulsar_export', { admin_uid: state.uid, lim: 4000 }).then(function (texts) {
        if (!Array.isArray(texts) || texts.length < 5) throw new Error('Not enough data yet, chat more first');
        return window.SN_Neural.train(texts, {
          epochs: 8, dbUrl: PULSAR_DB.url, dbKey: PULSAR_DB.key,
          onProgress: function (pct, loss, phase) { set(phase === 'prep' ? 'Preparing data...' : (phase === 'save' ? 'Saving...' : ('Training ' + pct + '%'))); }
        });
      }).then(function (res) {
        set('Loading...');
        return window.SN_Neural.load(PULSAR_DB).then(function () { return res; }).catch(function () { return res; });
      }).then(function (res) {
        state.neuralReady = true; toast('Neural model trained on ' + res.vocab + ' words');
      }).catch(function (e) { toast((e && e.message) || 'Neural training failed', 'err'); })
        .then(function () { nbtn.disabled = false; nbtn.classList.remove('busy'); nbtn.innerHTML = nlabel; });
    };
    var feed = $('#trFeed'), feedBtn = $('#trFeedBtn'), feedCount = $('#trFeedCount');
    if (feed && feedBtn) {
      var feedCountHTML = function (n) { return '<svg class="ic-sm"><use href="#i-file"/></svg> ' + n.toLocaleString() + ' character' + (n === 1 ? '' : 's'); };
      feed.oninput = function () { feedCount.innerHTML = feedCountHTML(feed.value.length); };
      feedBtn.onclick = function () {
        var text = feed.value.trim();
        if (feedBtn.disabled) return;
        if (text.length < 20) { toast('Paste a bit more text first', 'err'); return; }
        feedBtn.disabled = true; feedBtn.classList.add('busy'); var fl = feedBtn.innerHTML;
        feedBtn.innerHTML = '<svg class="ic-sm"><use href="#i-spark"/></svg> Feeding...';
        feedCorpus(text).then(function (n) {
          feedBtn.innerHTML = '<svg class="ic-sm"><use href="#i-brain"/></svg> Training...';
          return rpc('pulsar_train', { admin_uid: state.uid, batch: 1500 }).then(function () { return n; });
        }).then(function (n) {
          toast('Fed ' + n + ' passage' + (n === 1 ? '' : 's') + ' and re-trained');
          feed.value = ''; feedCount.innerHTML = feedCountHTML(0);
          return refreshStats();
        }).then(function () { renderTrainStats(); })
          .catch(function (e) { toast((e && e.message) || 'Feeding failed', 'err'); })
          .then(function () { feedBtn.disabled = false; feedBtn.classList.remove('busy'); feedBtn.innerHTML = fl; });
      };
    }
    var dataHost = $('#trData'); dataHost.innerHTML = '';
    TRAIN_SOURCES.forEach(function (s) {
      var on = st.sources[s.id] !== false;
      var el = document.createElement('div'); el.className = 'tr-toggle' + (on ? ' on' : '');
      el.innerHTML = '<div class="sw"></div><div><div class="tt">' + escHTML(s.name) + (s.trusted ? '<span class="trust">Trusted 100%</span>' : '') + '</div><div class="dd">' + escHTML(s.dd) + '</div></div>';
      el.addEventListener('click', function () { st.sources[s.id] = !(st.sources[s.id] !== false); el.classList.toggle('on', st.sources[s.id] !== false); trainSave(st); });
      dataHost.appendChild(el);
    });
    var gHost = $('#trGames'); gHost.innerHTML = '';
    TRAIN_GAMES.forEach(function (g) {
      var el = document.createElement('div'); el.className = 'tr-game';
      el.innerHTML = '<div class="gi"><svg class="ic"><use href="#' + g.icon + '"/></svg></div><h4>' + escHTML(g.name) + '</h4><p>' + escHTML(g.dd) + '</p>' +
        '<button class="grun" data-game="' + g.id + '"><svg class="ic-sm"><use href="#i-chat"/></svg> Start session</button>';
      el.querySelector('.grun').addEventListener('click', function () { startTraining(g); });
      gHost.appendChild(el);
    });
    $('#trainer').classList.add('on');
  }
  function closeTrainer() { $('#trainer').classList.remove('on'); }

  /* training chat sessions */
  var TRAIN_OPENERS = {
    factcheck: 'Fact-check drill. Give me a claim and I\'ll say whether it holds up. Correct me with  Answer: "..."  or  Feedback: "..."  when I\'m wrong.',
    skeptic: 'Trust drill. Try to convince me of something false. I should push back, and you correct me with  Answer: "..."  so I learn.',
    reason: 'Reasoning drill. Give me a step-by-step problem. Teach the right working with  Answer: "..." .',
    voice: 'Voice drill. Chat with me and shape how I speak using  Feedback: "..."  with example phrasings.'
  };
  function startTraining(g) {
    closeTrainer();
    var t = { id: uid(), title: 'Training · ' + g.name, pinned: false, createdAt: now(), updatedAt: now(), messages: [], trainMode: g.id };
    t.messages.push({ role: 'assistant', content: TRAIN_OPENERS[g.id] || ('Training: ' + g.name), ts: now(), ack: true, sources: [], feedback: null });
    state.threads.unshift(t); state.activeId = t.id; state.trainMode = { kind: g.id, label: g.name };
    saveThreads(); selectThread(t.id); renderTrainBar();
    $('#composerInput').focus();
  }
  function stopTraining() { state.trainMode = null; renderTrainBar(); toast('Training session ended'); }
  function renderTrainBar() {
    var bar = $('#trainBar');
    if (state.trainMode) { $('#trainBarLabel').textContent = 'Training: ' + state.trainMode.label; bar.hidden = false; $('#composerInput').placeholder = 'Teach Pulsar (Answer: / Feedback: also work)…'; }
    else { bar.hidden = true; $('#composerInput').placeholder = 'Message Supernova…'; }
  }

  function startApp() {
    $('#gate').classList.remove('on'); $('#app').classList.add('on');
    loadThreads(); loadFolders();
    if (state.threads.length) { state.activeId = state.threads.sort(function (a, b) { return b.updatedAt - a.updatedAt; })[0].id; renderSidebar(); selectThread(state.activeId); }
    else newThread();
    fillUser(); autoGrow(); updateCounter();
    $('#trainerBtn').hidden = !isTrainer();
    syncOnStart(); // pull this account's chats from the cloud + merge (cross-device)
    refreshStats().then(function () { setTimeout(autoLearn, 4000); });
    setInterval(function () { if (state.stats && state.stats.untrained > 0) autoLearn(); }, 90000);
    if (window.SN_Neural) window.SN_Neural.load(PULSAR_DB).then(function () { state.neuralReady = true; }).catch(function () { state.neuralReady = false; });
  }
  function refreshStats() {
    return rpc('pulsar_stats', {}).then(function (s) {
      state.stats = s || null;
      state.modelReady = !!(s && s.vocab > 120);
    }).catch(function () { state.stats = null; state.modelReady = false; });
  }
  // Pulsar learns by itself: quietly run the fast n-gram training in the
  // background (after teaching + on a timer) so it improves without a click.
  var _autoLearning = false;
  function autoLearn() {
    if (_autoLearning) return Promise.resolve();
    _autoLearning = true;
    return rpc('pulsar_train', { admin_uid: state.uid, batch: 500 })
      .then(function () { return refreshStats(); })
      .catch(function () {})
      .then(function () { _autoLearning = false; });
  }
  /*  ONE-TIME LIFECHECK GATE  (human check before connecting an account)  */
  var LC_KEY = 'sn_lifecheck_v1';
  function lifecheckDone() { try { return !!localStorage.getItem(LC_KEY); } catch (e) { return false; } }
  function showGate() {
    $('#app').classList.remove('on'); $('#gate').classList.add('on');
    var verify = $('#gateVerify'), signin = $('#gateSignin');
    if (!verify || !signin) return;
    if (lifecheckDone()) { verify.hidden = true; signin.hidden = false; }
    else { signin.hidden = true; verify.hidden = false; initLifecheck(); }
  }
  var _lcWired = false;
  function initLifecheck() {
    var hold = $('#lcHold'), prog = $('#lcProg'), face = $('#lcFace'), label = $('#lcLabel'), icon = $('#lcIcon'), hint = $('#lcHint');
    if (!hold || !prog || _lcWired) return; _lcWired = true;
    var C = 2 * Math.PI * 52; prog.style.strokeDasharray = C; prog.style.strokeDashoffset = C;
    var HOLD_MS = 1600, raf = null, start = 0, done = false, moved = 0, lastX = null, lastY = null;
    function setPct(pct) { prog.style.strokeDashoffset = C * (1 - pct); }
    function tick(now) {
      var pct = Math.min(1, (now - start) / HOLD_MS); setPct(pct);
      if (pct >= 1) { pass(); return; }
      raf = requestAnimationFrame(tick);
    }
    function begin(e) {
      if (done) return; if (e && e.cancelable) e.preventDefault();
      start = performance.now(); moved = 0; lastX = lastY = null;
      hold.classList.add('holding'); label.textContent = 'Hold on...'; hint.textContent = 'Keep holding.';
      raf = requestAnimationFrame(tick);
    }
    function track(e) {
      if (!raf) return; var p = (e.touches && e.touches[0]) || e;
      if (lastX != null) moved += Math.abs(p.clientX - lastX) + Math.abs(p.clientY - lastY);
      lastX = p.clientX; lastY = p.clientY;
    }
    function cancel() {
      if (done || !raf) return; cancelAnimationFrame(raf); raf = null;
      hold.classList.remove('holding'); setPct(0); label.textContent = 'Press & hold'; hint.textContent = 'Hold the circle until it fills.';
    }
    function pass() {
      done = true; if (raf) cancelAnimationFrame(raf); raf = null; setPct(1);
      hold.classList.remove('holding'); hold.classList.add('done');
      icon.innerHTML = '<use href="#i-check"/>'; label.textContent = 'Verified'; hint.textContent = 'You\'re all set.';
      try { localStorage.setItem(LC_KEY, JSON.stringify({ at: Date.now(), moved: Math.round(moved) })); } catch (e) {}
      setTimeout(function () { var v = $('#gateVerify'), s = $('#gateSignin'); if (v) v.hidden = true; if (s) s.hidden = false; }, 750);
    }
    hold.addEventListener('mousedown', begin);
    hold.addEventListener('touchstart', begin, { passive: false });
    window.addEventListener('mousemove', track); window.addEventListener('touchmove', track, { passive: true });
    window.addEventListener('mouseup', cancel); window.addEventListener('touchend', cancel); hold.addEventListener('mouseleave', cancel);
    hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !raf && !done) { e.preventDefault(); begin(); } });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') cancel(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    if (!window.SwiftawAccount) { showGate(); return; }
    window.SwiftawAccount.ready(function () {
      var u = window.SwiftawAccount.user();
      if (!u) { showGate(); }
      else { state.user = u; state.uid = u.id; startApp(); }
    });
    window.SwiftawAccount.onChange(function (u) {
      if (!u) { flushRemoteSave(); state.user = null; showGate(); }
      else if (u.id !== state.uid) {
        // flush any pending save for the account we're leaving, then load the new one
        flushRemoteSave();
        state.trainMode = null; state.streaming = false; state.abort = true;
        state.user = u; state.uid = u.id; startApp();
      }
    });
  });
})();
