import type { SoundName, Platform } from "../types";
import { t } from "../i18n";

/** Ntfy configuration */
export interface NtfyConfig {
  url: string;
  topic: string;
}

/** Feature toggle options */
export interface FeatureOptions {
  sound: boolean;
  notification: boolean;
  voice: boolean;
  ntfy: boolean;
  ntfyConfig?: NtfyConfig;
}

/** Script config metadata */
interface ScriptConfig {
  readonly name: string;
  readonly defaultSound: SoundName;
  readonly commentKey: "commentDone" | "cursorCommentDone";
  readonly promptKey: "soundDone";
  readonly notifyTitleKey: "notifyTitleDone" | "cursorNotifyTitleDone";
  readonly notifyMsgKey: "notifyMsgDone" | "cursorNotifyMsgDone";
  readonly sayKey: "sayDone" | "cursorSayDone";
}

/** Claude Code script config template (only done/stop event) */
const CLAUDE_SCRIPT_CONFIG_TEMPLATES = [
  {
    name: "claude-done-sound.sh",
    defaultSound: "Glass",
    commentKey: "commentDone",
    promptKey: "soundDone",
    notifyTitleKey: "notifyTitleDone",
    notifyMsgKey: "notifyMsgDone",
    sayKey: "sayDone",
  },
] as const satisfies readonly ScriptConfig[];

/** Cursor script config template (only done/stop event) */
const CURSOR_SCRIPT_CONFIG_TEMPLATES = [
  {
    name: "cursor-done-sound.sh",
    defaultSound: "Glass",
    commentKey: "cursorCommentDone",
    promptKey: "soundDone",
    notifyTitleKey: "cursorNotifyTitleDone",
    notifyMsgKey: "cursorNotifyMsgDone",
    sayKey: "cursorSayDone",
  },
] as const satisfies readonly ScriptConfig[];

/** Get Claude script configs with translations */
export function getClaudeScriptConfigs() {
  return CLAUDE_SCRIPT_CONFIG_TEMPLATES.map((c) => ({
    name: c.name,
    defaultSound: c.defaultSound,
    comment: t(c.commentKey),
    promptMessage: t(c.promptKey),
    notifyTitle: t(c.notifyTitleKey),
    notifyMsg: t(c.notifyMsgKey),
    sayText: t(c.sayKey),
  }));
}

/** Get Cursor script configs with translations */
export function getCursorScriptConfigs() {
  return CURSOR_SCRIPT_CONFIG_TEMPLATES.map((c) => ({
    name: c.name,
    defaultSound: c.defaultSound,
    comment: t(c.commentKey),
    promptMessage: t(c.promptKey),
    notifyTitle: t(c.notifyTitleKey),
    notifyMsg: t(c.notifyMsgKey),
    sayText: t(c.sayKey),
  }));
}

/** @deprecated Use getClaudeScriptConfigs instead */
export const getScriptConfigs = getClaudeScriptConfigs;

/** Claude script name type */
export type ClaudeScriptName = (typeof CLAUDE_SCRIPT_CONFIG_TEMPLATES)[number]["name"];

/** Cursor script name type */
export type CursorScriptName = (typeof CURSOR_SCRIPT_CONFIG_TEMPLATES)[number]["name"];

/** Script name type (union) */
export type ScriptName = ClaudeScriptName | CursorScriptName;

/** Claude script name constants */
export const CLAUDE_SCRIPT_NAMES = {
  done: CLAUDE_SCRIPT_CONFIG_TEMPLATES[0].name,
} as const;

/** Cursor script name constants */
export const CURSOR_SCRIPT_NAMES = {
  done: CURSOR_SCRIPT_CONFIG_TEMPLATES[0].name,
} as const;

/** @deprecated Use CLAUDE_SCRIPT_NAMES instead */
export const SCRIPT_NAMES = CLAUDE_SCRIPT_NAMES;

/** Claude script name list */
export const CLAUDE_SCRIPT_NAME_LIST: readonly ClaudeScriptName[] =
  Object.values(CLAUDE_SCRIPT_NAMES);

/** Cursor script name list */
export const CURSOR_SCRIPT_NAME_LIST: readonly CursorScriptName[] =
  Object.values(CURSOR_SCRIPT_NAMES);

/** @deprecated Use CLAUDE_SCRIPT_NAME_LIST instead */
export const SCRIPT_NAME_LIST = CLAUDE_SCRIPT_NAME_LIST;

/** Generate script content with optional sound + macOS notification + voice + ntfy */
export function createScript(
  sound: SoundName,
  comment: string,
  notifyTitle: string,
  notifyMsg: string,
  sayText: string,
  options: FeatureOptions
): string {
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# ${comment}`,
    "",
  ];

  if (options.sound) {
    lines.push("# Play system sound");
    lines.push(`afplay /System/Library/Sounds/${sound}.aiff &`);
    lines.push("");
  }

  if (options.notification) {
    lines.push("# Show macOS notification");
    lines.push(`osascript -e 'display notification "${notifyMsg}" with title "${notifyTitle}"'`);
    lines.push("");
  }

  if (options.voice) {
    lines.push("# Voice announcement");
    lines.push(`say "${sayText}"`);
    lines.push("");
  }

  if (options.ntfy && options.ntfyConfig) {
    const { url, topic } = options.ntfyConfig;
    const ntfyUrl = url.endsWith("/") ? `${url}${topic}` : `${url}/${topic}`;
    lines.push("# Send ntfy push notification");
    lines.push(`curl -s -d "${notifyMsg}" -H "Title: ${notifyTitle}" "${ntfyUrl}" > /dev/null 2>&1 &`);
    lines.push("");
  }

  return lines.join("\n");
}

/** Generate Claude scripts from sound config */
export function generateClaudeScripts(
  sounds: readonly SoundName[],
  options: FeatureOptions
): Record<ClaudeScriptName, string> {
  const configs = getClaudeScriptConfigs();
  return configs.reduce((acc, config, i) => {
    acc[config.name as ClaudeScriptName] = createScript(
      sounds[i] ?? config.defaultSound,
      config.comment,
      config.notifyTitle,
      config.notifyMsg,
      config.sayText,
      options
    );
    return acc;
  }, {} as Record<ClaudeScriptName, string>);
}

/** Generate Cursor scripts from sound config */
export function generateCursorScripts(
  sounds: readonly SoundName[],
  options: FeatureOptions
): Record<CursorScriptName, string> {
  const configs = getCursorScriptConfigs();
  return configs.reduce((acc, config, i) => {
    acc[config.name as CursorScriptName] = createScript(
      sounds[i] ?? config.defaultSound,
      config.comment,
      config.notifyTitle,
      config.notifyMsg,
      config.sayText,
      options
    );
    return acc;
  }, {} as Record<CursorScriptName, string>);
}

/** @deprecated Use generateClaudeScripts instead */
export const generateScripts = generateClaudeScripts;

// ============================================
// Codex script generation
// ============================================

export const CODEX_SCRIPT_NAME = "codex-notify.sh";

/** Generate Codex notification script that handles JSON input */
export function generateCodexScript(
  sound: SoundName,
  options: FeatureOptions
): string {
  const notifyTitle = t("codexNotifyTitle");
  const notifyMsg = t("codexNotifyMsgDone");
  const sayText = t("codexSayDone");
  const comment = t("codexCommentDone");

  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# ${comment}`,
    "",
    "# Codex passes JSON as first argument",
    'JSON="$1"',
    "",
    "# Check if jq is available, otherwise use simple grep",
    "if command -v jq &> /dev/null; then",
    '  TYPE=$(echo "$JSON" | jq -r \'.type // empty\')',
    "else",
    '  # Fallback: extract type using grep/sed',
    '  TYPE=$(echo "$JSON" | grep -o \'"type"[[:space:]]*:[[:space:]]*"[^"]*"\' | sed \'s/.*"\\([^"]*\\)"$/\\1/\')',
    "fi",
    "",
    '# Only notify on agent-turn-complete',
    'if [ "$TYPE" != "agent-turn-complete" ]; then',
    "  exit 0",
    "fi",
    "",
  ];

  if (options.sound) {
    lines.push("# Play system sound");
    lines.push(`afplay /System/Library/Sounds/${sound}.aiff &`);
    lines.push("");
  }

  if (options.notification) {
    lines.push("# Show macOS notification");
    lines.push(`osascript -e 'display notification "${notifyMsg}" with title "${notifyTitle}"'`);
    lines.push("");
  }

  if (options.voice) {
    lines.push("# Voice announcement");
    lines.push(`say "${sayText}"`);
    lines.push("");
  }

  if (options.ntfy && options.ntfyConfig) {
    const { url, topic } = options.ntfyConfig;
    const ntfyUrl = url.endsWith("/") ? `${url}${topic}` : `${url}/${topic}`;
    lines.push("# Send ntfy push notification");
    lines.push(`curl -s -d "${notifyMsg}" -H "Title: ${notifyTitle}" "${ntfyUrl}" > /dev/null 2>&1 &`);
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================
// CLI notify script generation
// ============================================

export const CLI_SCRIPT_NAME = "notify";

/** Generate CLI notify script that handles exit code from previous command */
export function generateCliScript(
  sound: SoundName,
  options: FeatureOptions
): string {
  const comment = t("cliCommentDone");
  const successTitle = t("cliNotifyTitleSuccess");
  const successMsg = t("cliNotifyMsgSuccess");
  const failedTitle = t("cliNotifyTitleFailed");
  const failedMsg = t("cliNotifyMsgFailed");
  const saySuccess = t("cliSaySuccess");
  const sayFailed = t("cliSayFailed");

  // Pre-compute ntfy URL if needed
  const ntfyUrl = options.ntfy && options.ntfyConfig
    ? (options.ntfyConfig.url.endsWith("/")
        ? `${options.ntfyConfig.url}${options.ntfyConfig.topic}`
        : `${options.ntfyConfig.url}/${options.ntfyConfig.topic}`)
    : null;

  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# ${comment}`,
    "",
    "# Usage: command; notify $?",
    "# Or define a shell function: notify() { /path/to/notify \"$?\"; }",
    "",
    "# Get exit status from argument (default to 0 if not provided)",
    'EXIT_STATUS="${1:-0}"',
    "",
    'if [ "$EXIT_STATUS" -eq 0 ]; then',
    "  # Success notification",
  ];

  if (options.sound) {
    lines.push(`  afplay /System/Library/Sounds/${sound}.aiff &`);
  }

  if (options.notification) {
    lines.push(`  osascript -e 'display notification "${successMsg}" with title "${successTitle}"'`);
  }

  if (options.voice) {
    lines.push(`  say "${saySuccess}"`);
  }

  if (ntfyUrl) {
    lines.push(`  curl -s -d "${successMsg}" -H "Title: ${successTitle}" "${ntfyUrl}" > /dev/null 2>&1 &`);
  }

  lines.push("else");
  lines.push("  # Failure notification");

  if (options.sound) {
    lines.push(`  afplay /System/Library/Sounds/Basso.aiff &`);
  }

  if (options.notification) {
    lines.push(`  osascript -e 'display notification "${failedMsg} (exit code: '$EXIT_STATUS')" with title "${failedTitle}"'`);
  }

  if (options.voice) {
    lines.push(`  say "${sayFailed}"`);
  }

  if (ntfyUrl) {
    lines.push(`  curl -s -d "${failedMsg} (exit code: $EXIT_STATUS)" -H "Title: ${failedTitle}" -H "Priority: high" "${ntfyUrl}" > /dev/null 2>&1 &`);
  }

  lines.push("fi");
  lines.push("");

  return lines.join("\n");
}
