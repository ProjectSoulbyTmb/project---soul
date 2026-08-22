// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Deterministic minimal SPDX licenses document for CI.
 * Usage: node scripts/ci-spdx.mjs [output-path]
 */
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'sbom/spdx-licenses.json';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const doc = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: `Eidovara-${pkg.version}`,
  documentNamespace: `https://eidovara.org/spdx/eidovara-${pkg.version}`,
  creationInfo: { created: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), creators: ['Organization: Soul Consciousness Studios'] },
  packages: [
    {
      name: pkg.name,
      version: pkg.version,
      SPDXID: 'SPDXRef-Package-eidovara',
      licenseConcluded: 'LicenseRef-Eidovara-Source-Available-1.0',
      copyrightText: 'Copyright (c) 2026 Soul Consciousness Studios',
      filesAnalyzed: false,
    },
  ],
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`[ci-spdx] wrote ${out}`);
