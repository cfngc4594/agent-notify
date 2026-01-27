# claude-notify

[English](./README.md)

为 macOS 上的 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 添加声音通知。

当 Claude 发生以下情况时播放提示音：
- 任务完成
- 等待输入
- 请求权限

## 截图

![截图](./assets/image.png)

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
