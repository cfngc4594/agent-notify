import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
export const CLAUDE_DIR = join(HOME, ".claude");
export const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
