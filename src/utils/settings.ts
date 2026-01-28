import { isValidSettings, type Settings, type HooksConfig } from "../types";
import { SETTINGS_FILE, CLAUDE_DIR, CURSOR_HOOKS_FILE, CURSOR_DIR } from "../config/constants";
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

// ============================================
// Cursor hooks.json
// ============================================

/** Cursor hooks config type */
export type CursorHooksConfig = {
  version?: number;
  hooks?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Check if value is valid Cursor hooks config */
function isValidCursorHooksConfig(value: unknown): value is CursorHooksConfig {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Empty Cursor hooks config */
const EMPTY_CURSOR_HOOKS: CursorHooksConfig = { version: 1, hooks: {} };

/** Cursor hooks read result type */
export type CursorHooksReadResult =
  | { ok: true; data: CursorHooksConfig; isNew: boolean }
  | { ok: false; error: "parse_error"; message: string; path: string };

/** Read and validate Cursor hooks.json */
export async function readCursorHooksSafe(): Promise<CursorHooksReadResult> {
  const result = await readJsonSafe<unknown>(CURSOR_HOOKS_FILE);

  if (!result.ok && result.error === "not_found") {
    return { ok: true, data: EMPTY_CURSOR_HOOKS, isNew: true };
  }

  if (!result.ok && result.error === "parse_error") {
    return {
      ok: false,
      error: "parse_error",
      message: result.message,
      path: CURSOR_HOOKS_FILE,
    };
  }

  if (!isValidCursorHooksConfig(result.data)) {
    return {
      ok: false,
      error: "parse_error",
      message: "Cursor hooks config must be an object",
      path: CURSOR_HOOKS_FILE,
    };
  }

  return { ok: true, data: result.data, isNew: false };
}

/** Write Cursor hooks.json (ensures directory exists) */
export async function writeCursorHooks(config: CursorHooksConfig): Promise<void> {
  await ensureDir(CURSOR_DIR);
  await writeJson(CURSOR_HOOKS_FILE, config);
}

/** Merge Cursor hooks config preserving key order */
export function mergeCursorHooksConfig(
  existing: CursorHooksConfig,
  hooks: Record<string, unknown>
): CursorHooksConfig {
  const result: CursorHooksConfig = {};
  const hasVersion = "version" in existing;
  const hasHooks = "hooks" in existing;

  // Preserve existing key order
  for (const key of Object.keys(existing)) {
    if (key === "hooks") {
      result[key] = hooks;
    } else {
      result[key] = existing[key];
    }
  }

  // Add missing keys
  if (!hasVersion) result.version = 1;
  if (!hasHooks) result.hooks = hooks;

  return result;
}
