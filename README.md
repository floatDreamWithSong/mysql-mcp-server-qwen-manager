# 基于MCP与QWEN大模型的自然语言MySQL数据库查询系统

## 附件

[实验报告.md](/实验报告.md)

[v1文档 branch: v1](./README_v1.md)

[v2文档 branch: v2](./README_v2.md)

当前分支为v2，v2相比v1仅仅添加了web GUI样式，MCP等其余功能是相同的。

## 环境

- NodeJS 目前的stable版本22.13.1
- pnpm@^9.5.0，因为pnpm@9.5.0起开始支持catalog协议来辅助monorepo

## QuickStart

- 确认环境后，`pnpm i`安装依赖
- 复制根目录的`.env.example`文件为`.env`文件，并填写相关内容
- `pnpm start`启动应用