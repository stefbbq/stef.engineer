/** base + per-palette CSS custom properties */
export const cssVars = `
:root, [data-theme="dark"] {
  --bg: #0a0a0c;
  --bg-elevated: #111114;
  --text: #ededee;
  --text-muted: #8a8a93;
  --text-subtle: #5a5a63;
  --surface: rgba(255,255,255,0.03);
  --surface-strong: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.07);
  --border-strong: rgba(255,255,255,0.13);
  --dot-color: rgba(255,255,255,0.045);
  --nav-bg: rgba(10,10,12,0.72);
  color-scheme: dark;
}
[data-theme="light"] {
  --bg: #fafafa;
  --bg-elevated: #ffffff;
  --text: #0d0d10;
  --text-muted: #5a5a63;
  --text-subtle: #9a9aa3;
  --surface: rgba(0,0,0,0.025);
  --surface-strong: rgba(0,0,0,0.05);
  --border: rgba(0,0,0,0.07);
  --border-strong: rgba(0,0,0,0.14);
  --dot-color: rgba(0,0,0,0.06);
  --nav-bg: rgba(250,250,250,0.78);
  color-scheme: light;
}

/* palettes - default is midnight */
:root, [data-palette="midnight"] {
  --accent: #00e5ff;
  --accent-2: #a855f7;
  --accent-grad: linear-gradient(135deg, #00e5ff 0%, #a855f7 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(0,229,255,0.18), rgba(168,85,247,0.18));
  --glow: rgba(0,229,255,0.18);
  --halo-1: rgba(0,229,255,0.10);
  --halo-2: rgba(168,85,247,0.08);
}
[data-theme="light"][data-palette="midnight"] {
  --accent: #0891b2;
  --accent-2: #7c3aed;
  --accent-grad: linear-gradient(135deg, #0891b2 0%, #7c3aed 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(8,145,178,0.12), rgba(124,58,237,0.10));
  --glow: rgba(8,145,178,0.16);
  --halo-1: rgba(8,145,178,0.06);
  --halo-2: rgba(124,58,237,0.05);
}

[data-palette="neon"] {
  --accent: #ff2bb1;
  --accent-2: #3a7bff;
  --accent-grad: linear-gradient(135deg, #ff2bb1 0%, #3a7bff 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(255,43,177,0.18), rgba(58,123,255,0.18));
  --glow: rgba(255,43,177,0.22);
  --halo-1: rgba(255,43,177,0.10);
  --halo-2: rgba(58,123,255,0.10);
}
[data-theme="light"][data-palette="neon"] {
  --accent: #d4179a;
  --accent-2: #2a5fdf;
  --accent-grad: linear-gradient(135deg, #d4179a 0%, #2a5fdf 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(212,23,154,0.12), rgba(42,95,223,0.12));
  --glow: rgba(212,23,154,0.16);
  --halo-1: rgba(212,23,154,0.06);
  --halo-2: rgba(42,95,223,0.06);
}

[data-palette="sunset"] {
  --accent: #ffb627;
  --accent-2: #ff5e62;
  --accent-grad: linear-gradient(135deg, #ffb627 0%, #ff5e62 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(255,182,39,0.18), rgba(255,94,98,0.18));
  --glow: rgba(255,94,98,0.20);
  --halo-1: rgba(255,182,39,0.10);
  --halo-2: rgba(255,94,98,0.08);
}
[data-theme="light"][data-palette="sunset"] {
  --accent: #d4830a;
  --accent-2: #d83d40;
  --accent-grad: linear-gradient(135deg, #d4830a 0%, #d83d40 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(212,131,10,0.12), rgba(216,61,64,0.12));
  --glow: rgba(216,61,64,0.16);
  --halo-1: rgba(212,131,10,0.06);
  --halo-2: rgba(216,61,64,0.05);
}

[data-palette="forest"] {
  --accent: #84cc16;
  --accent-2: #0d9488;
  --accent-grad: linear-gradient(135deg, #84cc16 0%, #0d9488 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(132,204,22,0.18), rgba(13,148,136,0.18));
  --glow: rgba(132,204,22,0.18);
  --halo-1: rgba(132,204,22,0.08);
  --halo-2: rgba(13,148,136,0.08);
}
[data-theme="light"][data-palette="forest"] {
  --accent: #4d7c0f;
  --accent-2: #0f766e;
  --accent-grad: linear-gradient(135deg, #4d7c0f 0%, #0f766e 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(77,124,15,0.12), rgba(15,118,110,0.12));
  --glow: rgba(15,118,110,0.16);
  --halo-1: rgba(77,124,15,0.06);
  --halo-2: rgba(15,118,110,0.05);
}

[data-palette="vapor"] {
  --accent: #9d4edd;
  --accent-2: #ff006e;
  --accent-grad: linear-gradient(135deg, #9d4edd 0%, #ff006e 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(157,78,221,0.18), rgba(255,0,110,0.18));
  --glow: rgba(255,0,110,0.20);
  --halo-1: rgba(157,78,221,0.10);
  --halo-2: rgba(255,0,110,0.08);
}
[data-theme="light"][data-palette="vapor"] {
  --accent: #7e22ce;
  --accent-2: #be185d;
  --accent-grad: linear-gradient(135deg, #7e22ce 0%, #be185d 100%);
  --accent-grad-soft: linear-gradient(135deg, rgba(126,34,206,0.12), rgba(190,24,93,0.12));
  --glow: rgba(190,24,93,0.16);
  --halo-1: rgba(126,34,206,0.06);
  --halo-2: rgba(190,24,93,0.05);
}
`

export const PALETTES = ['midnight', 'neon', 'sunset', 'forest', 'vapor'] as const
export type Palette = (typeof PALETTES)[number]

export const getThemeFromCookie = (cookie: string | null): 'dark' | 'light' => {
  const match = (cookie ?? '').match(/theme=(dark|light)/)
  return match ? (match[1] as 'dark' | 'light') : 'dark'
}

export const getPaletteFromCookie = (cookie: string | null): Palette => {
  const match = (cookie ?? '').match(/palette=(midnight|neon|sunset|forest|vapor)/)
  return match ? (match[1] as Palette) : 'midnight'
}

export const themeScript = `
(function(){
  var ck = document.cookie;
  var t = ck.match(/theme=(dark|light)/);
  var p = ck.match(/palette=(midnight|neon|sunset|forest|vapor)/);
  var html = document.documentElement;
  if(t) html.setAttribute('data-theme', t[1]);
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme:light)').matches)
    html.setAttribute('data-theme','light');
  if(p) html.setAttribute('data-palette', p[1]);
  else html.setAttribute('data-palette','midnight');
  // bridge for the fabric @client IIFE, which polls window.exo?.ers but the
  // framework only ever sets window.ers / window.ERS
  window.exo = window.exo || {};
  Object.defineProperty(window.exo, 'ers', {
    get: function(){ return window.ERS || window.ers || true },
    configurable: true,
  });
})();
`

export const globalStyles = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-feature-settings:"cv11","ss01","ss03";
  background:var(--bg);
  color:var(--text);
  line-height:1.65;
  min-height:100vh;
  position:relative;
  padding-bottom:env(safe-area-inset-bottom,0);
  overflow-x:hidden;
  transition:background .25s ease, color .25s ease;
}
/* dot grid + radial halos */
body::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:-2;
  background-image:radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size:22px 22px;
  background-position:0 0;
  mask-image:linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image:linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
}
body::after{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(60% 40% at 20% 0%, var(--halo-1), transparent 70%),
    radial-gradient(50% 35% at 90% 10%, var(--halo-2), transparent 70%);
  transition:background .4s ease;
}

a{color:var(--accent);text-decoration:none;transition:color .15s, opacity .15s}
a:hover{opacity:0.85}

::selection{background:var(--accent);color:var(--bg)}

.grad-text{
  background:var(--accent-grad);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
}

main{transition:opacity .22s ease}
[data-navigating="true"] main{opacity:0.45}

/* top nav */
.top-nav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:0.85rem 1.75rem;
  background:var(--nav-bg);
  backdrop-filter:blur(14px) saturate(180%);
  -webkit-backdrop-filter:blur(14px) saturate(180%);
  border-bottom:1px solid var(--border);
}
.top-nav > *{display:flex;align-items:center}
.top-nav .logo{
  font-family:'Bebas Neue','Inter',sans-serif;
  font-weight:400;font-size:1.3rem;letter-spacing:0.06em;line-height:1;
  text-transform:uppercase;
  background:var(--accent-grad);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
  /* nudge bebas optical center onto the shared baseline with inter */
  transform:translateY(1px);
}
.top-nav .nav-links{display:flex;gap:1.75rem;align-items:center}
.top-nav .nav-links a{
  display:inline-flex;align-items:center;line-height:1;
  color:var(--text-muted);font-size:0.875rem;font-weight:500;
  letter-spacing:-0.01em;
  position:relative;padding:0.25rem 0;
  transition:color .15s;
}
.top-nav .nav-links a:hover{color:var(--text);opacity:1}
.top-nav .nav-links a.active{color:var(--text)}
.top-nav .nav-links a.active::after{
  content:'';position:absolute;left:0;right:0;bottom:-2px;height:2px;
  background:var(--accent-grad);border-radius:2px;
}
.nav-actions{display:flex;align-items:center;gap:0.5rem}
.icon-btn{
  background:none;border:none;cursor:pointer;color:var(--text-muted);
  padding:0.4rem;display:flex;align-items:center;justify-content:center;
  border-radius:8px;transition:color .15s, background .15s;
}
.icon-btn:hover{color:var(--text);background:var(--surface-strong)}
.icon-btn svg{width:18px;height:18px}
.palette-btn .palette-dot{
  width:14px;height:14px;border-radius:50%;
  background:var(--accent-grad);
  box-shadow:0 0 0 2px var(--bg-elevated), 0 0 8px var(--glow);
}

/* bottom nav */
.bottom-nav{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;
  background:var(--nav-bg);
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border-top:1px solid var(--border);
  padding:0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom,0));
}
.bottom-nav nav{display:flex;justify-content:space-around;align-items:flex-end}
.bottom-nav a{
  position:relative;
  display:flex;flex-direction:column;align-items:center;gap:0.25rem;
  color:var(--text-muted);
  font-family:'Bebas Neue','Inter',sans-serif;
  font-size:0.78rem;font-weight:400;letter-spacing:0.08em;
  text-transform:uppercase;
  padding:0.4rem 0.75rem 0.25rem;
  transition:color .15s;
}
.bottom-nav a:hover{color:var(--text);opacity:1}
.bottom-nav a.active{color:var(--text)}
.bottom-nav a.active::before{
  content:'';position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  width:24px;height:2px;border-radius:2px;background:var(--accent-grad);
}
.bottom-nav svg{width:22px;height:22px;stroke-width:1.8}

@media(max-width:768px){
  .top-nav .nav-links a:not(.icon-btn-link){display:none}
  .bottom-nav{display:block}
  body{padding-bottom:calc(4.5rem + env(safe-area-inset-bottom,0))}
  .top-nav{padding:0.75rem 1.25rem}
}

.container{max-width:920px;margin:0 auto;padding:3rem 1.75rem 1rem}
@media(max-width:768px){.container{padding:2rem 1.25rem 1rem}}
section{margin-bottom:4.5rem}
section:last-child{margin-bottom:1rem}

h1,h2,h3{
  font-family:'Bebas Neue','Inter',sans-serif;
  text-transform:uppercase;
  font-weight:400;
  color:var(--text);
}
h1{font-size:clamp(3.75rem,8.5vw,6.25rem);letter-spacing:0.02em;line-height:0.95;margin-bottom:0.85rem}
h2{font-size:2.35rem;letter-spacing:0.06em;margin-bottom:1.75rem}
h3{font-size:1.4rem;letter-spacing:0.05em;margin-bottom:0.5rem}
p{color:var(--text-muted)}
.tagline{font-size:1.2rem;color:var(--text-muted);font-weight:400;letter-spacing:-0.01em;margin-bottom:1.75rem}
.section-text{color:var(--text-muted);line-height:1.75;font-size:1.05rem}
.section-text p{margin-bottom:1rem}
.section-text p:last-child{margin-bottom:0}
.section-text strong{color:var(--text);font-weight:600}

.hero{padding:4rem 0 3rem}
@media(max-width:768px){.hero{padding:2.5rem 0 2rem}}

.highlights{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
@media(max-width:600px){.highlights{grid-template-columns:1fr}}
.highlight-card{
  position:relative;
  padding:1.5rem;border-radius:14px;
  background:var(--surface);
  border:1px solid var(--border);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  transition:transform .2s ease, border-color .2s ease, background .2s ease;
}
.highlight-card:hover{
  transform:translateY(-2px);
  border-color:var(--border-strong);
  background:var(--surface-strong);
}
.highlight-card .icon-badge{
  display:inline-flex;align-items:center;justify-content:center;
  width:38px;height:38px;border-radius:10px;
  background:var(--accent-grad-soft);
  border:1px solid var(--border);
  color:var(--accent);
  margin-bottom:1rem;
}
.highlight-card .icon-badge svg{width:18px;height:18px;stroke-width:2}
.highlight-card h3{margin-bottom:0.4rem}
.highlight-card p{font-size:0.98rem;color:var(--text-muted);line-height:1.65}
.highlight-card p strong{color:var(--text)}

.experience-card{
  position:relative;
  padding:1.5rem;border-radius:14px;
  background:var(--surface);
  border:1px solid var(--border);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  margin-bottom:1rem;
  transition:border-color .2s ease, background .2s ease;
}
.experience-card:hover{border-color:var(--border-strong);background:var(--surface-strong)}
.experience-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.25rem}
.experience-header h3{font-size:1.55rem;margin-bottom:0;color:var(--text);letter-spacing:0.05em}
.experience-org{color:var(--text-muted);font-style:italic;font-size:1rem}
.experience-date{
  font-size:0.8rem;color:var(--text-subtle);
  margin-bottom:1rem;display:block;
  text-transform:uppercase;letter-spacing:0.06em;font-weight:500;
}
.experience-card .section-text{font-size:1rem;margin-bottom:1rem}
.experience-card .section-text p{margin-bottom:0.5rem}
.experience-card .section-text ul{padding-left:1.25rem;margin-bottom:0.5rem}
.experience-card .section-text li{margin-bottom:0.35rem;color:var(--text-muted);font-size:1rem}

.tags{display:flex;flex-wrap:wrap;gap:0.4rem}
.tag{
  display:inline-block;padding:0.3rem 0.7rem;border-radius:999px;
  font-size:0.76rem;font-weight:500;letter-spacing:0.01em;
  border:1px solid var(--border-strong);color:var(--text-muted);
  background:transparent;
  transition:color .15s, border-color .15s, background .15s;
}
.tag:hover{
  color:var(--text);
  border-color:transparent;
  background:var(--accent-grad-soft);
}

.social-links{display:flex;gap:0.6rem;margin-top:0.5rem}
.social-link{
  display:flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:10px;
  border:1px solid var(--border);color:var(--text-muted);
  background:var(--surface);
  transition:all .2s ease;
}
.social-link:hover{
  border-color:var(--border-strong);
  color:var(--text);
  background:var(--surface-strong);
  transform:translateY(-1px);
  opacity:1;
}
.social-link svg{width:18px;height:18px;stroke-width:1.8}

.footer{
  padding:2.5rem 1.5rem;border-top:1px solid var(--border);
  margin-top:3rem;text-align:center;
  font-size:0.78rem;color:var(--text-subtle);letter-spacing:0.02em;
}
.footer-meta{margin-top:0.5rem;font-size:0.7rem;color:var(--text-subtle);letter-spacing:0.05em}
.footer-meta-link{
  background:none;border:none;padding:0 0 1px;
  font:inherit;letter-spacing:inherit;cursor:pointer;
  color:var(--text-muted);
  border-bottom:1px dashed var(--border-strong);
  transition:color .15s, border-color .15s;
}
.footer-meta-link:hover{color:var(--text);border-bottom-color:var(--accent);opacity:1}

#ers-modal{
  border:1px solid var(--border-strong);border-radius:14px;
  background:var(--bg-elevated);color:var(--text);
  padding:0;
  width:min(640px, 92vw);
  max-height:85vh;
  overflow:auto;
  /* explicit centering: inset:0 + margin:auto works cross-browser when the
     dialog has a bounded width AND height */
  inset:0;margin:auto;
}
#ers-modal::backdrop{
  background:rgba(0,0,0,0.55);
  backdrop-filter:blur(4px);
  -webkit-backdrop-filter:blur(4px);
}
.ers-modal-inner{padding:2rem 2.25rem 2.25rem;position:relative}
.ers-modal-inner h2{margin-bottom:1.25rem;font-size:2rem}
.ers-modal-inner p{
  color:var(--text-muted);line-height:1.7;
  margin-bottom:1rem;font-size:1rem;
}
.ers-modal-inner p:last-child{margin-bottom:0}
.ers-modal-inner strong{color:var(--text);font-weight:600}
.ers-modal-inner code{
  background:var(--surface-strong);
  padding:0.1rem 0.4rem;border-radius:5px;
  font-size:0.85em;
  font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  color:var(--text);
}
.ers-modal-close{
  position:absolute;top:0.85rem;right:0.95rem;
  background:none;border:none;cursor:pointer;color:var(--text-muted);
  padding:0.4rem;border-radius:8px;line-height:1;
  display:flex;align-items:center;justify-content:center;
  transition:color .15s, background .15s;
}
.ers-modal-close:hover{color:var(--text);background:var(--surface-strong)}
.ers-modal-close svg{width:18px;height:18px}

.markdown-content h1,.markdown-content h2,.markdown-content h3{margin-top:1.5rem;margin-bottom:0.75rem}
.markdown-content ul{padding-left:1.5rem;margin-bottom:1rem}
.markdown-content li{margin-bottom:0.4rem;color:var(--text-muted)}
.markdown-content code{
  background:var(--surface-strong);
  padding:0.15rem 0.45rem;border-radius:5px;
  font-size:0.85em;font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  color:var(--text);
}
.markdown-content strong{color:var(--text);font-weight:600}
.markdown-content a{color:var(--accent);border-bottom:1px solid transparent;transition:border-color .15s}
.markdown-content a:hover{border-bottom-color:var(--accent)}

/* art gallery - css grid masonry; spans set by JS from each item's rendered height
   (which is correct from the start because we set aspect-ratio inline server-side). */
.art-grid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  grid-auto-rows:8px;
  grid-auto-flow:row dense;
  gap:1rem;
  align-content:start;
}
@media(max-width:900px){.art-grid{grid-template-columns:repeat(2, minmax(0, 1fr))}}
@media(max-width:520px){.art-grid{grid-template-columns:1fr}}
.art-item{
  border-radius:12px;overflow:hidden;
  background:var(--surface);border:1px solid var(--border);
  transition:transform .2s ease, border-color .2s ease;
  position:relative;
  cursor:zoom-in;
  /* aspect-ratio is set inline per item; keeps space reserved before JS spans set */
}
.art-item:hover{transform:translateY(-2px);border-color:var(--border-strong)}
.art-item img{
  display:block;width:100%;height:100%;object-fit:cover;
  background:var(--surface-strong);
}
.art-loading{
  text-align:center;padding:2rem 0;
  color:var(--text-subtle);font-size:0.85rem;
  letter-spacing:0.04em;text-transform:uppercase;
}

/* lightbox */
body.lightbox-open{overflow:hidden}
.lightbox{
  position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,0);
  transition:background .35s cubic-bezier(.2,.8,.2,1);
  cursor:zoom-out;
}
.lightbox.open{background:rgba(0,0,0,0.94)}
.lightbox-image{
  position:fixed;
  object-fit:contain;
  margin:0;
  transition:left .4s cubic-bezier(.2,.8,.2,1),
             top .4s cubic-bezier(.2,.8,.2,1),
             width .4s cubic-bezier(.2,.8,.2,1),
             height .4s cubic-bezier(.2,.8,.2,1),
             opacity .18s ease;
  z-index:10000;
  cursor:zoom-out;
  box-shadow:0 30px 80px rgba(0,0,0,0.6);
  border-radius:6px;
  background:#000;
}
.lightbox-image.swapping{opacity:0.25}
.lightbox-btn{
  position:fixed;z-index:10001;
  width:46px;height:46px;border-radius:50%;
  background:rgba(255,255,255,0.10);
  border:1px solid rgba(255,255,255,0.18);
  color:#fff;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  backdrop-filter:blur(12px) saturate(160%);
  -webkit-backdrop-filter:blur(12px) saturate(160%);
  opacity:0;
  transition:opacity .35s ease, background .15s ease, transform .15s ease;
}
.lightbox.open .lightbox-btn{opacity:1}
.lightbox-btn:hover{background:rgba(255,255,255,0.20)}
.lightbox-btn svg{width:20px;height:20px;stroke-width:2}
.lightbox-close{top:20px;right:20px}
.lightbox-prev{left:20px;top:50%;transform:translateY(-50%)}
.lightbox-next{right:20px;top:50%;transform:translateY(-50%)}
.lightbox-prev:hover{transform:translateY(-50%) scale(1.06)}
.lightbox-next:hover{transform:translateY(-50%) scale(1.06)}
@media(max-width:600px){
  .lightbox-prev,.lightbox-next{top:auto;bottom:max(20px, env(safe-area-inset-bottom));transform:none}
  .lightbox-prev{left:calc(50% - 56px)}
  .lightbox-next{right:calc(50% - 56px)}
  .lightbox-prev:hover,.lightbox-next:hover{transform:scale(1.06)}
}
`
