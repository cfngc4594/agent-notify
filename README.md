# agent-notify

[中文](./README.zh-CN.md)

Notifications for AI coding agents on macOS. Supports [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Cursor](https://cursor.sh), and [OpenAI Codex](https://openai.com/index/openai-codex/).

**Supported Platforms:**
- **Claude Code / Cursor** - hooks in `~/.claude/settings.json`
- **OpenAI Codex** - notify in `~/.codex/config.toml`

Get notified when:
- Task completes
- Waiting for your input (Claude Code only)
- Permission requested (Claude Code only)

**Features (all optional):**
- Sound effects (system sounds)
- macOS notifications (Notification Center)
- Voice announcements (say command)
- ntfy push notifications (self-hosted or ntfy.sh)

## Screenshots

![Platform and feature selection](./assets/image1.png)

![ntfy push notification on mobile](./assets/image2.jpeg)

## Install

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

This will download the binary to `~/.local/bin/agent-notify`.

### Manual download

```bash
# Download for Apple Silicon (M1/M2/M3)
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-arm64 -o agent-notify

# Download for Intel Mac
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-x64 -o agent-notify

chmod +x agent-notify
./agent-notify
```

### From source

```bash
bun install && bun run dev
```

## Build

```bash
bun run build
```

## Codex Configuration

After running the installer with Codex selected, add the following to `~/.codex/config.toml`:

```toml
notify = ["bash", "~/.bin/codex-notify.sh"]
```

Replace `~/.bin` with your actual script installation directory.

## Self-hosted ntfy (Optional)

If you want to use ntfy push notifications with your own server:

```bash
docker compose up -d
```

This will start a ntfy server on port 1145. Configure the ntfy URL during setup.

## License

MIT
