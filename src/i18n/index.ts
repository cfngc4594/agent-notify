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
    ntfyTopicPlaceholder: "claude-notify",
    ntfyTopicEmpty: "Topic cannot be empty",
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
    ntfyTopicPlaceholder: "claude-notify",
    ntfyTopicEmpty: "主题不能为空",
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
