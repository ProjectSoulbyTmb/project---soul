// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Canonical source/product and published Windows installer metadata.
 * Values below must come from a real built and published release artifact.
 * Every consumer (worker, site helper, desktop kernel, certification JSON,
 * tests) derives from these constants — change them here, nowhere else, and
 * tests/release-consistency.test.js fails if any other surface drifts.
 */

export const SOURCE_VERSION = '1.0.0';
export const LIVE_INSTALLER_VERSION = '1.0.0';
export const INSTALLER_NAME = `Eidovara-v${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`;
/**
 * Measured installer facts exist only for real tagged builds.
 * v1.0.0 has not been tagged yet, so no measured SHA-256 or size exists.
 * These stay null until Release Windows CI publishes the artifact; the
 * authoritative checksums then live in that release's SHA256SUMS.txt and
 * latest.yml. Do NOT copy another build's digest here (the F29A52F0… digest
 * belongs to the published v0.22.2 Setup.exe).
 */
export const INSTALLER_MEASURED = false;
export const INSTALLER_SHA256 = null;
export const INSTALLER_SIZE_BYTES = null;
export const INSTALLER_SIZE = 'measured when tag v1.0.0 is built';
export const INSTALLER_LATEST_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`;
export const INSTALLER_PINNED_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`;

