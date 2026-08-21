#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SoulEngine } from './core/engine.js';
import { JsonStore } from './core/store.js';

const args = process.argv.slice(2);
const profile = args.find(a => a.startsWith('--profile='))?.split('=')[1] || 'default';
const dataDir = args.find(a => a.startsWith('--data-dir='))?.split('=')[1];
const engine = new SoulEngine({ store: new JsonStore({ profileId: profile, dataDir }) });

if (args.includes('--snapshot')) {
  console.log(JSON.stringify(engine.snapshot(), null, 2));
  process.exit(0);
}

console.log('Eidovara v0.17.4 CLI. Type /exit to quit, /reset to reset profile.');
const rl = readline.createInterface({ input, output });
while (true) {
  const line = await rl.question('you> ');
  if (line.trim() === '/exit') break;
  if (line.trim() === '/reset') {
    engine.reset();
    console.log('soul> profile reset');
    continue;
  }
  const res = engine.respond(line);
  console.log(`soul> ${res.reply}`);
}
rl.close();
