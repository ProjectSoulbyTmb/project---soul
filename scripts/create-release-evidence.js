import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const names = fs.readdirSync('dist').filter(name => /\.(?:exe|zip|json)$/i.test(name) && (name.startsWith('Eidovara-') || name === 'update.json')).sort();
if (!names.some(name => /Setup\.exe$/i.test(name))) throw new Error('The Windows setup installer is missing.');
const files = names.map(name => { const data = fs.readFileSync(path.join('dist', name)); return { name, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex').toUpperCase() }; });
fs.writeFileSync(path.join('dist', 'SHA256SUMS.txt'), `${files.map(f => `${f.sha256}  ${f.name}`).join('\n')}\n`, 'utf8');
const namespace = `https://github.com/${process.env.GITHUB_REPOSITORY || 'ProjectSoulbyTmb/project---soul'}/releases/tag/v${pkg.version}`;
const sbom = { spdxVersion: 'SPDX-2.3', dataLicense: 'CC0-1.0', SPDXID: 'SPDXRef-DOCUMENT', name: `Eidovara ${pkg.version}`, documentNamespace: namespace, creationInfo: { created: new Date().toISOString(), creators: ['Tool: Eidovara-release-evidence'] }, packages: [{ name: pkg.name, SPDXID: 'SPDXRef-Package', versionInfo: pkg.version, downloadLocation: 'NOASSERTION', filesAnalyzed: true, licenseConcluded: 'LicenseRef-Eidovara-Source-Available-1.0', licenseDeclared: 'LicenseRef-Eidovara-Source-Available-1.0', copyrightText: 'Copyright (c) 2026 Tyler Michael Bosworth. All rights reserved.' }], files: files.map((f,i)=>({fileName:f.name,SPDXID:`SPDXRef-File-${i+1}`,checksums:[{algorithm:'SHA256',checksumValue:f.sha256}]})), relationships: files.map((_,i)=>({spdxElementId:'SPDXRef-Package',relationshipType:'CONTAINS',relatedSpdxElement:`SPDXRef-File-${i+1}`})) };
fs.writeFileSync(path.join('dist', 'SBOM.spdx.json'), `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join('dist', 'CODE-SIGNING-STATUS.txt'), `Eidovara ${pkg.version}\n\nAuthenticode: unsigned; no valid local Windows code-signing identity was available.\nBuild provenance: signed by GitHub Actions through Sigstore and published in the repository attestations.\nIntegrity: verify SHA256SUMS.txt and the GitHub attestation before installation.\nPrivate keys and private certificates are never included in release assets.\n`, 'utf8');
const privacy = { schemaVersion: 1, product: 'Eidovara', version: pkg.version, declarationType: 'self-declared-and-build-attested', telemetry: false, advertising: false, automaticExternalSafetyReporting: false, localConversationStorage: true, secretsExposedToRenderer: false, updater: { automaticCheck: true, downloadRequiresUserApproval: true, httpsRequired: true, sha256Required: true }, documents: ['PRIVACY.md', 'SECURITY.md', 'docs/NETWORK_USAGE.md'] };
fs.writeFileSync(path.join('dist', 'PRIVACY-DECLARATION.json'), `${JSON.stringify(privacy, null, 2)}\n`, 'utf8');
fs.copyFileSync('PRIVACY.md', path.join('dist', 'PRIVACY.md')); fs.copyFileSync('SECURITY.md', path.join('dist', 'SECURITY.md')); fs.copyFileSync(path.join('docs', 'NETWORK_USAGE.md'), path.join('dist', 'NETWORK-USAGE.md'));
for (const name of ['LICENSE','NOTICE.md','AUTHORS.md','TRADEMARKS.md','THIRD_PARTY_NOTICES.md']) fs.copyFileSync(name, path.join('dist', name));
console.log(`Release evidence created for ${files.length} files.`);
