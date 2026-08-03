/* ════════════════════════════════════════════════════════════════
   PULSAR neural trainer — Web Worker (off the main thread, no UI freeze)
   Trains the small word-level model and uploads it to Supabase Storage.
   The main thread only loads the saved model for generation.
════════════════════════════════════════════════════════════════ */
/* global tf, importScripts */
try { importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'); } catch (e) {}

var SEQ = 6, EMBED = 48, UNITS = 96, VOCAB_CAP = 1500, MAX_TEXTS = 700, MAX_SEQS = 12000;

function tokenize(t) { return String(t || '').toLowerCase().replace(/([.,!?;:()"])/g, ' $1 ').split(/\s+/).filter(Boolean); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
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

onmessage = function (e) {
  var msg = e.data || {}; if (msg.type !== 'train') return;
  (async function () {
    try {
      if (typeof tf === 'undefined') throw new Error('TensorFlow failed to load');
      await tf.ready();
      var texts = (msg.texts || []).filter(function (t) { return t && String(t).trim().length > 1; });
      if (texts.length < 5) throw new Error('Not enough data yet, chat more first');
      texts = shuffle(texts).slice(0, MAX_TEXTS);
      var vocab = buildVocab(texts), stoi = vocab.stoi, V = vocab.size;

      postMessage({ type: 'progress', phase: 'prep', pct: 0 });
      var X = [], Y = [];
      for (var i = 0; i < texts.length && X.length < MAX_SEQS; i++) {
        var ids = [2].concat(tokenize(texts[i]).map(function (w) { return enc(stoi, w); })).concat([3]);
        for (var k = 1; k < ids.length && X.length < MAX_SEQS; k++) {
          var ctx = ids.slice(Math.max(0, k - SEQ), k); while (ctx.length < SEQ) ctx.unshift(0);
          X.push(ctx); Y.push(ids[k]);
        }
      }
      if (!X.length) throw new Error('no training sequences');

      var model = tf.sequential();
      model.add(tf.layers.embedding({ inputDim: V, outputDim: EMBED, inputLength: SEQ }));
      model.add(tf.layers.gru({ units: UNITS }));
      model.add(tf.layers.dense({ units: V, activation: 'softmax' }));
      model.compile({ optimizer: tf.train.adam(0.01), loss: 'sparseCategoricalCrossentropy' });

      var xs = tf.tensor2d(X, [X.length, SEQ], 'int32'), ys = tf.tensor1d(Y, 'int32');
      var epochs = Math.min(msg.epochs || 10, 12);
      await model.fit(xs, ys, {
        epochs: epochs, batchSize: 64, shuffle: true,
        callbacks: { onEpochEnd: function (ep) { postMessage({ type: 'progress', pct: Math.round(((ep + 1) / epochs) * 100) }); } }
      });
      xs.dispose(); ys.dispose();

      var db = msg.db || {};
      async function put(path, body, ct) {
        var r = await fetch(db.url + '/storage/v1/object/pulsar/' + path, {
          method: 'POST', headers: { apikey: db.key, Authorization: 'Bearer ' + db.key, 'Content-Type': ct, 'x-upsert': 'true' }, body: body
        });
        if (!r.ok) throw new Error('upload ' + path + ' ' + r.status + ' ' + (await r.text()));
      }
      postMessage({ type: 'progress', phase: 'save', pct: 100 });
      await model.save({
        save: async function (art) {
          var mj = { modelTopology: art.modelTopology, format: art.format, generatedBy: art.generatedBy, convertedBy: art.convertedBy, weightsManifest: [{ paths: ['weights.bin'], weights: art.weightSpecs }] };
          await put('model.json', JSON.stringify(mj), 'application/json');
          await put('weights.bin', art.weightData, 'application/octet-stream');
          return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
        }
      });
      await put('vocab.json', JSON.stringify({ itos: vocab.itos }), 'application/json');
      postMessage({ type: 'done', vocab: V, sequences: X.length });
    } catch (err) {
      postMessage({ type: 'error', message: (err && err.message) || String(err) });
    }
  })();
};
