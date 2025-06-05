import express from "express";
import cors from "cors";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { mastra } from "./mastra";
import dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

const app = express();
const port = process.env.PORT ?? 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 流式对话API - 集成Mastra服务
app.get("/api/stream", async (req: express.Request, res: express.Response) => {
  console.log("[API访问] /api/stream - 流式对话请求");
  console.log("请求参数:", req.query);
  const { message, tid } = req.query;

  if (!message) {
    console.log("错误: 缺少message参数");
    res.status(400).json({ error: "Missing 'message' in request query" });
    return;
  }
  if (typeof tid != "string") {
    res.status(400).json({ error: "wrong 'tid' in request query" });
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
      resourceId: "user",
      threadId: tid || "default",
      toolChoice: "required",
      onStepFinish: (stepResult: {
        toolCalls: Array<{
          type: "tool-call";
          toolCallId: string;
          toolName: string;
          args: {
            detailed: boolean;
          };
        }>;
        toolResults: Array<{
          type: "tool-result";
          toolCallId: string;
          toolName: string;
          args: {
            detailed: boolean;
          };
          result: {
            content: Array<{
              type: "text";
              text: string;
            }>;
            isError: boolean;
          };
        }>;
      }) => {
        // 处理工具调用信息
        try {
          if (stepResult.toolCalls && stepResult.toolCalls.length > 0) {
            stepResult.toolCalls.forEach((toolCall: any) => {
              console.log(toolCall);

              // 通过 toolCallId 找到对应的结果
              const toolResult = stepResult.toolResults?.find(
                (result: any) => result.toolCallId === toolCall.toolCallId,
              );

              const toolInfo = {
                type: "tool_call",
                toolCallId: toolCall.toolCallId,
                functionName: toolCall.toolName,
                arguments: toolCall.args,
                result: toolResult
                  ? {
                      content: toolResult.result.content,
                      isError: toolResult.result.isError,
                    }
                  : null,
                timestamp: new Date().toISOString(),
              };
              console.log("处理的工具调用信息:", toolInfo);
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
  console.log("[API访问] /api/health - 健康检查请求");
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "express-server",
  });
});

// 获取可用的代理信息
app.get("/api/agents", (req: express.Request, res: express.Response) => {
  console.log("[API访问] /api/agents - 获取代理列表请求");
  try {
    // 使用 Object.keys 来获取代理名称
    const agentNames = ["MySQLAgent"]; // 硬编码已知的代理名称
    console.log("返回代理列表:", agentNames);
    res.json({
      agents: agentNames,
      count: agentNames.length,
    });
  } catch (error) {
    console.error("获取代理列表失败:", error);
    res.status(500).json({
      error: "Failed to load agents",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`Express服务器已启动，端口: ${port}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_HOST}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_PORT}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_USER}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_PASSWORD}`);
  console.log(`- 环境变量-数据库: ${process.env.DB_NAME}`);
  console.log(`- 前端界面: http://localhost:5173`);
});
