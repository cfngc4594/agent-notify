import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { homedir } from "node:os";
import { getScriptConfigs, generateScripts, type FeatureOptions } from "./config/scripts";
import { mergeHooksConfig } from "./config/hooks";
import {
  readSettingsSafe,
  writeSettings,
  mergeSettings,
} from "./utils/settings";
import { ensureDir, writeExecutable } from "./utils/fs";
import { toDisplayPath, toAbsolutePath } from "./utils/path";
import { selectSoundWithPreview } from "./utils/sound-select";
import { setLocale, t } from "./i18n";
import type { SoundName } from "./types";

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

  // 2. Select features to enable
  const features = await p.multiselect({
    message: t("featureToggle"),
    options: [
      { value: "sound", label: t("featureSound"), hint: "afplay" },
      { value: "notification", label: t("featureNotification"), hint: "osascript" },
      { value: "voice", label: t("featureVoice"), hint: "say" },
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

  const featureOptions: FeatureOptions = {
    sound: features.includes("sound"),
    notification: features.includes("notification"),
    voice: features.includes("voice"),
  };

  // 3. Select sounds (with preview) - only if sound feature is enabled
  const sounds: SoundName[] = [];
  const scriptConfigs = getScriptConfigs();

  if (featureOptions.sound) {
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
  } else {
    // Use default sounds when sound feature is disabled
    for (const config of scriptConfigs) {
      sounds.push(config.defaultSound);
    }
  }

  // 4. Install
  const spinner = p.spinner();
  spinner.start(t("checkingSettings"));
  const settingsResult = await readSettingsSafe();

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

  spinner.start(t("creatingDir"));
  await ensureDir(binDir);
  spinner.stop(t("dirReady"));

  spinner.start(t("installingScripts"));
  const scripts = generateScripts(sounds, featureOptions);

  await Promise.all(
    Object.entries(scripts).map(([name, content]) =>
      writeExecutable(join(binDir, name), content)
    )
  );
  spinner.stop(t("scriptsInstalled")(scriptConfigs.length));

  spinner.start(t("updatingSettings"));
  const newHooks = mergeHooksConfig(settingsResult.data.hooks, binDir);
  const updatedSettings = mergeSettings(settingsResult.data, newHooks);
  await writeSettings(updatedSettings);
  spinner.stop(t("settingsUpdated"));

  // 5. Show results
  p.note(
    [
      pc.green(t("installedScripts")),
      ...scriptConfigs.map(
        (c, i) =>
          `  ${pc.dim("•")} ${binDirDisplay}/${c.name} ${pc.dim(
            `(${sounds[i]})`
          )}`
      ),
      "",
      pc.green(t("configuredHooks")),
      `  ${pc.dim("•")} Stop → claude-done-sound.sh`,
      `  ${pc.dim("•")} Notification (idle) → claude-waiting-sound.sh`,
      `  ${pc.dim("•")} Notification (permission) → claude-permission-sound.sh`,
    ].join("\n"),
    t("installComplete")
  );

  p.outro(pc.green(t("done")));
}

main().catch(console.error);
