const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ID = 'local-vault-template';
const CONFIGS = new Set(['templates.json', 'core-plugins.json', 'app.json', 'appearance.json']);
const BLOCKED = new Set(['.git', '.trash', 'node_modules', '.DS_Store']);
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
class TemplateError extends Error {
  constructor(code, values = {}, cause) {
    super(code);
    this.templateCode = code;
    this.values = values;
    this.cause = cause;
  }
}

function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
function nameCheck(name) {
  if (!name || name.trim() !== name || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name) || /^\.{1,2}$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new TemplateError('invalidName');
  }
  if (name.length > 100) throw new TemplateError('longName');
  return name;
}
async function folder(value) {
  if (!path.isAbsolute(value)) throw new TemplateError('absolutePath');
  const real = await fs.realpath(value);
  if (!(await fs.stat(real)).isDirectory()) throw new TemplateError('notFolder', { path: value });
  return real;
}
async function fileInside(root, relative) {
  if (path.isAbsolute(relative)) throw new TemplateError('relativePath');
  const target = path.resolve(root, relative);
  if (!inside(root, target)) throw new TemplateError('outsideVault', { path: relative });
  let walk = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    walk = path.join(walk, part);
    if ((await fs.lstat(walk)).isSymbolicLink()) throw new TemplateError('symlink', { path: relative });
  }
  if (!(await fs.stat(target)).isFile()) throw new TemplateError('notFile', { path: relative });
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
      if (entry.isSymbolicLink()) throw new TemplateError('symlink', { path: relative });
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative);
      else if (entry.isFile()) files.push(relative);
    }
  }
  await walk(root);
  if (!files.some(f => f.toLowerCase().endsWith('.md'))) throw new TemplateError('emptyTemplate');
  return { root, files: files.sort() };
}
async function destination(parent, name, forbidden) {
  const root = await folder(parent);
  const target = path.join(root, nameCheck(name));
  for (const protectedRoot of forbidden) {
    const real = await folder(protectedRoot);
    if (inside(real, target) || inside(target, real)) throw new TemplateError('nested');
  }
  try { await fs.lstat(target); throw new TemplateError('exists', { path: target }); }
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
  else throw new TemplateError('invalidCore');
  put(entries, '.obsidian/core-plugins.json', value);
}
async function writeNew(target, entries) {
  // Exclusive directory creation and file writes: an existing vault is never overwritten.
  await fs.mkdir(target);
  try {
    for (const entry of entries) {
      const out = path.resolve(target, entry.relative);
      if (!inside(target, out)) throw new TemplateError('invalidTarget');
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, entry.bytes, { flag: 'wx' });
      if (hash(await fs.readFile(out)) !== hash(entry.bytes)) throw new TemplateError('verifyFailed', { path: entry.relative });
    }
  } catch (error) {
    throw new TemplateError('partial', { path: target }, error);
  }
  return { target, files: entries.length, hashes: entries.map(e => ({ path: e.relative, sha256: hash(e.bytes) })) };
}
async function snapshot({ vaultRoot, selected, attachments = [], parent, name, templatePath, templateFolder = '模板', configDir = '.obsidian' }) {
  const source = await folder(vaultRoot);
  if (!selected.length) throw new TemplateError('selectOne');
  const protectedRoots = [source];
  if (templatePath) protectedRoots.push(templatePath);
  const target = await destination(parent, name, protectedRoots);
  const entries = await collect(source, [...selected, ...attachments]);
  const templateInfo = path.join(source, configDir, 'templates.json');
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
  for (const file of ['manifest.json', 'main.js', 'styles.css']) {
    const source = await fileInside(pluginRoot, file);
    entries.push({ relative: '.obsidian/plugins/' + ID + '/' + file, bytes: await fs.readFile(source) });
  }
  put(entries, '.obsidian/plugins/' + ID + '/data.json', { ...settings, templatePath: template.root, parentPath: path.dirname(target) });
  put(entries, '.obsidian/community-plugins.json', [ID]);
  return writeNew(target, entries);
}
module.exports = { ID, TemplateError, inside, nameCheck, folder, listTemplate, snapshot, createVault };
