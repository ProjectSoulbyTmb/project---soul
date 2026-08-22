// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
export async function readBoundedBody(res, limit, message = 'Response is too large.') {
  const reader = res?.body?.getReader?.();
  if (!reader) return null;
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value?.byteLength || 0;
    if (total > limit) {
      try { await reader.cancel(); } catch {}
      throw new Error(message);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
