import { mkdir, chmod } from "node:fs/promises";

/** Ensure directory exists, create if not */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/** Write file and set executable permission */
export async function writeExecutable(
  path: string,
  content: string
): Promise<void> {
  await Bun.write(path, content);
  await chmod(path, 0o755);
}

/** JSON read result type */
export type JsonReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "parse_error"; message: string };

/** Read JSON file safely (uses Bun native API) */
export async function readJsonSafe<T>(
  path: string
): Promise<JsonReadResult<T>> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return { ok: false, error: "not_found" };
  }

  try {
    const data = await file.json();
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "parse_error", message };
  }
}

/** Write JSON file with formatting (uses Bun native API) */
export async function writeJson(path: string, data: unknown): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, 2));
}
