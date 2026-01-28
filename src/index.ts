import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { homedir } from "node:os";
import { getScriptConfigs, generateScripts, generateCodexScript, CODEX_SCRIPT_NAME, type FeatureOptions, type NtfyConfig } from "./config/scripts";
import { mergeHooksConfig } from "./config/hooks";
import {
  readSettingsSafe,
  writeSettings,
  mergeSettings,
} from "./utils/settings";
import { updateCodexNotify, getExistingCodexNotify, isOurCodexNotify, readCodexConfig, generateCodexConfigContent } from "./utils/codex-settings";
import { formatFileDiff } from "./utils/diff";
import { SETTINGS_FILE, CODEX_CONFIG_FILE } from "./config/constants";
import { ensureDir, writeExecutable } from "./utils/fs";
import { toDisplayPath, toAbsolutePath } from "./utils/path";
import { selectSoundWithPreview } from "./utils/sound-select";
import { setLocale, t } from "./i18n";
import type { SoundName, Platform } from "./types";

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
      { value: "codex", label: t("platformCodex"), hint: t("platformCodexHint") },
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
  const enableCodex = selectedPlatforms.includes("codex");

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
      defaultValue: "claude-notify",
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

  // 4. Select sounds (with preview) - only if sound feature is enabled
  const sounds: SoundName[] = [];
  const scriptConfigs = getScriptConfigs();
  let codexSound: SoundName = "Glass"; // Default for Codex

  if (featureOptions.sound) {
    // If Claude Code is enabled, select 3 sounds (done, waiting, permission)
    if (enableClaudeCode) {
      for (const [, config] of scriptConfigs.entries()) {
        console.log();
        const sound = await selectSoundWithPreview(
          config.promptMessage,
          config.defaultSound
        );
        if (!sound) {
          p.cancel(t("canceled"));
          process.exit(0);
        }
        sounds.push(sound);
      }
      // Use the "done" sound for Codex as well
      codexSound = sounds[0] ?? "Glass";
    }

    // If only Codex is enabled (no Claude Code), select just 1 sound
    if (enableCodex && !enableClaudeCode) {
      console.log();
      p.log.info(pc.dim(t("codexLimitHint")));
      const sound = await selectSoundWithPreview(
        t("codexSoundDone"),
        "Glass"
      );
      if (!sound) {
        p.cancel(t("canceled"));
        process.exit(0);
      }
      codexSound = sound;
    }
  } else {
    // Use default sounds when sound feature is disabled
    for (const config of scriptConfigs) {
      sounds.push(config.defaultSound);
    }
    codexSound = "Glass";
  }

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

  spinner.start(t("creatingDir"));
  await ensureDir(binDir);
  spinner.stop(t("dirReady"));

  spinner.start(t("installingScripts"));

  const installedScripts: string[] = [];
  let totalScripts = 0;

  // Install Claude Code scripts
  if (enableClaudeCode) {
    const scripts = generateScripts(sounds, featureOptions);
    await Promise.all(
      Object.entries(scripts).map(([name, content]) =>
        writeExecutable(join(binDir, name), content)
      )
    );
    installedScripts.push(...scriptConfigs.map((c, i) =>
      `  ${pc.dim("•")} ${binDirDisplay}/${c.name} ${pc.dim(`(${sounds[i]})`)}`
    ));
    totalScripts += scriptConfigs.length;
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

  spinner.stop(t("scriptsInstalled")(totalScripts));

  // Prepare config changes (but don't write yet)
  const codexScriptPath = join(binDir, CODEX_SCRIPT_NAME);
  const codexScriptPathDisplay = `${binDirDisplay}/${CODEX_SCRIPT_NAME}`;

  let claudeUpdatedSettings: ReturnType<typeof mergeSettings> | null = null;
  let shouldUpdateClaude = false;
  let shouldUpdateCodex = false;
  let codexExistingNotify: string | null = null;

  // Calculate Claude changes
  if (enableClaudeCode && settingsResult?.ok) {
    const newHooks = mergeHooksConfig(settingsResult.data.hooks, binDir);
    claudeUpdatedSettings = mergeSettings(settingsResult.data, newHooks);
    shouldUpdateClaude = true;
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
  if (shouldUpdateClaude || shouldUpdateCodex) {
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
  let codexConfigUpdated = false;

  if (shouldUpdateClaude && claudeUpdatedSettings) {
    spinner.start(t("updatingSettings"));
    await writeSettings(claudeUpdatedSettings);
    spinner.stop(t("settingsUpdated"));
    claudeConfigUpdated = true;
  }

  if (shouldUpdateCodex) {
    spinner.start(t("updatingCodex"));
    await updateCodexNotify(codexScriptPath);
    spinner.stop(t("codexUpdated"));
    codexConfigUpdated = true;
  }

  // 6. Show results
  const resultLines: string[] = [
    pc.green(t("installedScripts")),
    ...installedScripts,
  ];

  // Claude Code hooks info
  if (claudeConfigUpdated) {
    resultLines.push(
      "",
      pc.green(t("configuredHooks")),
      `  ${pc.dim("•")} Stop → claude-done-sound.sh`,
      `  ${pc.dim("•")} Notification (idle) → claude-waiting-sound.sh`,
      `  ${pc.dim("•")} Notification (permission) → claude-permission-sound.sh`
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

  p.note(resultLines.join("\n"), t("installComplete"));

  p.outro(pc.green(t("done")));
}

main().catch(console.error);
