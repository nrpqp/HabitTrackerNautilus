/* Ensambla cada parts/*.part.html en un HTML autocontenido en prototypes/.
   Autocontenido a propósito: las maquetas se abren con file:// sin servidor,
   se pueden mandar por chat y sobreviven fuera del repo.

   Uso:  node prototypes/assemble.js
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const parts = join(here, 'parts');

const coreCSS = readFileSync(join(parts, 'core.css'), 'utf8');
const coreJS = readFileSync(join(parts, 'core.js'), 'utf8');

const files = readdirSync(parts).filter(f => f.endsWith('.part.html')).sort();

for (const f of files) {
  const raw = readFileSync(join(parts, f), 'utf8');
  const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) { console.error(`✗ ${f}: falta la cabecera JSON`); process.exit(1); }
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length);
  const out = `<!doctype html>
<html lang="es" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${meta.title}${meta.title.includes('Nautilus FX Lab') ? '' : ' · Nautilus FX Lab'}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${encodeURIComponent(meta.favicon || '🌀')}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
${coreCSS}
</style>
<script>
${coreJS}
</script>
</head>
<body>
${body}
</body>
</html>
`;
  const name = meta.file || f.replace('.part.html', '.html');
  writeFileSync(join(here, name), out, 'utf8');
  console.log(`✓ ${name}  (${(out.length / 1024).toFixed(0)} KB)`);
}
console.log(`\n${files.length} maquetas ensambladas en ${here}`);
