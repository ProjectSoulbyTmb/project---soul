// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Canonical source/product and published Windows installer metadata.
 * Values below must come from a real built and published release artifact.
 */

export const SOURCE_VERSION = '0.22.2';
export const LIVE_INSTALLER_VERSION = '0.22.2';
export const INSTALLER_NAME = `Eidovara-${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`;
export const INSTALLER_SHA256 = 'A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE';
export const INSTALLER_SIZE_BYTES = 106691429;
export const INSTALLER_SIZE = 'about 101.75 MiB';
export const INSTALLER_LATEST_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`;
export const INSTALLER_PINNED_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`;
