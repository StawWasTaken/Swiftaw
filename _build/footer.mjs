// The footer, written once.
//
// Every site we own ends the same way: a mark and a line about who we are,
// three columns, a base line, the rainbaw. What changes between sites is the
// mark and the first column. Everything else is the ecosystem's signature and
// is not a per-site decision.
//
// This file is the only place that shape exists. _build/min.mjs stamps it into
// the pages between their markers, so what ships is real HTML - crawlable, no
// script needed, nothing to flash in - and `--check` catches any page that has
// drifted away from it.
//
// A page opts in by carrying the markers:
//
//   <!--footer:workstation-->
//   <!--/footer-->
//
// Fortized lives in another repository and cannot run this build, so its pages
// carry the stamped markup by hand. `node _build/footer.mjs <site>` prints a
// site's footer for pasting; the same command is how you refresh it there.

// Root-relative for a site's own pages, absolute for anything on swiftaw.com.
// A site that later moves to its own subdomain keeps its outbound links.
const SW = 'https://swiftaw.com';

const LEGAL_SWIFTAW = {
  head: 'Legal',
  links: [
    ['Terms of Service', SW + '/legal/terms-of-service'],
    ['Privacy Policy', SW + '/legal/privacy-policy'],
    ['Products Policy', SW + '/legal/products-policy'],
  ],
};

const ABOUT_SWIFTAW = {
  head: 'Swiftaw',
  links: [
    ['Home', SW + '/'],
    ['About', SW + '/about-us'],
    ['Newsroom', SW + '/newsroom'],
    ['Contact', SW + '/contact'],
  ],
};

export const SITES = {
  // Swiftaw's own footer. It was here first and it is the reference the others
  // were made to match, so it is reproduced exactly, links and all.
  swiftaw: {
    brand: { href: '/', img: '/SWFTW_Logomark.png', alt: 'Swiftaw' },
    blurb: 'A European software company. Île-de-France, France.',
    columns: [
      { head: 'Company', links: [
        ['About', '/about-us'],
        ['Mission', '/mission'],
        ['Lab', '/innovation-room'],
        ['Newsroom', '/newsroom'],
        ['Press kit', '/presskit'],
        ['Contact', '/contact'],
      ] },
      { head: 'Make', links: [
        ['Fortized', 'https://fortized.com'],
        ['Lifecheck', '/lifecheck/'],
        ['Supernova', '/supernova/'],
        ['Swiftaw Icons', '/icons/'],
      ] },
      { head: 'Legal', links: [
        ['Terms of Service', '/legal/terms-of-service'],
        ['Privacy Policy', '/legal/privacy-policy'],
        ['Products Policy', '/legal/products-policy'],
      ] },
    ],
  },

  workstation: {
    brand: { href: '/icons/', img: '/Workstation%20logo.png', alt: 'Swiftaw Workstation' },
    blurb: 'The tools we built for ourselves, open to anyone. Made in Île-de-France, France.',
    columns: [
      // One service is on the bench today. The others go in as they arrive,
      // not before.
      { head: 'Workstation', links: [
        ['Swiftaw Icons', '/icons/'],
      ] },
      ABOUT_SWIFTAW,
      LEGAL_SWIFTAW,
    ],
  },

  lifecheck: {
    brand: { href: '/lifecheck/', img: '/lifecheck/LifeCheck%20logo.png', alt: 'Lifecheck' },
    blurb: 'Human verification, made by Swiftaw in Île-de-France, France.',
    columns: [
      { head: 'Lifecheck', links: [
        ['Overview', '/lifecheck/'],
        ['Docs', '/lifecheck/docs'],
        ['API keys', '/lifecheck/keys'],
      ] },
      ABOUT_SWIFTAW,
      LEGAL_SWIFTAW,
    ],
  },

  fortized: {
    brand: { href: '/', img: '/Fortized%20logo2026.png', alt: 'Fortized' },
    blurb: 'More Than A Chat App. Made by Swiftaw in Île-de-France, France.',
    columns: [
      { head: 'Fortized', links: [
        ['Open the app', '/app'],
        ['Download', '/download'],
        ['Support', '/support'],
        ['Newsroom', '/newsroom'],
      ] },
      ABOUT_SWIFTAW,
      { head: 'Legal', links: [
        ['Terms of Service', '/legal/terms-of-service'],
        ['Terms of Use', '/legal/terms-of-use'],
        ['Privacy Policy', '/legal/privacy-policy'],
      ] },
    ],
  },
};

// The holder is Swiftaw on every one of them, products included. Bumping the
// year is a one-word edit here rather than a sweep across four sites.
const COPYRIGHT = '© 2026 Swiftaw';
const TAGLINE = 'Make It Matter.';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A link that leaves the site gets rel="noopener". Deciding it from the href
// rather than from a flag in the data means nobody has to remember.
function link(label, href) {
  const out = /^https?:\/\//.test(href);
  return '          <a href="' + esc(href) + '"' + (out ? ' rel="noopener"' : '') +
         '>' + esc(label) + '</a>';
}

export function render(site, indent = '') {
  const s = SITES[site];
  if (!s) throw new Error('No footer defined for "' + site + '".');

  const cols = s.columns.map(c =>
    '      <div>\n' +
    '        <h4>' + esc(c.head) + '</h4>\n' +
    '        <div class="nb-footer-list">\n' +
    c.links.map(l => link(l[0], l[1])).join('\n') + '\n' +
    '        </div>\n' +
    '      </div>'
  ).join('\n');

  const html =
    '<footer class="nb-footer">\n' +
    '  <div class="nb-footer-wrap">\n' +
    '    <div class="nb-footer-grid">\n' +
    '      <div>\n' +
    '        <a href="' + esc(s.brand.href) + '" class="nb-foot-brand">' +
    '<img src="' + esc(s.brand.img) + '" alt="' + esc(s.brand.alt) + '"></a>\n' +
    '        <p class="nb-footer-blurb">' + esc(s.blurb) + '</p>\n' +
    '      </div>\n' +
    cols + '\n' +
    '    </div>\n' +
    '    <div class="nb-footer-base">\n' +
    '      <span>' + esc(COPYRIGHT) + '</span>\n' +
    '      <span>' + esc(TAGLINE) + '</span>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="nb-rainbaw nb-footer-bar" aria-hidden="true">' +
    '<i></i><i></i><i></i><i></i><i></i></div>\n' +
    '</footer>';

  return indent ? html.split('\n').map(l => l ? indent + l : l).join('\n') : html;
}

// Printing one out is how the repositories that cannot run this build get it.
if (process.argv[1] && process.argv[1].endsWith('footer.mjs')) {
  const which = process.argv[2];
  if (!which || !SITES[which]) {
    console.error('Usage: node _build/footer.mjs <' + Object.keys(SITES).join('|') + '>');
    process.exit(1);
  }
  console.log(render(which));
}
