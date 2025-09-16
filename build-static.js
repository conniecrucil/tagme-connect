#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';

console.log('Building static client-only version...');

// Create dist directory
const distDir = 'dist';
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy public files
if (existsSync('public')) {
  cpSync('public', distDir, { recursive: true });
}

// Copy build/client files to dist if they exist
if (existsSync('build/client')) {
  cpSync('build/client', distDir, { recursive: true });
  console.log('Copied build/client files to dist/');
} else {
  console.log('No build/client directory found. Creating minimal static build...');
}

// Create a simple index.html for SPA
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SmartVCard</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app/root.tsx"></script>
  </body>
</html>`;

import { writeFileSync } from 'fs';
writeFileSync(join(distDir, 'index.html'), indexHtml);

console.log('Static build completed! Files are in the dist/ directory.');
console.log('You can serve the dist/ directory with any static file server.');
console.log('To test locally, you can run: npx serve dist/');
