# claude-notify

[English](./README.md)

为 macOS 上的 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 添加通知提醒。

当 Claude 发生以下情况时通知你：
- 任务完成
- 等待输入
- 请求权限

**功能（均可选）：**
- 音效提示（系统声音）
- macOS 通知（通知中心）
- 语音播报（say 命令）
- ntfy 推送通知（支持自托管或 ntfy.sh）

## 截图

![功能选择 - 选择音效、通知、语音](./assets/image1.png)

![音效选择器，支持预览](./assets/image2.png)

![安装完成摘要](./assets/image3.jpeg)

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

## 自托管 ntfy（可选）

如果你想使用自己的 ntfy 服务器进行推送通知：

```bash
docker compose up -d
```

这将在端口 1145 启动一个 ntfy 服务器。在设置过程中配置 ntfy URL 即可。

## 许可证

MIT
