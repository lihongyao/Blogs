# 概述

[Sentry ↪](https://docs.sentry.io/)  提供端到端的分布式追踪功能，使开发者能够在其系统和各项服务之间识别并调试性能问题和错误。

这里主要记录如何在 Next.js 中的集成指南，参考 [这里 ↪](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

# 准备

1. 账号注册：https://sentry.io/signup/
2. 项目创建：https://docs.sentry.io/product/projects/

# 自动配置

提示：本示例配置仅配置错误上报

1）登录 Sentry，进入对应的项目，然后会看到 *Get Started with Sentry Issues* 提示，根据提示配置即可。

```shell
$ npx @sentry/wizard@latest -i nextjs  --org <org_name> --project <project_name>

> 选择部署方式（按实际情况来，我这里选择的是私有化部署）
◆ Are you using Sentry SaaS or self-hosted Sentry?
○ Sentry SaaS (sentry.io) 
● Self-hosted/on-premise/single-tenant 

> 输入私有化部署域名
◆	Please enter the URL of your self-hosted Sentry instance.

> 是否开启请求代理（如果是直连，选择No）
◆	Do you want to route Sentry requests in the browser through your Next.js server to avoid ad blockers?
○ Yes
● No

> 是否开启性能追踪
◆ Do you want to enable Tracing to track the performance of your application?
○ Yes
● No

> 是否开启会话回放，便于排查问题，会记录所有行为，增加 bundle 体积，如果有严格要求隐私合规的建议关闭
◆ Do you want to enable Session Replay to get a video-like reproduction of errors during a user session?
○ Yes
● No

> 是否将应用日志推送到 sentry （按需）
◆ Do you want to enable Logs to send your application logs to Sentry?
○ Yes
● No

> 是否自动生成一个测试页面，用于验证 Sentry 是否正常工作
◆ Do you want to create an example page ("/sentry-example-page") to test your Sentry setup?
○ Yes
● No

> 是不是通过 自动化构建/部署流程（CI/CD） 发布
◆ Are you using a CI/CD tool to build and deploy your application?
○ Yes
● No

> 要不要给你的项目加 MCP（Model Context Protocol）配置
◆ Optionally add a project-scoped MCP server configuration for the Sentry MCP?
○ Yes
● No 
○ What is MCP?

> 要不要让脚手架在改动文件后，帮你自动跑一遍代码格式化（Prettier / Biome）
◆ Looks like you have Prettier and Biome in your project. Do you want to run them on your files?
● Yes / ○ No

.....
Successfully installed the Sentry Next.js SDK! 
```

# Source map

https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/

# 参考

@see https://eastondev.com/blog/zh/posts/dev/20251220-nextjs-production-monitoring/
