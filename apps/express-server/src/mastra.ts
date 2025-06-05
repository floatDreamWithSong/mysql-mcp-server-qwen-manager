import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { MySQLAgent } from "./agents/mysql-agent";

export const mastra = new Mastra({
  agents: { MySQLAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: `file:${process.cwd()}/mastra.db`,
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
