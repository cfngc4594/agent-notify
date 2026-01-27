# claude-notify

[中文](./README.zh-CN.md)

Sound notifications for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) on macOS.

Get notified with system sounds when Claude:
- Completes a task
- Waits for your input
- Requests permission

## Screenshot

![Screenshot](./assets/image.png)

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
