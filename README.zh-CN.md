# claude-notify

[English](./README.md)

为 macOS 上的 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 添加通知提醒。

当 Claude 发生以下情况时通知你：
- 任务完成
- 等待输入
- 请求权限

**功能（均可选）：**
- 音效提示（系统声音）
- macOS 通知
- 语音播报

## 截图

![功能选择 - 选择音效、通知、语音](./assets/image1.png)

![音效选择器，支持预览](./assets/image2.png)

![安装完成摘要](./assets/image3.png)

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

## 许可证

MIT
