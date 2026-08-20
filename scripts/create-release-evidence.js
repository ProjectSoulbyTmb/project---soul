import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const names = fs.readdirSync('dist').filter(name => /\.(?:exe|json)$/i.test(name) && (name.startsWith('Project-Soul-Alpha-') || name === 'update.json')).sort();
if (!names.some(name => /Setup\.exe$/i.test(name)) || !names.some(name => /Portable\.exe$/i.test(name))) throw new Error('Release executables are missing.');
const files = names.map(name => { const data = fs.readFileSync(path.join('dist', name)); return { name, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex').toUpperCase() }; });
fs.writeFileSync(path.join('dist', 'SHA256SUMS.txt'), `${files.map(f => `${f.sha256}  ${f.name}`).join('\n')}\n`, 'utf8');
const namespace = `https://github.com/${process.env.GITHUB_REPOSITORY || 'ProjectSoulbyTmb/project---soul'}/releases/tag/v${pkg.version}`;
const sbom = { spdxVersion: 'SPDX-2.3', dataLicense: 'CC0-1.0', SPDXID: 'SPDXRef-DOCUMENT', name: `Project Soul Alpha ${pkg.version}`, documentNamespace: namespace, creationInfo: { created: new Date().toISOString(), creators: ['Tool: Project-Soul-release-evidence'] }, packages: [{ name: pkg.name, SPDXID: 'SPDXRef-Package', versionInfo: pkg.version, downloadLocation: 'NOASSERTION', filesAnalyzed: true, licenseConcluded: 'NOASSERTION', licenseDeclared: 'NOASSERTION', copyrightText: 'NOASSERTION' }], files: files.map((f,i)=>({fileName:f.name,SPDXID:`SPDXRef-File-${i+1}`,checksums:[{algorithm:'SHA256',checksumValue:f.sha256}]})), relationships: files.map((_,i)=>({spdxElementId:'SPDXRef-Package',relationshipType:'CONTAINS',relatedSpdxElement:`SPDXRef-File-${i+1}`})) };
fs.writeFileSync(path.join('dist', 'SBOM.spdx.json'), `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join('dist', 'CODE-SIGNING-STATUS.txt'), `Project Soul Alpha ${pkg.version}\n\nAuthenticode: unsigned; no valid local Windows code-signing identity was available.\nBuild provenance: signed by GitHub Actions through Sigstore and published in the repository attestations.\nIntegrity: verify SHA256SUMS.txt and the GitHub attestation before installation.\nPrivate keys and private certificates are never included in release assets.\n`, 'utf8');
console.log(`Release evidence created for ${files.length} files.`);
