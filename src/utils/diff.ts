import pc from "picocolors";
import { createTwoFilesPatch } from "diff";

/**
 * Normalize content for comparison (trim trailing whitespace/newlines)
 */
function normalizeContent(content: string): string {
  return content.trim();
}

/**
 * Create a colored unified diff using the diff library
 */
export function createUnifiedDiff(
  oldContent: string,
  newContent: string,
  oldLabel: string = "before",
  newLabel: string = "after"
): string[] {
  // Normalize both contents to avoid false diffs from trailing newlines
  const normalizedOld = normalizeContent(oldContent);
  const normalizedNew = normalizeContent(newContent);

  // If normalized content is the same, no diff
  if (normalizedOld === normalizedNew) {
    return [];
  }

  // Generate unified diff using the diff library
  const patch = createTwoFilesPatch(
    oldLabel,
    newLabel,
    normalizedOld + "\n",
    normalizedNew + "\n"
  );

  // Parse and colorize the diff output
  return colorizeDiff(patch);
}

/**
 * Colorize unified diff output
 */
function colorizeDiff(diffOutput: string): string[] {
  const lines = diffOutput.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith("+++") || line.startsWith("---")) {
      // File headers - skip them, we show our own header
      continue;
    } else if (line.startsWith("@@")) {
      // Hunk header
      result.push(pc.cyan(line));
    } else if (line.startsWith("+")) {
      // Added line
      result.push(pc.green(line));
    } else if (line.startsWith("-")) {
      // Removed line
      result.push(pc.red(line));
    } else if (line.trim() !== "") {
      // Context line
      result.push(pc.dim(` ${line}`));
    }
  }

  return result;
}

/**
 * Format a file diff with header
 * Returns { lines, hasChanges }
 */
export function formatFileDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
  noChangesText: string = "(already configured)"
): { lines: string[]; hasChanges: boolean } {
  const lines: string[] = [pc.cyan(pc.bold(filePath))];

  // Check if normalized content is the same
  const normalizedOld = normalizeContent(oldContent);
  const normalizedNew = normalizeContent(newContent);

  if (normalizedOld === normalizedNew) {
    lines.push(pc.dim(`  ${noChangesText}`));
    return { lines, hasChanges: false };
  }

  const diffLines = createUnifiedDiff(oldContent, newContent, "current", "new");

  if (diffLines.length === 0) {
    lines.push(pc.dim(`  ${noChangesText}`));
    return { lines, hasChanges: false };
  }

  lines.push(...diffLines.map((line) => `  ${line}`));
  return { lines, hasChanges: true };
}
