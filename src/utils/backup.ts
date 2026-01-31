import { toDisplayPath } from "./path";

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  displayPath: string;
}

export interface BackupResult {
  success: boolean;
  backups: BackupInfo[];
}

/**
 * Generate a timestamp string for backup filenames
 * Format: YYYYMMDD-HHMMSS
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Backup a single file if it exists
 * Backup is created in the same directory as the original file
 * Format: {filename}.{timestamp}.bak (e.g., settings.json.20250131-143022.bak)
 * Returns BackupInfo if backed up, null if file doesn't exist
 */
export async function backupFile(filePath: string): Promise<BackupInfo | null> {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  const timestamp = getTimestamp();
  const backupPath = `${filePath}.${timestamp}.bak`;

  // Read original content and write to backup
  const content = await file.text();
  await Bun.write(backupPath, content);

  return {
    originalPath: filePath,
    backupPath,
    displayPath: toDisplayPath(backupPath),
  };
}

/**
 * Backup multiple files at once
 * Only backs up files that exist
 */
export async function backupFiles(filePaths: string[]): Promise<BackupResult> {
  const backups: BackupInfo[] = [];

  for (const filePath of filePaths) {
    const backup = await backupFile(filePath);
    if (backup) {
      backups.push(backup);
    }
  }

  return {
    success: true,
    backups,
  };
}
