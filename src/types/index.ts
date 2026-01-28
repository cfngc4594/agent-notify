// ============================================
// Hook config types
// ============================================

/** Hook entry (flexible format for user compatibility) */
export type HookEntry = Record<string, unknown>;

/** Hook matcher */
export type HookMatcher = {
  matcher: string;
  hooks: HookEntry[];
  [key: string]: unknown;
};

/** Hooks config (supports any hook type: Stop, Notification, etc.) */
export type HooksConfig = Record<string, HookMatcher[] | undefined>;

/** Settings type */
export type Settings = {
  hooks?: HooksConfig;
  [key: string]: unknown;
};

// ============================================
// Type guards
// ============================================

/** Check if value is a valid object (not null, not array) */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Check if value is valid Settings */
export function isValidSettings(value: unknown): value is Settings {
  return isObject(value);
}

// ============================================
// Platform types
// ============================================

export type Platform = "claudeCode" | "cursor" | "codex";

export const PLATFORMS = ["claudeCode", "cursor", "codex"] as const;

// ============================================
// Sound config
// ============================================

export const SOUNDS = [
  "Basso",
  "Blow",
  "Bottle",
  "Frog",
  "Funk",
  "Glass",
  "Hero",
  "Morse",
  "Ping",
  "Pop",
  "Purr",
  "Sosumi",
  "Submarine",
  "Tink",
] as const;

export type SoundName = (typeof SOUNDS)[number];
