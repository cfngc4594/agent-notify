import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { backupFile, backupFiles } from "./backup";

describe("backup", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "backup-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("backupFile returns null for non-existent file", async () => {
    const result = await backupFile(join(testDir, "non-existent.json"));
    expect(result).toBeNull();
  });

  test("backupFile backs up existing file in same directory with timestamp", async () => {
    const testFile = join(testDir, "test.json");
    await writeFile(testFile, '{"key": "value"}');

    const result = await backupFile(testFile);

    expect(result).not.toBeNull();
    expect(result!.originalPath).toBe(testFile);
    // Check format: {file}.{timestamp}.bak
    expect(result!.backupPath).toMatch(/test\.json\.\d{8}-\d{6}\.bak$/);

    // Verify backup content matches original
    const backupContent = await Bun.file(result!.backupPath).text();
    expect(backupContent).toBe('{"key": "value"}');
  });

  test("backupFiles backs up multiple existing files", async () => {
    const file1 = join(testDir, "file1.json");
    const file2 = join(testDir, "file2.toml");
    await writeFile(file1, '{"a": 1}');
    await writeFile(file2, "key = 'value'");

    const result = await backupFiles([file1, file2, join(testDir, "non-existent.txt")]);

    expect(result.success).toBe(true);
    expect(result.backups).toHaveLength(2);

    const backupPaths = result.backups.map((b) => b.backupPath);
    // Check format: {file}.{timestamp}.bak
    expect(backupPaths.some((p) => /file1\.json\.\d{8}-\d{6}\.bak$/.test(p))).toBe(true);
    expect(backupPaths.some((p) => /file2\.toml\.\d{8}-\d{6}\.bak$/.test(p))).toBe(true);
  });

  test("backupFiles returns empty array when no files exist", async () => {
    const result = await backupFiles([
      join(testDir, "a.json"),
      join(testDir, "b.json"),
    ]);

    expect(result.success).toBe(true);
    expect(result.backups.length).toBe(0);
  });
});
