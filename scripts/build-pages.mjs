import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('?? Building JobMatch AI for GitHub Pages...');

const apiDir = path.resolve('app/api');
const apiBackup = path.resolve('app/_api_backup');

let moved = false;
try {
  // 1. Temporarily relocate app/api so static export doesn't fail on Route Handlers
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiBackup);
    moved = true;
    console.log('?? Relocated API routes for static export');
  }

  // 2. Run Next.js build with static export flags
  console.log('?? Compiling static export with basePath: /jobmatch-ai ...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      OUTPUT_EXPORT: 'true',
      GITHUB_ACTIONS: 'true',
    },
  });

  // 3. Create 404.html SPA fallback
  const outDir = path.resolve('out');
  const indexHtml = path.join(outDir, 'index.html');
  const fallbackHtml = path.join(outDir, '404.html');

  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, fallbackHtml);
    console.log('?? Created out/404.html SPA fallback for GitHub Pages');
  }

  // 4. Create .nojekyll so GitHub Pages does not ignore underscore files
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  console.log('? Created out/.nojekyll');

  console.log('? GitHub Pages build complete in out/');
} catch (err) {
  console.error('? Build failed:', err);
  process.exit(1);
} finally {
  // Always restore app/api
  if (moved && fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
    console.log('?? Restored app/api');
  }
}
