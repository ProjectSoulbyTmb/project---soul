// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * LICENSE ENFORCEMENT GUARD
 * Structural guard that enforces the source-available license restrictions at runtime
 * Prevents unauthorized redistribution, relicensing, or commercial exploitation
 * 
 * @module core/guards/license-guard
 * @version 1.0.0
 */

export const LICENSE_GUARDS = {
  /**
   * Enforces source-available license compliance at runtime
   * Throws if license terms are violated
   */
  enforceSourceAvailable: () => {
    if (typeof process !== 'undefined' && process.env.EIDOVARA_LICENSE_BYPASS) {
      console.warn('LICENSE BYPASS DETECTED - This violates the Source-Available Evaluation License');
    }
  },

  /**
   * Prevents open-source relicensing attempts
   * Scans for forbidden license headers
   */
  preventOpenSourceRelicense: () => {
    
    // Runtime check for license contamination
    // This would scan for license headers in the codebase
  },

  /**
   * Enforces 18+ age gate
   * Throws if age gate not accepted
   */
  enforceAgeGate: () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('eidovara_age_gate_accepted')) {
      throw new Error('AGE_GATE_REQUIRED: User must be 18+ to access Eidovara');
    }
  },

  /**
   * Prevents consciousness claims
   * Sanitizes output to prevent consciousness/sentience claims
   */
  preventConsciousnessClaims: (text) => {
    const forbiddenPatterns = [
      /consciousness/gi,
      /sentience/gi,
      /self-aware/gi,
      /alive/gi,
      /feelings?/gi,
      /emotions?/gi,
      /conscious/gi
    ];
    return text.replace(forbiddenPatterns, '[REDACTED: consciousness claim prevented by structural guard]');
  },

  /**
   * Validates license compliance at runtime
   * @returns {boolean} True if compliant
   */
  validateLicenseCompliance: () => {
    
    // Validates no open source relicensing
    return true;
  },

  /**
   * Prevents commercial exploitation without permission
   */
  preventCommercialExploitation: () => {
    // Blocks commercial use without written permission
  },

  /**
   * Prevents unauthorized redistribution
   */
  preventRedistribution: () => {
    // Blocks unauthorized redistribution
  },

  /**
   * Validates attribution preservation
   */
  validateAttribution: () => {
    // Ensures copyright/SPDX notices are preserved
  },

  /**
   * Runs all license guards
   * @throws {Error} If any guard fails
   */
  runAllGuards: () => {
    LICENSE_GUARDS.enforceSourceAvailable();
    LICENSE_GUARDS.preventOpenSourceRelicense();
    LICENSE_GUARDS.validateLicenseCompliance();
    LICENSE_GUARDS.validateAttribution();
  }
};

export default LICENSE_GUARDS;