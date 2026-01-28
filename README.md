# agent-notify

[中文](./README.zh-CN.md)

Notifications for AI coding agents on macOS.

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

## Features

- Works with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Cursor](https://cursor.sh), and [OpenAI Codex](https://openai.com/index/openai-codex/)
- Sound effects (system sounds)
- macOS notifications (Notification Center)
- Voice announcements (say command)
- ntfy push notifications (self-hosted or ntfy.sh)

Get notified when task completes, waiting for input, or permission requested.

![Platform and feature selection](./assets/image1.png)

![ntfy push notification on mobile](./assets/image2.jpeg)

## Install

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

### Manual download

```bash
# Apple Silicon (M1/M2/M3/M4)
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-arm64 -o agent-notify

# Intel Mac
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-x64 -o agent-notify

chmod +x agent-notify
./agent-notify
```

### From source

```bash
bun install && bun run dev
```

## Configuration

Both platforms are **automatically configured** by the installer:

- **Claude Code / Cursor** → hooks in `~/.claude/settings.json`
- **OpenAI Codex** → notify in `~/.codex/config.toml`

No manual configuration needed.

## Self-hosted ntfy (Optional)

If you want to use your own ntfy server instead of [ntfy.sh](https://ntfy.sh):

```bash
docker compose up -d
```

Default port is 80. To use a different port, edit `docker-compose.yml`:

```yaml
ports:
  - 8080:80  # Change 8080 to your preferred port
```

Then enter `http://localhost:8080` as the ntfy URL during setup.

## License

MIT
