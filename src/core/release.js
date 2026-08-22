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
// INSTALLER_SHA256 / INSTALLER_SIZE_BYTES below are DECLARED TARGETS copied
// forward from the last fully verified build. They are NOT claims about the
// current artifact until the Release Windows workflow measures a real build:
// that run prints "Copy these measured facts into src/core/release.js" and a
// follow-up commit pastes the values AND flips INSTALLER_FACTS_MEASURED to
// true. While false, user-facing surfaces must point at SHA256SUMS.txt /
// /v1/config instead of printing these constants as verification guidance,
// and tests/installer-facts.test.js enforces exactly that.
export const INSTALLER_FACTS_MEASURED = false;
export const INSTALLER_SHA256 = 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675';
export const INSTALLER_SIZE_BYTES = 106691524;
export const INSTALLER_SIZE = 'about 101.75 MiB';
export const INSTALLER_LATEST_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`;
export const INSTALLER_PINNED_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`;
