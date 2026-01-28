# claude-notify

[English](./README.md)

为 macOS 上的 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 和 [OpenAI Codex](https://openai.com/index/openai-codex/) 添加通知提醒。

**支持的平台：**
- **Claude Code / Cursor** - hooks 配置在 `~/.claude/settings.json`
- **OpenAI Codex** - notify 配置在 `~/.codex/config.toml`

当发生以下情况时通知你：
- 任务完成
- 等待输入（仅 Claude Code）
- 请求权限（仅 Claude Code）

**功能（均可选）：**
- 音效提示（系统声音）
- macOS 通知（通知中心）
- 语音播报（say 命令）
- ntfy 推送通知（支持自托管或 ntfy.sh）

## 截图

![平台和功能选择](./assets/image1.png)

![手机上的 ntfy 推送通知](./assets/image2.jpeg)

## 安装

```bash
# 使用 Bun
bun install && bun run dev

# 或从 Releases 下载可执行文件
xattr -d com.apple.quarantine ./claude-notify-arm64  # 移除隔离属性
chmod +x ./claude-notify-arm64
./claude-notify-arm64
```

> **注意：** macOS 默认会阻止未签名的可执行文件。运行 `xattr -d com.apple.quarantine <文件>` 即可解除限制。

## 构建

```bash
bun run build
```

## Codex 配置

运行安装程序并选择 Codex 后，将以下内容添加到 `~/.codex/config.toml`：

```toml
notify = ["bash", "~/.bin/codex-notify.sh"]
```

将 `~/.bin` 替换为你实际的脚本安装目录。

## 自托管 ntfy（可选）

如果你想使用自己的 ntfy 服务器进行推送通知：

```bash
docker compose up -d
```

这将在端口 1145 启动一个 ntfy 服务器。在设置过程中配置 ntfy URL 即可。

## 许可证

MIT
