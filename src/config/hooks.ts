import type { HooksConfig, HookMatcher } from "../types";
import { SCRIPT_NAMES, SCRIPT_NAME_LIST } from "./scripts";
import { toDisplayPath } from "../utils/path";

/** Get hook command path for script (uses ~ format for Claude) */
function getScriptCommand(binDir: string, name: string): string {
  return `${toDisplayPath(binDir)}/${name}`;
}

/** Get script name if this is our hook */
function getOurScriptName(hook: Record<string, unknown>): string | null {
  const command = hook.command;
  if (typeof command !== "string") return null;
  return SCRIPT_NAME_LIST.find((name) => command.endsWith(name)) ?? null;
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
 * Smart merge hooks config
 * - Preserve user hooks and their positions
 * - Update/add managed hooks
 */
export function mergeHooksConfig(
  existing: HooksConfig | undefined,
  binDir: string
): HooksConfig {
  const ourConfig = createHooksConfig(binDir);

  if (!existing) {
    return ourConfig;
  }

  const updates: Partial<HooksConfig> = {
    Stop: mergeMatchers(existing.Stop, ourConfig.Stop ?? []),
    Notification: mergeMatchers(
      existing.Notification,
      ourConfig.Notification ?? []
    ),
  };

  return mergeObjectInOrder(existing, updates);
}

/** Create hooks config for our managed hooks */
function createHooksConfig(binDir: string): HooksConfig {
  return {
    Stop: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: getScriptCommand(binDir, SCRIPT_NAMES.done),
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: "idle_prompt",
        hooks: [
          {
            type: "command",
            command: getScriptCommand(binDir, SCRIPT_NAMES.waiting),
          },
        ],
      },
      {
        matcher: "permission_prompt",
        hooks: [
          {
            type: "command",
            command: getScriptCommand(binDir, SCRIPT_NAMES.permission),
          },
        ],
      },
    ],
  };
}
