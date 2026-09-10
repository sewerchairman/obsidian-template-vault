const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const ops = require('./vault-ops');
const root = path.join(__dirname, 'test-output');
async function fixture() {
  await fs.mkdir(root, { recursive: true });
  const base = await fs.mkdtemp(path.join(root, 'run-'));
  const vault = path.join(base, 'current');
  await fs.mkdir(path.join(vault, '模板'), { recursive: true });
  await fs.mkdir(path.join(vault, '附件'));
  await fs.writeFile(path.join(vault, '模板', '指南.md'), '# 测试\n\n![[附件/图.png]]\n');
  await fs.writeFile(path.join(vault, '附件', '图.png'), Buffer.from([0, 255, 12, 42]));
  await fs.writeFile(path.join(vault, '私人笔记.md'), 'do not copy');
  return { base, vault };
}
test('save selected notes, retain image bytes, create two generations of vaults with plugin', async () => {
  const { base, vault } = await fixture();
  const snapshot = await ops.snapshot({ vaultRoot: vault, selected: ['模板/指南.md'], attachments: ['附件/图.png'], parent: base, name: '模板快照' });
  assert.equal(await fs.readFile(path.join(snapshot.target, '模板/指南.md'), 'utf8'), '# 测试\n\n![[附件/图.png]]\n');
  assert.deepEqual(await fs.readFile(path.join(snapshot.target, '附件/图.png')), Buffer.from([0,255,12,42]));
  await assert.rejects(fs.access(path.join(snapshot.target, '私人笔记.md')));
  const first = await ops.createVault({ templatePath: snapshot.target, parent: base, name: '中文 新仓库', vaultRoot: vault, pluginDir: __dirname, settings: { selected: ['模板/指南.md'] } });
  assert.equal(await fs.readFile(path.join(first.target, '模板/指南.md'), 'utf8'), '# 测试\n\n![[附件/图.png]]\n');
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(first.target, '.obsidian/community-plugins.json'), 'utf8')), [ops.ID]);
  const pluginDir = path.join(first.target, '.obsidian/plugins', ops.ID);
  const settings = JSON.parse(await fs.readFile(path.join(pluginDir, 'data.json'), 'utf8'));
  assert.equal(settings.templatePath, snapshot.target);
  const second = await ops.createVault({ templatePath: settings.templatePath, parent: base, name: '下一代仓库', vaultRoot: first.target, pluginDir, settings });
  assert.deepEqual(await fs.readFile(path.join(second.target, '附件/图.png')), Buffer.from([0,255,12,42]));
});
test('existing directory is preserved, invalid names and nested destinations are rejected', async () => {
  const { base, vault } = await fixture();
  const seed = await ops.snapshot({ vaultRoot: vault, selected: ['模板/指南.md'], parent: base, name: 'seed' });
  const args = { templatePath: seed.target, parent: base, name: 'current', vaultRoot: vault, pluginDir: __dirname, settings: {} };
  await assert.rejects(ops.createVault(args));
  assert.equal(await fs.readFile(path.join(vault, '私人笔记.md'), 'utf8'), 'do not copy');
  await assert.rejects(ops.createVault({ ...args, parent: vault, name: 'nested' }), /嵌套/);
  for (const name of ['../escape', 'CON', 'a/b', 'a\\b', 'bad:', 'trailing.', '..']) assert.throws(() => ops.nameCheck(name));
});
test('empty selection, missing attachment, and escaping paths fail before creating output', async () => {
  const { base, vault } = await fixture();
  await assert.rejects(ops.snapshot({ vaultRoot: vault, selected: [], parent: base, name: 'empty' }));
  await assert.rejects(ops.snapshot({ vaultRoot: vault, selected: ['../outside.md'], parent: base, name: 'escape' }));
  await assert.rejects(ops.snapshot({ vaultRoot: vault, selected: ['模板/指南.md'], attachments: ['missing.png'], parent: base, name: 'missing' }));
  for (const name of ['empty','escape','missing']) await assert.rejects(fs.access(path.join(base, name)));
});
test('third-party plugin code, workspace state and trash do not propagate from a template', async () => {
  const { base, vault } = await fixture();
  await fs.mkdir(path.join(vault, '.obsidian/plugins/other'), { recursive:true });
  await fs.writeFile(path.join(vault, '.obsidian/plugins/other/main.js'), 'throw 1');
  await fs.writeFile(path.join(vault, '.obsidian/workspace.json'), '{}');
  await fs.mkdir(path.join(vault, '.trash'));
  await fs.writeFile(path.join(vault, '.trash/deleted.md'), 'deleted');
  const listed = await ops.listTemplate(vault);
  assert(!listed.files.some(f => f.includes('workspace') || f.includes('/other/') || f.includes('.trash')));
});
test('directory junction is rejected instead of copying outside files', async () => {
  const { base, vault } = await fixture();
  await fs.mkdir(path.join(base, 'outside'));
  await fs.symlink(path.join(base, 'outside'), path.join(vault, 'linked'), 'junction');
  await assert.rejects(ops.listTemplate(vault), /联接/);
});
test('bundled plugin registers ribbon, commands, settings and opens its home panel', async () => {
  const events = [];
  class Element {
    addClass() {} empty() {} setText() {} createEl() { return new Element(); } createDiv() { return new Element(); }
  }
  class Plugin {
    async loadData() { return {}; }
    addRibbonIcon(icon, title, callback) { events.push({type:'ribbon', callback}); }
    addCommand(command) { events.push({type:'command', ...command}); }
    addSettingTab(tab) { events.push({type:'settings',tab}); }
  }
  class Modal {
    constructor(app) { this.app=app; this.contentEl=new Element(); }
    open() { this.onOpen(); } close() {}
  }
  class Setting {
    setName() { return this; } setDesc() { return this; }
    addButton(callback) {
      const button = {setButtonText(){return this;},setCta(){return this;},onClick(){return this;}};
      callback(button); return this;
    }
  }
  class Adapter { getBasePath() { return __dirname; } }
  const context = { module:{exports:{}}, require: name => name === 'obsidian' ? { Plugin, Modal, Setting, FileSystemAdapter:Adapter, PluginSettingTab:class{}, Notice:class{} } : require(name), console, Buffer };
  vm.runInNewContext(await fs.readFile(path.join(__dirname,'main.js'),'utf8'),context);
  const plugin = new context.module.exports();
  plugin.app = { vault:{adapter:new Adapter()} };
  await plugin.onload();
  assert.equal(events.filter(e=>e.type==='command').length,3);
  events.find(e=>e.type==='ribbon').callback();
  assert.equal(events.filter(e=>e.type==='settings').length,1);
});
