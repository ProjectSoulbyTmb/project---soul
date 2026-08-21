# Copyright notices and U.S. registration (owner checklist)

This file tells the owner how to **notice** first-party files and, separately, how to **register** a work at the U.S. Copyright Office. It is **not legal advice**, not a filing, and not a claim that Eidovara is registered.

Copyright © 2026 Tyler Michael Bosworth. All rights reserved. Source-available; use governed by [LICENSE](../LICENSE) + [TERMS.md](../TERMS.md). Third-party stays third-party.

**This repository is not a U.S. Copyright Office registration.** There is no registration number, certificate, or deposit receipt in git. A `©` line, LICENSE, git history, and SHA-256 hashes are evidence of a claim, not a registration.

## Claimant

- **Copyright claimant:** Tyler Michael Bosworth
- **Intended publisher name:** Soul Consciousness Studios (does not own copyright unless a formed entity receives a signed assignment)
- **Works claimed:** qualifying original first-party Eidovara expression (source, tests, first-party docs, first-party UI assets, release materials he authored)
- **Not claimed:** ideas, methods, systems, facts, names, titles, short phrases; Electron, Chromium, Node.js, Windows; Wikipedia/Wikimedia content; user content; third-party marks and media

See [OWNERSHIP.md](../OWNERSHIP.md), [NOTICE.md](../NOTICE.md), [COPYRIGHT.txt](../COPYRIGHT.txt), and [COPYRIGHT_ASSET_REGISTER.md](COPYRIGHT_ASSET_REGISTER.md).

## Standard file header (single block)

Use **one** header. Do not stack multiple copyright blocks or paste third-party licenses into first-party files.

JavaScript / CSS / CJS (block comment):

```
/*
 * Copyright (c) 2026 Tyler Michael Bosworth. All rights reserved.
 * Source-available; use governed by LICENSE + TERMS. Third-party stays third-party.
 */
```

HTML (after `<!doctype html>` or at the top of a first-party fragment):

```
<!-- Copyright (c) 2026 Tyler Michael Bosworth. All rights reserved. Source-available; use governed by LICENSE + TERMS. Third-party stays third-party. -->
```

Markdown / text (first lines, only on first-party docs that are not already titled legal instruments):

```
Copyright (c) 2026 Tyler Michael Bosworth. All rights reserved.
Source-available; use governed by LICENSE + TERMS. Third-party stays third-party.
```

Rules:

1. Apply only to **first-party** files. Do not stamp Electron, Chromium, Node.js, or other third-party trees.
2. Do not add this header to files that already carry an equivalent Tyler Michael Bosworth copyright line.
3. Absence of a header does **not** mean a first-party file is unlicensed or third-party; LICENSE still governs.
4. This pack does **not** mass-stamp hundreds of existing sources. New first-party files should include the header. Existing files keep their current form unless they lack any notice **and** a later, targeted pass is approved.
5. Do not add ®, a copyright-office registration number, or a patent number.

## How to put a copyright notice on a work

A notice is optional for works first published on or after 1 March 1989 under U.S. law, but it is useful. A conventional notice has three parts:

1. The symbol ©, the word "Copyright", or "Copr."
2. The year of first publication of this version
3. The name of the copyright owner (here: Tyler Michael Bosworth)

Place it on LICENSE, NOTICE, About screens, installer EULA, website footers, and (when adding new files) the standard header above.

Do **not** write "registered with the Copyright Office" unless a registration has issued.

## U.S. Copyright Office registration (owner-only)

Registration, if desired, is done by the **owner or the owner's agent** at [https://www.copyright.gov](https://www.copyright.gov) (electronic registration through the Copyright Office's eCO / current portal). **This commit does not register anything.** A Cloud Agent cannot log into copyright.gov as Tyler Michael Bosworth, pay the fee, or upload a deposit.

### Checklist (complete privately with counsel)

1. Confirm you are the author or have a signed written assignment covering the deposit. Unsigned templates in this repo do not count.
2. Decide **what** to register (for example a specific source-code version; first-party visual assets). Source code is typically registered as a literary work. Icons and original artwork may be visual-arts works. Do not register Electron or other third-party code as yours.
3. Prepare a **deposit** that matches Copyright Office rules for the chosen category (often identifying portions of source, not secrets, credentials, or unpublished invention write-ups you intend to keep private).
4. Create an account on copyright.gov. Complete the application **in your own name** (or the formed entity's name only after a signed assignment).
5. Pay the **then-current** fee listed by the Copyright Office. Fees change; do not rely on a number written in this file.
6. Keep the application, payment receipt, and any later certificate in **private** storage. Do not commit certificates, applicant addresses, or deposit packages to this public repository.
7. After a certificate issues, you may state that *that specific work* is registered and cite the registration number. Until then, say "copyright claimed," not "registered."

Registration can support statutory damages and attorney-fee eligibility for qualifying U.S. claims when the statutory timing rules are met. It is not automatic from putting a LICENSE in git. Foreign protection and Berne Convention points need counsel.

### What copyright does not cover

Copyright does not protect ideas, procedures, processes, systems, methods of operation, concepts, principles, discoveries, names, titles, or short phrases. Trademark and patent, if any, are separate. See [TRADEMARKS.md](../TRADEMARKS.md) and [IP_PROTECTION.md](IP_PROTECTION.md).

## Honesty rules for this repository

- Do not create a fake "Certificate of Registration."
- Do not invent a registration number or "Txu" / "VAu" identifier.
- Do not apply GPL, MIT, Apache, or CC-BY to first-party Eidovara code; LICENSE is the Eidovara Source-Available Evaluation License.
- Do not include other people's lyrics, novels, or copied product licenses as if they were first-party.
