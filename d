# Windows application compatibility and third-party use

Eidovara can store a user-selected `.exe` or `.lnk` path and ask Windows to open it. This is a launcher function, not universal integration, certification, control, interoperability, or authorization from the application publisher.

## Technical boundary

- Eidovara does not inject code, patch processes, read application memory, bypass access controls, impersonate users, automate anti-cheat systems, embed third-party interfaces, or redistribute another application's files.
- Adding an application does not give Soul access to that application's private data, account, API, controls, or subscription.
- Compatibility depends on Windows, file availability, architecture, permissions, publisher policies, account state, drivers, security software, and the target application's own behavior.
- Applications requiring administrator rights, protected launchers, anti-cheat, enterprise policy, special URI schemes, command-line arguments, or authenticated APIs may not launch or may require separate user-approved integration.

## User and publisher rights

Users must have the right to install, access, and operate each linked application and must follow its license, terms, acceptable-use rules, privacy notice, API policy, platform rules, and applicable law. Eidovara does not grant third-party rights or make prohibited automation lawful.

Names and links are used only for factual identification or user-directed handoff. Windows and all named applications, platforms, APIs, and services remain the property of their respective owners. No sponsorship, endorsement, compatibility certification, or partnership is implied.

Before adding deeper automation for a particular application, the project must review its current official developer terms, use an authorized API or documented local interface, request the minimum permission, keep credentials out of the renderer, provide a disconnect/removal control, and test failure and revocation behavior. If the terms prohibit the proposed use or permission cannot be obtained, the integration must not ship.
