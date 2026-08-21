// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';

const repository = String(process.argv[2] || process.env.GITHUB_REPOSITORY || '').trim();
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Pass the GitHub repository as owner/name.');
const url = `https://github.com/${repository}/releases/latest/download/update.json`;
fs.writeFileSync('src/config/release-channel.js', `export const RELEASE_MANIFEST_URL = ${JSON.stringify(url)};\n`, 'utf8');
console.log(`Release channel configured: ${url}`);
