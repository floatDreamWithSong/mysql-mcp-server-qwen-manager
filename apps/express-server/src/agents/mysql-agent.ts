import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { qwen } from "../model";
import { mcp } from "../mcp";
import { MYSQL_AGENT_PROMPT } from "../prompts/mysql-agent-prompt";

export const MySQLAgent = new Agent({
  name: "MySQL Agent",
  instructions: MYSQL_AGENT_PROMPT,
  model: qwen("qwen-plus"),
  tools: await mcp.getTools(),
  memory: new Memory({
    storage: new LibSQLStore({
      url: `file:${process.cwd()}/mastra-mysql-agent.db`,
    }),
    options: {
      lastMessages: 10,
      threads: {
        generateTitle: true,
      },
    },
  }),
});
