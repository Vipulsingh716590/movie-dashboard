// Packs the demo build (dist/demo-build/browser) into ONE self-contained page so it can be hosted anywhere that serves
// a single file (no extra files, no API). Lazy route chunks are merged into the script.
//   dist/demo/index.html     full document, for static hosts such as Netlify
//   dist/demo/artifact.html  fragment without <html>/<head>, for hosts that add their own page skeleton
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const src = 'dist/demo-build/browser';
const { outputFiles } = await build({
  entryPoints: [`${src}/main.js`],
  bundle: true,
  splitting: false,
  format: 'iife',
  minify: true,
  write: false,
  logLevel: 'error'
});

const js = outputFiles[0].text.replaceAll('</script', '<\\/script');
const css = readFileSync(`${src}/styles.css`, 'utf8');
const polyfills = readFileSync(`${src}/polyfills.js`, 'utf8').replaceAll('</script', '<\\/script');

const body = `<style>:root{color-scheme:dark}${css}</style>
<app-root></app-root>
<script>${polyfills}</script>
<script>${js}</script>
`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MovieFlix Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Demo of the MovieFlix admin dashboard, running on sample data in your browser.">
<meta name="theme-color" content="#141414">
</head>
<body>
${body}</body>
</html>
`;

mkdirSync('dist/demo', { recursive: true });
writeFileSync('dist/demo/index.html', page);
writeFileSync('dist/demo/artifact.html', `<title>MovieFlix Dashboard</title>\n${body}`);
console.log(`dist/demo/index.html  ${(page.length / 1024).toFixed(0)} kB`);
