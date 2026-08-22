// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defaultProfile, migrateProfile } from './schema.js';
import { migrateAdultSoul } from './adult-soul.js';
import { migrateAdultEntertainment } from './adult-media.js';

function hydrateAdult(state) {
  if (!state || typeof state !== 'object') return state;
  state.adultSoul = migrateAdultSoul(state.adultSoul);
  state.entertainment =
    state.entertainment && typeof state.entertainment === 'object'
      ? state.entertainment
      : { favorites: [], history: [], taste: {} };
  state.entertainment.adult = migrateAdultEntertainment(state.entertainment.adult);
  return state;
}

export class JsonStore {
  constructor({ dataDir, profileId = 'default', codec } = {}) {
    this.dataDir = dataDir || path.join(os.homedir(), '.project-soul');
    this.profileId = sanitize(profileId);
    this.filePath = path.join(this.dataDir, `${this.profileId}.json`);
    this.backupDir = path.join(this.dataDir, 'backups');
    this.codec = codec || { encode: value => value, decode: value => value, encrypted: false };
  }
  load() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    try {
      for (const stale of fs.readdirSync(this.dataDir))
        if (stale.startsWith(`${this.profileId}.json.`) && stale.endsWith('.tmp'))
          fs.rmSync(path.join(this.dataDir, stale), { force: true });
    } catch {}
    if (!fs.existsSync(this.filePath)) {
      const state = hydrateAdult(defaultProfile(this.profileId));
      this.save(state);
      return state;
    }
    try {
      const state = hydrateAdult(
        migrateProfile(
          JSON.parse(this.codec.decode(fs.readFileSync(this.filePath, 'utf8'))),
          this.profileId
        )
      );
      this.save(state);
      return state;
    } catch (err) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backup = `${this.filePath}.corrupt-${stamp}.bak`;
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        fs.writeFileSync(backup, this.codec.encode(this.codec.decode(raw)), {
          encoding: 'utf8',
          mode: 0o600,
        });
      } catch {}
      const state = hydrateAdult(defaultProfile(this.profileId));
      state.audit.push({
        at: new Date().toISOString(),
        type: 'storage.recovered_from_corrupt_state',
        details: { backup: path.basename(backup), error: String(err?.message || err) },
      });
      this.save(state);
      return state;
    }
  }
  save(state) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    state.updatedAt = new Date().toISOString();
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, this.codec.encode(JSON.stringify(state, null, 2)), {
      encoding: 'utf8',
      mode: 0o600,
    });
    const previous = `${this.filePath}.previous`;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        fs.writeFileSync(previous, this.codec.encode(this.codec.decode(raw)), {
          encoding: 'utf8',
          mode: 0o600,
        });
      }
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      try {
        fs.rmSync(this.filePath, { force: true });
        fs.renameSync(tmp, this.filePath);
      } catch (inner) {
        if (fs.existsSync(previous)) fs.copyFileSync(previous, this.filePath);
        throw inner;
      }
    }
  }
  reset() {
    const state = hydrateAdult(defaultProfile(this.profileId));
    this.save(state);
    return state;
  }
  createBackup(state) {
    fs.mkdirSync(this.backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `${this.profileId}-${stamp}.${this.codec.encrypted ? 'soulbackup' : 'json'}`;
    const target = path.join(this.backupDir, name);
    const payload = hydrateAdult(migrateProfile(state || this.load(), this.profileId));
    fs.writeFileSync(target, this.codec.encode(JSON.stringify(payload, null, 2)), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
    return { name, createdAt: payload.updatedAt, bytes: fs.statSync(target).size };
  }
  listBackups() {
    fs.mkdirSync(this.backupDir, { recursive: true });
    return fs
      .readdirSync(this.backupDir, { withFileTypes: true })
      .filter(
        e =>
          e.isFile() &&
          e.name.startsWith(`${this.profileId}-`) &&
          (e.name.endsWith('.json') || e.name.endsWith('.soulbackup'))
      )
      .map(e => {
        const stat = fs.statSync(path.join(this.backupDir, e.name));
        return { name: e.name, createdAt: stat.mtime.toISOString(), bytes: stat.size };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  restoreBackup(name) {
    const safeName = path.basename(String(name || ''));
    if (
      safeName !== name ||
      !safeName.startsWith(`${this.profileId}-`) ||
      (!safeName.endsWith('.json') && !safeName.endsWith('.soulbackup'))
    )
      throw new Error('Invalid backup name.');
    const restored = hydrateAdult(
      migrateProfile(
        JSON.parse(this.codec.decode(fs.readFileSync(path.join(this.backupDir, safeName), 'utf8'))),
        this.profileId
      )
    );
    restored.audit.push({
      at: new Date().toISOString(),
      type: 'storage.backup_restored',
      details: { name: safeName },
    });
    this.save(restored);
    return restored;
  }
}
function sanitize(value) {
  return (
    String(value || 'default')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64) || 'default'
  );
}
