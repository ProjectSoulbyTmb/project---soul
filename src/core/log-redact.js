// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

/** Strip bearer tokens and obvious secrets before writing local diagnostic logs. */
export function redactSecretsForLog(value) {
  const text = String(value ?? '');
  return text
    .replace(/Authorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Authorization: Bearer [redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*['"]?[^\s'"&,]+/gi, '$1=[redacted]')
    .replace(/encrypted(?:Api|SearchApi)Key["\s:]+[A-Za-z0-9+/=]{16,}/gi, match => `${match.split(/[:"]/)[0]}=[redacted]`);
}

