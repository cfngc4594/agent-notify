import { CODEX_CONFIG_FILE, CODEX_DIR } from "../config/constants";
import { ensureDir } from "./fs";

/** Codex config read result type */
export type CodexConfigResult =
  | { ok: true; content: string; exists: boolean }
  | { ok: false; error: "read_error"; message: string };

/** Read Codex config.toml as text */
export async function readCodexConfig(): Promise<CodexConfigResult> {
  const file = Bun.file(CODEX_CONFIG_FILE);

  if (!(await file.exists())) {
    return { ok: true, content: "", exists: false };
  }

  try {
    const content = await file.text();
    return { ok: true, content, exists: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "read_error", message };
  }
}

/** Generate new Codex config content (without writing) */
export async function generateCodexConfigContent(scriptPath: string): Promise<{ oldContent: string; newContent: string }> {
  const result = await readCodexConfig();
  if (!result.ok) {
    throw new Error(`Failed to read Codex config: ${result.message}`);
  }

  const notifyLine = `notify = ["bash", "${scriptPath}"]`;
  const oldContent = result.exists ? result.content : "";
  let newContent: string;

  if (!result.exists || result.content.trim() === "") {
    // Create new config file
    newContent = `# Codex configuration\n# https://github.com/openai/codex\n\n${notifyLine}\n`;
  } else {
    // Check if global notify already exists (before any [section])
    // We need to find notify that's NOT inside a [section]
    const lines = result.content.split("\n");
    const firstSectionIndex = lines.findIndex(line => /^\s*\[/.test(line));
    
    // Check for existing global notify (before first section or in whole file if no sections)
    const globalPart = firstSectionIndex === -1 
      ? result.content 
      : lines.slice(0, firstSectionIndex).join("\n");
    
    const notifyRegex = /^notify\s*=\s*\[.*\]\s*$/m;
    const hasGlobalNotify = notifyRegex.test(globalPart);

    if (hasGlobalNotify) {
      // Replace existing global notify line
      const beforeSection = globalPart.replace(notifyRegex, notifyLine);
      if (firstSectionIndex === -1) {
        newContent = beforeSection;
      } else {
        newContent = beforeSection + "\n" + lines.slice(firstSectionIndex).join("\n");
      }
    } else {
      // Insert notify BEFORE any [section] to ensure it's global
      if (firstSectionIndex === -1) {
        // No sections, safe to append
        const trimmed = result.content.trimEnd();
        newContent = `${trimmed}\n\n${notifyLine}\n`;
      } else {
        // Insert before the first section
        const beforeSection = lines.slice(0, firstSectionIndex).join("\n").trimEnd();
        const afterSection = lines.slice(firstSectionIndex).join("\n");
        newContent = `${beforeSection}\n\n${notifyLine}\n\n${afterSection}`;
      }
    }
  }

  return { oldContent, newContent };
}

/** Update or add notify config in Codex config.toml */
export async function updateCodexNotify(scriptPath: string): Promise<void> {
  await ensureDir(CODEX_DIR);
  const { newContent } = await generateCodexConfigContent(scriptPath);
  await Bun.write(CODEX_CONFIG_FILE, newContent);
}

/** Get existing notify config if any */
export async function getExistingCodexNotify(): Promise<string | null> {
  const result = await readCodexConfig();
  if (!result.ok || !result.exists) {
    return null;
  }

  const notifyRegex = /^notify\s*=\s*\[.*\]\s*$/m;
  const match = result.content.match(notifyRegex);
  return match ? match[0] : null;
}

/** Check if the notify is already configured with our script */
export function isOurCodexNotify(notifyLine: string, scriptPath: string): boolean {
  return notifyLine.includes(scriptPath) || notifyLine.includes("codex-notify.sh");
}
