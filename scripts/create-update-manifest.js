import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const name = `Eidovara-${pkg.version}-Windows-x64-Setup.exe`;
if (!fs.existsSync(path.join('dist', name))) throw new Error(`Missing Windows installer: ${name}`);
const file = path.join('dist', name);
const bytes = fs.readFileSync(file);
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const sha512 = crypto.createHash('sha512').update(bytes).digest('base64');
const size = bytes.length;
const repository = String(process.env.GITHUB_REPOSITORY || process.argv[2] || '').trim();
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('GitHub repository owner/name is required.');
const manifest = { version: pkg.version, url: `https://github.com/${repository}/releases/download/v${pkg.version}/${name}`, sha256, packageType: 'installer', notes: `Eidovara ${pkg.version} Windows installer` };
fs.writeFileSync(path.join('dist', 'update.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const latestYml = [
  `version: ${pkg.version}`,
  'files:',
  `  - url: ${name}`,
  `    sha512: ${sha512}`,
  `    size: ${size}`,
  `path: ${name}`,
  `sha512: ${sha512}`,
  `releaseDate: '${new Date().toISOString()}'`,
  ''
].join('\n');
fs.writeFileSync(path.join('dist', 'latest.yml'), latestYml, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
console.log(`Wrote dist/latest.yml for electron-updater (${name}, ${size} bytes).`);
