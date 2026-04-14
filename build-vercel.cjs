const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '.vercel/output');

// 1. Build frontend with vite (outputs to dist/public per vite.config.ts)
execSync('npx vite build', { stdio: 'inherit' });

// Copy frontend build into .vercel/output/static
const staticDir = path.join(outputDir, 'static');
fs.mkdirSync(staticDir, { recursive: true });
execSync(`cp -r dist/public/* ${staticDir}/`, { stdio: 'inherit' });

// 2. Bundle API with esbuild into the function directory (ESM format)
const funcDir = path.join(outputDir, 'functions/api/index.func');
fs.mkdirSync(funcDir, { recursive: true });
execSync(
  `npx esbuild api/index.src.ts --bundle --platform=node --target=node18 --format=esm --outfile=${funcDir}/index.mjs --external:pg-native --banner:js='import { createRequire } from "module"; const require = createRequire(import.meta.url);'`,
  { stdio: 'inherit' }
);

// 3. Write function config (ESM handler)
fs.writeFileSync(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs18.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
    },
    null,
    2
  )
);

// 4. Write output config with routes
fs.writeFileSync(
  path.join(outputDir, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: '/api/index' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2
  )
);

console.log('Vercel Build Output API build complete!');
