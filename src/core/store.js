import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defaultProfile, migrateProfile } from './schema.js';

export class JsonStore {
  constructor({ dataDir, profileId = 'default' } = {}) {
    this.dataDir = dataDir || path.join(os.homedir(), '.project-soul');
    this.profileId = sanitize(profileId);
    this.filePath = path.join(this.dataDir, `${this.profileId}.json`);
    this.backupDir = path.join(this.dataDir, 'backups');
  }
  load() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    if (!fs.existsSync(this.filePath)) { const state = defaultProfile(this.profileId); this.save(state); return state; }
    try {
      const state = migrateProfile(JSON.parse(fs.readFileSync(this.filePath, 'utf8')), this.profileId);
      this.save(state); return state;
    } catch (err) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backup = `${this.filePath}.corrupt-${stamp}.bak`;
      try { fs.copyFileSync(this.filePath, backup); } catch {}
      const state = defaultProfile(this.profileId);
      state.audit.push({ at: new Date().toISOString(), type: 'storage.recovered_from_corrupt_state', details: { backup: path.basename(backup), error: String(err?.message || err) } });
      this.save(state); return state;
    }
  }
  save(state) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    state.updatedAt = new Date().toISOString();
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
    try { fs.renameSync(tmp, this.filePath); }
    catch { try { fs.rmSync(this.filePath, { force: true }); } catch {} fs.renameSync(tmp, this.filePath); }
  }
  reset() { const state = defaultProfile(this.profileId); this.save(state); return state; }
  createBackup(state) {
    fs.mkdirSync(this.backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `${this.profileId}-${stamp}.json`;
    const target = path.join(this.backupDir, name);
    const payload = migrateProfile(state || this.load(), this.profileId);
    fs.writeFileSync(target, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    return { name, createdAt: payload.updatedAt, bytes: fs.statSync(target).size };
  }
  listBackups() {
    fs.mkdirSync(this.backupDir, { recursive: true });
    return fs.readdirSync(this.backupDir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.startsWith(`${this.profileId}-`) && e.name.endsWith('.json'))
      .map(e => { const stat = fs.statSync(path.join(this.backupDir, e.name)); return { name: e.name, createdAt: stat.mtime.toISOString(), bytes: stat.size }; })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  restoreBackup(name) {
    const safeName = path.basename(String(name || ''));
    if (safeName !== name || !safeName.startsWith(`${this.profileId}-`) || !safeName.endsWith('.json')) throw new Error('Invalid backup name.');
    const restored = migrateProfile(JSON.parse(fs.readFileSync(path.join(this.backupDir, safeName), 'utf8')), this.profileId);
    restored.audit.push({ at: new Date().toISOString(), type: 'storage.backup_restored', details: { name: safeName } });
    this.save(restored); return restored;
  }
}
function sanitize(value) { return String(value || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'default'; }
