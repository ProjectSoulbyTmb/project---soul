#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SoulEngine } from './core/engine.js';
import { JsonStore } from './core/store.js';

function argValue(name) {
  const prefixed = args.find(a => a.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return undefined;
}

const args = process.argv.slice(2);
const profile = argValue('--profile') || 'default';
const dataDir = argValue('--data-dir');
const message = argValue('--message');
const engine = new SoulEngine({ store: new JsonStore({ profileId: profile, dataDir }) });

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Eidovara v0.18.0 CLI

Usage:
  node src/cli.js [--profile=name] [--data-dir=path]
  node src/cli.js --snapshot [--profile=name] [--data-dir=path]
  node src/cli.js --message "Hello Soul" [--profile=name] [--data-dir=path]

Commands in interactive mode: /exit, /reset`);
  process.exit(0);
}

if (args.includes('--snapshot')) {
  console.log(JSON.stringify(engine.snapshot(), null, 2));
  process.exit(0);
}

async function replyTo(text) {
  const res = await engine.respond(text);
  console.log(`soul> ${res.reply}`);
  return res;
}

if (message !== undefined) {
  await replyTo(message);
  process.exit(0);
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
