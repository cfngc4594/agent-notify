import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  getClaudeScriptConfigs,
  getCursorScriptConfigs,
  generateClaudeScripts,
  generateCursorScripts,
  generateCodexScript,
  generateCliScript,
  CODEX_SCRIPT_NAME,
  CLI_SCRIPT_NAME,
  type FeatureOptions,
  type NtfyConfig,
} from "./config/scripts";
import { mergeHooksConfig, mergeCursorHooksConfig } from "./config/hooks";
import {
  readSettingsSafe,
  writeSettings,
  mergeSettings,
  readCursorHooksSafe,
  writeCursorHooks,
  mergeCursorHooksConfig as mergeCursorHooksConfigSettings,
} from "./utils/settings";
import { updateCodexNotify, getExistingCodexNotify, isOurCodexNotify, generateCodexConfigContent } from "./utils/codex-settings";
import { formatFileDiff } from "./utils/diff";
import { ensureDir, writeExecutable } from "./utils/fs";
import { toDisplayPath, toAbsolutePath } from "./utils/path";
import { selectSoundWithPreview } from "./utils/sound-select";
import { configureShell, getManualConfig, getShellConfigPath } from "./utils/shell-config";
import { backupFiles, type BackupResult } from "./utils/backup";
import { setLocale, t } from "./i18n";
import type { SoundName, Platform } from "./types";
import { SETTINGS_FILE, CURSOR_HOOKS_FILE, CODEX_CONFIG_FILE } from "./config/constants";

const DEFAULT_BIN_DIR = join(homedir(), ".bin");

async function main() {
  console.clear();

  // 0. Select language
  const locale = await p.select({
    message: "Select language / 选择语言",
    options: [
      { value: "en", label: "English" },
      { value: "zh", label: "中文" },
    ],
  });

  if (p.isCancel(locale)) {
    process.exit(0);
  }

  setLocale(locale);

  // 1. Get install directory
  const defaultDisplay = toDisplayPath(DEFAULT_BIN_DIR);

  const binDirInput = await p.text({
    message: t("scriptDir"),
    placeholder: defaultDisplay,
    defaultValue: defaultDisplay,
    validate: (value) => {
      if (!value?.trim()) return t("dirEmpty");
    },
  });

  if (p.isCancel(binDirInput)) {
    p.cancel(t("canceled"));
    process.exit(0);
  }

  const binDir = toAbsolutePath(binDirInput);
  const binDirDisplay = toDisplayPath(binDir);

  // 2. Select target platforms
  const platforms = await p.multiselect({
    message: t("platformSelect"),
    options: [
      { value: "claudeCode", label: t("platformClaudeCode"), hint: t("platformClaudeCodeHint") },
      { value: "cursor", label: t("platformCursor"), hint: t("platformCursorHint") },
      { value: "codex", label: t("platformCodex"), hint: t("platformCodexHint") },
      { value: "cli", label: t("platformCli"), hint: t("platformCliHint") },
    ],
    initialValues: ["claudeCode"],
    required: true,
  });

  if (p.isCancel(platforms)) {
    p.cancel(t("canceled"));
    process.exit(0);
  }

  if (platforms.length === 0) {
    p.cancel(t("platformRequired"));
    process.exit(0);
  }

  const selectedPlatforms = platforms as Platform[];
  const enableClaudeCode = selectedPlatforms.includes("claudeCode");
  const enableCursor = selectedPlatforms.includes("cursor");
  const enableCodex = selectedPlatforms.includes("codex");
  const enableCli = selectedPlatforms.includes("cli");

  // Warn if both Claude Code and Cursor are selected
  if (enableClaudeCode && enableCursor) {
    console.log();
    p.log.warn(pc.yellow(t("dualPlatformWarning")));
    p.log.info(pc.dim(`  ${t("dualPlatformHint")}`));
  }

  // 3. Select features to enable
  const features = await p.multiselect({
    message: t("featureToggle"),
    options: [
      { value: "sound", label: t("featureSound"), hint: "afplay" },
      { value: "notification", label: t("featureNotification"), hint: "osascript" },
      { value: "voice", label: t("featureVoice"), hint: "say" },
      { value: "ntfy", label: t("featureNtfy"), hint: "curl" },
    ],
    initialValues: ["sound", "notification"],
    required: true,
  });

  if (p.isCancel(features)) {
    p.cancel(t("canceled"));
    process.exit(0);
  }

  if (features.length === 0) {
    p.cancel(t("featureRequired"));
    process.exit(0);
  }

  // 3.1 Get ntfy config if enabled
  let ntfyConfig: NtfyConfig | undefined;
  if (features.includes("ntfy")) {
    const ntfyUrl = await p.text({
      message: t("ntfyUrl"),
      placeholder: t("ntfyUrlPlaceholder"),
      validate: (value) => {
        if (!value?.trim()) return t("ntfyUrlEmpty");
      },
    });

    if (p.isCancel(ntfyUrl)) {
      p.cancel(t("canceled"));
      process.exit(0);
    }

    const ntfyTopic = await p.text({
      message: t("ntfyTopic"),
      placeholder: t("ntfyTopicPlaceholder"),
      defaultValue: "agent-notify",
      validate: (value) => {
        if (!value?.trim()) return t("ntfyTopicEmpty");
      },
    });

    if (p.isCancel(ntfyTopic)) {
      p.cancel(t("canceled"));
      process.exit(0);
    }

    ntfyConfig = {
      url: ntfyUrl.trim(),
      topic: ntfyTopic.trim(),
    };
  }

  const featureOptions: FeatureOptions = {
    sound: features.includes("sound"),
    notification: features.includes("notification"),
    voice: features.includes("voice"),
    ntfy: features.includes("ntfy"),
    ntfyConfig,
  };

  // 4. Select sound (with preview) - only if sound feature is enabled
  // All platforms now only have one hook (task completion), so only need one sound
  const claudeScriptConfigs = getClaudeScriptConfigs();
  const cursorScriptConfigs = getCursorScriptConfigs();
  let selectedSound: SoundName = "Glass"; // Default sound

  if (featureOptions.sound) {
    console.log();
    const sound = await selectSoundWithPreview(
      t("soundDone"),
      "Glass"
    );
    if (!sound) {
      p.cancel(t("canceled"));
      process.exit(0);
    }
    selectedSound = sound;
  }

  // Use the same sound for all platforms
  const sounds: SoundName[] = [selectedSound];
  const codexSound = selectedSound;

  // 5. Install
  const spinner = p.spinner();

  // Check Claude settings only if Claude Code is selected
  let settingsResult: Awaited<ReturnType<typeof readSettingsSafe>> | null = null;
  if (enableClaudeCode) {
    spinner.start(t("checkingSettings"));
    settingsResult = await readSettingsSafe();

    if (!settingsResult.ok) {
      spinner.stop(pc.red(t("readFailed")));
      p.log.error(
        [
          pc.red(t("configError")),
          "",
          `  ${pc.dim(t("file"))} ${settingsResult.path}`,
          `  ${pc.dim(t("error"))} ${settingsResult.message}`,
          "",
          pc.yellow(t("jsonHint")),
        ].join("\n")
      );
      process.exit(1);
    }
    spinner.stop(t("configOk"));
  }

  // Check Cursor hooks only if Cursor is selected
  let cursorHooksResult: Awaited<ReturnType<typeof readCursorHooksSafe>> | null = null;
  if (enableCursor) {
    spinner.start(t("checkingSettings"));
    cursorHooksResult = await readCursorHooksSafe();

    if (!cursorHooksResult.ok) {
      spinner.stop(pc.red(t("readFailed")));
      p.log.error(
        [
          pc.red(t("configError")),
          "",
          `  ${pc.dim(t("file"))} ${cursorHooksResult.path}`,
          `  ${pc.dim(t("error"))} ${cursorHooksResult.message}`,
          "",
          pc.yellow(t("jsonHint")),
        ].join("\n")
      );
      process.exit(1);
    }
    spinner.stop(t("configOk"));
  }

  spinner.start(t("creatingDir"));
  await ensureDir(binDir);
  spinner.stop(t("dirReady"));

  spinner.start(t("installingScripts"));

  const installedScripts: string[] = [];
  let totalScripts = 0;

  // Install Claude Code scripts
  if (enableClaudeCode) {
    const scripts = generateClaudeScripts(sounds, featureOptions);
    await Promise.all(
      Object.entries(scripts).map(([name, content]) =>
        writeExecutable(join(binDir, name), content)
      )
    );
    installedScripts.push(...claudeScriptConfigs.map((c, i) =>
      `  ${pc.dim("•")} ${binDirDisplay}/${c.name} ${pc.dim(`(${sounds[i]})`)}`
    ));
    totalScripts += claudeScriptConfigs.length;
  }

  // Install Cursor scripts
  if (enableCursor) {
    const scripts = generateCursorScripts(sounds, featureOptions);
    await Promise.all(
      Object.entries(scripts).map(([name, content]) =>
        writeExecutable(join(binDir, name), content)
      )
    );
    installedScripts.push(...cursorScriptConfigs.map((c, i) =>
      `  ${pc.dim("•")} ${binDirDisplay}/${c.name} ${pc.dim(`(${sounds[i]})`)}`
    ));
    totalScripts += cursorScriptConfigs.length;
  }

  // Install Codex script
  if (enableCodex) {
    const codexScript = generateCodexScript(codexSound, featureOptions);
    await writeExecutable(join(binDir, CODEX_SCRIPT_NAME), codexScript);
    installedScripts.push(
      `  ${pc.dim("•")} ${binDirDisplay}/${CODEX_SCRIPT_NAME} ${pc.dim(`(${codexSound})`)}`
    );
    totalScripts += 1;
  }

  // Install CLI script
  if (enableCli) {
    const cliScript = generateCliScript(selectedSound, featureOptions);
    await writeExecutable(join(binDir, CLI_SCRIPT_NAME), cliScript);
    installedScripts.push(
      `  ${pc.dim("•")} ${binDirDisplay}/${CLI_SCRIPT_NAME} ${pc.dim(`(${selectedSound})`)}`
    );
    totalScripts += 1;
  }

  spinner.stop(t("scriptsInstalled")(totalScripts));

  // Prepare config changes (but don't write yet)
  const codexScriptPath = join(binDir, CODEX_SCRIPT_NAME);
  const codexScriptPathDisplay = `${binDirDisplay}/${CODEX_SCRIPT_NAME}`;

  let claudeUpdatedSettings: ReturnType<typeof mergeSettings> | null = null;
  let cursorUpdatedHooks: ReturnType<typeof mergeCursorHooksConfigSettings> | null = null;
  let shouldUpdateClaude = false;
  let shouldUpdateCursor = false;
  let shouldUpdateCodex = false;
  let codexExistingNotify: string | null = null;

  // Calculate Claude changes
  if (enableClaudeCode && settingsResult?.ok) {
    const newHooks = mergeHooksConfig(settingsResult.data.hooks, binDir);
    claudeUpdatedSettings = mergeSettings(settingsResult.data, newHooks);
    shouldUpdateClaude = true;
  }

  // Calculate Cursor changes
  if (enableCursor && cursorHooksResult?.ok) {
    const existingHooks = cursorHooksResult.data.hooks as Record<string, unknown> | undefined;
    const newHooks = mergeCursorHooksConfig(existingHooks as Parameters<typeof mergeCursorHooksConfig>[0], binDir);
    cursorUpdatedHooks = mergeCursorHooksConfigSettings(cursorHooksResult.data, newHooks as Record<string, unknown>);
    shouldUpdateCursor = true;
  }

  // Calculate Codex changes
  if (enableCodex) {
    codexExistingNotify = await getExistingCodexNotify();

    // Check if there's existing config that's NOT ours
    if (codexExistingNotify && !isOurCodexNotify(codexExistingNotify, codexScriptPath)) {
      console.log();
      p.log.warn(pc.yellow(t("codexExistingNotify")));
      p.log.info(pc.dim(`  ${codexExistingNotify}`));

      const action = await p.select({
        message: t("codexOverwritePrompt"),
        options: [
          { value: "overwrite", label: t("codexOverwrite") },
          { value: "keep", label: t("codexKeep") },
        ],
      });

      if (p.isCancel(action)) {
        p.cancel(t("canceled"));
        process.exit(0);
      }

      shouldUpdateCodex = action === "overwrite";
      if (!shouldUpdateCodex) {
        p.log.info(pc.dim(t("codexSkipped")));
      }
    } else {
      shouldUpdateCodex = true;
    }
  }

  // Show real diff and ask for confirmation
  if (shouldUpdateClaude || shouldUpdateCursor || shouldUpdateCodex) {
    console.log();
    const previewLines: string[] = [];
    let hasAnyChanges = false;

    // Claude settings diff
    if (shouldUpdateClaude && claudeUpdatedSettings && settingsResult?.ok) {
      const oldContent = JSON.stringify(settingsResult.data, null, 2);
      const newContent = JSON.stringify(claudeUpdatedSettings, null, 2);
      const result = formatFileDiff(t("claudeSettingsPath"), oldContent, newContent, t("noChangesNeeded"));
      previewLines.push(...result.lines);
      if (result.hasChanges) hasAnyChanges = true;
    }

    // Cursor hooks diff
    if (shouldUpdateCursor && cursorUpdatedHooks && cursorHooksResult?.ok) {
      if (previewLines.length > 0) previewLines.push("");
      const oldContent = JSON.stringify(cursorHooksResult.data, null, 2);
      const newContent = JSON.stringify(cursorUpdatedHooks, null, 2);
      const result = formatFileDiff(t("cursorHooksPath"), oldContent, newContent, t("noChangesNeeded"));
      previewLines.push(...result.lines);
      if (result.hasChanges) hasAnyChanges = true;
    }

    // Codex config diff
    if (shouldUpdateCodex) {
      if (previewLines.length > 0) previewLines.push("");
      const { oldContent, newContent } = await generateCodexConfigContent(codexScriptPath);
      const result = formatFileDiff(t("codexConfigPath"), oldContent, newContent, t("noChangesNeeded"));
      previewLines.push(...result.lines);
      if (result.hasChanges) hasAnyChanges = true;
    }

    p.note(previewLines.join("\n"), t("configPreview"));

    // If no changes needed, skip confirmation and writing
    if (!hasAnyChanges) {
      p.log.success(t("allConfigsUpToDate"));
      shouldUpdateClaude = false;
      shouldUpdateCursor = false;
      shouldUpdateCodex = false;
    } else {
      const confirm = await p.confirm({
        message: t("confirmChanges"),
      });

      if (p.isCancel(confirm) || !confirm) {
        p.cancel(t("changesCanceled"));
        process.exit(0);
      }
    }
  }

  // Now apply the changes (only if there are real changes)
  let claudeConfigUpdated = false;
  let cursorConfigUpdated = false;
  let codexConfigUpdated = false;
  let backupResult: BackupResult | null = null;

  // Backup all selected platform configs (simple approach: always backup if file exists)
  if (enableClaudeCode || enableCursor || enableCodex || enableCli) {
    spinner.start(t("backingUpConfigs"));

    const filesToBackup: string[] = [];
    if (enableClaudeCode) filesToBackup.push(SETTINGS_FILE);
    if (enableCursor) filesToBackup.push(CURSOR_HOOKS_FILE);
    if (enableCodex) filesToBackup.push(CODEX_CONFIG_FILE);
    if (enableCli) {
      const shellConfigPath = await getShellConfigPath();
      if (shellConfigPath) filesToBackup.push(shellConfigPath);
    }

    backupResult = await backupFiles(filesToBackup);

    if (backupResult.backups.length > 0) {
      spinner.stop(t("backupComplete")(backupResult.backups.length));
    } else {
      spinner.stop(t("backupNone"));
    }
  }

  if (shouldUpdateClaude && claudeUpdatedSettings) {
    spinner.start(t("updatingSettings"));
    await writeSettings(claudeUpdatedSettings);
    spinner.stop(t("settingsUpdated"));
    claudeConfigUpdated = true;
  }

  if (shouldUpdateCursor && cursorUpdatedHooks) {
    spinner.start(t("updatingCursor"));
    await writeCursorHooks(cursorUpdatedHooks);
    spinner.stop(t("cursorUpdated"));
    cursorConfigUpdated = true;
  }

  if (shouldUpdateCodex) {
    spinner.start(t("updatingCodex"));
    await updateCodexNotify(codexScriptPath);
    spinner.stop(t("codexUpdated"));
    codexConfigUpdated = true;
  }

  // 6. Show results
  const resultLines: string[] = [];

  // Show backup info first (if any backups were made)
  if (backupResult && backupResult.backups.length > 0) {
    resultLines.push(
      pc.yellow(`⚠ ${t("backupCreated")}`),
      ...backupResult.backups.map(b => `  ${pc.dim("•")} ${b.displayPath}`),
      pc.dim(`  ${t("backupRestoreHint")}`),
      ""
    );
  }

  resultLines.push(
    pc.green(t("installedScripts")),
    ...installedScripts,
  );

  // Claude Code hooks info
  if (claudeConfigUpdated) {
    resultLines.push(
      "",
      pc.green(t("configuredHooks")),
      `  ${pc.dim("•")} Stop → claude-done-sound.sh`
    );
  }

  // Cursor hooks info
  if (cursorConfigUpdated) {
    resultLines.push(
      "",
      pc.green(t("cursorConfiguredHooks")),
      `  ${pc.dim("•")} stop → cursor-done-sound.sh`
    );
  }

  // Codex config info
  if (codexConfigUpdated) {
    resultLines.push(
      "",
      pc.green(t("codexConfiguredNotify")),
      `  ${pc.dim("•")} notify → ${codexScriptPathDisplay}`
    );
  }

  // CLI usage info and shell configuration
  if (enableCli) {
    const cliScriptPath = join(binDir, CLI_SCRIPT_NAME);
    const cliScriptPathDisplay = `${binDirDisplay}/${CLI_SCRIPT_NAME}`;
    
    resultLines.push(
      "",
      pc.green(t("cliConfiguredNotify")),
      `  ${pc.dim("•")} ${cliScriptPathDisplay}`
    );

    // Try to configure shell automatically (like install.sh does for zsh/bash)
    const shellResult = await configureShell(binDir, cliScriptPath);
    
    if (shellResult && shellResult.success) {
      const configDisplay = toDisplayPath(shellResult.configPath);
      if (shellResult.pathAdded) {
        resultLines.push(
          "",
          pc.dim(t("cliPathAdded")(binDirDisplay, configDisplay))
        );
      }
      if (shellResult.functionAdded) {
        resultLines.push(
          pc.dim(t("cliShellConfigured")(configDisplay))
        );
      }
      resultLines.push(
        "",
        pc.dim(t("cliUsageHint"))
      );
    } else {
      // Unsupported shell, show manual instructions
      const manualConfig = getManualConfig(binDir, cliScriptPath);
      resultLines.push(
        "",
        pc.dim(t("cliShellManualHint")),
        ...manualConfig.map((line) => pc.cyan(`  ${line}`)),
        "",
        pc.dim(t("cliUsageHint"))
      );
    }
  }

  p.note(resultLines.join("\n"), t("installComplete"));

  p.outro(pc.green(t("done")));
}

main().catch(console.error);
