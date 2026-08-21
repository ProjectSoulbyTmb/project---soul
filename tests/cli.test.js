import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-cli-test-')); }
function run(args, extra = {}) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15_000, ...extra });
}

test('cli one-shot message returns an offline Soul reply', () => {
  const result = run([`--data-dir=${tmp()}`, '--message', 'Hello Soul']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /\[object Promise\]/);
  assert.match(result.stdout, /soul> /);
  assert.match(result.stdout, /Soul/i);
});

test('cli snapshot prints JSON profile state', () => {
  const result = run([`--data-dir=${tmp()}`, '--snapshot']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const state = JSON.parse(result.stdout);
  assert.equal(state.profileId, 'default');
  assert.ok(Array.isArray(state.conversations));
});

test('package.json exposes the cli script used by launchers', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.cli, 'node src/cli.js');
});
