import type { SoundName } from "../types";

/** Play macOS system sound */
export async function playSound(name: SoundName): Promise<void> {
  const soundPath = `/System/Library/Sounds/${name}.aiff`;

  const proc = Bun.spawn(["afplay", soundPath], {
    stdout: "ignore",
    stderr: "ignore",
  });

  await proc.exited;
}

/** Play sound async (non-blocking) */
export function playSoundAsync(name: SoundName): void {
  const soundPath = `/System/Library/Sounds/${name}.aiff`;

  Bun.spawn(["afplay", soundPath], {
    stdout: "ignore",
    stderr: "ignore",
  });
}
