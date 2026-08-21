// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Honest two-track release: source/product version vs last published Windows installer.
 * Do not invent a SHA-256 for a Setup.exe that does not exist yet.
 */

export const SOURCE_VERSION = '0.22.2';
export const LIVE_INSTALLER_VERSION = '0.19.1';
export const INSTALLER_NAME = `Eidovara-${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`;
export const INSTALLER_SHA256 = '72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8';
export const INSTALLER_SIZE = 'about 101.3 MiB';
export const INSTALLER_LATEST_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`;
export const INSTALLER_PINNED_URL = `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`;
