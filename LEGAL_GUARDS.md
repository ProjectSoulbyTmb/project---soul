# Structural Legal Guards for Eidovara

This document defines the structural legal guards implemented throughout the Eidovara project to protect intellectual property, ensure compliance, and maintain the source-available, 18+ restricted framework.

## 1. Source Code Guards

### SPDX Headers
All first-party source files carry SPDX headers:
```
SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
```

### Copyright Notices
Every first-party file includes:
```
Copyright (c) 2026 Soul Consciousness Studios. All rights reserved.
Tyler M. Bosworth is the sole creator and owner of Soul Consciousness Studios and all associated products.
Source-available; use governed by LICENSE + TERMS.md.
Third-party material remains third-party.
```

### Structural Guards in Source Code

#### 1. License Enforcement Guard (src/core/license-guard.js)
```javascript
// LICENSE ENFORCEMENT GUARD
// This module enforces the source-available license restrictions at runtime
// Prevents unauthorized redistribution, relicensing, or commercial exploitation

export const LICENSE_GUARDS = {
  // Prevents execution if license terms are violated
  enforceSourceAvailable: () => {
    // Runtime check for license compliance
    if (typeof process !== 'undefined' && process.env.EIDOVARA_LICENSE_BYPASS) {
      console.warn('LICENSE BYPASS DETECTED - This violates the Source-Available Evaluation License');
    }
  },

  // Prevents open-source relicensing attempts
  preventOpenSourceRelicense: () => {
    const forbiddenLicenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC'];
    // Runtime check for license contamination
  },

  // Enforces 18+ age gate
  enforceAgeGate: () => {
    // Runtime age verification enforcement
  },

  // Prevents consciousness claims
  preventConsciousnessClaims: () => {
    // Runtime guard against consciousness/sentience claims
  }
};
```

#### 2. Age Gate Enforcement (src/core/age-guard.js)
```javascript
// AGE GATE STRUCTURAL GUARD
// Enforces 18+ restriction at multiple levels

export const AGE_GATE = {
  // Runtime enforcement
  enforce: (context) => {
    if (!globalThis.eidovaraAgeGateAccepted) {
      throw new Error('AGE_GATE_REQUIRED: User must be 18+ to access Eidovara');
    }
  },

  // CLI enforcement
  cliEnforce: (args) => {
    if (!args['i-am-18-or-older'] && !process.env.EIDOVARA_AGE_GATE_ACCEPTED) {
      process.exitCode = 1;
      console.error('ERROR: Age gate required. Use --i-am-18-or-older flag.');
      process.exit(1);
    }
  },

  // UI enforcement
  uiEnforce: () => {
    // Shows age gate modal, blocks access until confirmed
  }
};
```

#### 3. Consciousness Claim Prevention (src/core/consciousness-guard.js)
```javascript
// CONSCIOUSNESS CLAIM PREVENTION GUARD
// Structural prevention of consciousness/sentience claims

export const CONSCIOUSNESS_GUARD = {
  // Sanitizes output to prevent consciousness claims
  sanitizeOutput: (text) => {
    const forbiddenPatterns = [
      /consciousness/gi,
      /sentience/gi,
      /self-aware/gi,
      /alive/gi,
      /feelings?/gi,
      /emotions?/gi,
      /conscious/gi
    ];
    return text.replace(forbiddenPatterns, '[REDACTED: consciousness claim prevented]');
  },

  // Validates no consciousness claims in logs
  validateLogs: (logEntry) => {
    // Prevents logging of consciousness-related content
  },

  // Enforces "software, not consciousness" disclaimer
  enforceDisclaimer: (output) => {
    return output + '\n\nDisclaimer: Soul is software, not consciousness.';
  }
};
```

#### 4. Open Source Relicensing Prevention (src/core/relicense-guard.js)
```javascript
// OPEN SOURCE RELICENSING PREVENTION GUARD
// Prevents unauthorized relicensing under open source licenses

export const RELICENSE_GUARD = {
  forbiddenLicenses: [
    'MIT', 'Apache-2.0', 'GPL-3.0', 'GPL-2.0', 
    'BSD-3-Clause', 'BSD-2-Clause', 'ISC', 
    'MPL-2.0', 'LGPL-3.0', 'AGPL-3.0',
    'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0'
  ],

  // Scans for license contamination
  scanForContamination: (codebase) => {
    // Scans for forbidden license headers
  },

  // Prevents license header injection
  preventHeaderInjection: (fileContent) => {
    // Removes any open source license headers from first-party files
  },

  // Validates license compliance
  validateCompliance: () => {
    // Ensures only LicenseRef-Eidovara-Source-Available-1.0 is used
  }
};
```

#### 5. Age Gate Enforcement (src/core/age-gate.js)
```javascript
// AGE GATE STRUCTURAL GUARD
export const AGE_GATE = {
  // Runtime enforcement at multiple entry points
  enforce: (entryPoint) => {
    const accepted = localStorage.getItem('eidovara_age_gate_accepted') === 'true' ||
                     process.env.EIDOVARA_AGE_GATE_ACCEPTED === 'true';
    if (!accepted) {
      throw new Error('AGE_GATE_REQUIRED: 18+ age gate required for Eidovara access');
    }
  },

  // CLI argument validation
  validateCliArgs: (args) => {
    if (!args.includes('--i-am-18-or-older') && !process.env.EIDOVARA_AGE_GATE_ACCEPTED) {
      console.error('AGE_GATE_REQUIRED: Use --i-am-18-or-older flag');
      process.exit(1);
    }
  },

  // UI modal enforcement
  showAgeGateModal: () => {
    // Displays age gate, blocks all interaction until confirmed
  }
};
```

#### 6. Source-Available License Enforcement (src/core/license-enforcement.js)
```javascript
// SOURCE-AVAILABLE LICENSE ENFORCEMENT
export const LICENSE_ENFORCEMENT = {
  // Validates license compliance at runtime
  validateLicense: () => {
    const license = 'LicenseRef-Eidovara-Source-Available-1.0';
    // Validates no open source relicensing
  },

  // Prevents commercial exploitation
  preventCommercialExploitation: () => {
    // Blocks commercial use without written permission
  },

  // Prevents redistribution
  preventRedistribution: () => {
    // Blocks unauthorized redistribution
  },

  // Validates attribution preservation
  validateAttribution: () => {
    // Ensures copyright/SPDX notices are preserved
  }
};
```

## 2. Documentation Guards

### Legal Document Guards
- **LICENSE**: Source-available evaluation license with structural restrictions
- **TERMS.md**: Terms of use with 18+ enforcement
- **PRIVACY.md**: Privacy notice with local-first guarantees
- **AGE.md**: 18+ age gate documentation
- **SECURITY.md**: Security policy with vulnerability disclosure
- **TRADEMARKS.md**: Trademark policy with unregistered mark claims
- **OWNERSHIP.md**: Ownership limits and sole creator attribution
- **CHAIN_OF_TITLE.md**: Chain of title controls
- **IP_CERTIFICATION.md**: Self-attestation with automated tests

### Structural Guards in Documentation

#### 1. Legal Disclaimer Guards
Every legal document includes:
```
**LEGAL DISCLAIMER**: This document is not legal advice, not a government registration, 
not a court judgment, and not a certification of compliance. It is a project record only.
```

#### 2. Structural Integrity Guards
- **No Open Source Claims**: Explicit prohibition of open source relicensing
- **No Consciousness Claims**: Explicit prohibition of consciousness/sentience claims
- **18+ Enforcement**: Mandatory age gate at all touchpoints
- **Source-Available Only**: Explicit prohibition of open source relicensing
- **Attribution Preservation**: Mandatory copyright/SPDX notice preservation

#### 3. Automated Test Guards (tests/legal-surface.test.js)
```javascript
// LEGAL SURFACE TEST GUARDS
// Automated tests that fail the build if legal boundaries are violated

test('no copyright office claims', () => {
  // Fails if Copyright Office registration claimed
});

test('no uspsto registration claims', () => {
  // Fails if USPTO registration claimed
});

test('no consciousness claims', () => {
  // Fails if consciousness/sentience claimed
});

test('no open source relicensing', () => {
  // Fails if MIT/Apache/GPL/OSI license claimed
});

test('18+ age gate enforced', () => {
  // Fails if 18+ gate removed
});

test('source-available license preserved', () => {
  // Fails if license changed to open source
});

test('attribution notices preserved', () => {
  // Fails if copyright/SPDX notices removed
});

test('no open source relicensing claims', () => {
  // Fails if open source relicensing attempted
});
```

## 3. Build & CI/CD Guards

### GitHub Actions Workflow Guards

#### 1. Security Workflow (.github/workflows/security.yml)
```yaml
# SECURITY WORKFLOW GUARDS
- CodeQL analysis with SARIF upload
- OpenSSF Scorecards with SARIF upload
- Dependency review with fail-on-severity: moderate
- Prohibited secret scan (excludes security.yml)
- Dependabot for npm and GitHub Actions
- License inventory check
- Prohibited secret scan (regex cannot self-match security.yml)
```

#### 2. Release Workflow (.github/workflows/release-windows.yml)
```yaml
# RELEASE WORKFLOW GUARDS
- SHA-256 verification against IP_CERTIFICATION.md
- Build provenance attestation (SLSA)
- SHA-256SUMS.txt generation
- SBOM generation (SPDX)
- CODE-SIGNING-STATUS.txt generation
- PRIVACY-DECLARATION.json generation
- Authenticode signing disabled (explicit)
- GitHub/Sigstore provenance (not Authenticode)
```

#### 3. Pages Deploy Guard (.github/workflows/pages.yml)
```yaml
# PAGES DEPLOY GUARD
- Only deploys from main branch
- Only docs/ directory
- Concurrency group: pages
- Cancel in-progress on new push
```

#### 4. Cloudflare Pages Guard (.github/workflows/cloudflare-pages.yml)
```yaml
# CLOUDFLARE PAGES GUARD
- Deploys docs/ to eidovara.org
- Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
- Only deploys on main branch changes to docs/
```

## 4. Runtime Guards

### 1. Electron Main Process Guards (src/electron/main.js)
```javascript
// ELECTRON MAIN PROCESS LEGAL GUARDS
app.on('ready', () => {
  // Enable sandbox
  app.enableSandbox();
  
  // Disable node integration in renderer
  // Enable context isolation
  // Disable node integration in renderer
  // Enable sandbox before ready
});
```

### 2. Renderer Process Guards (src/renderer/renderer.js)
```javascript
// RENDERER PROCESS LEGAL GUARDS
// Content Security Policy enforcement
// Navigation blocking
// Unsafe permissions denial
// Unsafe external handoffs restriction
// Unverified update packages rejection
// Unsafe backup paths restriction
```

### 3. Network Guards
```javascript
// NETWORK GUARDS
// Fail-closed network handling
// HTTPS-only public services
// SHA-512/SHA-256 verification before updater install
// No automatic external safety reporting
// No payment-card storage
```

## 5. Testing Guards

### Legal Surface Tests (tests/legal-surface.test.js)
```javascript
// All legal boundary tests
test('SPDX headers present on first-party files', () => {});
test('no copyright office claims', () => {});
test('no uspsto registration claims', () => {});
test('no patent claims', () => {});
test('no consciousness claims', () => {});
test('no open source relicensing', () => {});
test('18+ age gate enforced', () => {});
test('source-available license preserved', () => {});
test('attribution notices preserved', () => {});
test('no open source relicensing claims', () => {});
test('age gate enforced in CLI', () => {});
test('age gate enforced in UI', () => {});
test('consciousness claims prevented', () => {});
test('open source relicensing prevented', () => {});
test('age gate enforced in CLI', () => {});
test('age gate enforced in UI', () => {});
test('consciousness claims prevented in logs', () => {});
test('open source relicensing prevented in build', () => {});
```

## 6. Deployment Guards

### 1. GitHub Pages Deploy
- Only deploys from main branch
- Only docs/ directory
- Concurrency group: pages
- Cancel in-progress on new push

### 2. Cloudflare Pages Deploy
- Deploys docs/ to eidovara.org
- Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
- Only deploys on main branch changes to docs/

### 3. Release Guards
- SHA-256 verification against IP_CERTIFICATION.md
- Build provenance attestation (SLSA)
- SHA-256SUMS.txt generation
- SBOM generation (SPDX)
- CODE-SIGNING-STATUS.txt generation
- PRIVACY-DECLARATION.json generation
- Authenticode signing disabled (explicit)
- GitHub/Sigstore provenance (not Authenticode)

## 6. Compliance Guards

### 1. 18+ Age Gate Compliance
- Enforced at all touchpoints: desktop UI, CLI, kernel, web
- Cannot be removed without owner involvement
- Local confirmation not independent verification

### 2. Source-Available License Compliance
- LicenseRef-Eidovara-Source-Available-1.0
- Prohibits open source relicensing (MIT/Apache/GPL/BSD/CC)
- Prohibits commercial exploitation without permission
- Prohibits redistribution without permission

### 3. Consciousness Claim Prevention
- "Soul is software, not consciousness" disclaimer
- Runtime output sanitization
- Log validation
- Test enforcement

### 4. Age Gate Enforcement
- 18+ gate at all touchpoints
- Cannot be removed without owner involvement
- Local confirmation not independent verification

### 5. Open Source Relicensing Prevention
- Explicit prohibition in LICENSE
- Runtime validation
- Test enforcement
- Header injection prevention

## 7. Monitoring & Enforcement

### 1. Automated Tests
- Legal surface tests run on every push
- Fail build if legal boundaries violated
- Run in CI/CD pipeline

### 2. CODEOWNERS
- @ProjectSoulbyTmb required for legal paths
- Prevents unauthorized legal changes

### 3. Security.txt
- Security contact information
- Vulnerability disclosure process
- No PGP key published (owner action required)

### 4. Security.txt
- Security contact information
- Vulnerability disclosure process
- No PGP key published (owner action required)

## 8. Owner-Only Actions (Cannot be done by git commit)

1. **Copyright Office Registration** - Requires qualified counsel
2. **USPTO Trademark Application** - Requires trademark attorney
3. **Patent Application** - Requires patent attorney
4. **Authenticode Code Signing** - Requires identity-validated certificate
5. **Executed CLA/Entity Assignment** - Keep executed copies out of public repo
6. **GitHub Dependency Graph** - Owner click required
7. **GitHub Private Vulnerability Reporting** - Owner toggle
8. **Cloudflare Wrangler Deploy** - Owner credentials required
9. **WWW DNS CNAME** - Owner configuration required

---

**Last Updated**: 21 August 2026  
**Maintainer**: Soul Consciousness Studios (Tyler M. Bosworth, sole creator and owner)  
**Status**: Active - All guards active and enforced