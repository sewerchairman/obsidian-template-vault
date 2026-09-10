# Template Vault

Reusable vault templates for Obsidian. 可复用的仓库模板。

English | [简体中文](README.zh-CN.md)

Save selected notes and attachments as a template, then create new vaults with the same starting content. **Version 1.1.0 · Desktop only · Obsidian 1.8.7+**

## Why this plugin?

Starting a new vault often means copying the same reference notes, writing outlines, and attachments again. Obsidian’s built-in Templates plugin inserts text into one note; Template Vault creates a new vault folder with a reusable set of files.

For example, prepare a Markdown reference and a study-note outline once, then include them in separate vaults for programming, projects, or courses. The [example template](example-vault) includes a Chinese Markdown reference and study-note outline. Changing the UI language does not translate these notes or rename files.

## Features

- Select an existing template folder, or save selected notes from the current vault as a snapshot.
- Include recognized image, PDF, and other non-note attachment links.
- Create a new vault while preserving the template’s folder structure.
- Include this plugin and its preferences in the new vault for continued reuse.
- Switch between Auto, English, and 中文 without restarting the plugin.
- Refuse to overwrite existing folders and verify copied file contents.

## Install or update

1. Download `local-vault-template-1.1.0.zip` from the [1.1.0 release](https://github.com/sewerchairman/obsidian-template-vault/releases/tag/1.1.0).
2. Extract its `local-vault-template` folder into your vault’s `.obsidian/plugins/` directory. Use your configured configuration directory if it differs from `.obsidian`.
3. Reload Obsidian and enable **Template Vault** in Community plugins. Disable Restricted mode if prompted.

The runtime requires only:

```text
your-vault/.obsidian/plugins/local-vault-template/
├── main.js
├── manifest.json
└── styles.css
```

You may download these files individually from the release instead. When upgrading, **preserve `data.json`** and replace only the program files. Existing template paths and selected notes are retained. Older versions left a separate `vault-ops.js` file; 1.1.0 no longer uses it at runtime.

This project is not yet listed in the Obsidian Community directory. See [submission preparation](docs/COMMUNITY-SUBMISSION.md).

**Community submission blocker:** this version copies itself into new vaults. The [official developer policies](https://docs.obsidian.md/community-directory/developer-policies) prohibit plugins from installing or updating themselves. That behavior must be removed before submission; 1.1.0 preserves it for the existing manual-install workflow.

## Language

The default is **Auto**. The plugin reads the language configured in Obsidian using its public `getLanguage()` API:

| Preference | Behavior |
| --- | --- |
| Auto | Chinese for `zh`, `zh-CN`, `zh-TW`, and other Chinese variants; English for other or unavailable locales |
| English | Always English, regardless of the client language |
| 中文 | Always Simplified Chinese, regardless of the client language |

Change **Language** in the main plugin panel or **Settings → Template Vault**. The choice is saved and updates open panels, tooltips, and command labels. It also follows new vaults created by the plugin. The static plugin name in the installed-plugin list remains **Template Vault**.

## Use an existing template

1. Put the [example-vault](example-vault) folder, or your own template folder, outside the current vault. Keep it in a permanent location.
2. Click the folder-plus ribbon icon, or search for **Template Vault** in the command palette.
3. Open **Set template**, enter the template folder’s absolute path, and click **Use this template**.
4. Return to the panel and select **New vault**.

Installing the plugin alone does not add example notes to an existing vault. The plugin and example content are separate downloads; obtain `example-vault` from this repository’s source ZIP or a clone.

## Save a template from your notes

1. Open **Set template** and select the notes to reuse. Use the filename filter as needed.
2. Choose a template name and an existing parent folder outside the current vault.
3. Select **Save and use template**.

The template is an independent snapshot. Later edits to the source notes do not change it. Save another snapshot to update the content used by future vaults. Linked Markdown notes must be selected separately; recognized non-note attachments are collected automatically.

## Create a vault

1. Select **New vault** in the plugin panel.
2. Enter a vault name and an existing parent folder, then select **Create vault**.
3. On completion, copy the new path and select **Open vault manager**.
4. Choose **Open folder as vault** and select the created folder.

The new vault includes the plugin. Enable it if the new vault starts in Restricted mode.

**Use this plugin’s New vault action to inherit a template.** Obsidian’s built-in Create new vault action is unchanged. Preferences are stored per vault and inherited by newly created vaults; they are not a global setting synchronized across existing vaults.

## File access and limitations

The plugin reads and writes **outside the current vault** when you explicitly save a template or create a new vault. It copies its own runtime and an enabled-plugin configuration into newly created vaults. No network requests, accounts, payments, telemetry, or background monitoring are required by the plugin.

- Existing target directories are never overwritten. Nested vault destinations and symbolic links/junctions are rejected.
- `.git`, `.trash`, `node_modules`, workspace state, and other third-party plugins are excluded.
- Templates may include `.obsidian/templates.json`, `core-plugins.json`, `app.json`, and `appearance.json`. The current vault’s template-folder settings are read using `Vault.configDir`; newly created vaults use the standard `.obsidian` directory.
- Attachment collection relies on Obsidian’s resolved links. Unrecognized raw HTML image references are not automatically collected; prefer native embeds.
- A failed operation can leave a partial destination. The path is reported, and files are retained for inspection rather than deleted automatically.
- If the template folder moves, select its new location in the plugin.
- UI translations do not modify user content. Chinese locale variants currently share the Simplified Chinese UI.

## Development

Node.js 18+ is required. No additional npm dependencies are needed.

```bash
git clone https://github.com/sewerchairman/obsidian-template-vault.git
cd obsidian-template-vault
node build.js
node --check main.js
node --test test.js i18n.test.js
```

`main-source.js` implements the UI; `vault-ops.js` implements file operations; `i18n.js` contains translations and locale handling. `build.js` bundles them into `main.js`. No relative source-module loading is required in an installed plugin.

Tests cover file preservation, two generations of vault creation from a three-file installation, locale detection, manual overrides, preference persistence, translated errors, and UI refresh with an Obsidian API test double. These tests do not replace visual or interaction checks in a real Obsidian window.

To generate the installation ZIP and checksums, use Python 3:

```bash
python package-plugin.py
```

See the [changelog](CHANGELOG.md) and [Chinese documentation](README.zh-CN.md). Licensed under the existing [MIT License](LICENSE).
