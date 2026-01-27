import { isValidSettings, type Settings, type HooksConfig } from "../types";
import { SETTINGS_FILE, CLAUDE_DIR } from "../config/constants";
import { readJsonSafe, writeJson, ensureDir } from "./fs";

/** Empty settings constant */
const EMPTY_SETTINGS: Settings = {};

/** Merge settings preserving key order */
export function mergeSettings(
  existing: Settings,
  hooks: HooksConfig
): Settings {
  const result: Settings = {};
  const hasHooks = "hooks" in existing;

  for (const key of Object.keys(existing)) {
    result[key] = key === "hooks" ? hooks : existing[key];
  }

  if (!hasHooks) result.hooks = hooks;

  return result;
}

/** Settings read result type */
export type SettingsReadResult =
  | { ok: true; data: Settings; isNew: boolean }
  | { ok: false; error: "parse_error"; message: string; path: string };

/** Read and validate settings.json */
export async function readSettingsSafe(): Promise<SettingsReadResult> {
  const result = await readJsonSafe<unknown>(SETTINGS_FILE);

  if (!result.ok && result.error === "not_found") {
    return { ok: true, data: EMPTY_SETTINGS, isNew: true };
  }

  if (!result.ok && result.error === "parse_error") {
    return {
      ok: false,
      error: "parse_error",
      message: result.message,
      path: SETTINGS_FILE,
    };
  }

  if (!isValidSettings(result.data)) {
    return {
      ok: false,
      error: "parse_error",
      message: "Settings must be an object",
      path: SETTINGS_FILE,
    };
  }

  return { ok: true, data: result.data, isNew: false };
}

/** Write settings.json (ensures directory exists) */
export async function writeSettings(settings: Settings): Promise<void> {
  await ensureDir(CLAUDE_DIR);
  await writeJson(SETTINGS_FILE, settings);
}
