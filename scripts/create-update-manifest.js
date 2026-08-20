import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const name = `Project-Soul-Alpha-${pkg.version}-Windows-x64-Setup.exe`;
const file = path.join('dist', name);
if (!fs.existsSync(file)) throw new Error(`Missing release installer: ${file}`);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const repository = String(process.env.GITHUB_REPOSITORY || process.argv[2] || '').trim();
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('GitHub repository owner/name is required.');
const manifest = { version: pkg.version, url: `https://github.com/${repository}/releases/download/v${pkg.version}/${name}`, sha256, notes: `Project Soul Alpha ${pkg.version}` };
fs.writeFileSync(path.join('dist', 'update.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
