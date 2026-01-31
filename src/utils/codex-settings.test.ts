import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";

// We need to mock the CODEX_CONFIG_FILE for testing
// So we'll test the core logic directly

describe("Codex config generation logic", () => {
  /**
   * Simulate the generateCodexConfigContent logic for testing
   * Updated to insert notify BEFORE any [section] to ensure it's global
   */
  function generateContent(existingContent: string, scriptPath: string): string {
    const notifyLine = `notify = ["bash", "${scriptPath}"]`;

    if (!existingContent || existingContent.trim() === "") {
      return `# Codex configuration\n# https://github.com/openai/codex\n\n${notifyLine}\n`;
    }

    // Check if global notify already exists (before any [section])
    const lines = existingContent.split("\n");
    const firstSectionIndex = lines.findIndex(line => /^\s*\[/.test(line));
    
    // Check for existing global notify (before first section or in whole file if no sections)
    const globalPart = firstSectionIndex === -1 
      ? existingContent 
      : lines.slice(0, firstSectionIndex).join("\n");
    
    const notifyRegex = /^notify\s*=\s*\[.*\]\s*$/m;
    const hasGlobalNotify = notifyRegex.test(globalPart);

    if (hasGlobalNotify) {
      // Replace existing global notify line
      const beforeSection = globalPart.replace(notifyRegex, notifyLine);
      if (firstSectionIndex === -1) {
        return beforeSection;
      }
      return beforeSection + "\n" + lines.slice(firstSectionIndex).join("\n");
    }

    // Insert notify BEFORE any [section] to ensure it's global
    if (firstSectionIndex === -1) {
      // No sections, safe to append
      const trimmed = existingContent.trimEnd();
      return `${trimmed}\n\n${notifyLine}\n`;
    }

    // Insert before the first section
    const beforeSection = lines.slice(0, firstSectionIndex).join("\n").trimEnd();
    const afterSection = lines.slice(firstSectionIndex).join("\n");
    return `${beforeSection}\n\n${notifyLine}\n\n${afterSection}`;
  }

  describe("empty or non-existent config", () => {
    test("creates new config with header and notify", () => {
      const result = generateContent("", "/path/to/script.sh");
      
      expect(result).toContain("# Codex configuration");
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });

    test("creates new config when only whitespace exists", () => {
      const result = generateContent("   \n\n  ", "/path/to/script.sh");
      
      expect(result).toContain("# Codex configuration");
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });
  });

  describe("existing config without notify", () => {
    test("appends notify to existing config without sections", () => {
      const existing = `# My config
model = "gpt-4"
temperature = 0.7`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should preserve ALL existing content
      expect(result).toContain("# My config");
      expect(result).toContain("model = \"gpt-4\"");
      expect(result).toContain("temperature = 0.7");
      
      // Should add notify at the end (no sections, so append is safe)
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });

    test("inserts notify BEFORE sections to ensure it is global", () => {
      const existing = `# Codex configuration
[general]
model = "gpt-4"
max_tokens = 4096

[safety]
allowed_tools = ["read", "write", "shell"]`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should preserve ALL sections
      expect(result).toContain("[general]");
      expect(result).toContain("model = \"gpt-4\"");
      expect(result).toContain("[safety]");
      
      // notify should appear BEFORE [general]
      const notifyIndex = result.indexOf("notify =");
      const generalIndex = result.indexOf("[general]");
      expect(notifyIndex).toBeLessThan(generalIndex);
    });

    test("inserts notify before [projects.xxx] sections (user bug scenario)", () => {
      // This is the exact scenario reported by user
      const existing = `model = "gpt-5.2-codex"
model_reasoning_effort = "medium"

[projects."/Users/zzzz/Documents/pin-board"]
trust_level = "trusted"

[projects."/Users/zzzz/Documents/kb-agent"]
trust_level = "trusted"

[projects."/Users/zzzz/Documents/saas-heartopian-schema"]
trust_level = "trusted"`;
      
      const result = generateContent(existing, "/Users/zzzz/.local/bin/codex-notify.sh");
      
      // notify should be BEFORE any [projects.xxx] section
      const notifyIndex = result.indexOf("notify =");
      const firstProjectIndex = result.indexOf("[projects.");
      expect(notifyIndex).toBeLessThan(firstProjectIndex);
      
      // Should preserve all projects
      expect(result).toContain('[projects."/Users/zzzz/Documents/pin-board"]');
      expect(result).toContain('[projects."/Users/zzzz/Documents/kb-agent"]');
      expect(result).toContain('[projects."/Users/zzzz/Documents/saas-heartopian-schema"]');
    });

    test("preserves complex existing config with sections", () => {
      const existing = `# Codex configuration
[general]
model = "gpt-4"
max_tokens = 4096

[safety]
allowed_tools = ["read", "write", "shell"]

# Custom settings
custom_key = "custom_value"`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should preserve ALL sections
      expect(result).toContain("[general]");
      expect(result).toContain("model = \"gpt-4\"");
      expect(result).toContain("max_tokens = 4096");
      expect(result).toContain("[safety]");
      expect(result).toContain("allowed_tools");
      expect(result).toContain("custom_key");
      
      // Should add notify
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });

    test("does not duplicate config sections", () => {
      const existing = `model = "gpt-4"`;
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should only have one model line
      const modelCount = (result.match(/model\s*=/g) || []).length;
      expect(modelCount).toBe(1);
    });
  });

  describe("existing config with notify", () => {
    test("updates existing notify line", () => {
      const existing = `model = "gpt-4"
notify = ["bash", "/old/path.sh"]
temperature = 0.7`;
      
      const result = generateContent(existing, "/new/path.sh");
      
      // Should update notify
      expect(result).toContain("notify = [\"bash\", \"/new/path.sh\"]");
      expect(result).not.toContain("/old/path.sh");
      
      // Should preserve other settings
      expect(result).toContain("model = \"gpt-4\"");
      expect(result).toContain("temperature = 0.7");
    });

    test("updates notify with different format", () => {
      const existing = `notify=["other-tool", "arg1", "arg2"]`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should replace entire notify line
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
      expect(result).not.toContain("other-tool");
    });

    test("only replaces notify line, not similar content", () => {
      const existing = `# This is a notify comment
description = "notify users about events"
notify = ["old-tool"]
after_notify = "some value"`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should preserve comment and other keys
      expect(result).toContain("# This is a notify comment");
      expect(result).toContain("description = \"notify users about events\"");
      expect(result).toContain("after_notify = \"some value\"");
      
      // Should only update the actual notify line
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
      expect(result).not.toContain('notify = ["old-tool"]');
    });

    test("handles notify with spaces around =", () => {
      const existing = `notify   =   ["old-tool"]`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });
  });

  describe("edge cases", () => {
    test("handles config with only comments", () => {
      const existing = `# This is a comment
# Another comment`;
      
      const result = generateContent(existing, "/path/to/script.sh");
      
      expect(result).toContain("# This is a comment");
      expect(result).toContain("# Another comment");
      expect(result).toContain("notify = [\"bash\", \"/path/to/script.sh\"]");
    });

    test("handles path with spaces", () => {
      const result = generateContent("", "/path/with spaces/script.sh");
      
      expect(result).toContain('notify = ["bash", "/path/with spaces/script.sh"]');
    });

    test("handles path with special characters", () => {
      const result = generateContent("", "/path/with-dash_underscore/script.sh");
      
      expect(result).toContain('notify = ["bash", "/path/with-dash_underscore/script.sh"]');
    });

    test("preserves line endings", () => {
      const existing = "line1\nline2\nline3";
      const result = generateContent(existing, "/path/to/script.sh");
      
      // Should not have weird line endings
      expect(result).not.toContain("\r\n");
      expect(result).not.toContain("\r");
    });
  });
});

describe("isOurCodexNotify logic", () => {
  function isOurNotify(notifyLine: string, scriptPath: string): boolean {
    return notifyLine.includes(scriptPath) || notifyLine.includes("codex-notify.sh");
  }

  test("recognizes our script by full path", () => {
    const notifyLine = 'notify = ["bash", "/Users/test/.bin/codex-notify.sh"]';
    expect(isOurNotify(notifyLine, "/Users/test/.bin/codex-notify.sh")).toBe(true);
  });

  test("recognizes our script by filename", () => {
    const notifyLine = 'notify = ["bash", "/any/path/codex-notify.sh"]';
    expect(isOurNotify(notifyLine, "/different/path")).toBe(true);
  });

  test("does not recognize other scripts", () => {
    const notifyLine = 'notify = ["bash", "/path/to/other-tool.sh"]';
    expect(isOurNotify(notifyLine, "/different/path")).toBe(false);
  });

  test("does not recognize similar named scripts", () => {
    const notifyLine = 'notify = ["bash", "/path/to/codex-notify-v2.sh"]';
    // codex-notify-v2.sh does NOT contain "codex-notify.sh" as substring
    // so this should return false
    expect(isOurNotify(notifyLine, "/different/path")).toBe(false);
  });

  test("recognizes exact codex-notify.sh filename", () => {
    const notifyLine = 'notify = ["bash", "/any/path/codex-notify.sh"]';
    // This contains exactly "codex-notify.sh"
    expect(isOurNotify(notifyLine, "/totally/different/path")).toBe(true);
  });
});
