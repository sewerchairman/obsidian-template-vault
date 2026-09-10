const test = require('node:test');
const assert = require('node:assert/strict');
const { messages, resolveLanguage, translate, formatError } = require('./i18n');
const { TemplateError } = require('./vault-ops');
const { loadPlugin } = require('./test-support');

test('auto follows all Chinese locale variants and defaults to English otherwise', () => {
  for (const locale of ['zh','zh-CN','zh-TW','zh_Hant','ZH-hans',' zh-HK ']) assert.equal(resolveLanguage('auto',locale),'zh');
  for (const locale of ['en','de','ja','',null,undefined,'zhunknown']) assert.equal(resolveLanguage('auto',locale),'en');
  assert.equal(resolveLanguage('en','zh'),'en');
  assert.equal(resolveLanguage('zh','en'),'zh');
  assert.equal(resolveLanguage(undefined,'zh'),'zh');
});
test('English and Chinese dictionaries are complete with matching placeholders', () => {
  assert.deepEqual(Object.keys(messages.en).sort(),Object.keys(messages.zh).sort());
  for (const key of Object.keys(messages.en)) {
    assert(!/[\u3400-\u9fff]/.test(messages.en[key]),key);
    assert.deepEqual(messages.en[key].match(/\{\w+\}/g)?.sort(), messages.zh[key].match(/\{\w+\}/g)?.sort(),key);
  }
  assert.equal(translate('en','selected',{count:3}),'3 notes selected');
});
test('file errors and nested failures render in the chosen language', () => {
  const failure = new TemplateError('partial', {path:'D:/Notes'}, new TemplateError('exists',{path:'D:/Notes/New'}));
  assert.match(formatError(failure,'en'),/Creation did not finish/);
  assert.match(formatError(failure,'en'),/already exists/);
  assert.match(formatError(failure,'zh'),/创建未完成/);
  assert.match(formatError({code:'ENOENT',path:'missing'},'en'),/not found/);
});
test('upgrade preserves existing paths and selections; client detection uses Obsidian API', async () => {
  const saved = {templatePath:'D:/Existing',parentPath:'D:/Notes',selected:['Guide.md']};
  const {plugin} = await loadPlugin({saved,client:'zh-TW'});
  assert.equal(plugin.locale(),'zh');
  assert.equal(plugin.settings.language,'auto');
  assert.equal(plugin.settings.templatePath,saved.templatePath);
  assert.equal(plugin.settings.selected[0],'Guide.md');
  const fallback = await loadPlugin({languageThrows:true});
  assert.equal(fallback.plugin.locale(),'en');
});
test('manual switch persists, updates open UI/ribbon/commands and preserves modal drafts', async () => {
  const {plugin,events,classes,getSaved} = await loadPlugin({client:'zh',saved:{templatePath:'D:/Example',selected:['Guide.md']}});
  plugin.openHome();
  const home = events.modals[0];
  const save = new classes.SaveTemplateModal(plugin); save.open();
  save.name='My custom template'; save.query='guide';
  await plugin.setLanguage('en');
  assert.equal(home.title,'Template vault');
  assert.equal(save.title,'Set vault template');
  assert.equal(save.name,'My custom template');
  assert.equal(save.query,'guide');
  assert(save.selected.has('Guide.md'));
  assert.equal(events.commands.length,3);
  assert(events.commands.every(c=>!/[\u3400-\u9fff]/.test(c.name)));
  assert.match(events.ribbon.el.tooltip,/Template vault/);
  assert.equal(getSaved().language,'en');
  const next = await loadPlugin({client:'zh',saved:getSaved()});
  assert.equal(next.plugin.locale(),'en');
  await plugin.setLanguage('auto');
  assert.equal(home.title,'仓库模板');
  plugin.onunload(); assert.equal(plugin.modals.size,0);
});
test('every dialog renders English text without external source modules', async () => {
  const {plugin,classes} = await loadPlugin({client:'en',saved:{templatePath:'D:/Example'}});
  for (const [name,Modal] of Object.entries(classes)) {
    const modal = name==='CreatedModal' ? new Modal(plugin,{target:'D:/Notes/New'}) : new Modal(plugin);
    modal.open();
    assert(!/[\u3400-\u9fff]/.test(modal.title),name);
    for (const text of modal.contentEl.allText()) assert(!/[\u3400-\u9fff]/.test(text),name+': '+text);
    modal.close();
  }
});
test('language dropdown handles persistence and a failed save rolls back preference', async () => {
  const {plugin,events} = await loadPlugin({client:'en'});
  plugin.openHome();
  const dropdown=events.modals[0].contentEl.children.flatMap(el=>el.controls).find(c=>c.kind==='dropdown');
  assert.deepEqual(Object.keys(dropdown.options),['auto','en','zh']);
  await dropdown.change('zh');
  assert.equal(plugin.locale(),'zh');
  plugin.saveData=async()=>{throw new Error('storage failure');};
  await assert.rejects(plugin.setLanguage('en'));
  assert.equal(plugin.settings.language,'zh');
});
