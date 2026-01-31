# agent-notify

[English](./README.md)

macOS 上 AI 编程助手的通知提醒工具。

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

## 功能

- 支持 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Cursor](https://cursor.sh)、[OpenAI Codex](https://openai.com/index/openai-codex/) 和命令行 (CLI)
- 音效提示（系统声音）
- macOS 通知（通知中心）
- 语音播报（say 命令）
- ntfy 推送通知（支持自托管或 ntfy.sh）

任务完成时通知你。

![平台和功能选择](./assets/image1.png)

![macOS 通知](./assets/image2.png)

![手机上的 ntfy 推送通知](./assets/image3.png)

## 安装

### 一行命令安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

### 手动下载

```bash
# Apple Silicon (M1/M2/M3/M4)
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-arm64 -o agent-notify

# Intel Mac
curl -fsSL https://github.com/cfngc4594/agent-notify/releases/latest/download/agent-notify-x64 -o agent-notify

chmod +x agent-notify
./agent-notify
```

### 从源码构建

```bash
bun install && bun run dev
```

## 配置

安装程序会**自动配置**所有平台：

| 平台 | 配置文件 | Hook |
|------|---------|------|
| Claude Code | `~/.claude/settings.json` | `Stop` |
| Cursor | `~/.cursor/hooks.json` | `stop` |
| OpenAI Codex | `~/.codex/config.toml` | `notify` |
| CLI | `~/.zshrc` 或 `~/.bashrc` | `notify` 函数 |

安装程序会在应用更改前显示 **diff 预览**，让你确认将要修改的内容。你的现有配置会被保留。

**自动备份：** 修改任何配置文件前，安装程序会在同目录创建带时间戳的备份（如 `settings.json.20250131-143022.bak`）。如有问题，重命名 `.bak` 文件即可恢复。

> **说明：** 由于各平台支持的 hook 事件不同，为保持一致性，仅配置"任务完成"这一个 hook。

### 同时使用 Claude Code 和 Cursor

如果你同时使用 Claude Code 和 Cursor，Cursor 默认会加载 Claude Code 的 hooks 配置（通过"Include third-party skills"设置），这可能导致**收到重复通知**。

为避免此问题，请在 Cursor 中关闭该选项：

**Settings → Rules, Skills, Subagents → Include third-party skills, subagents, and other configs → 关闭**

## 自托管 ntfy（可选）

如果你想使用自己的 ntfy 服务器而不是 [ntfy.sh](https://ntfy.sh)：

```bash
docker compose up -d
```

默认端口是 80。如需修改端口，编辑 `docker-compose.yml`：

```yaml
ports:
  - 8080:80  # 将 8080 改为你需要的端口
```

安装时输入 `http://localhost:8080` 作为 ntfy URL 即可。

## 许可证

MIT
