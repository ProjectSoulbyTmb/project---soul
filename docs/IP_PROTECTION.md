# Eidovara intellectual-property protection plan

This operational checklist is not legal advice.

## Public repository boundary

- Keep public releases, user documentation, marketing material, checksums, and security notices here.
- Develop new patent-sensitive mechanisms in a separate private repository until a patent professional has reviewed them or an application supporting them has been filed.
- Do not commit credentials, private patent drafts, inventor addresses, unpublished diagrams, customer data, or trade secrets to this repository.
- Do not describe the project as “patent pending” until a qualifying patent application has actually been filed.
- First-party `src/**/*.js` and `docs/*.js` carry SPDX `LicenseRef-Eidovara-Source-Available-1.0` headers. Preserve them. Do not relicense first-party material as MIT, Apache, GPL, or other open source.
- GitHub pull requests do not transfer ownership. `docs/CONTRIBUTOR_ASSIGNMENT.md` and `docs/ENTITY_IP_ASSIGNMENT.md` are unsigned templates for private wet-ink or counsel-supervised execution only.

## What this repository can state vs what only the owner can do

Repository notices, SPDX headers, LICENSE, TERMS, and git history are evidence of a claim. They do **not** form an LLC, register a trademark or copyright, e-sign an assignment, or enable GitHub's private CLA product. Owner-only actions remain: entity formation, USPTO/Copyright Office filings, privately executed assignments, a GitHub private CLA if desired, Authenticode identity, and secret rotation if a credential were ever committed.

## Evidence preservation

- Preserve the complete Git history, release tags, workflow attestations, source archives, design notes, and dated test results.
- Maintain a private, dated invention log explaining who conceived each claimed mechanism, when it was conceived, how it works, and when it was first reduced to practice.
- Record every public disclosure, demonstration, sale, offer for sale, publication, and non-confidential discussion with its date and audience.
- Record all contributors and distinguish conception from implementation. Ownership alone does not determine legal inventorship.

## Filing preparation

- Ask a registered patent attorney or agent to conduct a prior-art and patentability search focused on concrete technical mechanisms, not the general idea of a desktop assistant or “digital consciousness.”
- Prepare architecture drawings and a complete written description covering alternatives and failure modes before filing. New technical matter generally cannot be added later while keeping the original filing date.
- Determine every actual inventor, ownership/assignment obligations, government funding interests, public-disclosure dates, and desired countries before filing.
- If using a U.S. provisional application, calendar the non-extendable 12-month deadline for a corresponding nonprovisional application.

## Other protection

- Evaluate federal trademark registration for Eidovara and Soul Consciousness Studios.
- Evaluate U.S. Copyright Office registration for qualifying source-code versions and visual assets.
- Use written confidentiality and invention-assignment agreements before sharing unpublished development with contractors or collaborators. An unsigned contributor template is `docs/CONTRIBUTOR_ASSIGNMENT.md`; do not treat it as signed, and do not commit executed copies here.
- If a formed company should own pre-formation rights, execute a private assignment (`docs/ENTITY_IP_ASSIGNMENT.md` is an unsigned template). Formation alone does not transfer IP.
- Obtain a commercial code-signing certificate through a verified legal person or business; never publish its private key.
