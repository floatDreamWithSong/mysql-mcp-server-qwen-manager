import { MCPClient } from "@mastra/mcp";

// Configure MCPClient to connect to your server(s)
export const mcp = new MCPClient({
  servers: {
    "mysql-server": {
      "command": "node",
      "args": ["../../src/mysql-mcp/index.js"],
      "env": {
        // 传递环境变量到MCP服务器
        "DB_HOST": process.env.DB_HOST || "localhost",
        "DB_PORT": process.env.DB_PORT || "3306",
        "DB_USER": process.env.DB_USER || "user",
        "DB_PASSWORD": process.env.DB_PASSWORD || "123456",
        "DB_NAME": process.env.DB_NAME || "college"
      }
    }
  }
});