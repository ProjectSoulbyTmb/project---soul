import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['src', 'scripts', 'tests', 'server'];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:js|cjs)$/.test(entry.name) && full !== path.join('scripts', 'check.js')) files.push(full);
  }
}
for (const root of roots) walk(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax check OK (${files.length} files)`);
