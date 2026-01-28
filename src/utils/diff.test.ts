import { describe, test, expect } from "bun:test";
import { createUnifiedDiff, formatFileDiff } from "./diff";

describe("createUnifiedDiff", () => {
  test("returns empty array when contents are identical", () => {
    const content = "line1\nline2\nline3";
    const result = createUnifiedDiff(content, content);
    expect(result).toEqual([]);
  });

  test("returns empty array when contents differ only by trailing newline", () => {
    const old = "line1\nline2";
    const newContent = "line1\nline2\n";
    const result = createUnifiedDiff(old, newContent);
    expect(result).toEqual([]);
  });

  test("returns empty array when contents differ only by trailing whitespace", () => {
    const old = "line1\nline2  ";
    const newContent = "line1\nline2";
    const result = createUnifiedDiff(old, newContent);
    expect(result).toEqual([]);
  });

  test("detects added lines", () => {
    const old = "line1\nline2";
    const newContent = "line1\nline2\nline3";
    const result = createUnifiedDiff(old, newContent);
    
    // Should contain the added line with + prefix
    const addedLine = result.find(line => line.includes("+line3"));
    expect(addedLine).toBeDefined();
  });

  test("detects removed lines", () => {
    const old = "line1\nline2\nline3";
    const newContent = "line1\nline2";
    const result = createUnifiedDiff(old, newContent);
    
    // Should contain the removed line with - prefix
    const removedLine = result.find(line => line.includes("-line3"));
    expect(removedLine).toBeDefined();
  });

  test("detects modified lines", () => {
    const old = "line1\nold_value\nline3";
    const newContent = "line1\nnew_value\nline3";
    const result = createUnifiedDiff(old, newContent);
    
    // Should contain both old and new versions
    const removedLine = result.find(line => line.includes("-old_value"));
    const addedLine = result.find(line => line.includes("+new_value"));
    expect(removedLine).toBeDefined();
    expect(addedLine).toBeDefined();
  });

  test("handles empty old content (new file)", () => {
    const old = "";
    const newContent = "line1\nline2";
    const result = createUnifiedDiff(old, newContent);
    
    // Should show all lines as added
    expect(result.some(line => line.includes("+line1"))).toBe(true);
    expect(result.some(line => line.includes("+line2"))).toBe(true);
  });

  test("handles empty new content (deleted file)", () => {
    const old = "line1\nline2";
    const newContent = "";
    const result = createUnifiedDiff(old, newContent);
    
    // Should show all lines as removed
    expect(result.some(line => line.includes("-line1"))).toBe(true);
    expect(result.some(line => line.includes("-line2"))).toBe(true);
  });
});

describe("formatFileDiff", () => {
  test("shows no changes message when contents are identical", () => {
    const content = '{"key": "value"}';
    const result = formatFileDiff("test.json", content, content, "(no changes)");
    
    expect(result.hasChanges).toBe(false);
    expect(result.lines.some(line => line.includes("(no changes)"))).toBe(true);
  });

  test("shows no changes when only trailing newline differs", () => {
    const old = '{"key": "value"}';
    const newContent = '{"key": "value"}\n';
    const result = formatFileDiff("test.json", old, newContent, "(no changes)");
    
    expect(result.hasChanges).toBe(false);
  });

  test("shows diff when content actually changes", () => {
    const old = '{"key": "old"}';
    const newContent = '{"key": "new"}';
    const result = formatFileDiff("test.json", old, newContent);
    
    expect(result.hasChanges).toBe(true);
    expect(result.lines.length).toBeGreaterThan(1);
  });

  test("includes file path in header", () => {
    const result = formatFileDiff("~/.config/test.json", "old", "new");
    
    expect(result.lines[0]).toContain("~/.config/test.json");
  });
});

describe("JSON config diff", () => {
  test("preserves existing keys when adding new keys", () => {
    const old = JSON.stringify({
      existingKey: "existingValue",
      anotherKey: { nested: true }
    }, null, 2);
    
    const newContent = JSON.stringify({
      existingKey: "existingValue",
      anotherKey: { nested: true },
      newKey: "newValue"
    }, null, 2);
    
    const result = createUnifiedDiff(old, newContent);
    
    // Should NOT show existing keys as removed
    const existingKeyRemoved = result.some(line => 
      line.includes("-") && line.includes("existingKey")
    );
    expect(existingKeyRemoved).toBe(false);
    
    // Should show new key as added
    const newKeyAdded = result.some(line => 
      line.includes("+") && line.includes("newKey")
    );
    expect(newKeyAdded).toBe(true);
  });

  test("does not show diff when JSON is semantically identical", () => {
    const old = JSON.stringify({ a: 1, b: 2 }, null, 2);
    const newContent = JSON.stringify({ a: 1, b: 2 }, null, 2);
    
    const result = createUnifiedDiff(old, newContent);
    expect(result).toEqual([]);
  });
});

describe("TOML config diff", () => {
  test("preserves existing config when adding notify", () => {
    const old = `# Codex configuration
model = "gpt-4"
temperature = 0.7`;
    
    const newContent = `# Codex configuration
model = "gpt-4"
temperature = 0.7

notify = ["bash", "~/.bin/codex-notify.sh"]`;
    
    const result = createUnifiedDiff(old, newContent);
    
    // Should NOT show existing config as REMOVED (line starting with exactly "-model")
    // Context lines may contain "model" but won't start with "-model"
    const modelRemoved = result.some(line => {
      // Check if line starts with -model (after stripping ANSI codes)
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
      return stripped.startsWith("-model") || stripped.startsWith("- model");
    });
    expect(modelRemoved).toBe(false);
    
    // Should show notify as added
    const notifyAdded = result.some(line => 
      line.includes("+") && line.includes("notify")
    );
    expect(notifyAdded).toBe(true);
  });

  test("only changes notify line when updating existing notify", () => {
    const old = `# Codex configuration
model = "gpt-4"
notify = ["bash", "/old/path/script.sh"]`;
    
    const newContent = `# Codex configuration
model = "gpt-4"
notify = ["bash", "/new/path/script.sh"]`;
    
    const result = createUnifiedDiff(old, newContent);
    
    // Should NOT show model as changed (removed or added)
    const modelChanged = result.some(line => {
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
      return (stripped.startsWith("-model") || stripped.startsWith("+model") ||
              stripped.startsWith("- model") || stripped.startsWith("+ model"));
    });
    expect(modelChanged).toBe(false);
    
    // Should only change notify line
    const oldNotify = result.some(line => 
      line.includes("-") && line.includes("/old/path/")
    );
    const newNotify = result.some(line => 
      line.includes("+") && line.includes("/new/path/")
    );
    expect(oldNotify).toBe(true);
    expect(newNotify).toBe(true);
  });
});
