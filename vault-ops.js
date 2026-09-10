const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ID = 'local-vault-template';
const CONFIGS = new Set(['templates.json', 'core-plugins.json', 'app.json', 'appearance.json']);
const BLOCKED = new Set(['.git', '.trash', 'node_modules', '.DS_Store']);
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
function nameCheck(name) {
  if (!name || name.trim() !== name || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name) || /^\.{1,2}$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new Error('请填写有效的文件夹名称，不要包含斜杠、冒号或末尾空格。');
  }
  if (name.length > 100) throw new Error('名称过长，请使用 100 个字符以内的名称。');
  return name;
}
async function folder(value) {
  if (!path.isAbsolute(value)) throw new Error('请填写文件夹的完整路径，例如 D:\\Obsidianhub。');
  const real = await fs.realpath(value);
  if (!(await fs.stat(real)).isDirectory()) throw new Error('路径不是文件夹：' + value);
  return real;
}
async function fileInside(root, relative) {
  if (path.isAbsolute(relative)) throw new Error('文件必须使用仓库内的相对路径。');
  const target = path.resolve(root, relative);
  if (!inside(root, target)) throw new Error('文件路径超出仓库：' + relative);
  let walk = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    walk = path.join(walk, part);
    if ((await fs.lstat(walk)).isSymbolicLink()) throw new Error('模板不包含快捷链接或目录联接：' + relative);
  }
  if (!(await fs.stat(target)).isFile()) throw new Error('不是普通文件：' + relative);
  return target;
}
async function listTemplate(source) {
  const root = await folder(source);
  const files = [];
  async function walk(dir, prefix = '') {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (BLOCKED.has(entry.name)) continue;
      const relative = prefix ? prefix + '/' + entry.name : entry.name;
      if (relative.startsWith('.obsidian/') && !CONFIGS.has(relative.slice(10))) continue;
      if (entry.isSymbolicLink()) throw new Error('模板中包含快捷链接或目录联接：' + relative);
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative);
      else if (entry.isFile()) files.push(relative);
    }
  }
  await walk(root);
  if (!files.some(f => f.toLowerCase().endsWith('.md'))) throw new Error('模板文件夹中没有 Markdown 笔记。');
  return { root, files: files.sort() };
}
async function destination(parent, name, forbidden) {
  const root = await folder(parent);
  const target = path.join(root, nameCheck(name));
  for (const protectedRoot of forbidden) {
    const real = await folder(protectedRoot);
    if (inside(real, target) || inside(target, real)) throw new Error('请将新文件夹放在当前仓库和模板文件夹之外，避免仓库嵌套。');
  }
  try { await fs.lstat(target); throw new Error('目标文件夹已经存在，请换一个名称：' + target); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return target;
}
async function collect(root, files) {
  const entries = [];
  for (const relative of [...new Set(files)].sort()) {
    const source = await fileInside(root, relative);
    const bytes = await fs.readFile(source);
    entries.push({ relative: relative.replace(/\\/g, '/'), bytes });
  }
  return entries;
}
function put(entries, relative, object) {
  const bytes = Buffer.from(JSON.stringify(object, null, 2) + '\n');
  const existing = entries.find(e => e.relative === relative);
  if (existing) existing.bytes = bytes;
  else entries.push({ relative, bytes });
}
function coreSettings(entries) {
  const entry = entries.find(e => e.relative === '.obsidian/core-plugins.json');
  const value = entry ? JSON.parse(entry.bytes.toString('utf8').replace(/^\uFEFF/, '')) : { 'file-explorer': true, 'global-search': true, 'switcher': true, 'backlink': true, 'outline': true, 'command-palette': true, 'file-recovery': true };
  if (Array.isArray(value)) { if (!value.includes('templates')) value.push('templates'); }
  else if (value && typeof value === 'object') value.templates = true;
  else throw new Error('模板中的核心插件配置不是有效的对象或数组。');
  put(entries, '.obsidian/core-plugins.json', value);
}
async function writeNew(target, entries) {
  // Exclusive directory creation and file writes: an existing vault is never overwritten.
  await fs.mkdir(target);
  try {
    for (const entry of entries) {
      const out = path.resolve(target, entry.relative);
      if (!inside(target, out)) throw new Error('不合法的目标路径。');
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, entry.bytes, { flag: 'wx' });
      if (hash(await fs.readFile(out)) !== hash(entry.bytes)) throw new Error('写入校验失败：' + entry.relative);
    }
  } catch (error) {
    throw new Error('创建未完成，已写入的文件保留在 ' + target + '。请检查后使用另一个名称重试。原因：' + error.message);
  }
  return { target, files: entries.length, hashes: entries.map(e => ({ path: e.relative, sha256: hash(e.bytes) })) };
}
async function snapshot({ vaultRoot, selected, attachments = [], parent, name, templatePath, templateFolder = '模板' }) {
  const source = await folder(vaultRoot);
  if (!selected.length) throw new Error('请至少选择一篇笔记。');
  const protectedRoots = [source];
  if (templatePath) protectedRoots.push(templatePath);
  const target = await destination(parent, name, protectedRoots);
  const entries = await collect(source, [...selected, ...attachments]);
  const templateInfo = path.join(source, '.obsidian/templates.json');
  try {
    const original = JSON.parse((await fs.readFile(templateInfo, 'utf8')).replace(/^\uFEFF/, ''));
    templateFolder = original.folder || templateFolder;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  put(entries, '.obsidian/templates.json', { folder: templateFolder, dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm' });
  coreSettings(entries);
  return writeNew(target, entries);
}
async function createVault({ templatePath, parent, name, vaultRoot, pluginDir, settings }) {
  const template = await listTemplate(templatePath);
  const target = await destination(parent, name, [template.root, vaultRoot]);
  const entries = await collect(template.root, template.files);
  coreSettings(entries);
  const pluginRoot = await folder(pluginDir);
  for (const file of ['manifest.json', 'main.js', 'vault-ops.js', 'styles.css']) {
    const source = await fileInside(pluginRoot, file);
    entries.push({ relative: '.obsidian/plugins/' + ID + '/' + file, bytes: await fs.readFile(source) });
  }
  put(entries, '.obsidian/plugins/' + ID + '/data.json', { ...settings, templatePath: template.root, parentPath: path.dirname(target) });
  put(entries, '.obsidian/community-plugins.json', [ID]);
  return writeNew(target, entries);
}
module.exports = { ID, inside, nameCheck, folder, listTemplate, snapshot, createVault };
