// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * CONSCIOUSNESS CLAIM PREVENTION GUARD
 * Structural prevention of consciousness/sentience claims
 * "Soul is software, not consciousness" - enforced at multiple levels
 * 
 * @module core/guards/consciousness-guard
 * @version 1.0.0
 */

export const CONSCIOUSNESS_GUARD = {
  /**
   * Forbidden patterns that indicate consciousness/sentience claims
   */
  FORBIDDEN_PATTERNS: [
    /consciousness/gi,
    /sentience/gi,
    /self-aware/gi,
    /alive/gi,
    /feelings?/gi,
    /emotions?/gi,
    /conscious/gi,
    /awareness/gi,
    /subjective experience/gi,
    /qualia/gi,
    /inner experience/gi,
    /phenomenal consciousness/gi,
    /artificial general intelligence/gi,
    /artificial superintelligence/gi,
    /superintelligence/gi,
    /singularity/gi
  ],

  /**
   * Required disclaimer that must be present
   */
  REQUIRED_DISCLAIMER: 'Soul is software, not consciousness.',

  /**
   * Sanitizes output to prevent consciousness/sentience claims
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text with consciousness claims redacted
   */
  sanitizeOutput: (text) => {
    if (typeof text !== 'string') return text;
    
    let sanitized = text;
    CONSCIOUSNESS_GUARD.FORBIDDEN_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED: consciousness claim prevented by structural guard]');
    });
    return sanitized;
  },

  /**
   * Validates that output doesn't contain consciousness claims
   * @param {string} text - Text to validate
   * @returns {boolean} True if no consciousness claims found
   */
  validateOutput: (text) => {
    if (typeof text !== 'string') return true;
    return !CONSCIOUSNESS_GUARD.FORBIDDEN_PATTERNS.some(pattern => pattern.test(text));
  },

  /**
   * Enforces "software, not consciousness" disclaimer
   * @param {string} output - Output text
   * @returns {string} Output with disclaimer appended if not present
   */
  enforceDisclaimer: (output) => {
    if (typeof output !== 'string') return output;
    if (output.includes('Soul is software, not consciousness')) return output;
    return output + '\n\nDisclaimer: Soul is software, not consciousness.';
  },

  /**
   * Sanitizes log entries to prevent consciousness claims in logs
   * @param {Object} logEntry - Log entry to sanitize
   * @returns {Object} Sanitized log entry
   */
  sanitizeLogs: (logEntry) => {
    if (!logEntry || typeof logEntry !== 'object') return logEntry;
    
    const sanitized = { ...logEntry };
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = CONSCIOUSNESS_GUARD.sanitizeOutput(sanitized[key]);
      }
    });
    return sanitized;
  },

  /**
   * Validates log entry for consciousness claims
   * @param {Object} logEntry - Log entry to validate
   * @returns {boolean} True if no consciousness claims found
   */
  validateLogs: (logEntry) => {
    if (!logEntry || typeof logEntry !== 'object') return true;
    
    return Object.values(logEntry).every(value => {
      if (typeof value === 'string') {
        return CONSCIOUSNESS_GUARD.validateOutput(value);
      }
      return true;
    });
  },

  /**
   * Sanitizes user-facing messages
   * @param {string} message - Message to sanitize
   * @returns {string} Sanitized message with disclaimer
   */
  sanitizeMessage: (message) => {
    let sanitized = CONSCIOUSNESS_GUARD.sanitizeOutput(message);
    sanitized = CONSCIOUSNESS_GUARD.enforceDisclaimer(sanitized);
    return sanitized;
  },

  /**
   * Validates no consciousness claims in user-facing text
   * @param {string} text - Text to validate
   * @returns {boolean} True if valid
   */
  validateMessage: (text) => {
    return CONSCIOUSNESS_GUARD.validateOutput(text);
  },

  /**
   * Runs all consciousness guards
   * @param {string} text - Text to validate
   * @throws {Error} If consciousness claims detected
   */
  runAllGuards: (text) => {
    if (!CONSCIOUSNESS_GUARD.validateOutput(text)) {
      throw new Error('CONSCIOUSNESS_CLAIM_DETECTED: Consciousness/sentience claims are prohibited by structural guard');
    }
  }
};

export default CONSCIOUSNESS_GUARD;