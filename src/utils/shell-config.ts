import { homedir } from "node:os";
import { join, basename } from "node:path";

const HOME = homedir();

export interface ShellConfigResult {
  success: boolean;
  shell: string;
  configPath: string;
  pathAdded: boolean;
  functionAdded: boolean;
}

/**
 * Get shell type from SHELL environment variable
 */
function getShellType(): string {
  const shell = process.env.SHELL || "";
  return basename(shell);
}

/**
 * Check if PATH already includes the bin directory
 */
function hasPathExport(content: string, binDir: string): boolean {
  // Check for exact export line or if binDir is mentioned in PATH
  return (
    content.includes(`export PATH="${binDir}:$PATH"`) ||
    content.includes(`export PATH="${binDir}:\$PATH"`) ||
    content.includes(`PATH="${binDir}:`)
  );
}

/**
 * Check if notify function already exists
 */
function hasNotifyFunction(content: string): boolean {
  return (
    content.includes("notify()") ||
    content.includes("function notify")
  );
}

/**
 * Configure shell to add PATH and notify function
 * Following the same pattern as install.sh (supports zsh and bash)
 */
export async function configureShell(
  binDir: string,
  notifyPath: string
): Promise<ShellConfigResult | null> {
  const shellType = getShellType();

  let configPath: string | null = null;

  switch (shellType) {
    case "zsh": {
      const zshrc = join(HOME, ".zshrc");
      try {
        const file = Bun.file(zshrc);
        if (await file.exists()) {
          configPath = zshrc;
        }
      } catch {
        // File doesn't exist, try to create it
        configPath = zshrc;
      }
      break;
    }
    case "bash": {
      // Try .bashrc first, then .bash_profile
      const bashrc = join(HOME, ".bashrc");
      const bashProfile = join(HOME, ".bash_profile");
      const bashConfigs = [bashrc, bashProfile];
      
      for (const config of bashConfigs) {
        try {
          const file = Bun.file(config);
          if (await file.exists()) {
            configPath = config;
            break;
          }
        } catch {
          // Continue to next
        }
      }
      // Default to .bashrc if none exist
      if (!configPath) {
        configPath = bashrc;
      }
      break;
    }
    default:
      // Unsupported shell
      return null;
  }

  if (!configPath) {
    return null;
  }

  try {
    const file = Bun.file(configPath);
    let content = "";
    
    if (await file.exists()) {
      content = await file.text();
    }

    const needsPath = !hasPathExport(content, binDir);
    const needsFunction = !hasNotifyFunction(content);

    if (!needsPath && !needsFunction) {
      // Already configured
      return {
        success: true,
        shell: shellType,
        configPath,
        pathAdded: false,
        functionAdded: false,
      };
    }

    // Build content to append
    const linesToAdd: string[] = ["", "# agent-notify"];
    
    if (needsPath) {
      linesToAdd.push(`export PATH="${binDir}:$PATH"`);
    }
    
    if (needsFunction) {
      linesToAdd.push(`notify() { "${notifyPath}" "$?"; }`);
    }

    const newContent = content + linesToAdd.join("\n") + "\n";
    await Bun.write(configPath, newContent);

    return {
      success: true,
      shell: shellType,
      configPath,
      pathAdded: needsPath,
      functionAdded: needsFunction,
    };
  } catch {
    return null;
  }
}

/**
 * Generate manual configuration instructions for unsupported shells
 */
export function getManualConfig(binDir: string, notifyPath: string): string[] {
  return [
    `export PATH="${binDir}:$PATH"`,
    `notify() { "${notifyPath}" "$?"; }`,
  ];
}

/**
 * Get the shell config file path that would be modified
 * Returns null if shell is unsupported
 */
export async function getShellConfigPath(): Promise<string | null> {
  const shellType = getShellType();

  switch (shellType) {
    case "zsh": {
      return join(HOME, ".zshrc");
    }
    case "bash": {
      const bashrc = join(HOME, ".bashrc");
      const bashProfile = join(HOME, ".bash_profile");

      // Check which one exists
      try {
        const file = Bun.file(bashrc);
        if (await file.exists()) {
          return bashrc;
        }
      } catch {
        // Continue
      }

      try {
        const file = Bun.file(bashProfile);
        if (await file.exists()) {
          return bashProfile;
        }
      } catch {
        // Continue
      }

      // Default to .bashrc
      return bashrc;
    }
    default:
      return null;
  }
}

