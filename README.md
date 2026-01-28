# claude-notify

[中文](./README.zh-CN.md)

Notifications for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) on macOS.

Get notified when Claude:
- Completes a task
- Waits for your input
- Requests permission

**Features (all optional):**
- Sound effects (system sounds)
- macOS notifications
- Voice announcements

## Screenshots

![Feature selection - choose sound, notification, voice](./assets/image1.png)

![Sound picker with preview option](./assets/image2.png)

![Installation complete summary](./assets/image3.png)

## Install

```bash
# Using Bun
bun install && bun run dev

# Or download the binary from Releases
xattr -d com.apple.quarantine ./claude-notify-arm64  # Remove quarantine
chmod +x ./claude-notify-arm64
./claude-notify-arm64
```

> **Note:** macOS blocks unsigned binaries by default. Run `xattr -d com.apple.quarantine <file>` to allow execution.

## Build

```bash
bun run build
```

## License

MIT
