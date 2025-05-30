# 基于MCP与QWEN大模型的自然语言MySQL数据库查询系统

## 附件

[实验报告.md](/实验报告.md)

## 项目概述

本项目是实现了一个基于Model Context Protocol (MCP) 和大语言模型的自然语言到SQL查询转换系统。用户可以通过自然语言描述查询需求，系统自动生成并执行对应的SQL语句，返回查询结果。

### 主要功能

- 🔍 **自然语言转SQL**: 支持通过自然语言描述生成精确的SQL查询
- 🛡️ **安全控制**: 只允许SELECT查询，过滤敏感字段
- 📝 **查询日志**: 记录所有查询操作和时间戳
- 📄 **分页支持**: 长查询结果支持分页展示
- 🗄️ **表结构管理**: 动态获取和过滤数据库schema
- 🤖 **智能优化**: 提供SQL优化建议和多轮对话支持

## 项目目录结构

```
mcp-lab-06/
├── src/
│   ├── mysql-mcp/              # MCP服务器实现
│   │   ├── index.js           # MCP服务器主入口
│   │   ├── config/
│   │   │   └── database.js    # 数据库连接配置
│   │   ├── tools/
│   │   │   └── mysql-tools.js # MySQL工具集实现
│   │   └── utils/             # 工具函数
│   └── mastra/                # 大模型交互框架
│       ├── index.ts           # Mastra主入口
│       ├── agents/
│       │   └── mysql-agent.ts # MySQL Agent，MCP和大模型的交互集成处
│       ├── model/
│       │   └── index.ts       # 模型配置
│       ├── prompts/
│       │   └── mysql-agent-prompt.ts # Prompt模板
│       ├── mcp/               # MCP客户端配置
│       └── utils/             # 工具函数
├── logs/                      # 查询日志存储
├── .mastra/                   # Mastra中间文件输出
├── package.json              # 项目依赖配置
├── pnpm-lock.yaml            # 依赖锁定文件
├── .gitignore                # Git忽略配置
├── README.md                 # 项目说明文档
└── 实验报告.md               # 实验报告
```

## 环境要求

- **Node.js**: >= 20.9.0
- **数据库**: MySQL 5.7+ 或 MariaDB 10.3+
- **包管理器**: pnpm (推荐) 或 npm

## 配置说明

### 1. 环境变量配置

创建 `.env` 文件（如果不存在）：

```bash
# 通义千问API配置
QWEN_API_KEY=your_qwen_api_key_here

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=college
```

### 2. 数据库配置

确保你已经安装并配置了MySQL数据库，并创建了测试数据库（如college数据库）。

修改 `src/mysql-mcp/config/database.js` 中的数据库连接配置：

```javascript
export const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college'
};
```

## 安装与运行

### 1. 安装依赖

```bash
# 使用pnpm（推荐）
pnpm install

# 或使用npm
npm install
```

### 2. 启动Mastra开发环境（终端2）

```bash
# 启动Mastra开发环境
npm run dev
```

启动后，在浏览器中打开Web界面，地址为 `http://localhost:4111`

MCP服务器通过stdio输出，因此其并不会影响其它进程的MCP服务

如果你想要手动启动MCP：

```bash
# 启动MySQL MCP服务器
npm run mcp
```

服务器启动后会显示：
```
MySQL MCP服务器（增强版）准备启动...
数据库: xxx, 用户: xxx
支持功能: 安全查询、分页显示、日志记录、表结构获取
```

### 3. 使用系统

1. 在Web界面中选择 "MySQL Agent"
2. 输入自然语言查询，例如：
   - "列出所有课程的名称，按标题和学分排序"
   - "查找计算机科学系的所有课程"
   - "显示选修人数最多的前5门课程"
3. 系统会自动生成SQL、执行查询并返回结果

## 核心工具说明

### MCP工具集

- **mysqlQueryTool**: 执行SELECT查询，支持安全过滤
- **mysqlSchemaTool**: 获取数据库表结构信息
- **mysqlDdlTool**: 获取表的DDL语句
- **paginationTool**: 分页查询支持
- **queryLogTool**: 查询日志记录和查看

### 安全特性

- 只允许SELECT查询语句
- 过滤包含敏感字段的查询（password、salary等）
- SQL注入防护机制
- 白名单关键字验证