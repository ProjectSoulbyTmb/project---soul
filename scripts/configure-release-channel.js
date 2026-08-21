// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';

const repository = String(process.argv[2] || process.env.GITHUB_REPOSITORY || '').trim();
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Pass the GitHub repository as owner/name.');
const [owner, repo] = repository.split('/');
const manifest = `https://github.com/${repository}/releases/latest/download/update.json`;
const latestYml = `https://github.com/${repository}/releases/latest/download/latest.yml`;
fs.writeFileSync('src/config/release-channel.js', `// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
export const RELEASE_OWNER = ${JSON.stringify(owner)};
export const RELEASE_REPO = ${JSON.stringify(repo)};
export const GITHUB_PUBLISH = { provider: 'github', owner: RELEASE_OWNER, repo: RELEASE_REPO, private: false };
export const RELEASE_MANIFEST_URL = ${JSON.stringify(manifest)};
export const RELEASE_LATEST_YML_URL = ${JSON.stringify(latestYml)};
`, 'utf8');
console.log(`Release channel configured: ${manifest}`);
