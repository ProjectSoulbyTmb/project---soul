import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-cli-test-'));
}
function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15_000 });
}

test('cli one-shot message awaits an offline Soul reply', () => {
  const result = run([`--data-dir=${tmp()}`, '--i-am-18-or-older', '--message', 'Hello Soul']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /\[object Promise\]/);
  assert.match(result.stdout, /soul> /);
  assert.match(result.stdout, /Soul/i);
});

test('cli snapshot prints JSON profile state', () => {
  const result = run([`--data-dir=${tmp()}`, '--i-am-18-or-older', '--snapshot']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const state = JSON.parse(result.stdout);
  assert.equal(state.profileId, 'default');
  assert.ok(Array.isArray(state.conversations));
});

test('cli help documents message, snapshot, and 18+ confirmation', () => {
  const result = run(['--help']);
  const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /--message/);
  assert.match(result.stdout, /--snapshot/);
  assert.match(result.stdout, /--i-am-18-or-older/);
  assert.match(result.stdout, /18 or older/);
  assert.match(result.stdout, /Soul Consciousness Studios/);
  assert.match(result.stdout, /Source-available, not open source/);
  assert.match(result.stdout, new RegExp(`Eidovara v${version.replace(/\./g, '\\.')}`));
});

test('cli product commands refuse to run without 18+ confirmation', () => {
  const dir = tmp();
  const result = run([`--data-dir=${dir}`, '--message', 'Hello Soul']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /18 or older/);
  assert.equal(fs.existsSync(path.join(dir, 'default.json')), false);
  assert.equal(fs.existsSync(path.join(dir, 'age-gate.json')), false);
});

test('cli persists 18+ confirmation in the data directory', () => {
  const dir = tmp();
  const first = run([`--data-dir=${dir}`, '--i-am-18-or-older', '--snapshot']);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const second = run([`--data-dir=${dir}`, '--snapshot']);
  assert.equal(second.status, 0, second.stderr || second.stdout);
});

test('package.json exposes the cli script', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.cli, 'node src/cli.js');
});

test('cli help does not create a profile directory', () => {
  const dir = path.join(os.tmpdir(), `soul-cli-help-${process.pid}-${Date.now()}`);
  const result = run([`--data-dir=${dir}`, '--help']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(dir), false);
});

test('cli empty --message exits with an error', () => {
  const result = run([`--data-dir=${tmp()}`, '--i-am-18-or-older', '--message', '']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /empty/i);
});
