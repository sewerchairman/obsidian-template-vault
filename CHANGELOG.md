# Changelog

## 1.1.0

- Add English and Chinese UI for panels, buttons, command names, tooltips, notices, and file-operation errors.
- Default to Auto: detect the Obsidian client language through `getLanguage()`; Chinese variants use Chinese, all other or unavailable locales use English.
- Add persistent Auto / English / 中文 selectors to the main panel and settings. Manual selection takes priority; open dialogs retain their drafts during switching.
- Preserve existing template paths and selected notes when upgrading from 1.0.0.
- Bundle all runtime code into `main.js`. New vault creation now works with the three standard community-install files.
- Read the current vault’s template settings from its configured configuration directory.
- Raise the minimum Obsidian version to 1.8.7 for the public language API.
- Add English documentation and localization tests.

### 中文

新增中英文界面、自动识别客户端语言和手动切换。语言设置会保存，现有模板路径与笔记选择不变。安装仅需标准三个文件，最低要求 Obsidian 1.8.7。

## 1.0.0

Initial desktop release with template selection, snapshots, attachment copying, and new vault creation.
