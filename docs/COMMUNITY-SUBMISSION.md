# Obsidian 社区插件提交准备

核对日期：2026-09-10。本文件记录申请准备情况，不代表已上架或已获审核通过。

## 当前具备的材料

- GitHub 源码仓库、英文及中文 README、MIT 许可证。
- 根目录 `manifest.json`，稳定插件 ID `local-vault-template`，名称 `Template Vault`。
- 1.1.0 的构建产物与测试；最低 Obsidian 版本为 1.8.7，标记为仅桌面端。
- 运行时完全打包到 `main.js`，无需下载额外源码模块。
- GitHub Release 应使用与 manifest 一致的标签 `1.1.0`，并直接附上 `main.js`、`manifest.json`、`styles.css`；安装 ZIP 不能替代这些单独附件。

## 当前官方申请流程

根据 [官方提交指南](https://docs.obsidian.md/plugins/releasing/submit-plugin)，需要 GitHub 与 Obsidian 账号。先准备可供审核的源码、README、LICENSE、manifest 和匹配版本的 GitHub Release，再到 [Obsidian Community](https://community.obsidian.md) 登录 Obsidian 账号、绑定 GitHub，并添加插件。目录会读取默认分支的 manifest，校验仓库归属及插件 ID；ID 必须唯一，且不能包含 `obsidian`。

提交后需要处理审核反馈；未解决审核错误之前，插件不能从客户端安装。通过后，后续版本通过 GitHub Release 分发。[流程及版本附件要求](https://docs.obsidian.md/plugins/releasing/submit-plugin)

此流程不等于只推送 GitHub 代码，也不应继续照旧教程直接假定必须向 `obsidian-releases` 提交 PR。

## 提交前还应完成

**明确阻碍：当前版本会将自身复制到新仓库并写入启用配置。官方 [开发政策](https://docs.obsidian.md/community-directory/developer-policies) 明确禁止插件安装或更新自身及依赖。按这条政策，当前自复制实现不适合直接提交。申请前需要移除 `createVault()` 中复制本插件和自动配置启用的逻辑，让用户通过 Obsidian 安装插件；不能仅靠增加说明或开关来假定符合政策。**

1.1.0 保留了既有的自复制功能，因此本次发布仍用于手动安装，没有宣称已满足全部上架条件。这项政策针对官方目录插件，不禁止用户在目录之外手动安装自己的插件。[政策适用范围](https://docs.obsidian.md/community-directory/developer-policies)

1. 用真实 Obsidian 客户端验证英文、中文、自动语言、模板保存及新仓库打开流程。当前自动化界面测试使用 API 替身，不替代实际客户端验证。
2. 复核 [插件开发指南](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)，并阅读提交界面中的现行开发政策与提交要求。
3. 在 README 明确披露仓库外的文件访问用途。此类访问在官方政策中属于必须披露的行为；自安装行为则需要按上面的要求修改，不能以披露代替修正。
4. 在目录提交时确认名称和 ID 可用。已有本地用户通过此 ID 保存设置，不宜在未规划迁移时随意修改。

本次版本更新不代替账号绑定、政策确认或正式提交操作，也不承诺一定通过审核。

其他要求包括简短英文描述、准确的最低客户端版本和桌面端标记，见 [插件提交要求](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)。
