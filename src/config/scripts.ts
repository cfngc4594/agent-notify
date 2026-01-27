import type { SoundName } from "../types";
import { t } from "../i18n";

/** Script config metadata */
interface ScriptConfig {
  readonly name: string;
  readonly defaultSound: SoundName;
  readonly commentKey: "commentDone" | "commentWaiting" | "commentPermission";
  readonly promptKey: "soundDone" | "soundWaiting" | "soundPermission";
}

/** Script config templates */
const SCRIPT_CONFIG_TEMPLATES = [
  {
    name: "claude-done-sound.sh",
    defaultSound: "Glass",
    commentKey: "commentDone",
    promptKey: "soundDone",
  },
  {
    name: "claude-waiting-sound.sh",
    defaultSound: "Ping",
    commentKey: "commentWaiting",
    promptKey: "soundWaiting",
  },
  {
    name: "claude-permission-sound.sh",
    defaultSound: "Basso",
    commentKey: "commentPermission",
    promptKey: "soundPermission",
  },
] as const satisfies readonly ScriptConfig[];

/** Get script configs with translations */
export function getScriptConfigs() {
  return SCRIPT_CONFIG_TEMPLATES.map((c) => ({
    name: c.name,
    defaultSound: c.defaultSound,
    comment: t(c.commentKey),
    promptMessage: t(c.promptKey),
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

/** Generate script content */
export function createScript(sound: SoundName, comment: string): string {
  return `#!/bin/bash
# ${comment}
afplay /System/Library/Sounds/${sound}.aiff
`;
}

/** Generate all scripts from sound config */
export function generateScripts(
  sounds: readonly SoundName[]
): Record<ScriptName, string> {
  const configs = getScriptConfigs();
  return configs.reduce((acc, config, i) => {
    acc[config.name as ScriptName] = createScript(
      sounds[i] ?? config.defaultSound,
      config.comment
    );
    return acc;
  }, {} as Record<ScriptName, string>);
}
