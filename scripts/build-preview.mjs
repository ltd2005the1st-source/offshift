// Builds the browser preview: the Expo web export inlined into one app.html,
// next to the iPhone frame page (preview/index.html).
//
//   npx expo export -p web && node scripts/build-preview.mjs
//
// Output: preview-dist/index.html (frame) and preview-dist/app.html (the app).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'preview-dist');
mkdirSync(out, { recursive: true });

let html = readFileSync(join(dist, 'index.html'), 'utf8');
const m = html.match(/<script src="([^"]+)" defer><\/script>/);
if (!m) throw new Error('No bundle script found in dist/index.html');
const js = readFileSync(join(dist, m[1]), 'utf8').replace(/<\/script/gi, '<\\/script');

// The router reads the page path. Inside the preview the app lives at
// .../app.html, so reset the path to "/" (keeping ?frame=1) before it boots.
const boot = `<script>try{history.replaceState(null,'','/'+location.search)}catch(e){}</script>`;
html = html
  .replace(m[0], () => `${boot}\n<script>${js}</script>`)
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace('<title>Offshift</title>', '<title>Offshift</title>\n<style>html,body{background:#0D0F15}</style>');

writeFileSync(join(out, 'app.html'), html);
copyFileSync(join(root, 'preview', 'index.html'), join(out, 'index.html'));
console.log(`preview-dist/app.html ${(html.length / 1024 / 1024).toFixed(2)} MB`);
