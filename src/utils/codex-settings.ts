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

/** Update or add notify config in Codex config.toml */
export async function updateCodexNotify(scriptPath: string): Promise<void> {
  await ensureDir(CODEX_DIR);

  const result = await readCodexConfig();
  if (!result.ok) {
    throw new Error(`Failed to read Codex config: ${result.message}`);
  }

  const notifyLine = `notify = ["bash", "${scriptPath}"]`;
  let newContent: string;

  if (!result.exists || result.content.trim() === "") {
    // Create new config file
    newContent = `# Codex configuration\n# https://github.com/openai/codex\n\n${notifyLine}\n`;
  } else {
    // Check if notify already exists
    const notifyRegex = /^notify\s*=\s*\[.*\]\s*$/m;

    if (notifyRegex.test(result.content)) {
      // Replace existing notify line
      newContent = result.content.replace(notifyRegex, notifyLine);
    } else {
      // Append notify line
      const trimmed = result.content.trimEnd();
      newContent = `${trimmed}\n\n${notifyLine}\n`;
    }
  }

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
