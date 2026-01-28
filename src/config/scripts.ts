import type { SoundName } from "../types";
import { t } from "../i18n";

/** Feature toggle options */
export interface FeatureOptions {
  sound: boolean;
  notification: boolean;
  voice: boolean;
}

/** Script config metadata */
interface ScriptConfig {
  readonly name: string;
  readonly defaultSound: SoundName;
  readonly commentKey: "commentDone" | "commentWaiting" | "commentPermission";
  readonly promptKey: "soundDone" | "soundWaiting" | "soundPermission";
  readonly notifyTitleKey:
    | "notifyTitleDone"
    | "notifyTitleWaiting"
    | "notifyTitlePermission";
  readonly notifyMsgKey:
    | "notifyMsgDone"
    | "notifyMsgWaiting"
    | "notifyMsgPermission";
  readonly sayKey: "sayDone" | "sayWaiting" | "sayPermission";
}

/** Script config templates */
const SCRIPT_CONFIG_TEMPLATES = [
  {
    name: "claude-done-sound.sh",
    defaultSound: "Glass",
    commentKey: "commentDone",
    promptKey: "soundDone",
    notifyTitleKey: "notifyTitleDone",
    notifyMsgKey: "notifyMsgDone",
    sayKey: "sayDone",
  },
  {
    name: "claude-waiting-sound.sh",
    defaultSound: "Ping",
    commentKey: "commentWaiting",
    promptKey: "soundWaiting",
    notifyTitleKey: "notifyTitleWaiting",
    notifyMsgKey: "notifyMsgWaiting",
    sayKey: "sayWaiting",
  },
  {
    name: "claude-permission-sound.sh",
    defaultSound: "Basso",
    commentKey: "commentPermission",
    promptKey: "soundPermission",
    notifyTitleKey: "notifyTitlePermission",
    notifyMsgKey: "notifyMsgPermission",
    sayKey: "sayPermission",
  },
] as const satisfies readonly ScriptConfig[];

/** Get script configs with translations */
export function getScriptConfigs() {
  return SCRIPT_CONFIG_TEMPLATES.map((c) => ({
    name: c.name,
    defaultSound: c.defaultSound,
    comment: t(c.commentKey),
    promptMessage: t(c.promptKey),
    notifyTitle: t(c.notifyTitleKey),
    notifyMsg: t(c.notifyMsgKey),
    sayText: t(c.sayKey),
  }));
}

/** Script name type */
export type ScriptName = (typeof SCRIPT_CONFIG_TEMPLATES)[number]["name"];

/** Script name constants */
export const SCRIPT_NAMES = {
  done: SCRIPT_CONFIG_TEMPLATES[0].name,
  waiting: SCRIPT_CONFIG_TEMPLATES[1].name,
  permission: SCRIPT_CONFIG_TEMPLATES[2].name,
} as const;

/** Script name list */
export const SCRIPT_NAME_LIST: readonly ScriptName[] =
  Object.values(SCRIPT_NAMES);

/** Generate script content with optional sound + macOS notification + voice */
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

  return lines.join("\n");
}

/** Generate all scripts from sound config */
export function generateScripts(
  sounds: readonly SoundName[],
  options: FeatureOptions
): Record<ScriptName, string> {
  const configs = getScriptConfigs();
  return configs.reduce((acc, config, i) => {
    acc[config.name as ScriptName] = createScript(
      sounds[i] ?? config.defaultSound,
      config.comment,
      config.notifyTitle,
      config.notifyMsg,
      config.sayText,
      options
    );
    return acc;
  }, {} as Record<ScriptName, string>);
}
