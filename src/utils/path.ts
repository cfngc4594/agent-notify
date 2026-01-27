import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();

/** Convert absolute path to display format (~/xxx) */
export function toDisplayPath(path: string): string {
  if (path.startsWith(HOME)) {
    return "~" + path.slice(HOME.length);
  }
  return path;
}

/** Convert display path to absolute path (supports ~/xxx and ~xxx) */
export function toAbsolutePath(path: string): string {
  if (path.startsWith("~/")) {
    return join(HOME, path.slice(2));
  }
  if (path.startsWith("~")) {
    return join(HOME, path.slice(1));
  }
  return path;
}
