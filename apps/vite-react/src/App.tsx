import React, { useState, useRef, useEffect } from "react";
import { Bubble, Sender, ThoughtChain, Welcome } from "@ant-design/x";
import { Button, Typography } from "antd";
import { BulbOutlined, MoreOutlined } from "@ant-design/icons";
import { Prompts } from "@ant-design/x";
import type {
  BubbleProps,
  PromptsProps,
  ThoughtChainProps,
} from "@ant-design/x";
import markdownit from "markdown-it";
import { v4 } from "uuid";
const initial_prompt_items: PromptsProps["items"] = [
  {
    key: "1",
    icon: <BulbOutlined style={{ color: "#FFD700" }} />,
    label: "数据库结构",
    description: "数据库里面有什么？",
  },
  {
    key: "2",
    icon: <BulbOutlined style={{ color: "#1890ff" }} />,
    label: "查询学生数据",
    description: "帮我查询学生数量",
  },
  {
    key: "3",
    icon: <BulbOutlined style={{ color: "#52c41a" }} />,
    label: "老师统计",
    description: "一共有多少个老师？",
  },
];

const md = markdownit({ html: true, breaks: true });
const renderMarkdown: BubbleProps["messageRender"] = (content) => {
  console.log("content", content);
  return (
    <Typography>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );
};

async function createStreamFromAPI(message: string, tid: string) {
  const apiUrl = `http://localhost:3001/api/stream?message=${encodeURIComponent(message)}&tid=${encodeURIComponent(tid)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/x-ndjson",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.body;
}

interface StreamChunk {
  type: "text_chunk" | "tool_call" | "error" | "end";
  content?: string;
  toolCallId?: string;
  functionName?: string;
  arguments?: any;
  result?: {
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  };
  error?: string;
  timestamp: string;
}

const App: React.FC = () => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<
    {
      role: "user" | "assistant";
      type: "text" | "function_call";
      content: string;
      toolCalls?: any[];
    }[]
  >([]);

  const [status, setStatus] = useState<"idle" | "requesting" | "responsing">(
    "idle",
  );
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [currentToolCalls, setCurrentToolCalls] = useState<any[]>([]);

  const sendMessage = (message: string) => {
    if (status !== "idle") {
      return;
    }

    setStreamingContent("");
    setCurrentToolCalls([]);
    setStatus("requesting");
    readStream(message);
  };
  const tid = useRef(v4());
  async function readStream(message: string) {
    try {
      const readableStream = await createStreamFromAPI(message, tid.current);
      if (!readableStream) {
        throw new Error("无法获取流式响应");
      }
      let accumulatedContent = "";
      let toolCalls: any[] = [];

      // 手动处理NDJSON流
      const reader = readableStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      setStatus("responsing");

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 将字节转换为文本并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: StreamChunk = JSON.parse(line.trim());
              console.log("收到流式数据:", data);

              switch (data.type) {
                case "text_chunk":
                  if (data.content) {
                    accumulatedContent += data.content;
                    setStreamingContent(accumulatedContent);
                  }
                  break;

                case "tool_call":
                  const toolCallInfo = {
                    id: data.toolCallId,
                    functionName: data.functionName,
                    arguments: data.arguments,
                    result: data.result,
                    timestamp: data.timestamp,
                  };
                  toolCalls.push(toolCallInfo);
                  setCurrentToolCalls([...toolCalls]);
                  break;

                case "error":
                  console.error("流式响应错误:", data.error);
                  break;

                case "end":
                  console.log("流式响应结束");
                  break;
              }
            } catch (parseError) {
              console.error("解析流式数据失败:", parseError, "Raw line:", line);
            }
          }
        }
      }

      // 流结束后，将最终内容添加到对话中
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          type: toolCalls.length > 0 ? "function_call" : "text",
          content: accumulatedContent,
          toolCalls: toolCalls,
        },
      ]);

      // 清理临时状态
      setStreamingContent("");
      setCurrentToolCalls([]);
    } catch (error) {
      console.error("流式请求失败:", error);
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: `请求失败: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
      setStreamingContent("");
      setCurrentToolCalls([]);
    } finally {
      setStatus("idle");
    }
  }

  // 生成工具调用显示项目
  const generateToolItems = (toolCalls: any[]): ThoughtChainProps["items"] => {
    return toolCalls.map((toolCall, _) => ({
      title: `🔧 ${toolCall.functionName}`,
      description: (
        <div>
          <div>
            <strong>参数:</strong> {JSON.stringify(toolCall.arguments, null, 2)}
          </div>
          {toolCall.result && (
            <div style={{ marginTop: "8px" }}>
              <strong>结果:</strong>
              {toolCall.result.content?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    marginTop: "4px",
                    padding: "4px 8px",
                    color: "black",
                    backgroundColor: toolCall.result.isError
                      ? "#fff2f0"
                      : "#f6ffed",
                    border: `1px solid ${toolCall.result.isError ? "#ffccc7" : "#b7eb8f"}`,
                    borderRadius: "4px",
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      extra: <Button type="text" icon={<MoreOutlined />} />,
    }));
  };

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  // 当conversation或streamingContent变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [conversation, streamingContent]);

  return (
    <div className="app">
      <div className="chat-box" ref={chatBoxRef}>
        {conversation.length === 0 ? (
          <Welcome
            icon="https://pngpai.com/pai_img/sml/2fa90860-d700-4c83-856f-b3ba898f4b95.png"
            title="Hello, I'm MySQL Agent"
            description="可以帮你生成查询数据库的SQL语句并执行"
          />
        ) : null}

        {conversation.map((item, index) => (
          <div key={index}>
            <Bubble
              className="mt-5"
              content={item.content}
              placement={item.role === "user" ? "end" : "start"}
              messageRender={
                item.role === "assistant" ? renderMarkdown : undefined
              }
            />
            {item.role === "assistant" &&
              item.toolCalls &&
              item.toolCalls.length > 0 && (
                <ThoughtChain
                  className="mt-3"
                  items={generateToolItems(item.toolCalls)}
                />
              )}
          </div>
        ))}

        {/* 显示当前流式内容 */}
        {streamingContent && (
          <Bubble
            className="mt-5"
            content={streamingContent}
            placement="start"
            messageRender={renderMarkdown}
          />
        )}

        {
          /** loading占位 */
          status === "requesting" && (
            <Bubble className="mt-5" placement="start" loading />
          )
        }

        {/* 显示当前工具调用 */}
        {currentToolCalls.length > 0 && (
          <ThoughtChain
            className="mt-3"
            items={generateToolItems(currentToolCalls)}
          />
        )}
      </div>

      <div
        className="input-container"
        style={{ padding: "20px", borderTop: "1px solid #f0f0f0" }}
      >
        {conversation.length === 0 && (
          <Prompts
            title="✨ 快速开始？"
            items={initial_prompt_items}
            className="mb-4"
            onItemClick={(info) => {
              const prompts = {
                "1": "数据库里面有什么表和字段？",
                "2": "帮我查询学生数量",
                "3": "一共有多少个老师？",
              };
              const message =
                prompts[info.data.key as keyof typeof prompts] ||
                String(info.data.description) ||
                "";
              if (message) {
                setConversation((prev) => [
                  ...prev,
                  {
                    content: message,
                    role: "user",
                    type: "text",
                  },
                ]);
                sendMessage(message);
              }
            }}
          />
        )}
        <Sender
          submitType="shiftEnter"
          placeholder="按 Shift + Enter 发送消息"
          loading={status !== "idle"}
          onSubmit={(message: string) => {
            setConversation((prev) => [
              ...prev,
              {
                content: message,
                role: "user",
                type: "text",
              },
            ]);
            sendMessage(message);
          }}
        />
      </div>
    </div>
  );
};

export default App;
