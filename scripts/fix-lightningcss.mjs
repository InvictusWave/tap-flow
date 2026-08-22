import { existsSync, cpSync, renameSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function ensureBoth(baseDir) {
  const arm64Dir = join(baseDir, 'lightningcss-darwin-arm64');
  const x64Dir = join(baseDir, 'lightningcss-darwin-x64');

  if (existsSync(arm64Dir) && !existsSync(x64Dir)) {
    cpSync(arm64Dir, x64Dir, { recursive: true });
    const oldNode = join(x64Dir, 'lightningcss.darwin-arm64.node');
    const newNode = join(x64Dir, 'lightningcss.darwin-x64.node');
    if (existsSync(oldNode)) renameSync(oldNode, newNode);
    const pPath = join(x64Dir, 'package.json');
    if (existsSync(pPath)) {
      const p = JSON.parse(readFileSync(pPath, 'utf8'));
      p.name = 'lightningcss-darwin-x64';
      p.cpu = ['x64'];
      writeFileSync(pPath, JSON.stringify(p, null, 2));
    }
  } else if (existsSync(x64Dir) && !existsSync(arm64Dir)) {
    cpSync(x64Dir, arm64Dir, { recursive: true });
    const oldNode = join(arm64Dir, 'lightningcss.darwin-x64.node');
    const newNode = join(arm64Dir, 'lightningcss.darwin-arm64.node');
    if (existsSync(oldNode)) renameSync(oldNode, newNode);
    const pPath = join(arm64Dir, 'package.json');
    if (existsSync(pPath)) {
      const p = JSON.parse(readFileSync(pPath, 'utf8'));
      p.name = 'lightningcss-darwin-arm64';
      p.cpu = ['arm64'];
      writeFileSync(pPath, JSON.stringify(p, null, 2));
    }
  }
}

ensureBoth(join(process.cwd(), 'node_modules'));
ensureBoth(join(process.cwd(), 'node_modules/@tailwindcss/node/node_modules'));
console.log('✅ Synchronized lightningcss platform packages');
