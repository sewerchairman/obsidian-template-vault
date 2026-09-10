const { Plugin, PluginSettingTab, Modal, Setting, Notice, FileSystemAdapter, getLanguage, setTooltip } = require('obsidian');
const path = require('path');
const ops = require('./vault-ops');
const i18n = require('./i18n');

const DEFAULTS = { language: 'auto', templatePath: '', parentPath: '', selected: ['开始使用.md', '仓库模板插件使用说明.md', '模板/Markdown常用语法笔记.md', '模板/学习笔记模板.md'] };
function description(el, text) { el.createEl('p', { text, cls: 'vault-template-muted' }); }
async function action(plugin, button, run) {
  button.setDisabled(true);
  try { await run(); }
  catch (error) { new Notice(plugin.error(error), 10000); console.error('[Template Vault]', error); }
  finally { button.setDisabled(false); }
}
function languageSetting(el, plugin) {
  new Setting(el).setName(plugin.t('language')).setDesc(plugin.t('languageHint')).addDropdown(dropdown => {
    dropdown.addOption('auto', plugin.t('auto')).addOption('en', 'English').addOption('zh', '中文')
      .setValue(plugin.settings.language).onChange(value => action(plugin, dropdown, () => plugin.setLanguage(value)));
  });
}

class VaultTemplatePlugin extends Plugin {
  async onload() {
    if (!(this.app.vault.adapter instanceof FileSystemAdapter)) return;
    this.settings = { ...DEFAULTS, ...(await this.loadData()) };
    if (!['auto', 'en', 'zh'].includes(this.settings.language)) this.settings.language = 'auto';
    if (!Array.isArray(this.settings.selected)) this.settings.selected = [...DEFAULTS.selected];
    this.modals = new Set();
    this.root = this.app.vault.adapter.getBasePath();
    this.settings.parentPath ||= path.dirname(this.root);
    this.settings.templatePath ||= path.join(path.dirname(this.root), '_仓库模板');
    this.ribbon = this.addRibbonIcon('folder-plus', this.t('ribbon'), () => this.openHome());
    this.commands = [
      { id: 'open', key: 'openCommand', callback: () => this.openHome() },
      { id: 'set-template', key: 'setCommand', callback: () => new SaveTemplateModal(this).open() },
      { id: 'create-vault', key: 'createCommand', callback: () => new CreateVaultModal(this).open() },
    ].map(({ id, key, callback }) => ({ key, command: this.addCommand({ id, name: this.t(key), callback }) }));
    this.settingTab = new TemplateSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
  }
  locale() {
    let client;
    try { client = getLanguage(); } catch { client = 'en'; }
    return i18n.resolveLanguage(this.settings.language, client);
  }
  t(key, values) { return i18n.translate(this.locale(), key, values); }
  error(error) { return i18n.formatError(error, this.locale()); }
  async setLanguage(value) {
    const previous = this.settings.language;
    this.settings.language = ['auto', 'en', 'zh'].includes(value) ? value : 'auto';
    try { await this.save(); } catch (error) { this.settings.language = previous; throw error; }
    setTooltip(this.ribbon, this.t('ribbon'));
    this.ribbon.setAttribute('aria-label', this.t('ribbon'));
    for (const { key, command } of this.commands) command.name = this.manifest.name + ': ' + this.t(key);
    for (const modal of this.modals) modal.render();
    this.settingTab.display();
  }
  openHome() { new HomeModal(this).open(); }
  async save() { await this.saveData(this.settings); }
  getPluginDir() { return path.join(this.root, this.app.vault.configDir, 'plugins', this.manifest.id); }
  onunload() { for (const modal of [...(this.modals || [])]) modal.close(); }
}

class TemplateModal extends Modal {
  constructor(plugin) { super(plugin.app); this.plugin = plugin; this.t = (key, values) => plugin.t(key, values); }
  onOpen() { this.plugin.modals.add(this); this.render(); }
  onClose() { this.plugin.modals.delete(this); this.contentEl.empty(); }
  begin(title) { this.contentEl.empty(); this.contentEl.addClass('vault-template-modal'); this.setTitle(this.t(title)); return this.contentEl; }
  run(button, callback) { return action(this.plugin, button, callback); }
}

class HomeModal extends TemplateModal {
  render() {
    const el = this.begin('title');
    languageSetting(el, this.plugin);
    description(el, this.t('intro'));
    const card = el.createDiv({ cls: 'vault-template-card' });
    card.createEl('strong', { text: this.t('current') });
    card.createEl('p', { text: this.plugin.settings.templatePath, cls: 'vault-template-path' });
    new Setting(el).setName(this.t('createTitle')).setDesc(this.t('createHint'))
      .addButton(b => b.setButtonText(this.t('create')).setCta().onClick(() => { this.close(); new CreateVaultModal(this.plugin).open(); }));
    new Setting(el).setName(this.t('setTitle')).setDesc(this.t('setHint'))
      .addButton(b => b.setButtonText(this.t('set')).onClick(() => { this.close(); new SaveTemplateModal(this.plugin).open(); }));
    new Setting(el).setName(this.t('guide')).setDesc(this.t('guideHint'))
      .addButton(b => b.setButtonText(this.t('openNote')).onClick(() => this.run(b, async () => {
        const note = this.app.vault.getAbstractFileByPath('模板/Markdown常用语法笔记.md');
        if (!note) throw new ops.TemplateError('missingGuide');
        await this.app.workspace.getLeaf(false).openFile(note); this.close();
      })));
    description(el, this.t('nativeHint'));
  }
}

class CreateVaultModal extends TemplateModal {
  constructor(plugin) { super(plugin); this.name = ''; this.parent = plugin.settings.parentPath; }
  render() {
    const el = this.begin('createTitle');
    description(el, this.t('createIntro'));
    new Setting(el).setName(this.t('vaultName')).addText(t => t.setValue(this.name).setPlaceholder(this.t('vaultExample')).onChange(v => { this.name = v; }));
    new Setting(el).setName(this.t('location')).setDesc(this.t('locationHint'))
      .addText(t => t.setValue(this.parent).onChange(v => { this.parent = v.trim(); }));
    const preview = el.createEl('p', { cls: 'vault-template-path', text: this.t('templatePath', { path: this.plugin.settings.templatePath }) });
    ops.listTemplate(this.plugin.settings.templatePath).then(result => {
      preview.setText(this.t('preview', { notes: result.files.filter(f => f.toLowerCase().endsWith('.md')).length, files: result.files.length }));
    }).catch(error => preview.setText(this.t('unavailable', { reason: this.plugin.error(error) })));
    new Setting(el).addButton(b => b.setButtonText(this.t('createButton')).setCta().onClick(() => this.run(b, async () => {
      const result = await ops.createVault({ templatePath: this.plugin.settings.templatePath, parent: this.parent, name: this.name.trim(), vaultRoot: this.plugin.root, pluginDir: this.plugin.getPluginDir(), settings: this.plugin.settings });
      this.plugin.settings.parentPath = this.parent;
      try { await this.plugin.save(); } catch (error) { new Notice(this.t('locationNotSaved', { reason: this.plugin.error(error) })); }
      this.close(); new CreatedModal(this.plugin, result).open();
    }))).addButton(b => b.setButtonText(this.t('cancel')).onClick(() => this.close()));
  }
}

class CreatedModal extends TemplateModal {
  constructor(plugin, result) { super(plugin); this.result = result; }
  render() {
    const el = this.begin('created');
    el.createEl('p', { text: this.result.target, cls: 'vault-template-path' });
    description(el, this.t('openInstructions'));
    description(el, this.t('enableInstructions'));
    new Setting(el).addButton(b => b.setButtonText(this.t('copyPath')).onClick(() => this.run(b, async () => {
      await navigator.clipboard.writeText(this.result.target); new Notice(this.t('copied'));
    }))).addButton(b => b.setButtonText(this.t('manager')).setCta().onClick(() => { window.open('obsidian://choose-vault'); }));
  }
}

class SaveTemplateModal extends TemplateModal {
  constructor(plugin) {
    super(plugin);
    this.existing = plugin.settings.templatePath;
    this.files = this.app.vault.getMarkdownFiles().sort((a, b) => a.path.localeCompare(b.path));
    this.selected = new Set(plugin.settings.selected.filter(p => this.files.some(f => f.path === p)));
    this.query = '';
    this.parent = plugin.settings.parentPath;
    this.name = this.t('templatePrefix') + new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  }
  render() {
    const el = this.begin('setTitle');
    description(el, this.t('saveIntro'));
    new Setting(el).setName(this.t('existingFolder')).addText(t => t.setValue(this.existing).onChange(v => { this.existing = v.trim(); }))
      .addButton(b => b.setButtonText(this.t('useTemplate')).onClick(() => this.run(b, async () => {
        const result = await ops.listTemplate(this.existing);
        this.plugin.settings.templatePath = result.root;
        await this.plugin.save(); new Notice(this.t('templateSet')); this.close(); this.plugin.openHome();
      })));
    new Setting(el).setName(this.t('saveHeading')).setHeading();
    new Setting(el).setName(this.t('selectNotes')).addText(t => t.setValue(this.query).setPlaceholder(this.t('search')).onChange(v => { this.query = v.toLowerCase(); renderList(); }));
    const count = el.createEl('p', { cls: 'vault-template-muted' });
    const list = el.createDiv({ cls: 'vault-template-list' });
    const renderList = () => {
      list.empty(); count.setText(this.t('selected', { count: this.selected.size }));
      for (const file of this.files.filter(f => f.path.toLowerCase().includes(this.query))) {
        new Setting(list).setName(file.path).addToggle(t => t.setValue(this.selected.has(file.path)).onChange(on => {
          if (on) this.selected.add(file.path); else this.selected.delete(file.path);
          count.setText(this.t('selected', { count: this.selected.size }));
        }));
      }
    };
    renderList();
    new Setting(el).setName(this.t('templateName')).addText(t => t.setValue(this.name).onChange(v => { this.name = v; }));
    new Setting(el).setName(this.t('templateLocation')).setDesc(this.t('outsideHint'))
      .addText(t => t.setValue(this.parent).onChange(v => { this.parent = v.trim(); }));
    description(el, this.t('attachmentHint'));
    new Setting(el).addButton(b => b.setButtonText(this.t('saveTemplate')).setCta().onClick(() => this.run(b, async () => {
      const attachments = new Set();
      for (const file of this.selected) {
        for (const linked of Object.keys(this.app.metadataCache.resolvedLinks[file] || {})) {
          const item = this.app.vault.getAbstractFileByPath(linked);
          if (item && item.extension && !['md', 'canvas', 'base'].includes(item.extension)) attachments.add(linked);
        }
      }
      const result = await ops.snapshot({ vaultRoot: this.plugin.root, selected: [...this.selected], attachments: [...attachments], parent: this.parent, name: this.name.trim(), configDir: this.app.vault.configDir });
      this.plugin.settings.templatePath = result.target;
      this.plugin.settings.selected = [...this.selected];
      await this.plugin.save(); new Notice(this.t('saved')); this.close(); this.plugin.openHome();
    })));
  }
}

class TemplateSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl;
    el.empty();
    languageSetting(el, this.plugin);
    description(el, this.plugin.t('templatePath', { path: this.plugin.settings.templatePath }));
    new Setting(el).setName(this.plugin.t('manage')).setDesc(this.plugin.t('manageHint'))
      .addButton(b => b.setButtonText(this.plugin.t('open')).setCta().onClick(() => this.plugin.openHome()));
    description(el, this.plugin.t('localHint'));
  }
}

module.exports = VaultTemplatePlugin;
