import { PALETTES } from './palettes'

// palette list is interpolated into the regex so adding a palette only
// requires editing palettes.ts + adding a new scss file.
const paletteRegex = `palette=(${PALETTES.join('|')})`

/** inline `<script>` body run before body paint. reads the theme+palette
 * cookies and sets matching `data-theme` / `data-palette` on <html>, so the
 * server-rendered CSS custom properties resolve against the correct layer.
 *
 * the trailing `window.exo.ers` bridge is needed by the fabric `@client` IIFE:
 * fabric polls `window.exo?.ers` but the framework only ever sets
 * `window.ers` / `window.ERS`, so this getter forwards between the two. */
export const themeScript = `
(function(){
  var ck = document.cookie;
  var t = ck.match(/theme=(dark|light)/);
  var p = ck.match(/${paletteRegex}/);
  var html = document.documentElement;
  if(t) html.setAttribute('data-theme', t[1]);
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme:light)').matches)
    html.setAttribute('data-theme','light');
  if(p) html.setAttribute('data-palette', p[1]);
  else html.setAttribute('data-palette','${PALETTES[0]}');
  window.exo = window.exo || {};
  Object.defineProperty(window.exo, 'ers', {
    get: function(){ return window.ERS || window.ers || true },
    configurable: true,
  });
})();
`
