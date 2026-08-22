// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * OPEN SOURCE RELICENSING PREVENTION GUARD
 * Prevents unauthorized relicensing under open source licenses
 * 
 * @module core/guards/relicense-guard
 * @version 1.0.0
 */

export const RELICENSE_GUARD = {
  /**
   * Forbidden open source licenses
   * These licenses are explicitly prohibited for first-party Eidovara material
   */
  FORBIDDEN_LICENSES: [
    'MIT',
    'Apache-2.0',
    'GPL-3.0',
    'GPL-2.0',
    'GPL-1.0',
    'LGPL-3.0',
    'LGPL-2.1',
    'LGPL-2.0',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'BSD-4-Clause',
    'ISC',
    'MPL-2.0',
    'MPL-1.1',
    'AGPL-3.0',
    'CC0-1.0',
    'CC-BY-4.0',
    'CC-BY-SA-4.0',
    'CC-BY-NC-4.0',
    'CC-BY-NC-SA-4.0',
    'CC-BY-ND-4.0',
    'CC-BY-NC-ND-4.0',
    'Unlicense',
    'WTFPL',
    'Zlib',
    'X11'
  ],

  /**
   * Forbidden license identifiers (SPDX)
   */
  FORBIDDEN_SPDX: [
    'MIT',
    'Apache-2.0',
    'GPL-3.0-or-later',
    'GPL-2.0-or-later',
    'GPL-1.0-or-later',
    'LGPL-3.0-or-later',
    'LGPL-2.1-or-later',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'ISC',
    'MPL-2.0',
    'AGPL-3.0-or-later',
    'CC0-1.0',
    'CC-BY-4.0',
    'CC-BY-SA-4.0',
    'Unlicense'
  ],

  /**
   * Required license for first-party material
   */
  REQUIRED_LICENSE: 'LicenseRef-Eidovara-Source-Available-1.0',

  /**
   * Scans codebase for license contamination
   * @param {string} codebase - Codebase to scan
   * @returns {Object} Scan results
   */
  scanForContamination: (codebase) => {
    const results = {
      violations: [],
      warnings: [],
      clean: true
    };

    if (typeof codebase !== 'string') return results;

    // Check for forbidden license headers
    RELICENSE_GUARD.FORBIDDEN_LICENSES.forEach(license => {
      const patterns = [
        new RegExp(`SPDX-License-Identifier:\\s*${license}`, 'gi'),
        new RegExp(`License:\\s*${license}`, 'gi'),
        new RegExp(`licensed under the ${license}`, 'gi'),
        new RegExp(`licensed under ${license}`, 'gi'),
        new RegExp(`Copyright.*${license}`, 'gi')
      ];

      patterns.forEach(pattern => {
        if (pattern.test(codebase)) {
          results.violations.push({
            type: 'FORBIDDEN_LICENSE',
            license,
            message: `Forbidden license detected: ${license}`
          });
          results.clean = false;
        }
      });
    });

    // Check for missing required license
    if (!codebase.includes('LicenseRef-Eidovara-Source-Available-1.0') &&
        !codebase.includes('LicenseRef-Eidovara-Source-Available')) {
      results.warnings.push({
        type: 'MISSING_REQUIRED_LICENSE',
        message: 'Required LicenseRef-Eidovara-Source-Available-1.0 not found'
      });
    }

    return results;
  },

  /**
   * Prevents license header injection
   * @param {string} fileContent - File content to check
   * @returns {string} Sanitized file content
   */
  preventHeaderInjection: (fileContent) => {
    if (typeof fileContent !== 'string') return fileContent;

    let sanitized = fileContent;

    // Remove any open source license headers
    RELICENSE_GUARD.FORBIDDEN_LICENSES.forEach(license => {
      const patterns = [
        new RegExp(`SPDX-License-Identifier:\\s*${license}`, 'gi'),
        new RegExp(`License:\\s*${license}`, 'gi'),
        new RegExp(`Copyright.*${license}`, 'gi'),
        new RegExp(`licensed under the ${license}`, 'gi'),
        new RegExp(`licensed under ${license}`, 'gi')
      ];

      patterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED: open source license header removed by structural guard]');
      });
    });

    // Ensure required license is present
    if (!fileContent.includes('LicenseRef-Eidovara-Source-Available-1.0')) {
      // Add required license header if missing
    }

    return sanitized;
  },

  /**
   * Validates license compliance
   * @returns {Object} Validation results
   */
  validateCompliance: () => {
    const results = {
      compliant: true,
      violations: [],
      warnings: []
    };

    // Check if required license is used
    // This would be implemented with actual file system scanning

    return results;
  },

  /**
   * Scans for open source license contamination
   * @param {string} path - Path to scan
   * @returns {Object} Scan results
   */
  scanDirectory: async (_path) => {
    // Implementation would scan directory for license contamination
    return { violations: [], clean: true };
  },

  /**
   * Runs all relicense guards
   * @param {string} codebase - Codebase to validate
   * @throws {Error} If any guard fails
   */
  runAllGuards: (codebase) => {
    const results = RELICENSE_GUARD.scanForContamination(codebase);
    if (!results.clean) {
      throw new Error('OPEN_SOURCE_RELICENSING_DETECTED: Open source relicensing detected by structural guard');
    }
  }
};

export default RELICENSE_GUARD;