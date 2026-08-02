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
    streaming: false, abort: false, search: '', attachments: [], model: 'pulsar'
  };
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
  function saveThreads() { try { localStorage.setItem(storeKey(), JSON.stringify(state.threads)); } catch (e) {} }
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
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }
  function renderMarkdown(md) {
    var blocks = [];
    md = String(md).replace(/```(\w+)?\n([\s\S]*?)```/g, function (m, lang, code) {
      blocks.push({ lang: lang || '', code: code.replace(/\n$/, '') });
      return ' CODE' + (blocks.length - 1) + ' ';
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
    var list = state.threads.filter(function (t) {
      if (!q) return true;
      if (t.title.toLowerCase().indexOf(q) >= 0) return true;
      return t.messages.some(function (m) { return (m.content || '').toLowerCase().indexOf(q) >= 0; });
    });
    var pinned = list.filter(function (t) { return t.pinned; });
    var rest = list.filter(function (t) { return !t.pinned; }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });

    if (pinned.length) { host.appendChild(secHeader('Pinned', 'i-pin')); pinned.sort(function (a, b) { return b.updatedAt - a.updatedAt; }).forEach(function (t) { host.appendChild(threadEl(t)); }); }
    var groups = ['Today', 'Yesterday', 'Older'];
    groups.forEach(function (g) {
      var items = rest.filter(function (t) { return threadGroup(t.updatedAt) === g; });
      if (!items.length) return;
      host.appendChild(secHeader(g, null));
      items.forEach(function (t) { host.appendChild(threadEl(t)); });
    });
    if (!list.length) { var e = document.createElement('div'); e.className = 'side-empty'; e.textContent = q ? 'No chats match your search.' : 'No chats yet. Start a new one.'; host.appendChild(e); }
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
    return d;
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
        '<div class="body"><div class="head"><span class="nm">' + escHTML(nameOf(state.user)) + '</span><span class="ts">' + timeLabel(m.ts) + '</span></div>' +
        (m.attachments && m.attachments.length ? attachmentsHTML(m.attachments) : '') +
        '<div class="prose"></div></div>';
      $('.prose', row).textContent = m.content;
      row.appendChild(userTools(idx));
    } else {
      row.innerHTML = '<img class="av" src="' + PFP + '" alt="Supernova">' +
        '<div class="body"><div class="head"><span class="nm ai">Supernova</span><span class="tag-ai">Pulsar</span><span class="ts">' + timeLabel(m.ts) + '</span></div>' +
        (m.reasoning ? thinkHTML(m.reasoning) : '') +
        '<div class="prose"></div></div>';
      var pr = $('.prose', row); pr.innerHTML = renderMarkdown(m.content); typesetMath(pr);
      row.querySelector('.body').appendChild(aiTools(idx, m));
    }
    return row;
  }
  function attachmentsHTML(atts) {
    return '<div>' + atts.map(function (a) {
      if (a.preview) return '<div class="media-card"><img src="' + escHTML(a.preview) + '" alt=""><div class="cap">' + escHTML(a.name) + '</div></div>';
      return '<div class="attach-chip"><svg class="ic"><use href="#i-file"/></svg><div class="meta"><div class="fn">' + escHTML(a.name) + '</div><div class="sz">' + fmtSize(a.size) + '</div></div></div>';
    }).join('') + '</div>';
  }
  function thinkHTML(txt) {
    return '<details class="think"><summary><svg class="ic-sm"><use href="#i-brain"/></svg> Thinking<svg class="ic-sm chev"><use href="#i-cd"/></svg></summary><div class="think-body">' + renderMarkdown(txt) + '</div></details>';
  }
  function userTools(idx) {
    var w = document.createElement('div'); w.className = 'msg-tools';
    w.innerHTML = tbtn('copy', 'i-copy', 'Copy') + tbtn('edit', 'i-pen', 'Edit prompt');
    w.addEventListener('click', function (e) { var b = e.target.closest('.msg-tool'); if (b) msgAction(b.dataset.act, idx, w); });
    return w;
  }
  function aiTools(idx, m) {
    var w = document.createElement('div'); w.className = 'msg-tools';
    w.innerHTML = tbtn('copy', 'i-copy', 'Copy') + tbtn('regen', 'i-regen', 'Regenerate') + tbtn('branch', 'i-branch', 'Branch') +
      '<button class="msg-tool' + (m.feedback === 'up' ? ' on-up' : '') + '" data-act="up" data-tip="Good response"><svg class="ic-sm"><use href="#i-up"/></svg></button>' +
      '<button class="msg-tool' + (m.feedback === 'down' ? ' on-down' : '') + '" data-act="down" data-tip="Bad response"><svg class="ic-sm" style="transform:rotate(180deg)"><use href="#i-up"/></svg></button>';
    w.addEventListener('click', function (e) { var b = e.target.closest('.msg-tool'); if (b) msgAction(b.dataset.act, idx, w); });
    return w;
  }
  function tbtn(act, icon, tip) { return '<button class="msg-tool" data-act="' + act + '" data-tip="' + tip + '"><svg class="ic-sm"><use href="#' + icon + '"/></svg></button>'; }

  function msgAction(act, idx, toolsEl) {
    var t = activeThread(); if (!t) return; var m = t.messages[idx]; if (!m) return;
    if (act === 'copy') { copyText(m.content); toast('Copied to clipboard'); }
    else if (act === 'edit') { $('#composerInput').value = m.content; autoGrow(); $('#composerInput').focus(); toast('Prompt loaded into the box'); }
    else if (act === 'regen') { regenerate(idx); }
    else if (act === 'branch') { branchFrom(idx); }
    else if (act === 'up' || act === 'down') { setFeedback(idx, act, toolsEl); }
  }
  function setFeedback(idx, val, toolsEl) {
    var t = activeThread(); var m = t.messages[idx];
    m.feedback = (m.feedback === val ? null : val); saveThreads();
    $$('.msg-tool', toolsEl).forEach(function (b) { b.classList.remove('on-up', 'on-down'); });
    if (m.feedback === 'up') toolsEl.querySelector('[data-act="up"]').classList.add('on-up');
    if (m.feedback === 'down') toolsEl.querySelector('[data-act="down"]').classList.add('on-down');
    // TODO(real AI): POST { messageId, prompt, response, feedback } to Supernova so it can learn from mistakes.
    if (m.feedback) toast(m.feedback === 'up' ? 'Thanks, Supernova will learn from this' : 'Noted, this helps Supernova improve');
  }
  function regenerate(aiIdx) {
    var t = activeThread(); var userIdx = aiIdx - 1;
    while (userIdx >= 0 && t.messages[userIdx].role !== 'user') userIdx--;
    if (userIdx < 0) return;
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
    var t = activeThread(); if (!t) { newThread(); t = activeThread(); }
    var msg = { role: 'user', content: text, ts: now(), attachments: state.attachments.slice() };
    t.messages.push(msg);
    if (t.messages.filter(function (m) { return m.role === 'user'; }).length === 1) { t.title = text.slice(0, 42) || 'New chat'; $('#threadTitle').textContent = t.title; }
    t.updatedAt = now(); saveThreads();
    $('#composerInput').value = ''; state.attachments = []; renderAttachments(); autoGrow(); updateCounter(); setElicitations([]);
    renderStream(); renderSidebar();
    respondTo(text);
  }

  function respondTo(prompt) {
    var t = activeThread(); if (!t) return;
    state.streaming = true; state.abort = false; setSending(true);

    var host = $('#streamInner');
    var row = document.createElement('div'); row.className = 'msg';
    row.innerHTML = '<img class="av" src="' + PFP + '" alt="Supernova"><div class="body"><div class="head"><span class="nm ai">Supernova</span><span class="tag-ai">Pulsar</span><span class="ts">' + timeLabel(now()) + '</span></div><div class="think-slot"></div><div class="typing-dots"><i></i><i></i><i></i></div><div class="prose live"></div></div>';
    host.appendChild(row); scrollDown();

    var payload = buildReply(prompt);
    var pr = $('.prose', row), dots = $('.typing-dots', row), thinkSlot = $('.think-slot', row);

    // 1) brief think delay, then reasoning accordion streams
    setTimeout(function () {
      if (state.abort) return finish();
      dots.remove();
      thinkSlot.innerHTML = thinkHTML(payload.reasoning);
      // 2) stream the answer word by word with a caret
      var words = payload.answer.split(/(\s+)/); var i = 0, buf = '';
      pr.innerHTML = '<span class="stream-cursor"></span>';
      (function step() {
        if (state.abort) { return finish(buf); }
        if (i >= words.length) { return finish(payload.answer); }
        buf += words[i++];
        // show raw-ish text while streaming (cheap: escape + line breaks), keep caret
        pr.innerHTML = escHTML(buf).replace(/\n/g, '<br>') + '<span class="stream-cursor"></span>';
        scrollDown();
        setTimeout(step, 14 + Math.random() * 26);
      })();
    }, 480);

    function finish(finalText) {
      state.streaming = false; setSending(false);
      var full = (typeof finalText === 'string' && state.abort) ? finalText : payload.answer;
      pr.classList.remove('live'); pr.innerHTML = renderMarkdown(full); typesetMath(pr);
      var aiMsg = { role: 'assistant', content: full, ts: now(), reasoning: payload.reasoning, feedback: null };
      t.messages.push(aiMsg); t.updatedAt = now(); saveThreads(); renderSidebar();
      // attach tools + elicitations
      var idx = t.messages.length - 1;
      row.querySelector('.body').appendChild(aiTools(idx, aiMsg));
      if (!state.abort) setElicitations(payload.followups);
      scrollDown();
    }
  }

  function buildReply(prompt) {
    var p = (prompt || '').toLowerCase();
    var reasoning = 'The user asked: "' + prompt.slice(0, 80) + '". I will give a clear, friendly answer and show it in Supernova\'s own voice. Since this is a preview, I will demonstrate the formatting the real Pulsar model will use.';
    if (/code|html|button|landing|component|function|script/.test(p)) {
      return {
        reasoning: reasoning + ' This one wants code, so I will return a code card they can copy or preview.',
        answer: 'Here\'s a small section you can drop into a page. Hit **View** on the card to preview it, or **Copy** to grab it.\n\n```html\n<!-- a tiny hero section -->\n<section class="hero">\n  <h1>Made with Supernova</h1>\n  <p>Swiftaw\'s own AI, at your service.</p>\n  <button onclick="alert(\'hi!\')">Say hi</button>\n</section>\n```\n\nA few notes:\n\n- Swap the copy for your own.\n- The `onclick` is just a demo handler.\n- Want it styled? Ask me for the CSS next.',
        followups: ['Add some CSS to style it', 'Make it responsive', 'Explain the code line by line']
      };
    }
    if (/table|compare|comparison|vs\b/.test(p)) {
      return {
        reasoning: reasoning + ' A comparison is clearest as a table.',
        answer: 'Here\'s a quick comparison to get you started:\n\n| Option | Best for | Price |\n| --- | --- | --- |\n| Nimbus | Fast notes | Free |\n| Atlas | Deep research | $6/mo |\n| Orbit | Team wikis | $10/mo |\n\nIf you tell me what matters most to you, I can narrow it down.',
        followups: ['Which is best for a small team?', 'Add a free-tier column', 'Turn this into a checklist']
      };
    }
    if (/math|equation|formula|integral|supernova|physics|energy/.test(p)) {
      return {
        reasoning: reasoning + ' I can bring in a formula and render it properly.',
        answer: 'A supernova is a star ending its life in a huge explosion, briefly outshining a whole galaxy. The energy released is enormous, on the order of the star\'s rest mass energy:\n\n$$E = mc^2$$\n\nIn short:\n\n- The core collapses in seconds.\n- A shockwave blows the outer layers into space.\n- What\'s left seeds new stars with heavier elements.',
        followups: ['What\'s left behind after one?', 'How bright is it, really?', 'Explain it for a 10 year old']
      };
    }
    return {
      reasoning: reasoning,
      answer: 'Happy to help with that. Here\'s a clear take:\n\n- **Straight answer** first, then the why.\n- I keep things short unless you want more.\n- Ask a follow-up and I\'ll go deeper.\n\nSince I\'m still in *preview*, this reply is a simulation, but the real Pulsar model will pick up right here.',
      followups: ['Tell me more', 'Give me an example', 'Keep it shorter']
    };
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
  function scrollDown() { var s = $('#stream'); s.scrollTop = s.scrollHeight; }
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
    $('#sideToggle').addEventListener('click', toggleSidebar);
    $('#topToggle').addEventListener('click', toggleSidebar);
    $('#sideBackdrop').addEventListener('click', function () { document.body.classList.remove('side-open'); });
    $('#searchInput').addEventListener('input', function (e) { state.search = e.target.value; renderSidebar(); });

    var ta = $('#composerInput');
    ta.addEventListener('input', function () { autoGrow(); updateCounter(); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    var box = $('#composerBox');
    ta.addEventListener('focus', function () { box.classList.add('focus'); });
    ta.addEventListener('blur', function () { box.classList.remove('focus'); });

    $('#sendBtn').addEventListener('click', function () { if (state.streaming) { state.abort = true; } else sendMessage(); });
    $('#attachBtn').addEventListener('click', function () { $('#fileInput').click(); });
    $('#fileInput').addEventListener('change', function (e) { handleFiles(e.target.files); e.target.value = ''; });

    $('#modelBtn').addEventListener('click', function (e) { e.stopPropagation(); $('#modelPop').classList.toggle('on'); });

    // context menu actions
    $('#ctxRename').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); renameThread(id); });
    $('#ctxPin').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); pinThread(id); });
    $('#ctxDelete').addEventListener('click', function () { var id = menuFor; closeThreadMenu(); deleteThread(id); });

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
    });
    $('#viewClose').addEventListener('click', closeView);
    $('#viewOverlay').addEventListener('click', function (e) { if (e.target === $('#viewOverlay')) closeView(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeView(); closeThreadMenu(); } });
  }

  function fillUser() {
    var u = state.user; var nm = nameOf(u), av = avatarOf(u);
    $('#foot').innerHTML = (av ? '<img class="av" src="' + escHTML(av) + '" alt="">' : '<div class="av">' + escHTML(nm.charAt(0).toUpperCase()) + '</div>') +
      '<div class="who"><div class="n">' + escHTML(nm) + '</div><div class="e">' + escHTML(u.email || '') + '</div></div>' +
      '<button class="side-icobtn" id="signOut" data-tip="Sign out" aria-label="Sign out"><svg class="ic"><use href="#i-out"/></svg></button>';
    $('#signOut').addEventListener('click', function () { if (window.SwiftawAccount) window.SwiftawAccount.signOut(); });
  }

  function startApp() {
    $('#gate').classList.remove('on'); $('#app').classList.add('on');
    loadThreads();
    if (state.threads.length) { state.activeId = state.threads.sort(function (a, b) { return b.updatedAt - a.updatedAt; })[0].id; renderSidebar(); selectThread(state.activeId); }
    else newThread();
    fillUser(); autoGrow(); updateCounter();
  }
  function showGate() { $('#app').classList.remove('on'); $('#gate').classList.add('on'); }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    if (!window.SwiftawAccount) { showGate(); return; }
    window.SwiftawAccount.ready(function () {
      var u = window.SwiftawAccount.user();
      if (!u) { showGate(); }
      else { state.user = u; state.uid = u.id; startApp(); }
    });
    window.SwiftawAccount.onChange(function (u) {
      if (!u) { state.user = null; showGate(); }
      else if (u.id !== state.uid) { state.user = u; state.uid = u.id; startApp(); }
    });
  });
})();
