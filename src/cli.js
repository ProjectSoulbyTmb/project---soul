#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SoulEngine } from './core/engine.js';
import { JsonStore } from './core/store.js';

const args = process.argv.slice(2);

function argValue(name) {
  const prefixed = args.find(a => a.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] !== undefined && !String(args[index + 1]).startsWith('--')) return args[index + 1];
  return undefined;
}

const HELP = `Eidovara v0.18.0 CLI

Restricted to users 18 or older. Source-available, not open source.
Official advertised product: unsigned Windows 10/11 x64 desktop software.
Pass --i-am-18-or-older to confirm age and accept TERMS.md. Confirmation is
stored in the data directory and is not independent age verification.

Usage:
  node src/cli.js --i-am-18-or-older [--profile=name] [--data-dir=path]
  node src/cli.js --i-am-18-or-older --snapshot [--profile=name] [--data-dir=path]
  node src/cli.js --i-am-18-or-older --message "Hello Soul" [--profile=name] [--data-dir=path]

Commands in interactive mode: /exit, /reset`;

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}

const profile = argValue('--profile') || 'default';
const dataDir = argValue('--data-dir');
const message = argValue('--message');
const engine = new SoulEngine({ store: new JsonStore({ profileId: profile, dataDir }) });
const ageGatePath = path.join(engine.store.dataDir, 'age-gate.json');

function ageGateAccepted() {
  try { return JSON.parse(fs.readFileSync(ageGatePath, 'utf8')).accepted === true; } catch { return false; }
}

function persistAgeGate() {
  fs.mkdirSync(engine.store.dataDir, { recursive: true });
  fs.writeFileSync(ageGatePath, `${JSON.stringify({ accepted: true, at: new Date().toISOString(), statement: '18+' }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

if (!ageGateAccepted()) {
  if (!args.includes('--i-am-18-or-older')) {
    console.error('Eidovara is restricted to users age 18 or older. Pass --i-am-18-or-older to confirm you are 18+ and accept TERMS.md, or use --help.');
    process.exit(2);
  }
  persistAgeGate();
}

async function replyTo(text) {
  const res = await engine.respond(text);
  console.log(`soul> ${res.reply}`);
  return res;
}

if (args.includes('--snapshot')) {
  console.log(JSON.stringify(engine.snapshot(), null, 2));
  process.exit(0);
}

if (message !== undefined) {
  try {
    await replyTo(message);
    process.exit(0);
  } catch (err) {
    console.error(`soul> ${err?.message || err}`);
    process.exit(1);
  }
}

console.log('Eidovara v0.18.0 CLI. Type /exit to quit, /reset to reset profile.');
const rl = readline.createInterface({ input, output });
while (true) {
  const line = await rl.question('you> ');
  const text = line.trim();
  if (!text) continue;
  if (text === '/exit') break;
  if (text === '/reset') {
    engine.reset();
    console.log('soul> profile reset');
    continue;
  }
  try {
    await replyTo(text);
  } catch (err) {
    console.error(`soul> ${err?.message || err}`);
  }
}
rl.close();
