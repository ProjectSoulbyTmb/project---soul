import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { INSTALLER_SHA256 } from '../src/core/release.js';

const read = file => fs.readFileSync(file, 'utf8');
const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();

const MASTERS = {
  'assets/branding/eidovara-master.png': '5A7212D56125512565A56DCEA0D126AEC411248092A5E5BE53A2C3ED77D2D757',
  'assets/branding/eidovara-512.png': '3020E06EC0698875577D98B1E17A799608639458B985E7CBE2FFC927CD5584C9',
  'assets/branding/eidovara.ico': 'BB50C63CF8BBBFF07972742D26328180AF0154E534A39B0D7DF2F8AD8190841C',
  'assets/branding/soul-consciousness-studios-master.png': 'A5702E3187545FA3BF28CAD544805986D6ED887D60F4161CF67BF462E25E0413',
  'assets/branding/soul-consciousness-studios-512.png': 'F725D326E091C08D25785F360550A613A356087B07E0D20418741F3D0EB28857'
};

const WEBSITE = {
  'docs/eidovara-mark.png': { minW: 2048, minH: 2048, kind: 'png' },
  'docs/soul-consciousness-studios-mark.png': { minW: 2048, minH: 2048, kind: 'png' },
  'docs/eidovara-wallpaper-dark.jpg': { width: 2560, height: 1440, kind: 'jpeg' },
  'docs/eidovara-wallpaper-light.jpg': { width: 2560, height: 1440, kind: 'jpeg' },
  'docs/eidovara-wallpaper-product.jpg': { width: 2560, height: 1440, kind: 'jpeg' },
  'docs/eidovara-og.png': { width: 1200, height: 630, kind: 'png' }
};

function imageSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), kind: 'png' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const size = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc2) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5), kind: 'jpeg' };
      }
      i += 2 + size;
    }
    throw new Error(`no JPEG SOF in ${file}`);
  }
  throw new Error(`unknown image ${file}`);
}

function registerHashes() {
  const md = read('docs/COPYRIGHT_ASSET_REGISTER.md');
  const rows = [...md.matchAll(/\| `([^`]+)` \| [^|\n]+ \| `([A-F0-9]{64})` \|/g)];
  assert.ok(rows.length >= 11, rows.length);
  const map = new Map();
  for (const [, asset, hash] of rows) {
    assert.equal(map.has(asset), false, `duplicate register row ${asset}`);
    map.set(asset, hash);
  }
  return map;
}

test('website brand assets exist at required resolution and match the copyright register', () => {
  const register = registerHashes();
  for (const [file, spec] of Object.entries(WEBSITE)) {
    assert.equal(fs.existsSync(file), true, file);
    const size = imageSize(file);
    assert.equal(size.kind, spec.kind, file);
    if (spec.minW) {
      assert.ok(size.width >= spec.minW, `${file} width ${size.width}`);
      assert.ok(size.height >= spec.minH, `${file} height ${size.height}`);
    } else {
      assert.equal(size.width, spec.width, file);
      assert.equal(size.height, spec.height, file);
    }
    assert.equal(register.get(file), sha256(file), file);
  }
  for (const leftover of [
    'docs/eidovara-mark.jpg',
    'docs/soul-consciousness-studios-mark.jpg',
    'docs/eidovara-mark-512.png',
    'docs/soul-consciousness-studios-mark-512.png'
  ]) {
    assert.equal(fs.existsSync(leftover), false, leftover);
  }
});

test('registered application masters and 512 favicon copies stay unchanged', () => {
  const register = registerHashes();
  for (const [file, hash] of Object.entries(MASTERS)) {
    assert.equal(register.get(file), hash, file);
    assert.equal(sha256(file), hash, file);
  }
  assert.equal(sha256('docs/eidovara-icon.png'), MASTERS['assets/branding/eidovara-512.png']);
  assert.equal(sha256('docs/soul-consciousness-studios-icon.png'), MASTERS['assets/branding/soul-consciousness-studios-512.png']);
});

test('public site wires display marks, wallpapers, and OG image without CSP or token drift', () => {
  const brand = read('docs/brand.css');
  assert.match(brand, /\.hero-mark\s*\{/);
  assert.match(brand, /\.studio-mark\s*\{/);
  assert.match(brand, /\.brand-stage\s*\{/);
  assert.match(brand, /data-page="home"/);
  assert.match(brand, /data-page="product"/);
  assert.match(brand, /data-page="download"/);
  assert.ok(fs.existsSync('docs/eidovara-wallpaper-light.jpg'), 'wallpaper asset must ship');
  assert.ok(fs.existsSync('docs/eidovara-wallpaper-dark.jpg'), 'wallpaper asset must ship');
  assert.doesNotMatch(brand, /unsafe-inline|unsafe-eval/);

  const home = read('docs/index.html');
  assert.match(home, /class="hero-mark"/);
  assert.match(home, /src="eidovara-mark\.png"/);
  assert.match(home, /src="soul-consciousness-studios-mark\.png"/);
  assert.match(home, /href="download\.html"/);
  assert.doesNotMatch(home, /class="primary[^"]*"[^>]*href="[^"]+\.exe"/);

  const product = read('docs/product.html');
  assert.match(product, /eidovara-mark\.png/);

  const download = read('docs/download.html');
  assert.match(download, /eidovara-mark\.png/);
  assert.match(download, /id="ageConfirm"/);
  if (INSTALLER_SHA256) assert.match(download, new RegExp(INSTALLER_SHA256));
  else assert.match(download, /SHA256SUMS\.txt/);

  const htmlFiles = fs.readdirSync('docs').filter(name => name.endsWith('.html')).map(name => path.join('docs', name));
  assert.ok(htmlFiles.length >= 14, htmlFiles.length);
  for (const file of htmlFiles) {
if (file.endsWith('offline.html') || file.endsWith('500.html')) continue; // utility pages
    const html = read(file);
    assert.match(html, /property="og:image" content="https:\/\/eidovara\.org\/eidovara-og\.png"/, file);
    assert.doesNotMatch(html, /property="og:image" content="https:\/\/eidovara\.org\/eidovara-icon\.png"/, file);
    assert.match(html, /rel="icon"[^>]*href="eidovara-icon\.png"/, file);
    assert.match(html, /img-src 'self'/, file);
    assert.match(html, /script-src 'self'/, file);
    if (!file.endsWith('404.html') && !file.endsWith('index.html')) assert.doesNotMatch(html, /unsafe-inline|unsafe-eval/, file); // legacy inline handlers pending migration
  }
  assert.match(read('docs/_headers'), /img-src 'self'/);
  assert.match(read('docs/_headers'), /script-src 'self'/);
  assert.equal(read('docs/tokens.css'), read('src/renderer/tokens.css'));
  assert.match(read('docs/BRAND_GUIDE.md'), /website display marks/i);
  assert.match(read('docs/BRAND_GUIDE.md'), /wallpapers/);
  const logos = read('docs/BRAND_GUIDE.md').split('## Logos')[1].split('## Voice')[0];
  assert.doesNotMatch(logos, /®/);
  assert.doesNotMatch(read('docs/index.html'), /®/);
  assert.match(read('CHANGELOG.md'), /website display marks/);
  assert.match(read('CHANGELOG.md'), /72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8/);
  assert.doesNotMatch(read('docs/legal.html'), /eidovara-wallpaper-/);
  assert.doesNotMatch(read('docs/index.html'), /Adult Soul/);
});
