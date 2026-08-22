# Eidovara Plugin System

Source-available plugin architecture for Eidovara v1.0.0+.

## Overview

The plugin system lets developers extend Eidovara without modifying core source code. Plugins run in a sandboxed environment with explicit, user-approved permissions.

## Structure

```
plugins/
├── notion-sync/          # Sync memories ↔ Notion
│   ├── manifest.json     # Plugin metadata & permissions
│   └── src/index.js      # Main entry point
├── github-tracker/       # Watch repos, PRs, issues
│   ├── manifest.json
│   └── src/index.js
└── pomodoro/             # Pomodoro timer + ambient sounds
    ├── manifest.json
    └── src/index.js

src/core/plugins/         # Plugin runtime (core)
├── index.ts              # Public exports
├── plugin-manifest.ts    # Types + validation schema
├── plugin-sandbox.ts     # Sandboxed execution context
├── plugin-loader.ts      # Load / validate / init plugins
└── plugin-registry.ts    # Discovery + lifecycle management
```

## Writing a Plugin

### 1. Create `manifest.json`

```json
{
  "manifest_version": 1,
  "id": "com.yourname.your-plugin",
  "name": "Your Plugin",
  "version": "1.0.0",
  "description": "What it does",
  "author": "Your Name",
  "license": "MIT",
  "permissions": {
    "memory": true,
    "network": ["api.example.com"],
    "notifications": true
  },
  "entrypoints": {
    "main": "src/index.js",
    "commands": [
      {
        "id": "your-plugin.action",
        "name": "Do Something",
        "description": "Description shown in palette",
        "shortcut": "Ctrl+Shift+Y",
        "action": "action"
      }
    ]
  }
}
```

### 2. Implement `src/index.js`

```javascript
export default {
  name: 'Your Plugin',
  version: '1.0.0',

  async init() {
    // Called when plugin is loaded
  },

  async cleanup() {
    // Called when plugin is unloaded or app quits
  },

  async action(params) {
    // Called when user runs your command from the palette
    return { result: 'done' };
  }
};
```

### Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `memory` | `boolean` | Read/write Soul durable memories |
| `filesystem` | `string[]` | Glob patterns for allowed paths |
| `network` | `string[]` | Allowed hostnames |
| `shell` | `string[]` | Allowed executable names |
| `notifications` | `boolean` | Desktop notifications |
| `clipboard` | `"read"\|"write"\|"both"` | Clipboard access |

All permissions must be explicitly declared and are presented to the user before activation.

### Hooks

Plugins can subscribe to kernel events:

| Event | Payload |
|-------|---------|
| `memory.created` | The new memory object |
| `memory.updated` | The updated memory object |
| `memory.deleted` | The deleted memory ID |
| `pomodoro.session.completed` | Session stats |
| `github.pr.opened` | PR payload |
| `system.idle` | Idle duration in ms |

## License

Plugin system is part of Eidovara and carries the same source-available license (`LicenseRef-Eidovara-Source-Available-1.0`). Individual plugins may use their own licenses.

## Third-party plugins

Third-party plugins are **not** covered by the Eidovara license. Each plugin author chooses their own license. The marketplace (when launched) will require a permissive license for listed plugins.
