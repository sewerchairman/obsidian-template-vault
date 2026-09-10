const messages = {
  en: {
    title: 'Template vault', ribbon: 'Template vault: configure or create a vault',
    openCommand: 'Open template manager', setCommand: 'Set vault template', createCommand: 'Create vault from template',
    language: 'Language', languageHint: 'Auto uses Chinese for Chinese Obsidian clients, and English otherwise.', auto: 'Auto (follow Obsidian)',
    intro: 'Prepare your essential notes once, and include them in each new vault.', current: 'Current template',
    createTitle: 'Create vault from template', createHint: 'Choose a name and location to copy the template and this plugin.', create: 'New vault',
    setTitle: 'Set vault template', setHint: 'Save selected notes from this vault as a reusable template.', set: 'Set template',
    guide: 'Markdown reference', guideHint: 'Look up headings, code, images, links, and tables.', openNote: 'Open note',
    missingGuide: 'This vault has no bundled Markdown reference. Create a vault using the example template first.',
    nativeHint: 'Use New vault here. Obsidian’s built-in Create new vault does not apply this template.',
    createIntro: 'The new vault will include the template’s notes, attachments, and this plugin.',
    vaultName: 'Vault name', vaultExample: 'For example: Project notes', location: 'Parent folder', locationHint: 'An existing folder, for example D:\\Notes.',
    templatePath: 'Template: {path}', preview: '{notes} notes and {files} files in this template.', unavailable: 'Template unavailable: {reason}',
    createButton: 'Create vault', chooseFirst: 'Select an available template in Set vault template first.',
    locationNotSaved: 'The vault was created, but its default location could not be saved: {reason}', cancel: 'Cancel',
    created: 'Vault created', openInstructions: 'In the vault manager, select Open folder as vault and choose the folder above.',
    enableInstructions: 'This plugin is included. If the new vault opens in Restricted mode, enable Template Vault in Community plugins.',
    copyPath: 'Copy path', copied: 'Vault path copied', manager: 'Open vault manager',
    saveIntro: 'Select the notes each new vault should contain. A template is an independent snapshot, not a live copy.',
    existingFolder: 'Use an existing template folder', useTemplate: 'Use this template', templateSet: 'Vault template selected',
    saveHeading: 'Save a template from this vault', selectNotes: 'Select notes', search: 'Filter by file name', selected: '{count} notes selected',
    templateName: 'Template name', templatePrefix: 'Vault-template-', templateLocation: 'Template parent folder', outsideHint: 'Store the template outside this vault.',
    attachmentHint: 'Recognized images, PDFs, and other attachments are included. Select linked notes separately if you need them.',
    saveTemplate: 'Save and use template', saved: 'Template saved and ready for new vaults',
    manage: 'Manage vault templates', manageHint: 'Choose template content or create a new vault.', open: 'Open',
    localHint: 'Files are written only when you save or create. No background monitoring or changes to other existing vaults.',
    invalidName: 'Enter a valid folder name without slashes, colons, or trailing spaces.', longName: 'Use a name of 100 characters or fewer.',
    absolutePath: 'Enter a full folder path, for example D:\\Notes.', notFolder: 'Not a folder: {path}',
    relativePath: 'Files must use paths relative to the vault.', outsideVault: 'The file path is outside the vault: {path}',
    symlink: 'Templates cannot include symbolic links or directory junctions: {path}', notFile: 'Not a regular file: {path}',
    emptyTemplate: 'The template folder contains no Markdown notes.', nested: 'Choose a folder outside the current vault and template to avoid nested vaults.',
    exists: 'The target folder already exists. Choose another name: {path}', invalidCore: 'The core plugin configuration must be a JSON object or array.',
    invalidTarget: 'Invalid destination path.', verifyFailed: 'File verification failed: {path}',
    partial: 'Creation did not finish. Partial files remain at {path}. Check them and retry with another name. Reason: {reason}',
    selectOne: 'Select at least one note.', missingPath: 'File or folder not found: {path}', denied: 'Permission denied: {path}',
    badJson: 'A configuration file contains invalid JSON.', unknownError: 'Operation failed: {reason}',
  },
  zh: {
    title: '仓库模板', ribbon: '仓库模板：设置模板 / 新建仓库',
    openCommand: '打开仓库模板', setCommand: '设置仓库模板', createCommand: '从模板新建仓库',
    language: '界面语言', languageHint: '自动模式下，中文 Obsidian 客户端使用中文，其余使用英文。', auto: '自动（跟随 Obsidian）',
    intro: '把常用笔记准备一次，之后的新仓库直接带上。', current: '当前使用的模板',
    createTitle: '从模板新建仓库', createHint: '输入名称与存放位置，自动复制模板和本插件。', create: '新建仓库',
    setTitle: '设置仓库模板', setHint: '选择当前仓库中的笔记，保存成可重复使用的模板。', set: '设置模板',
    guide: 'Markdown 语法速查', guideHint: '查看标题、代码、图片、链接和表格的写法。', openNote: '打开笔记',
    missingGuide: '当前仓库尚未包含速查笔记，请从示例模板创建仓库。',
    nativeHint: '请使用这里的“新建仓库”。Obsidian 自带的“创建新仓库”不会自动套用此模板。',
    createIntro: '新仓库会带上模板里的笔记、附件和本插件。',
    vaultName: '仓库名称', vaultExample: '例如：项目笔记', location: '存放位置', locationHint: '现有的父文件夹，例如 D:\\Notes。',
    templatePath: '模板：{path}', preview: '模板包含 {notes} 篇笔记，共 {files} 个文件。', unavailable: '模板不可用：{reason}',
    createButton: '创建仓库', chooseFirst: '请先在“设置仓库模板”中指定可用的模板。',
    locationNotSaved: '仓库已创建，但默认位置未能保存：{reason}', cancel: '取消',
    created: '仓库已创建', openInstructions: '在仓库管理器中选择“打开文件夹为仓库”，然后选择上面的文件夹。',
    enableInstructions: '新仓库已携带本插件。若处于受限模式，请在第三方插件设置中启用 Template Vault（仓库模板）。',
    copyPath: '复制路径', copied: '仓库路径已复制', manager: '打开仓库管理器',
    saveIntro: '勾选希望每个新仓库都具备的笔记。保存的是独立副本，后续修改原笔记不会自动改变已有模板。',
    existingFolder: '使用已有模板文件夹', useTemplate: '设为当前模板', templateSet: '已设置仓库模板',
    saveHeading: '从当前仓库保存新模板', selectNotes: '选择笔记', search: '输入文件名筛选', selected: '已选择 {count} 篇笔记',
    templateName: '模板名称', templatePrefix: '仓库模板-', templateLocation: '模板存放位置', outsideHint: '模板应保存在当前仓库之外。',
    attachmentHint: '会一并复制已识别的图片、PDF 等附件引用；关联笔记请自行勾选。',
    saveTemplate: '保存并设为仓库模板', saved: '已保存模板，可用于创建新仓库',
    manage: '管理仓库模板', manageHint: '选择模板内容，或从模板新建仓库。', open: '打开',
    localHint: '仅在点击保存或创建时写入文件。不会后台监控或自动修改其他已有仓库。',
    invalidName: '请填写有效的文件夹名称，不要包含斜杠、冒号或末尾空格。', longName: '名称过长，请使用 100 个字符以内的名称。',
    absolutePath: '请填写文件夹的完整路径，例如 D:\\Notes。', notFolder: '路径不是文件夹：{path}',
    relativePath: '文件必须使用仓库内的相对路径。', outsideVault: '文件路径超出仓库：{path}',
    symlink: '模板不包含符号链接或目录联接：{path}', notFile: '不是普通文件：{path}',
    emptyTemplate: '模板文件夹中没有 Markdown 笔记。', nested: '请将新文件夹放在当前仓库和模板之外，避免仓库嵌套。',
    exists: '目标文件夹已经存在，请换一个名称：{path}', invalidCore: '核心插件配置必须是 JSON 对象或数组。',
    invalidTarget: '不合法的目标路径。', verifyFailed: '写入校验失败：{path}',
    partial: '创建未完成，部分文件保留在 {path}。请检查后使用另一个名称重试。原因：{reason}',
    selectOne: '请至少选择一篇笔记。', missingPath: '找不到文件或文件夹：{path}', denied: '没有访问权限：{path}',
    badJson: '配置文件中的 JSON 格式有误。', unknownError: '操作失败：{reason}',
  },
};
function resolveLanguage(preference, clientLanguage) {
  if (preference === 'en' || preference === 'zh') return preference;
  return typeof clientLanguage === 'string' && /^zh(?:[-_]|$)/i.test(clientLanguage.trim()) ? 'zh' : 'en';
}
function translate(language, key, values = {}) {
  const template = (messages[language] || messages.en)[key] ?? messages.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => values[name] === undefined ? match : String(values[name]));
}
function formatError(error, language) {
  if (error?.templateCode) {
    const values = { ...error.values };
    if (error.cause) values.reason = formatError(error.cause, language);
    return translate(language, error.templateCode, values);
  }
  if (error?.code === 'ENOENT') return translate(language, 'missingPath', { path: error.path || '' });
  if (['EACCES', 'EPERM'].includes(error?.code)) return translate(language, 'denied', { path: error.path || '' });
  if (error instanceof SyntaxError) return translate(language, 'badJson');
  return translate(language, 'unknownError', { reason: error?.message || String(error) });
}
module.exports = { messages, resolveLanguage, translate, formatError };
