import { MCPServer } from '@mastra/mcp';
import { config } from './config/database.js';
import { 
  mysqlQueryTool, 
  mysqlSchemaTool, 
  mysqlDdlTool,
  paginationTool,
  queryLogTool
} from './tools/mysql-tools.js';

// 创建MCP服务器
const server = new MCPServer({
  name: 'MySQL MCP Server',
  version: '2.0.0',
  description: '连接到MySQL数据库的高级工具集，支持安全查询、分页显示、日志记录等功能',
  tools: {
    mysqlQueryTool,
    mysqlSchemaTool,
    mysqlDdlTool,
    paginationTool,
    queryLogTool
  }
});

// 启动服务器
console.log(`MySQL MCP Server准备启动...`);
console.log(`数据库: ${config.database}, 用户: ${config.user}`);
console.log(`支持功能: 安全查询、分页显示、日志记录、表结构获取`);

// 使用stdio传输启动服务器
await server.startStdio();