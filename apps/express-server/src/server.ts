import express from "express";
import cors from "cors";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { mastra } from "./mastra";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 流式对话API - 集成Mastra服务
app.get("/api/stream", async (req: express.Request, res: express.Response) => {
  const { message } = req.query;

  if (!message) {
    res.status(400).json({ error: "Missing 'message' in request body" });
    return;
  }

  try {
    // 设置流式响应头
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // 使用共享包中的mastra实例
    const agent = mastra.getAgent("MySQLAgent");

    const result = await agent.stream(message as string, {
      toolChoice: "required",
      onStepFinish: (stepResult: any) => {
        // 处理工具调用信息
        try {
          if (stepResult.toolCalls && stepResult.toolCalls.length > 0) {
            stepResult.toolCalls.forEach((toolCall: any) => {
              console.log(toolCall);
              const toolInfo = {
                type: "tool_call",
                functionName: toolCall.toolName,
                arguments: toolCall.args,
                result: toolCall.result,
                timestamp: new Date().toISOString(),
              };
              res.write(JSON.stringify(toolInfo) + "\n");
            });
          }
        } catch (error) {
          console.error("Error processing step result:", error);
        }
      },
    });

    // 将异步迭代器转换为Observable并处理
    const stream$ = new Observable<string>((subscriber) => {
      (async () => {
        try {
          for await (const chunk of result.textStream) {
            subscriber.next(chunk);
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });

    stream$
      .pipe(
        tap((chunk) => {
          const data = {
            type: "text_chunk",
            content: chunk,
            timestamp: new Date().toISOString(),
          };
          console.log(data);
          res.write(JSON.stringify(data) + "\n");
        }),
        catchError((error) => {
          console.error("Stream error:", error);
          const errorData = {
            type: "error",
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            };
          res.write(JSON.stringify(errorData) + "\n");
          throw error;
        }),
      )
      .subscribe({
        complete: () => {
          const endData = {
            type: "end",
            timestamp: new Date().toISOString(),
            };
          res.write(JSON.stringify(endData) + "\n");
          res.end();
        },
        error: () => {
          if (!res.destroyed) res.end();
        },
      });
  } catch (error) {
    console.error("Agent error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Agent processing failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// 健康检查接口
app.get("/api/health", (req: express.Request, res: express.Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "express-server",
  });
});

// 获取可用的代理信息
app.get("/api/agents", (req: express.Request, res: express.Response) => {
  try {
    // 使用 Object.keys 来获取代理名称
    const agentNames = ["MySQLAgent"]; // 硬编码已知的代理名称
    res.json({
      agents: agentNames,
      count: agentNames.length,
    });
  } catch (error) {
    console.error("Error loading agents:", error);
    res.status(500).json({
      error: "Failed to load agents",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`Express服务器已启动，端口: ${port}`);
  console.log(`\n可用的API端点:`);
  console.log(`- GET  /api/health - 健康检查`);
  console.log(`- GET  /api/agents - 获取可用agent信息`);
  console.log(`- GET  /api/stream - 流式对话接口`);
  console.log(`- 环境变量-数据库: ${process.env.DB_HOST}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_PORT}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_USER}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_PASSWORD}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_NAME}`);
  console.log(`- QWEN 终端: ${process.env.QWEN_BASE_URL}`);
});
