import type { HooksConfig, HookMatcher } from "../types";
import { CLAUDE_SCRIPT_NAMES, CLAUDE_SCRIPT_NAME_LIST, CURSOR_SCRIPT_NAMES, CURSOR_SCRIPT_NAME_LIST } from "./scripts";
import { toDisplayPath } from "../utils/path";

/** Get hook command path for script (uses ~ format) */
function getScriptCommand(binDir: string, name: string): string {
  return `${toDisplayPath(binDir)}/${name}`;
}

/** Get Claude script name if this is our hook */
function getOurClaudeScriptName(hook: Record<string, unknown>): string | null {
  const command = hook.command;
  if (typeof command !== "string") return null;
  return CLAUDE_SCRIPT_NAME_LIST.find((name) => command.endsWith(name)) ?? null;
}

/** Get Cursor script name if this is our hook */
function getOurCursorScriptName(hook: Record<string, unknown>): string | null {
  const command = hook.command;
  if (typeof command !== "string") return null;
  return CURSOR_SCRIPT_NAME_LIST.find((name) => command.endsWith(name)) ?? null;
}

/** Get script name if this is our hook (checks both Claude and Cursor) */
function getOurScriptName(hook: Record<string, unknown>): string | null {
  return getOurClaudeScriptName(hook) ?? getOurCursorScriptName(hook);
}

/**
 * Merge hooks array for a single matcher
 * - Our hooks: update in place if exists, append if not
 * - User hooks: keep in original position
 */
function mergeHooks(
  existingHooks: Array<Record<string, unknown>>,
  newHooks: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const newHookMap = new Map<string, Record<string, unknown>>();
  for (const hook of newHooks) {
    const scriptName = getOurScriptName(hook);
    if (scriptName) newHookMap.set(scriptName, hook);
  }

  const processedScripts = new Set<string>();
  const result: Array<Record<string, unknown>> = [];

  // Update our hooks in place
  for (const hook of existingHooks) {
    const scriptName = getOurScriptName(hook);
    if (scriptName && newHookMap.has(scriptName)) {
      result.push(newHookMap.get(scriptName)!);
      processedScripts.add(scriptName);
    } else {
      result.push(hook);
    }
  }

  // Append new hooks
  for (const hook of newHooks) {
    const scriptName = getOurScriptName(hook);
    if (scriptName && !processedScripts.has(scriptName)) {
      result.push(hook);
    }
  }

  return result;
}

/**
 * Merge hook matchers array
 * - Existing matcher: update hooks in place
 * - New matcher: append to end
 */
function mergeMatchers(
  existing: HookMatcher[] | undefined,
  newMatchers: HookMatcher[]
): HookMatcher[] {
  if (!existing || existing.length === 0) return newMatchers;

  const newMatcherMap = new Map<string, HookMatcher>();
  for (const m of newMatchers) newMatcherMap.set(m.matcher, m);

  const processedMatchers = new Set<string>();
  const result: HookMatcher[] = [];

  // Update existing matchers in place
  for (const m of existing) {
    const newMatcher = newMatcherMap.get(m.matcher);
    if (newMatcher) {
      result.push({ ...m, hooks: mergeHooks(m.hooks, newMatcher.hooks) });
      processedMatchers.add(m.matcher);
    } else {
      result.push(m);
    }
  }

  // Append new matchers
  for (const m of newMatchers) {
    if (!processedMatchers.has(m.matcher)) result.push(m);
  }

  return result;
}

/** Merge object preserving key order, append new keys */
function mergeObjectInOrder<T extends Record<string, unknown>>(
  existing: T,
  updates: Partial<T>
): T {
  const result = {} as T;
  const processedKeys = new Set<string>();

  for (const key of Object.keys(existing)) {
    result[key as keyof T] = (
      key in updates ? updates[key as keyof T] : existing[key as keyof T]
    ) as T[keyof T];
    processedKeys.add(key);
  }

  for (const key of Object.keys(updates)) {
    if (!processedKeys.has(key)) {
      result[key as keyof T] = updates[key as keyof T] as T[keyof T];
    }
  }

  return result;
}

/**
 * Smart merge Claude hooks config
 * - Preserve user hooks and their positions
 * - Update/add managed hooks (only Stop event)
 */
export function mergeHooksConfig(
  existing: HooksConfig | undefined,
  binDir: string
): HooksConfig {
  const ourConfig = createClaudeHooksConfig(binDir);

  if (!existing) {
    return ourConfig;
  }

  const updates: Partial<HooksConfig> = {
    Stop: mergeMatchers(existing.Stop, ourConfig.Stop ?? []),
  };

  return mergeObjectInOrder(existing, updates);
}

/** Create Claude hooks config for our managed hooks (only Stop event) */
function createClaudeHooksConfig(binDir: string): HooksConfig {
  return {
    Stop: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: getScriptCommand(binDir, CLAUDE_SCRIPT_NAMES.done),
          },
        ],
      },
    ],
  };
}

// ============================================
// Cursor hooks config
// ============================================

/** Cursor hook entry (simpler format than Claude) */
export type CursorHookEntry = {
  command: string;
  matcher?: string;
  [key: string]: unknown;
};

/** Cursor hooks config structure */
export type CursorHooksStructure = {
  stop?: CursorHookEntry[];
  [key: string]: CursorHookEntry[] | undefined;
};

/**
 * Merge Cursor hooks array
 * - Our hooks: update in place if exists, append if not
 * - User hooks: keep in original position
 */
function mergeCursorHooksArray(
  existingHooks: CursorHookEntry[],
  newHooks: CursorHookEntry[]
): CursorHookEntry[] {
  const newHookMap = new Map<string, CursorHookEntry>();
  for (const hook of newHooks) {
    const scriptName = getOurCursorScriptName(hook);
    if (scriptName) newHookMap.set(scriptName, hook);
  }

  const processedScripts = new Set<string>();
  const result: CursorHookEntry[] = [];

  // Update our hooks in place
  for (const hook of existingHooks) {
    const scriptName = getOurCursorScriptName(hook);
    if (scriptName && newHookMap.has(scriptName)) {
      result.push(newHookMap.get(scriptName)!);
      processedScripts.add(scriptName);
    } else {
      result.push(hook);
    }
  }

  // Append new hooks
  for (const hook of newHooks) {
    const scriptName = getOurCursorScriptName(hook);
    if (scriptName && !processedScripts.has(scriptName)) {
      result.push(hook);
    }
  }

  return result;
}

/**
 * Smart merge Cursor hooks config
 * - Preserve user hooks and their positions
 * - Update/add managed hooks
 */
export function mergeCursorHooksConfig(
  existing: CursorHooksStructure | undefined,
  binDir: string
): CursorHooksStructure {
  const ourConfig = createCursorHooksConfig(binDir);

  if (!existing) {
    return ourConfig;
  }

  const result: CursorHooksStructure = {};
  const processedKeys = new Set<string>();

  // Preserve existing key order
  for (const key of Object.keys(existing)) {
    if (key === "stop" && ourConfig.stop) {
      result[key] = mergeCursorHooksArray(existing[key] ?? [], ourConfig.stop);
    } else {
      result[key] = existing[key];
    }
    processedKeys.add(key);
  }

  // Add new keys
  for (const key of Object.keys(ourConfig)) {
    if (!processedKeys.has(key)) {
      result[key] = ourConfig[key];
    }
  }

  return result;
}

/** Create Cursor hooks config for our managed hooks */
function createCursorHooksConfig(binDir: string): CursorHooksStructure {
  return {
    stop: [
      {
        command: getScriptCommand(binDir, CURSOR_SCRIPT_NAMES.done),
      },
    ],
  };
}
