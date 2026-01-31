export type Locale = "en" | "zh";

const messages = {
  en: {
    // Main flow
    selectLanguage: "Select language",
    scriptDir: "Script installation directory",
    dirEmpty: "Directory cannot be empty",
    canceled: "Operation canceled",

    // Script config
    soundDone: "Task completed",
    soundWaiting: "Waiting for input",
    soundPermission: "Permission required",
    commentDone: "Claude task completion sound",
    commentWaiting: "Claude waiting for input sound",
    commentPermission: "Claude permission request sound",

    // Notifications
    notifyTitleDone: "Claude Code",
    notifyMsgDone: "Task completed",
    notifyTitleWaiting: "Claude Code",
    notifyMsgWaiting: "Waiting for your input",
    notifyTitlePermission: "Claude Code",
    notifyMsgPermission: "Permission required",

    // Voice (say command)
    sayDone: "Task completed",
    sayWaiting: "Waiting for input",
    sayPermission: "Permission required",

    // Spinner
    checkingSettings: "Checking Claude settings.json...",
    readFailed: "Failed to read config",
    configError: "Config file has syntax errors, please fix manually:",
    file: "File:",
    error: "Error:",
    jsonHint: "Hint: Use a JSON validator like https://jsonlint.com",
    configOk: "Config check passed",
    creatingDir: "Creating script directory...",
    dirReady: "Script directory ready",
    installingScripts: "Installing scripts...",
    scriptsInstalled: (n: number) => `Installed ${n} scripts`,
    updatingSettings: "Updating Claude settings.json...",
    settingsUpdated: "Config file updated",

    // Results
    installedScripts: "✓ Installed scripts:",
    configuredHooks: "✓ Configured hooks:",
    installComplete: "Installation complete",
    done: "Done!",

    // Sound select
    previewHint: "(Space to preview, Enter to select)",
    default: "default",

    // Feature toggles
    featureToggle: "Select features to enable (Space to toggle, Enter to confirm)",
    featureSound: "Sound effects",
    featureNotification: "macOS notifications",
    featureVoice: "Voice announcements",
    featureNtfy: "ntfy push notifications",
    featureRequired: "Please select at least one feature",

    // Ntfy config
    ntfyUrl: "ntfy server URL",
    ntfyUrlPlaceholder: "https://ntfy.sh or http://localhost:80",
    ntfyUrlEmpty: "URL cannot be empty",
    ntfyTopic: "ntfy topic name",
    ntfyTopicPlaceholder: "agent-notify",
    ntfyTopicEmpty: "Topic cannot be empty",

    // Platform selection
    platformSelect: "Select target platform (Space to toggle, Enter to confirm)",
    platformClaudeCode: "Claude Code",
    platformClaudeCodeHint: "hooks in ~/.claude/settings.json",
    platformCursor: "Cursor",
    platformCursorHint: "hooks in ~/.cursor/hooks.json",
    platformCodex: "OpenAI Codex",
    platformCodexHint: "notify in ~/.codex/config.toml",
    platformRequired: "Please select at least one platform",

    // Cursor specific
    cursorCommentDone: "Cursor task completion sound",
    cursorCommentWaiting: "Cursor waiting for input sound",
    cursorCommentPermission: "Cursor permission request sound",
    cursorNotifyTitleDone: "Cursor",
    cursorNotifyMsgDone: "Task completed",
    cursorNotifyTitleWaiting: "Cursor",
    cursorNotifyMsgWaiting: "Waiting for your input",
    cursorNotifyTitlePermission: "Cursor",
    cursorNotifyMsgPermission: "Permission required",
    cursorSayDone: "Cursor task completed",
    cursorSayWaiting: "Cursor waiting for input",
    cursorSayPermission: "Cursor permission required",

    // Codex specific
    codexScriptName: "codex-notify.sh",
    codexCommentDone: "Codex task completion notification",
    codexNotifyTitle: "Codex",
    codexNotifyMsgDone: "Task completed",
    codexSayDone: "Codex task completed",
    codexSoundDone: "Codex task completed",
    codexLimitHint: "(Codex only supports task completion event)",

    // Results - Codex
    codexConfigHint: "Codex configuration (add to ~/.codex/config.toml):",
    codexConfigLine: (path: string) => `notify = ["bash", "${path}"]`,

    // Codex auto config
    updatingCodex: "Updating Codex config.toml...",
    codexUpdated: "Codex config updated",
    codexConfiguredNotify: "✓ Configured Codex notify:",

    // Codex existing config
    codexExistingNotify: "Existing notify configuration found in ~/.codex/config.toml",
    codexOverwritePrompt: "What would you like to do?",
    codexOverwrite: "Overwrite with new configuration",
    codexKeep: "Keep existing configuration",
    codexSkipped: "Codex config unchanged (kept existing)",

    // Config diff
    configPreview: "Configuration preview",
    claudeSettingsPath: "~/.claude/settings.json",
    cursorHooksPath: "~/.cursor/hooks.json",
    codexConfigPath: "~/.codex/config.toml",
    confirmChanges: "Apply these changes?",
    confirmYes: "Yes, apply changes",
    confirmNo: "No, cancel",
    changesApplied: "Changes applied",
    changesCanceled: "Changes canceled",
    noChangesNeeded: "(already configured)",
    allConfigsUpToDate: "All configurations are already up to date!",

    // Cursor config
    updatingCursor: "Updating Cursor hooks.json...",
    cursorUpdated: "Cursor config updated",
    cursorConfiguredHooks: "✓ Configured Cursor hooks:",

    // Dual platform warning
    dualPlatformWarning: "You selected both Claude Code and Cursor. To avoid duplicate notifications:",
    dualPlatformHint: "Disable \"Include third-party skills\" in Cursor Settings → Rules, Skills, Subagents",

    // CLI specific
    platformCli: "Command Line (CLI)",
    platformCliHint: "notify command for any shell",
    cliCommentDone: "CLI notification script",
    cliNotifyTitleSuccess: "Terminal",
    cliNotifyMsgSuccess: "Command completed successfully",
    cliNotifyTitleFailed: "Terminal",
    cliNotifyMsgFailed: "Command failed",
    cliSaySuccess: "Command finished successfully",
    cliSayFailed: "Command failed",
    cliConfiguredNotify: "✓ Installed CLI notify script:",
    cliUsageHint: "Usage: your_command; notify",
    cliShellConfigured: (config: string) => `Added notify function to "${config}"`,
    cliPathAdded: (binDir: string, config: string) => `Added "${binDir}" to $PATH in "${config}"`,
    cliShellManualHint: "Manually add the following to your shell config (e.g. ~/.bashrc):",

    // Backup
    backingUpConfigs: "Backing up config files...",
    backupComplete: (count: number) => `Backed up ${count} config file(s)`,
    backupNone: "No existing config files to backup",
    backupCreated: "Backup created:",
    backupRestoreHint: "To restore, rename .bak file to remove the .bak extension",
  },
  zh: {
    // Main flow
    selectLanguage: "选择语言",
    scriptDir: "脚本安装目录",
    dirEmpty: "目录不能为空",
    canceled: "操作已取消",

    // Script config
    soundDone: "任务完成",
    soundWaiting: "等待输入",
    soundPermission: "请求权限",
    commentDone: "Claude 任务完成提示音",
    commentWaiting: "Claude 等待用户输入提示音",
    commentPermission: "Claude 请求权限提示音",

    // Notifications
    notifyTitleDone: "Claude Code",
    notifyMsgDone: "任务已完成",
    notifyTitleWaiting: "Claude Code",
    notifyMsgWaiting: "等待你的输入",
    notifyTitlePermission: "Claude Code",
    notifyMsgPermission: "需要授权操作",

    // Voice (say command)
    sayDone: "任务完成",
    sayWaiting: "等待输入",
    sayPermission: "需要权限",

    // Spinner
    checkingSettings: "检查 Claude settings.json...",
    readFailed: "读取配置失败",
    configError: "配置文件存在语法错误，请手动修复后重试：",
    file: "文件:",
    error: "错误:",
    jsonHint: "提示: 可以使用 JSON 验证工具检查语法，如 https://jsonlint.com",
    configOk: "配置文件检查通过",
    creatingDir: "创建脚本目录...",
    dirReady: "脚本目录已就绪",
    installingScripts: "安装脚本文件...",
    scriptsInstalled: (n: number) => `已安装 ${n} 个脚本`,
    updatingSettings: "更新 Claude settings.json...",
    settingsUpdated: "配置文件已更新",

    // Results
    installedScripts: "✓ 已安装脚本:",
    configuredHooks: "✓ 已配置 hooks:",
    installComplete: "安装完成",
    done: "完成!",

    // Sound select
    previewHint: "(空格试听, 回车选择)",
    default: "默认",

    // Feature toggles
    featureToggle: "选择要启用的功能 (空格切换, 回车确认)",
    featureSound: "音效",
    featureNotification: "macOS 通知",
    featureVoice: "语音播报",
    featureNtfy: "ntfy 推送通知",
    featureRequired: "请至少选择一项功能",

    // Ntfy config
    ntfyUrl: "ntfy 服务器地址",
    ntfyUrlPlaceholder: "https://ntfy.sh 或 http://localhost:80",
    ntfyUrlEmpty: "地址不能为空",
    ntfyTopic: "ntfy 主题名称",
    ntfyTopicPlaceholder: "agent-notify",
    ntfyTopicEmpty: "主题不能为空",

    // Platform selection
    platformSelect: "选择目标平台 (空格切换, 回车确认)",
    platformClaudeCode: "Claude Code",
    platformClaudeCodeHint: "hooks 配置在 ~/.claude/settings.json",
    platformCursor: "Cursor",
    platformCursorHint: "hooks 配置在 ~/.cursor/hooks.json",
    platformCodex: "OpenAI Codex",
    platformCodexHint: "notify 配置在 ~/.codex/config.toml",
    platformRequired: "请至少选择一个平台",

    // Cursor specific
    cursorCommentDone: "Cursor 任务完成提示音",
    cursorCommentWaiting: "Cursor 等待用户输入提示音",
    cursorCommentPermission: "Cursor 请求权限提示音",
    cursorNotifyTitleDone: "Cursor",
    cursorNotifyMsgDone: "任务已完成",
    cursorNotifyTitleWaiting: "Cursor",
    cursorNotifyMsgWaiting: "等待你的输入",
    cursorNotifyTitlePermission: "Cursor",
    cursorNotifyMsgPermission: "需要授权操作",
    cursorSayDone: "Cursor 任务完成",
    cursorSayWaiting: "Cursor 等待输入",
    cursorSayPermission: "Cursor 需要权限",

    // Codex specific
    codexScriptName: "codex-notify.sh",
    codexCommentDone: "Codex 任务完成通知",
    codexNotifyTitle: "Codex",
    codexNotifyMsgDone: "任务已完成",
    codexSayDone: "Codex 任务完成",
    codexSoundDone: "Codex 任务完成",
    codexLimitHint: "（Codex 目前仅支持任务完成事件）",

    // Results - Codex
    codexConfigHint: "Codex 配置 (添加到 ~/.codex/config.toml):",
    codexConfigLine: (path: string) => `notify = ["bash", "${path}"]`,

    // Codex auto config
    updatingCodex: "更新 Codex config.toml...",
    codexUpdated: "Codex 配置已更新",
    codexConfiguredNotify: "✓ 已配置 Codex notify:",

    // Codex existing config
    codexExistingNotify: "在 ~/.codex/config.toml 中发现已有 notify 配置",
    codexOverwritePrompt: "你想怎么做？",
    codexOverwrite: "覆盖为新配置",
    codexKeep: "保留现有配置",
    codexSkipped: "Codex 配置未变更（已保留）",

    // Config diff
    configPreview: "配置预览",
    claudeSettingsPath: "~/.claude/settings.json",
    cursorHooksPath: "~/.cursor/hooks.json",
    codexConfigPath: "~/.codex/config.toml",
    confirmChanges: "是否应用这些更改？",
    confirmYes: "是，应用更改",
    confirmNo: "否，取消",
    changesApplied: "更改已应用",
    changesCanceled: "更改已取消",
    noChangesNeeded: "（已配置）",
    allConfigsUpToDate: "所有配置已是最新！",

    // Cursor config
    updatingCursor: "更新 Cursor hooks.json...",
    cursorUpdated: "Cursor 配置已更新",
    cursorConfiguredHooks: "✓ 已配置 Cursor hooks:",

    // Dual platform warning
    dualPlatformWarning: "你同时选择了 Claude Code 和 Cursor。为避免收到重复通知：",
    dualPlatformHint: "请在 Cursor Settings → Rules, Skills, Subagents 中关闭 \"Include third-party skills\"",

    // CLI specific
    platformCli: "命令行 (CLI)",
    platformCliHint: "适用于任何 shell 的 notify 命令",
    cliCommentDone: "CLI 通知脚本",
    cliNotifyTitleSuccess: "终端",
    cliNotifyMsgSuccess: "命令执行成功",
    cliNotifyTitleFailed: "终端",
    cliNotifyMsgFailed: "命令执行失败",
    cliSaySuccess: "命令执行成功",
    cliSayFailed: "命令执行失败",
    cliConfiguredNotify: "✓ 已安装 CLI notify 脚本:",
    cliUsageHint: "使用方法: your_command; notify",
    cliShellConfigured: (config: string) => `已添加 notify 函数到 "${config}"`,
    cliPathAdded: (binDir: string, config: string) => `已添加 "${binDir}" 到 $PATH (${config})`,
    cliShellManualHint: "请手动添加以下内容到你的 shell 配置 (如 ~/.bashrc):",

    // Backup
    backingUpConfigs: "备份配置文件...",
    backupComplete: (count: number) => `已备份 ${count} 个配置文件`,
    backupNone: "没有需要备份的配置文件",
    backupCreated: "已创建备份:",
    backupRestoreHint: "如需恢复，将 .bak 文件重命名去掉 .bak 后缀即可",
  },
} as const;

type Messages = (typeof messages)["en"];
type MessageKey = keyof Messages;

let currentLocale: Locale = "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

/** Get translated text */
export function t<K extends MessageKey>(key: K): Messages[K] {
  return messages[currentLocale][key] as Messages[K];
}
