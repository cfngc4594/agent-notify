# agent-notify

[English](./README.md)

macOS 上 AI 编程助手的通知提醒工具。

```bash
curl -fsSL https://raw.githubusercontent.com/cfngc4594/agent-notify/main/install.sh | bash
```

## 功能

- 支持 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Cursor](https://cursor.sh) 和 [OpenAI Codex](https://openai.com/index/openai-codex/)
- 音效提示（系统声音）
- macOS 通知（通知中心）
- 语音播报（say 命令）
- ntfy 推送通知（支持自托管或 ntfy.sh）

任务完成、等待输入、请求权限时通知你。

![平台和功能选择](./assets/image1.png)

![手机上的 ntfy 推送通知](./assets/image2.jpeg)

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

安装程序会**自动配置**两个平台：

- **Claude Code / Cursor** → hooks 配置在 `~/.claude/settings.json`
- **OpenAI Codex** → notify 配置在 `~/.codex/config.toml`

无需手动操作。

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
