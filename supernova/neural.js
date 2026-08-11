/* ════════════════════════════════════════════════════════════════
   SUPERNOVA / PULSAR — neural model (browser, TensorFlow.js)

   Pulsar's own small neural language model. It is TRAINED in the browser
   on the Swiftaw account (from the data stocked in Supabase), SAVED to
   Supabase Storage, and every visitor's browser LOADS it and generates
   from it. No external AI, no training server. Word-level next-token model
   (embedding -> GRU -> softmax). Rough with little data, better with more.

   Everything is guarded: if TF.js can't load or no model exists, this stays
   silent and the chat falls back to the n-gram model / draft.
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var TF_SRC = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
  var SEQ = 6, EMBED = 48, UNITS = 96, VOCAB_CAP = 1500;
  var MODEL = null, STOI = null, ITOS = null, tfReady = null;

  function ensureTF() {
    if (window.tf) return Promise.resolve(window.tf);
    if (tfReady) return tfReady;
    tfReady = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = TF_SRC; s.async = true;
      s.onload = function () { res(window.tf); }; s.onerror = function () { rej(new Error('tfjs load failed')); };
      document.head.appendChild(s);
    });
    return tfReady;
  }

  function tokenize(text) {
    return String(text || '').toLowerCase()
      .replace(/([.,!?;:()"])/g, ' $1 ')
      .split(/\s+/).filter(Boolean);
  }
  function detokenize(toks) {
    return toks.join(' ').replace(/\s+([.,!?;:])/g, '$1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
  }

  function buildVocab(texts) {
    var freq = Object.create(null);
    texts.forEach(function (t) { tokenize(t).forEach(function (w) { freq[w] = (freq[w] || 0) + 1; }); });
    var words = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, VOCAB_CAP);
    var stoi = { '<pad>': 0, '<unk>': 1, '<s>': 2, '</s>': 3 };
    words.forEach(function (w, i) { if (!(w in stoi)) stoi[w] = i + 4; });
    var itos = []; Object.keys(stoi).forEach(function (w) { itos[stoi[w]] = w; });
    return { stoi: stoi, itos: itos, size: itos.length };
  }
  function enc(stoi, w) { return (w in stoi) ? stoi[w] : 1; }

  // ── TRAIN (Swiftaw only) — runs in a Web Worker, never freezes the UI ──
  function train(texts, opts) {
    opts = opts || {};
    var onProgress = opts.onProgress || function () {};
    return new Promise(function (resolve, reject) {
      var w;
      try { w = new Worker('/supernova/neural-worker.js?v=sn11'); }
      catch (e) { return reject(new Error('Background training not available in this browser')); }
      w.onmessage = function (e) {
        var m = e.data || {};
        if (m.type === 'progress') onProgress(m.pct || 0, m.loss, m.phase);
        else if (m.type === 'done') { w.terminate(); resolve({ vocab: m.vocab, sequences: m.sequences }); }
        else if (m.type === 'error') { w.terminate(); reject(new Error(m.message || 'training failed')); }
      };
      w.onerror = function (e) { w.terminate(); reject(new Error((e && e.message) || 'worker error')); };
      w.postMessage({ type: 'train', texts: texts, epochs: opts.epochs, db: { url: opts.dbUrl, key: opts.dbKey } });
    });
  }

  // ── SAVE to Supabase Storage (bucket 'pulsar') ───────────────────
  function save(db) {
    if (!MODEL || !STOI) return Promise.reject(new Error('nothing trained'));
    function put(path, body, ct) {
      return fetch(db.url + '/storage/v1/object/pulsar/' + path, {
        method: 'POST',
        headers: { apikey: db.key, Authorization: 'Bearer ' + db.key, 'Content-Type': ct, 'x-upsert': 'true' },
        body: body
      }).then(function (r) { if (!r.ok) throw new Error('upload ' + path + ' ' + r.status); });
    }
    var handler = {
      save: function (artifacts) {
        var modelJSON = {
          modelTopology: artifacts.modelTopology,
          format: artifacts.format, generatedBy: artifacts.generatedBy, convertedBy: artifacts.convertedBy,
          weightsManifest: [{ paths: ['weights.bin'], weights: artifacts.weightSpecs }]
        };
        return put('model.json', JSON.stringify(modelJSON), 'application/json')
          .then(function () { return put('weights.bin', artifacts.weightData, 'application/octet-stream'); })
          .then(function () { return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }; });
      }
    };
    return MODEL.save(handler).then(function () {
      return put('vocab.json', JSON.stringify({ itos: ITOS }), 'application/json');
    });
  }

  // ── LOAD (every visitor) ─────────────────────────────────────────
  function load(db) {
    return ensureTF().then(function (tf) {
      var base = db.url + '/storage/v1/object/public/pulsar/';
      return fetch(base + 'vocab.json?t=' + Date.now()).then(function (r) {
        if (!r.ok) throw new Error('no vocab'); return r.json();
      }).then(function (v) {
        ITOS = v.itos; STOI = {}; ITOS.forEach(function (w, i) { STOI[w] = i; });
        return tf.loadLayersModel(base + 'model.json?t=' + Date.now());
      }).then(function (m) { MODEL = m; return true; });
    });
  }

  function sample(probs, temp) {
    var i, logits = [], sum = 0;
    for (i = 0; i < probs.length; i++) { var p = Math.pow(probs[i], 1 / (temp || 0.8)); logits.push(p); sum += p; }
    var r = Math.random() * sum, acc = 0;
    for (i = 0; i < logits.length; i++) { acc += logits[i]; if (r <= acc) return i; }
    return probs.length - 1;
  }

  // ── GENERATE ─────────────────────────────────────────────────────
  function reply(prompt) {
    if (!MODEL || !STOI || !window.tf) return null;
    var tf = window.tf;
    var seed = tokenize(prompt).slice(-SEQ).map(function (w) { return enc(STOI, w); });
    var ids = [2].concat(seed), out = [], end = STOI['</s>'];
    for (var i = 0; i < 45; i++) {
      var win = ids.slice(-SEQ); while (win.length < SEQ) win.unshift(0);
      var input = tf.tensor2d([win], [1, SEQ], 'float32');
      var pred = MODEL.predict(input);
      var probs = pred.dataSync(); input.dispose(); pred.dispose();
      var nxt = sample(probs, 0.8);
      if (nxt === end || nxt === 0 || nxt === 1) { if (out.length >= 4) break; else continue; }
      ids.push(nxt); out.push(ITOS[nxt] || '');
      if ((ITOS[nxt] === '.' || ITOS[nxt] === '!' || ITOS[nxt] === '?') && out.length > 6) break;
    }
    return detokenize(out.filter(Boolean));
  }

  window.SN_Neural = {
    available: function () { return !!window.tf; },
    hasModel: function () { return !!MODEL; },
    train: train, save: save, load: load, reply: reply, ensureTF: ensureTF
  };
})();
