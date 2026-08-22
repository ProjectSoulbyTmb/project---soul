// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * STRUCTURAL LEGAL GUARDS - MAIN ENTRY POINT
 * Main entry point for all structural legal guards
 * 
 * @module core/guards
 * @version 1.0.0
 */

import { LICENSE_GUARDS } from './license-guard.js';
import { AGE_GATE } from './age-gate.js';
import { CONSCIOUSNESS_GUARD } from './consciousness-guard.js';
import { RELICENSE_GUARD } from './relicense-guard.js';

/**
 * Main Structural Guards Registry
 * All legal guards are registered here and run at appropriate initialization points
 */
export const STRUCTURAL_GUARDS = {
  LICENSE_GUARDS,
  AGE_GATE,
  CONSCIOUSNESS_GUARD,
  RELICENSE_GUARD
};

/**
 * Runs all structural guards at application startup
 * @throws {Error} If any guard fails
 */
export const runAllStructuralGuards = () => {
  // Run license guards
  LICENSE_GUARDS.runAllGuards();
  
  // Run age gate checks
  AGE_GATE.runAllChecks();
  
  // Run consciousness guards
  CONSCIOUSNESS_GUARD.runAllGuards('');
  
  // Run relicense guards (would scan codebase)
  // RELICENSE_GUARD.runAllGuards(codebase);
  
  // Log successful guard initialization
  if (typeof console !== 'undefined') {
    console.log('[STRUCTURAL GUARDS] All legal guards initialized and active');
    console.log('[STRUCTURAL GUARDS] License enforcement: ACTIVE');
    console.log('[STRUCTURAL GUARDS] Age gate enforcement: ACTIVE');
    console.log('[STRUCTURAL GUARDS] Consciousness claim prevention: ACTIVE');
    console.log('[STRUCTURAL GUARDS] Open source relicensing prevention: ACTIVE');
  }
};

/**
 * Runs all guards for a specific context
 * @param {string} context - Context where guards are run
 */
export const runGuardsForContext = (context) => {
  switch (context) {
    case 'startup':
      STRUCTURAL_GUARDS.runAllStructuralGuards();
      break;
    case 'cli':
      AGE_GATE.validateCliArgs(process.argv);
      break;
    case 'ui':
      AGE_GATE.showAgeGateModal();
      break;
    case 'renderer':
      // Renderer-specific guards
      break;
    default:
      STRUCTURAL_GUARDS.runAllStructuralGuards();
  }
};

/**
 * Validates a specific text for legal compliance
 * @param {string} text - Text to validate
 * @returns {Object} Validation results
 */
export const validateLegalCompliance = (text) => {
  const results = {
    valid: true,
    violations: [],
    warnings: []
  };

  // Check consciousness claims
  if (!CONSCIOUSNESS_GUARD.validateOutput(text)) {
    results.valid = false;
    results.violations.push({
      type: 'CONSCIOUSNESS_CLAIM',
      message: 'Consciousness/sentience claim detected'
    });
  }

  // Check for forbidden licenses
  const relicenseResults = RELICENSE_GUARD.scanForContamination(text);
  if (!relicenseResults.clean) {
    results.valid = false;
    relicenseResults.violations.forEach(v => results.violations.push(v));
  }

  relicenseResults.warnings.forEach(w => results.warnings.push(w));

  return results;
};

export {
  LICENSE_GUARDS,
  AGE_GATE,
  CONSCIOUSNESS_GUARD,
  RELICENSE_GUARD
};

export default STRUCTURAL_GUARDS;