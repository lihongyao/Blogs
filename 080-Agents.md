# 终端推荐

现代终端模拟器：

1. https://ghostty.org/ （🔥）
2. https://www.warp.dev/

# Code-x

## 概述

https://openai.com/zh-Hans-CN/codex/get-started/

**Codex 是 OpenAI 对标 Claude Code 的编程 Agent 产品。**

它跟普通问答式 AI 最大的区别，不在于"它更聪明"，而在于：

- 它更像一个工作流工具
- 它会围绕任务持续推进
- 它的重点不是回答一句，而是把一件事往前做

**codex 20 刀充值链接（自备魔法）**： https://maynorai.jichiyun.sbs/buy/7

## 配置

`~/.codex/config.toml`

```toml
# 使用哪个模型提供商
model_provider = "OpenAI"

# 主模型
model = "gpt-5.4"

# 用于 review / 代码审查 的模型
review_model = "gpt-5.4"

# 推理强度：low / medium / high / xhigh，越高越聪明，但更慢、更耗 token
model_reasoning_effort = "xhigh"

# 禁止存储响应（隐私模式）
disable_response_storage = true

# 是否允许联网
network_access = "enabled"

# Windows 下是否已经配置好 WSL
windows_wsl_setup_acknowledged = true

# 最大上下文窗口（100 万 token）
model_context_window = 1000000

# 当上下文超过 90 万 token 时，自动 compact / summary 压缩上下文
model_auto_compact_token_limit = 900000

# OpenAI Provider 配置
[model_providers.OpenAI]

# Provider 名称
name = "OpenAI"

# OpenAI API 地址

# 注意：这里不是官方 OpenAI 地址，而是一个 OpenAI 兼容代理
base_url = "https://gmncode.cn"

# 使用 OpenAI 新版 Responses API，而不是旧版 Chat Completions API
wire_api = "responses"

# 是否需要 OpenAI 风格鉴权，Authorization: Bearer sk-xxxx
requires_openai_auth = true
```

`~/.codex/auth.json`

```
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```



## 实战

### Gitlab

1）安装

```shell
$ brew install glab
```

2）校验

```shell
$ glab version
```

3）登录

```shell
$ glab auth login
```

### Figma

@See [Codex and Figma: Set up the MCP server ↪ ](https://help.figma.com/hc/en-us/articles/39888629089175-Codex-and-Figma-Set-up-the-MCP-server?utm_source=chatgpt.com)

# OpenCode

## 官网与项目简介

- 官网：<https://opencode.ai>
- 官方文档：<https://opencode.ai/docs>
- GitHub：<https://github.com/anomalyco/opencode>

OpenCode 是一个开源、模型供应商无关的 AI 编程 Agent，可以通过终端 TUI、桌面应用或 IDE 扩展使用。它能够分析代码库、回答代码问题、制定实现计划、修改文件和执行 Shell 命令，并支持 MCP、LSP、会话管理与分享等能力。

OpenCode 支持 OpenAI、Anthropic、Google、Amazon Bedrock、GitHub Copilot、OpenRouter、DeepSeek 等众多模型服务，也可以连接 Ollama、LM Studio 等本地模型。它不是 OpenAI Codex，也不绑定某一家模型厂商。

## 安装

官方推荐使用安装脚本：

```shell
$ curl -fsSL https://opencode.ai/install | bash
```

也可以使用 npm 或 Homebrew：

```shell
$ npm install -g opencode-ai
# 或
$ brew install anomalyco/tap/opencode
```

安装后检查版本：

```shell
$ opencode --version
```

## 配置模型

进入 OpenCode 后运行 `/connect`，选择模型服务商并按提示登录或填写 API Key：

```text
/connect
```

使用 `/models` 查看并切换当前可用模型：

```text
/models
```

也可以在命令行中管理认证信息和查看模型：

```shell
$ opencode auth login
$ opencode auth list
$ opencode auth logout
$ opencode models
```

认证信息默认保存在 `~/.local/share/opencode/auth.json`。该文件包含敏感凭据，不要提交到 Git、分享给他人或同步到不可信位置。各服务商的具体配置方法参考[官方 Providers 文档](https://opencode.ai/docs/providers)。

## 基本使用

进入项目目录并启动交互式终端界面：

```shell
$ cd your-project
$ opencode
```

首次进入项目后，可以执行 `/init`。OpenCode 会分析项目并在根目录生成 `AGENTS.md`，用于记录项目结构和开发约定：

```text
/init
```

直接执行一次性任务：

```shell
$ opencode run "解释这个项目的整体架构"
$ opencode run "重构 formatDate 函数，并补充测试"
```

常用命令与参数：

```shell
$ opencode /path/to/project        # 打开指定项目
$ opencode --model provider/model  # 指定模型
$ opencode --continue              # 继续最近一次会话
$ opencode session list            # 查看历史会话
$ opencode mcp list                # 查看 MCP Server
$ opencode upgrade                 # 升级 OpenCode
$ opencode --help                  # 查看完整帮助
```

## Agent 模式

OpenCode 默认提供两种主要 Agent，可以在交互界面中按 `Tab` 切换：

- `build`：默认开发模式，可以读取和修改文件、执行命令并完成开发任务。
- `plan`：分析与规划模式，默认禁止修改文件，并在执行 Shell 命令前请求许可。

交互会话中还可以使用 `/undo` 撤销修改、`/redo` 恢复修改、`/share` 生成会话分享链接。会话默认不会公开分享。

## 安全提示

OpenCode 可以执行本地命令、读写文件和访问网络，权限确认机制不等同于完整的安全沙箱。处理来源不可信的仓库时，应先检查项目指令和脚本，必要时使用 Docker 或虚拟机隔离；涉及重要代码时，执行前后都应查看 Git diff 并运行测试。



# 参考

- https://zhuanlan.zhihu.com/p/2004914542765941622
- [写给 Codex 小白用户的全网最详细教程：从 0 到 1，把 Codex 真正用起来 ↪](https://github.com/xianyu110/gpt-codex)
- [AI Agent 工程师入门指南 ↪](https://juejin.cn/post/7654919203225649171)
- [动手学大模型应用开发 ↪](动手学大模型应用开发)
