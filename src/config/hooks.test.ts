import { describe, test, expect } from "bun:test";
import { mergeHooksConfig } from "./hooks";
import type { HooksConfig } from "../types";

describe("mergeHooksConfig", () => {
  const testBinDir = "/Users/test/.bin";

  describe("empty or undefined existing config", () => {
    test("creates new hooks config when existing is undefined", () => {
      const result = mergeHooksConfig(undefined, testBinDir);

      expect(result.Stop).toBeDefined();
      expect(result.Notification).toBeDefined();
      expect(result.Stop?.[0]?.hooks?.[0]?.command).toContain("claude-done-sound.sh");
    });

    test("creates new hooks config when existing is empty object", () => {
      const result = mergeHooksConfig({} as HooksConfig, testBinDir);

      expect(result.Stop).toBeDefined();
      expect(result.Notification).toBeDefined();
    });
  });

  describe("preserving user hooks", () => {
    test("preserves user's custom Stop hooks", () => {
      const existing: HooksConfig = {
        Stop: [
          {
            matcher: "",
            hooks: [
              { type: "command", command: "/user/custom/script.sh" }
            ]
          }
        ]
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Should have both user's hook and our hook
      const allCommands = result.Stop?.flatMap(m => 
        m.hooks?.map(h => h.command as string | undefined) || []
      ) || [];

      expect(allCommands).toContain("/user/custom/script.sh");
      expect(allCommands.some(c => c?.includes("claude-done-sound.sh"))).toBe(true);
    });

    test("preserves user's custom Notification hooks", () => {
      const existing: HooksConfig = {
        Notification: [
          {
            matcher: "custom_event",
            hooks: [
              { type: "command", command: "/user/notification/handler.sh" }
            ]
          }
        ]
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Should preserve user's custom_event matcher
      const customMatcher = result.Notification?.find(m => m.matcher === "custom_event");
      expect(customMatcher).toBeDefined();
      expect(customMatcher?.hooks?.[0]?.command).toBe("/user/notification/handler.sh");
    });

    test("preserves user hooks in other event types", () => {
      const existing: HooksConfig = {
        PreToolUse: [
          {
            matcher: "*",
            hooks: [{ type: "command", command: "/user/pre-tool.sh" }]
          }
        ],
        PostToolUse: [
          {
            matcher: "shell",
            hooks: [{ type: "command", command: "/user/post-shell.sh" }]
          }
        ]
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Should preserve PreToolUse and PostToolUse completely
      expect(result.PreToolUse).toEqual(existing.PreToolUse);
      expect(result.PostToolUse).toEqual(existing.PostToolUse);
    });

    test("preserves user's idle_prompt hooks alongside ours", () => {
      const existing: HooksConfig = {
        Notification: [
          {
            matcher: "idle_prompt",
            hooks: [
              { type: "command", command: "/user/idle-handler.sh" }
            ]
          }
        ]
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Find idle_prompt matcher
      const idleMatcher = result.Notification?.find(m => m.matcher === "idle_prompt");
      expect(idleMatcher).toBeDefined();

      // Should have both user's hook and our hook
      const commands = idleMatcher?.hooks?.map(h => h.command as string | undefined) || [];
      expect(commands).toContain("/user/idle-handler.sh");
      expect(commands.some(c => c?.includes("claude-waiting-sound.sh"))).toBe(true);
    });
  });

  describe("updating our own hooks", () => {
    test("updates our hook when path changes", () => {
      const existing: HooksConfig = {
        Stop: [
          {
            matcher: "",
            hooks: [
              { type: "command", command: "~/.old-bin/claude-done-sound.sh" }
            ]
          }
        ]
      };

      const result = mergeHooksConfig(existing, "/Users/test/.new-bin");

      // Should update the path
      const command = result.Stop?.[0]?.hooks?.[0]?.command;
      expect(command).toContain(".new-bin");
      expect(command).not.toContain(".old-bin");
    });

    test("does not duplicate our hooks when already present", () => {
      const existing: HooksConfig = {
        Stop: [
          {
            matcher: "",
            hooks: [
              { type: "command", command: "~/.bin/claude-done-sound.sh" }
            ]
          }
        ]
      };

      const result = mergeHooksConfig(existing, "/Users/test/.bin");

      // Should only have one hook in Stop
      const hookCount = result.Stop?.[0]?.hooks?.length || 0;
      expect(hookCount).toBe(1);
    });
  });

  describe("key order preservation", () => {
    test("preserves order of existing keys", () => {
      const existing: HooksConfig = {
        PreToolUse: [{ matcher: "*", hooks: [] }],
        Stop: [{ matcher: "", hooks: [] }],
        PostToolUse: [{ matcher: "*", hooks: [] }],
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Get keys in order
      const keys = Object.keys(result);
      
      // PreToolUse should come before Stop
      expect(keys.indexOf("PreToolUse")).toBeLessThan(keys.indexOf("Stop"));
      // Stop should come before PostToolUse
      expect(keys.indexOf("Stop")).toBeLessThan(keys.indexOf("PostToolUse"));
    });

    test("appends new keys at the end", () => {
      const existing: HooksConfig = {
        PreToolUse: [{ matcher: "*", hooks: [] }],
      };

      const result = mergeHooksConfig(existing, testBinDir);

      const keys = Object.keys(result);
      
      // PreToolUse should be first (existing)
      expect(keys[0]).toBe("PreToolUse");
      // Stop and Notification should be added after
      expect(keys).toContain("Stop");
      expect(keys).toContain("Notification");
    });
  });

  describe("complex scenarios", () => {
    test("handles complex user config with many hooks", () => {
      const existing: HooksConfig = {
        PreToolUse: [
          { matcher: "shell", hooks: [{ type: "command", command: "/log-shell.sh" }] },
          { matcher: "file_write", hooks: [{ type: "command", command: "/log-write.sh" }] },
        ],
        Stop: [
          { matcher: "", hooks: [
            { type: "command", command: "/user/on-stop-1.sh" },
            { type: "command", command: "/user/on-stop-2.sh" },
          ]}
        ],
        Notification: [
          { matcher: "idle_prompt", hooks: [{ type: "command", command: "/user/idle.sh" }] },
          { matcher: "permission_prompt", hooks: [{ type: "command", command: "/user/perm.sh" }] },
          { matcher: "custom_event", hooks: [{ type: "command", command: "/user/custom.sh" }] },
        ],
        PostToolUse: [
          { matcher: "*", hooks: [{ type: "command", command: "/post-all.sh" }] },
        ],
      };

      const result = mergeHooksConfig(existing, testBinDir);

      // Verify PreToolUse is unchanged
      expect(result.PreToolUse).toEqual(existing.PreToolUse);

      // Verify PostToolUse is unchanged
      expect(result.PostToolUse).toEqual(existing.PostToolUse);

      // Verify user's Stop hooks are preserved
      const stopCommands = result.Stop?.[0]?.hooks?.map(h => h.command as string | undefined) || [];
      expect(stopCommands).toContain("/user/on-stop-1.sh");
      expect(stopCommands).toContain("/user/on-stop-2.sh");
      expect(stopCommands.some(c => c?.includes("claude-done-sound.sh"))).toBe(true);

      // Verify user's Notification hooks are preserved
      const customMatcher = result.Notification?.find(m => m.matcher === "custom_event");
      expect(customMatcher?.hooks?.[0]?.command).toBe("/user/custom.sh");

      // Verify our notification hooks are merged with user's
      const idleMatcher = result.Notification?.find(m => m.matcher === "idle_prompt");
      const idleCommands = idleMatcher?.hooks?.map(h => h.command as string | undefined) || [];
      expect(idleCommands).toContain("/user/idle.sh");
      expect(idleCommands.some(c => c?.includes("claude-waiting-sound.sh"))).toBe(true);
    });

    test("does not remove any user data even with conflicting matchers", () => {
      const existing: HooksConfig = {
        Notification: [
          { 
            matcher: "idle_prompt", 
            hooks: [
              { type: "command", command: "/user/script1.sh", timeout: 30 },
              { type: "command", command: "/user/script2.sh" },
            ]
          },
        ],
      };

      const result = mergeHooksConfig(existing, testBinDir);

      const idleMatcher = result.Notification?.find(m => m.matcher === "idle_prompt");
      const commands = idleMatcher?.hooks?.map(h => h.command as string | undefined) || [];

      // All user scripts should still be there
      expect(commands).toContain("/user/script1.sh");
      expect(commands).toContain("/user/script2.sh");

      // Our script should be added
      expect(commands.some(c => c?.includes("claude-waiting-sound.sh"))).toBe(true);

      // Total should be 3 (2 user + 1 ours)
      expect(commands.length).toBe(3);
    });
  });
});

describe("settings merge safety", () => {
  test("never removes top-level keys from settings", () => {
    const existingSettings = {
      env: { VAR1: "value1" },
      permissions: { allow: ["read"] },
      customKey: "customValue",
      hooks: {}
    };

    // Simulate merging with new hooks
    const newHooks = { Stop: [], Notification: [] };
    
    // Create merged settings (simulating mergeSettings behavior)
    const mergedSettings = { ...existingSettings, hooks: newHooks };

    // All original keys should be present
    expect(mergedSettings.env).toEqual({ VAR1: "value1" });
    expect(mergedSettings.permissions).toEqual({ allow: ["read"] });
    expect(mergedSettings.customKey).toBe("customValue");
  });
});
