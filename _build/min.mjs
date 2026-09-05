// Build step: _js/*.js -> docs/css/*.js, _css/*.css -> docs/css/*.css
//
// docs/ is what GitHub Pages serves. The sources stay outside it on purpose,
// so they are not handed out with the site.
//
// Strips comments and indentation. It does NOT rename identifiers or join
// lines, so there is no ASI risk and the output is byte-for-byte behaviour
// identical to the source.
//
//   node _build/min.mjs          build
//   node _build/min.mjs --check  fail if any output is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render as renderFooter } from './footer.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// Walks the source once, tracking which construct we are inside, so a "//"
// inside a string or a regex is never mistaken for a comment.
function stripJs(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  // What the previous significant character was, to tell a division from the
  // start of a regex literal.
  let prev = '';
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];

    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      prev = q;
      continue;
    }
    if (c === '`') {
      out += c; i++;
      let depth = 0;
      while (i < n) {
        if (src[i] === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { depth++; out += '${'; i += 2; continue; }
        if (src[i] === '}' && depth > 0) { depth--; out += '}'; i++; continue; }
        out += src[i];
        if (src[i] === '`' && depth === 0) { i++; break; }
        i++;
      }
      prev = '`';
      continue;
    }
    if (c === '/' && /[=(,:[!&|?{};+\-*%~^<>]/.test(prev)) {
      // regex literal
      out += c; i++;
      let cls = false;
      while (i < n) {
        if (src[i] === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
        if (src[i] === '[') cls = true;
        else if (src[i] === ']') cls = false;
        out += src[i];
        if (src[i] === '/' && !cls) { i++; break; }
        i++;
      }
      while (i < n && /[a-z]/.test(src[i])) { out += src[i]; i++; }
      prev = '/';
      continue;
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length)
    .join('\n') + '\n';
}

function stripCss(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length)
    .join('\n') + '\n';
}

const JOBS = [
  { from: '_js', to: 'docs/css', ext: '.js', fn: stripJs },
  { from: '_css', to: 'docs/css', ext: '.css', fn: stripCss },
];

let stale = 0, built = 0;
for (const job of JOBS) {
  const dir = path.join(ROOT, job.from);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(job.ext))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const outPath = path.join(ROOT, job.to, f);
    const next = job.fn(src);
    const cur = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
    if (cur === next) continue;
    if (CHECK) { console.error('stale: ' + job.to + '/' + f); stale++; continue; }
    fs.writeFileSync(outPath, next);
    console.log('built ' + job.to + '/' + f + '  (' + src.length + ' -> ' + next.length + ')');
    built++;
  }
}
/* ── The footer, stamped in ────────────────────────────────────────────────
   A page marks where its footer goes and which site it belongs to:

     <!--footer:workstation-->
     <!--/footer-->

   and everything between the two is replaced with what _build/footer.mjs
   renders. The pages keep real HTML, so the footer is crawlable and needs no
   script, while there is still only one place the shape is written down.
   `--check` reports a page whose footer has drifted instead of fixing it. */
const FOOT_RE = /([ \t]*)<!--footer:([a-z0-9-]+)-->[\s\S]*?<!--\/footer-->/g;

function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

let footStale = 0, footBuilt = 0;
for (const f of walkHtml(path.join(ROOT, 'docs'))) {
  const src = fs.readFileSync(f, 'utf8');
  if (src.indexOf('<!--footer:') < 0) continue;
  const next = src.replace(FOOT_RE, (whole, indent, site) =>
    indent + '<!--footer:' + site + '-->\n' +
    renderFooter(site, indent) + '\n' +
    indent + '<!--/footer-->');
  if (next === src) continue;
  const rel = path.relative(ROOT, f);
  if (CHECK) { console.error('stale footer: ' + rel); footStale++; continue; }
  fs.writeFileSync(f, next);
  console.log('footer   ' + rel);
  footBuilt++;
}

if (CHECK && (stale || footStale)) process.exit(1);
if (!CHECK) {
  console.log(built ? built + ' file(s) built' : 'up to date');
  if (footBuilt) console.log(footBuilt + ' footer(s) stamped');
}
