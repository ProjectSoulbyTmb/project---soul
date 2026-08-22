// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * AGE GATE STRUCTURAL GUARD
 * Enforces 18+ age restriction at multiple levels
 * Cannot be removed without owner involvement
 * 
 * @module core/guards/age-gate
 * @version 1.0.0
 */

export const AGE_GATE = {
  /**
   * Storage key for age gate acceptance
   */
  STORAGE_KEY: 'eidovara_age_gate_accepted',

  /**
   * Environment variable for CLI age gate acceptance
   */
  ENV_VAR: 'EIDOVARA_AGE_GATE_ACCEPTED',

  /**
   * CLI flag for age gate acceptance
   */
  CLI_FLAG: '--i-am-18-or-older',

  /**
   * Runtime enforcement at multiple entry points
   * @param {string} context - Context where enforcement is called
   * @throws {Error} If age gate not accepted
   */
  enforce: (context = 'runtime') => {
    const accepted = typeof window !== 'undefined' 
      ? localStorage.getItem('eidovara_age_gate_accepted') === 'true'
      : process.env.EIDOVARA_AGE_GATE_ACCEPTED === 'true';
    
    if (!accepted && globalThis.eidovaraAgeGateAccepted !== true) {
      const error = new Error('AGE_GATE_REQUIRED: 18+ age gate required for Eidovara access');
      error.code = 'AGE_GATE_REQUIRED';
      error.context = context;
      throw error;
    }
  },

  /**
   * CLI argument validation
   * @param {string[]} args - Command line arguments
   * @throws {Error} If age gate not accepted via CLI
   */
  validateCliArgs: (args = process.argv) => {
    const hasFlag = args.includes('--i-am-18-or-older');
    const hasEnv = process.env.EIDOVARA_AGE_GATE_ACCEPTED === 'true';
    
    if (!hasFlag && !hasEnv) {
      const error = new Error('AGE_GATE_REQUIRED: Use --i-am-18-or-older flag or set EIDOVARA_AGE_GATE_ACCEPTED=1');
      error.code = 'AGE_GATE_REQUIRED_CLI';
      console.error('AGE_GATE_REQUIRED: Use --i-am-18-or-older flag or set EIDOVARA_AGE_GATE_ACCEPTED=1');
      process.exitCode = 1;
      throw new Error('AGE_GATE_REQUIRED_CLI');
    }
  },

  /**
   * UI modal enforcement
   * Shows age gate modal, blocks access until confirmed
   * @returns {Promise<boolean>} Resolves when age gate accepted
   */
  showAgeGateModal: () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      
      const accepted = localStorage.getItem('eidovara_age_gate_accepted') === 'true';
      if (accepted) return resolve(true);

      // Create age gate modal
      const modal = document.createElement('div');
      modal.id = 'eidovara-age-gate-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'age-gate-title');
      modal.innerHTML = `
        <div class="age-gate-overlay"></div>
        <div class="age-gate-modal" role="document">
          <h2 id="age-gate-title">Age Verification Required</h2>
          <p>Eidovara is restricted to users 18 years of age or older.</p>
          <p>By confirming, you acknowledge you are 18 or older and accept the <a href="/terms.html">Terms of Use</a>.</p>
          <p class="disclaimer">Local confirmation is not independent identity verification.</p>
          <div class="age-gate-actions">
            <button id="age-gate-decline" class="btn-secondary">Exit</button>
            <button id="age-gate-accept" class="btn-primary">I confirm I am 18+ and accept the Terms</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      const acceptBtn = modal.querySelector('#age-gate-accept');
      const declineBtn = modal.querySelector('#age-gate-decline');

      const cleanup = () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
      };

      acceptBtn.addEventListener('click', () => {
        localStorage.setItem('eidovara_age_gate_accepted', 'true');
        cleanup();
        resolve(true);
      });

      declineBtn.addEventListener('click', () => {
        cleanup();
        window.location.href = 'about:blank';
        resolve(false);
      });

      // Prevent closing with Escape
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') e.preventDefault();
      });
    });
  },

  /**
   * Checks if age gate is accepted
   * @returns {boolean} True if age gate accepted
   */
  isAccepted: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eidovara_age_gate_accepted') === 'true';
    }
    return process.env.EIDOVARA_AGE_GATE_ACCEPTED === 'true';
  },

  /**
   * Sets age gate acceptance
   * @param {boolean} accepted - Whether age gate is accepted
   */
  setAccepted: (accepted = true) => {
    if (typeof window !== 'undefined') {
      if (accepted) {
        localStorage.setItem('eidovara_age_gate_accepted', 'true');
      } else {
        localStorage.removeItem('eidovara_age_gate_accepted');
      }
    }
  },

  /**
   * Runs all age gate checks
   * @throws {Error} If any check fails
   */
  runAllChecks: () => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('eidovara_age_gate_accepted') !== 'true') {
        throw new Error('AGE_GATE_REQUIRED: 18+ age gate required for Eidovara access');
      }
    } else {
      if (process.env.EIDOVARA_AGE_GATE_ACCEPTED !== 'true') {
        throw new Error('AGE_GATE_REQUIRED: Set EIDOVARA_AGE_GATE_ACCEPTED=1');
      }
    }
  }
};

export default AGE_GATE;