const fs = require('fs/promises');
const path = require('path');
const vm = require('vm');

async function loadPlugin({ saved = {}, client = 'en', languageThrows = false } = {}) {
  const events = { commands: [], modals: [], notices: [], settings: [], ribbon: null };
  class Element {
    constructor(text = '') { this.text = text; this.children = []; this.controls = []; }
    addClass() {} setAttribute(key, value) { this[key] = value; }
    empty() { this.children = []; this.controls = []; this.text = ''; }
    setText(value) { this.text = value; }
    createEl(tag, options = {}) { const el = new Element(options.text || ''); this.children.push(el); return el; }
    createDiv(options) { return this.createEl('div', options); }
    allText() { return [this.text, ...this.children.flatMap(c => c.allText())]; }
  }
  class Component {
    constructor(el, kind) { this.el = el; this.kind = kind; this.options = {}; el.controls.push(this); }
    setButtonText(v) { this.el.children.push(new Element(v)); return this; }
    setPlaceholder(v) { this.placeholder = v; return this; }
    setValue(v) { this.value = v; return this; }
    setDisabled(v) { this.disabled = v; return this; }
    setCta() { return this; }
    addOption(k, v) { this.options[k] = v; return this; }
    onChange(fn) { this.change = fn; return this; }
    onClick(fn) { this.click = fn; return this; }
  }
  class Setting {
    constructor(parent) { this.el = parent.createDiv(); }
    setName(v) { this.el.children.push(new Element(v)); return this; }
    setDesc(v) { this.el.children.push(new Element(v)); return this; }
    setHeading() { return this; }
    addButton(fn) { fn(new Component(this.el, 'button')); return this; }
    addText(fn) { fn(new Component(this.el, 'text')); return this; }
    addToggle(fn) { fn(new Component(this.el, 'toggle')); return this; }
    addDropdown(fn) { fn(new Component(this.el, 'dropdown')); return this; }
  }
  class Plugin {
    async loadData() { return structuredClone(saved); }
    async saveData(value) { saved = structuredClone(value); }
    addRibbonIcon(icon, title, callback) { const el = new Element(); events.ribbon = { el, title, callback }; return el; }
    addCommand(command) { const registered = { ...command, id: this.manifest.id + ':' + command.id, name: this.manifest.name + ': ' + command.name }; events.commands.push(registered); return registered; }
    addSettingTab(tab) { events.settings.push(tab); }
  }
  class Modal {
    constructor(app) { this.app = app; this.contentEl = new Element(); }
    setTitle(title) { this.title = title; return this; }
    open() { events.modals.push(this); this.onOpen(); }
    close() { this.onClose(); }
  }
  class Adapter { getBasePath() { return __dirname; } }
  const obsidian = {
    Plugin, Modal, Setting, FileSystemAdapter: Adapter,
    PluginSettingTab: class { constructor() { this.containerEl = new Element(); } },
    Notice: class { constructor(message) { events.notices.push(message); } },
    getLanguage: () => { if (languageThrows) throw new Error('unavailable'); return client; },
    setTooltip: (el, tooltip) => { el.tooltip = tooltip; },
  };
  const context = { module: { exports: {} }, require: name => {
    if (name === 'obsidian') return obsidian;
    if (name.startsWith('.')) throw new Error('Unexpected runtime source dependency: ' + name);
    return require(name);
  }, console, Buffer, navigator: {clipboard:{writeText:async()=>{}}}, window:{open:()=>{}} };
  const source = await fs.readFile(path.join(__dirname, 'main.js'), 'utf8');
  vm.runInNewContext(source + '\nthis.testModals = { HomeModal, CreateVaultModal, SaveTemplateModal, CreatedModal };', context);
  const plugin = new context.module.exports();
  plugin.manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'manifest.json'), 'utf8'));
  plugin.app = { vault: { adapter: new Adapter(), configDir: '.obsidian', getMarkdownFiles: () => [{path:'Guide.md'}], getAbstractFileByPath: () => null }, metadataCache:{resolvedLinks:{}} };
  await plugin.onload();
  return { plugin, events, classes: context.testModals, getSaved: () => saved };
}
module.exports = { loadPlugin };
