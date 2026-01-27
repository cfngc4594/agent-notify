import { SelectPrompt, isCancel } from "@clack/core";
import pc from "picocolors";
import { type SoundName, SOUNDS } from "../types";
import { playSoundAsync } from "./sound";
import { t } from "../i18n";

interface Option {
  value: SoundName;
  label: string;
}

/**
 * Sound selector with preview (uses @clack/core)
 * Arrow keys: navigate, Space: preview, Enter: select
 */
export async function selectSoundWithPreview(
  message: string,
  initial: SoundName = "Glass"
): Promise<SoundName | null> {
  const options: Option[] = SOUNDS.map((s) => ({
    value: s,
    label: s === initial ? `${s} (${t("default")})` : s,
  }));

  const initialIndex = SOUNDS.indexOf(initial);

  const prompt = new SelectPrompt({
    options,
    initialValue: initial,
    render() {
      const state = this.state;

      // Submitted
      if (state === "submit") {
        return `${pc.green("◇")} ${message}\n${pc.dim("│")} ${pc.dim(
          this.value
        )}`;
      }

      // Cancelled
      if (state === "cancel") {
        return `${pc.red("◇")} ${message}\n${pc.dim("│")} ${pc.strikethrough(
          pc.dim(t("canceled"))
        )}`;
      }

      // Active
      const title = `${pc.cyan("◆")} ${message} ${pc.dim(t("previewHint"))}`;

      const optionLines = options.map((opt, i) => {
        const isActive = i === this.cursor;
        const pointer = isActive ? pc.cyan("›") : " ";
        const indicator = isActive ? pc.green("●") : pc.dim("○");
        const label = isActive ? pc.cyan(opt.label) : opt.label;
        return `${pointer} ${indicator} ${label}`;
      });

      return [title, ...optionLines].join("\n");
    },
  });

  // Set initial cursor position
  (prompt as any).cursor = initialIndex >= 0 ? initialIndex : 0;

  // Space key to preview sound
  prompt.on("key", (char) => {
    if (char === " ") {
      const currentIndex = (prompt as any).cursor;
      const currentSound = SOUNDS[currentIndex];
      if (currentSound) {
        playSoundAsync(currentSound);
      }
    }
  });

  const result = await prompt.prompt();

  if (isCancel(result)) {
    return null;
  }

  return result as SoundName;
}
