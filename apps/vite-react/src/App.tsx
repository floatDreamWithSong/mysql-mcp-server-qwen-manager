import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  useXAgent,
  useXChat,
  ThoughtChain,
} from '@ant-design/x';
import { Avatar, Button, Flex, type GetProp, Space, Spin, message, Tag, Alert } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

type BubbleDataType = {
  role: string;
  content: string;
  toolCalls?: ToolCall[];
};

interface ToolCall {
  functionName: string;
  arguments: any;
  result?: any;
  timestamp: string;
}

const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: 'What is MySQL Database?',
    group: 'Today',
  },
  {
    key: 'default-1',
    label: 'Show all tables',
    group: 'Today',
  },
  {
    key: 'default-2',
    label: 'Database Query Helper',
    group: 'Yesterday',
  },
];

const HOT_TOPICS = {
  key: '1',
  label: 'Database Queries',
  children: [
    {
      key: '1-1',
      description: '数据库里有哪些表？',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: '显示用户表的结构',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: '查询最近注册的用户',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: '统计用户总数',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: '查看订单表信息',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

const DESIGN_GUIDE = {
  key: '2',
  label: 'AI Database Guide',
  children: [
    {
      key: '2-1',
      icon: <DatabaseOutlined />,
      label: 'Query',
      description: 'AI helps you query database with natural language.',
    },
    {
      key: '2-2',
      icon: <ApiOutlined />,
      label: 'Tools',
      description: "AI uses database tools to execute SQL commands",
    },
    {
      key: '2-3',
      icon: <CommentOutlined />,
      label: 'Chat',
      description: 'Natural language interface for database operations',
    },
    {
      key: '2-4',
      icon: <PaperClipOutlined />,
      label: 'Results',
      description: 'AI provides structured database query results.',
    },
  ],
};

const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    description: 'Show Tables',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: 'User Data',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: 'Statistics',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: 'Table Structure',
    icon: <AppstoreAddOutlined />,
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
    `,
    // sider 样式
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background: #1677ff0f;
      border: 1px solid #1677ff34;
      height: 40px;
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    siderFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
    `,
    connectionStatus: css`
      font-size: 12px;
      text-align: center;
    `,
    // chat list 样式
    chat: css`
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-block: ${token.paddingLG}px;
      gap: 16px;
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    // sender 样式
    sender: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      color: ${token.colorText};
    `,
    toolCallsContainer: css`
      margin-top: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #1890ff;
      overflow: scroll;
    `,
    currentToolCall: css`
      margin-bottom: 16px;
    `,
    // Markdown 样式 - 优化的antd-style版本
    markdownContent: css`
      line-height: 1.6;
      font-size: 14px;
      
      /* 标题样式 */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        color: ${token.colorText};
        line-height: 1.3;
      }
      
      h1 { font-size: 1.5em; border-bottom: 2px solid ${token.colorBorder}; padding-bottom: 0.3em; }
      h2 { font-size: 1.3em; border-bottom: 1px solid ${token.colorBorderSecondary}; padding-bottom: 0.3em; }
      h3 { font-size: 1.1em; }
      h4 { font-size: 1em; }
      h5 { font-size: 0.9em; }
      h6 { font-size: 0.85em; color: ${token.colorTextSecondary}; }
      
      /* 段落样式 */
      p {
        margin-bottom: 1em;
        color: ${token.colorText};
        line-height: 1.6;
      }
      
      /* 内联代码样式 */
      code {
        background: ${token.colorFillTertiary};
        color: #d73a49;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.9em;
        border: 1px solid ${token.colorBorderSecondary};
      }
      
      /* 代码块样式 */
      pre {
        background: #f6f8fa;
        border: 1px solid ${token.colorBorder};
        border-radius: 8px;
        overflow-x: auto;
        margin: 1.5em 0;
        position: relative;
        
        code {
          background: none;
          color: #24292e;
          padding: 16px;
          border: none;
          display: block;
          font-size: 13px;
          line-height: 1.45;
          overflow: visible;
        }
      }
      
      /* 代码语法高亮 - GitHub风格 */
      .hljs {
        background: #f6f8fa !important;
        color: #24292e;
      }
      
      .hljs-comment,
      .hljs-quote {
        color: #6a737d;
        font-style: italic;
      }
      
      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-literal,
      .hljs-section,
      .hljs-link {
        color: #d73a49;
      }
      
      .hljs-string,
      .hljs-regexp,
      .hljs-template-string {
        color: #032f62;
      }
      
      .hljs-number,
      .hljs-meta {
        color: #005cc5;
      }
      
      .hljs-built_in,
      .hljs-builtin-name,
      .hljs-params,
      .hljs-attr {
        color: #e36209;
      }
      
      .hljs-attribute,
      .hljs-name,
      .hljs-tag {
        color: #22863a;
      }
      
      .hljs-variable,
      .hljs-template-variable {
        color: #e36209;
      }
      
      .hljs-function,
      .hljs-class .hljs-title {
        color: #6f42c1;
      }
      
      /* 引用块样式 */
      blockquote {
        border-left: 4px solid ${token.colorPrimary};
        margin: 1.5em 0;
        padding: 12px 20px;
        background: ${token.colorFillTertiary};
        border-radius: 0 8px 8px 0;
        color: ${token.colorTextSecondary};
        
        p {
          margin-bottom: 0.5em;
        }
        
        p:last-child {
          margin-bottom: 0;
        }
      }
      
      /* 列表样式 */
      ul, ol {
        padding-left: 2em;
        margin-bottom: 1em;
        
        li {
          margin-bottom: 0.5em;
          color: ${token.colorText};
          line-height: 1.6;
          
          p {
            margin-bottom: 0.5em;
          }
        }
      }
      
      ul {
        list-style-type: disc;
      }
      
      ol {
        list-style-type: decimal;
      }
      
      /* 表格样式 */
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1.5em 0;
        border: 1px solid ${token.colorBorder};
        border-radius: 8px;
        overflow: hidden;
        font-size: 13px;
        
        th, td {
          border: 1px solid ${token.colorBorder};
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }
        
        th {
          background: ${token.colorFillTertiary};
          font-weight: 600;
          color: ${token.colorText};
        }
        
        td {
          color: ${token.colorText};
        }
        
        tr:nth-child(even) td {
          background: ${token.colorFillTertiary};
        }
        
        tr:hover td {
          background: ${token.colorFillSecondary};
        }
      }
      
      /* 链接样式 */
      a {
        color: ${token.colorPrimary};
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
          color: ${token.colorPrimaryHover};
        }
        
        &:visited {
          color: ${token.colorPrimary};
        }
      }
      
      /* 分割线样式 */
      hr {
        border: none;
        border-top: 2px solid ${token.colorBorder};
        margin: 2em 0;
        background: none;
      }
      
      /* 强调文本样式 */
      strong {
        font-weight: 600;
        color: ${token.colorText};
      }
      
      em {
        font-style: italic;
        color: ${token.colorTextSecondary};
      }
      
      /* 删除线 */
      del {
        text-decoration: line-through;
        color: ${token.colorTextTertiary};
      }
      
      /* 任务列表 */
      input[type="checkbox"] {
        margin-right: 8px;
      }
      
      /* 代码块语言标签 */
      .code-language-label {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 12px;
        color: #666;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 8px;
        border-radius: 4px;
        z-index: 1;
        font-family: ${token.fontFamily};
      }
    `,
  };
});

// Markdown渲染组件
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const { styles } = useStyle();
  
  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 自定义代码块渲染
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <div style={{ position: 'relative' }}>
                {language && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '12px',
                    color: '#666',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    zIndex: 1
                  }}>
                    {language}
                  </div>
                )}
                <pre>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // 自定义表格渲染
          table: ({ children }: any) => (
            <div style={{ overflowX: 'auto', margin: '1em 0' }}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const App: React.FC = () => {
  const { styles } = useStyle();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ==================== State ====================
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [agentInfo, setAgentInfo] = useState<{agents: string[], count: number} | null>(null);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);

  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GetProp<typeof Attachments, 'items'>>([]);

  const [inputValue, setInputValue] = useState('');

  // ==================== Custom message handling ====================
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;
    
    if (connectionStatus !== "connected") {
      message.error('Backend is not connected. Please check your server.');
      return;
    }

    setLoading(true);
    setCurrentToolCall(null);

    // Add user message
    const userMessage = {
      key: Date.now().toString(),
      role: 'user',
      message: { role: 'user', content: messageText },
      status: 'complete'
    };

    // Add assistant message placeholder
    const assistantMessage = {
      key: (Date.now() + 1).toString(),
      role: 'assistant',
      message: { role: 'assistant', content: '', toolCalls: [] },
      status: 'loading'
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      const response = await fetch(
        `http://localhost:3001/api/stream?message=${encodeURIComponent(messageText)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === "text_chunk") {
              assistantContent += data.content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.message.content = assistantContent;
                return newMessages;
              });
            } else if (data.type === "tool_call") {
              const toolCall: ToolCall = {
                functionName: data.functionName,
                arguments: data.arguments,
                result: data.result,
                timestamp: data.timestamp
              };

              setCurrentToolCall(toolCall);
              toolCalls.push(toolCall);
              
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.message.toolCalls = [...toolCalls];
                return newMessages;
              });
            } else if (data.type === "end") {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.status = 'complete';
                return newMessages;
              });
            } else if (data.type === "error") {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.message.content = `错误: ${data.error}`;
                lastMessage.status = 'complete';
                return newMessages;
              });
            }
          } catch (parseError) {
            console.warn("Failed to parse JSON line:", line, parseError);
          }
        }
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.message.content = `连接错误: ${error instanceof Error ? error.message : String(error)}`;
        lastMessage.status = 'complete';
        return newMessages;
      });
    } finally {
      setLoading(false);
      setCurrentToolCall(null);
    }
  };

  // ==================== Effects ====================
  useEffect(() => {
    fetchAgentInfo();
  }, []);

  useEffect(() => {
    // history mock
    if (messages?.length) {
      setMessageHistory((prev) => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages, curConversation]);

  // ==================== API Functions ====================
  const fetchAgentInfo = async () => {
    try {
      setConnectionStatus("connecting");
      const response = await fetch("http://localhost:3001/api/agents");
      const data = await response.json();
      setAgentInfo(data);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("获取代理信息失败:", error);
      setConnectionStatus("disconnected");
    }
  };

  // ==================== Event ====================
  const onSubmit = (val: string) => {
    sendMessage(val);
  };

  // ==================== Render Tool Calls ====================
  const renderToolCalls = (toolCalls?: ToolCall[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className={styles.toolCallsContainer}>
        {toolCalls.map((toolCall, index) => (
          <ThoughtChain
            key={index}
            items={[
              {
                title: `🔧 调用工具: ${toolCall.functionName}`,
                status: "success",
                content: (
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div>
                      <strong>参数:</strong>
                      <pre style={{ fontSize: "12px", background: "#fff", padding: "8px", borderRadius: "4px", margin: "4px 0" }}>
                        {JSON.stringify(toolCall.arguments, null, 2)}
                      </pre>
                    </div>
                    {toolCall.result && (
                      <div>
                        <strong>结果:</strong>
                        <div style={{ background: "#fff", padding: "8px", borderRadius: "4px", margin: "4px 0" }}>
                          {typeof toolCall.result === 'string' ? (
                            <MarkdownRenderer content={toolCall.result} />
                          ) : (
                            <pre style={{ fontSize: "12px", margin: 0 }}>
                              {JSON.stringify(toolCall.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </Space>
                )
              }
            ]}
          />
        ))}
      </div>
    );
  };

  // ==================== Nodes ====================
  const chatSider = (
    <div className={styles.sider}>
      {/* 🌟 Logo */}
      <div className={styles.logo}>
        <DatabaseOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        <span>MySQL AI Assistant</span>
      </div>

      {/* 🌟 添加会话 */}
      <Button
        onClick={() => {
          const now = dayjs().valueOf().toString();
          setConversations([
            {
              key: now,
              label: `New Query ${conversations.length + 1}`,
              group: 'Today',
            },
            ...conversations,
          ]);
          setCurConversation(now);
          setMessages([]);
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
        New Query
      </Button>

      {/* 🌟 会话管理 */}
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          abortControllerRef.current?.abort();
          setTimeout(() => {
            setCurConversation(val);
            setMessages(messageHistory?.[val] || []);
          }, 100);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: 'Rename',
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: 'Delete',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                const newList = conversations.filter((item) => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                setTimeout(() => {
                  if (conversation.key === curConversation) {
                    setCurConversation(newKey);
                    setMessages(messageHistory?.[newKey] || []);
                  }
                }, 200);
              },
            },
          ],
        })}
      />

      <div className={styles.siderFooter}>
        <div className={styles.connectionStatus}>
          <Tag 
            color={connectionStatus === "connected" ? "success" : connectionStatus === "connecting" ? "processing" : "error"}
            icon={<DatabaseOutlined />}
          >
            {connectionStatus === "connected" ? "已连接" : connectionStatus === "connecting" ? "连接中..." : "未连接"}
          </Tag>
          {agentInfo && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              {agentInfo.count} 个代理可用
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} icon={<DatabaseOutlined />} />
          <Button type="text" icon={<QuestionCircleOutlined />} onClick={fetchAgentInfo} />
        </div>
      </div>
    </div>
  );

  const chatList = (
    <div className={styles.chatList}>
      {messages?.length ? (
        /* 🌟 消息列表 */
        <Bubble.List
          items={messages?.map((i) => ({
            ...i.message,
            content: (
              <div>
                {i.message.role === 'assistant' ? (
                  <MarkdownRenderer content={i.message.content} />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{i.message.content}</div>
                )}
                {renderToolCalls(i.message.toolCalls)}
              </div>
            ),
            classNames: {
              content: i.status === 'loading' ? styles.loadingMessage : '',
            },
            typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>🔍</> } : false,
          }))}
          style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}
          roles={{
            assistant: {
              placement: 'start',
              footer: (
                <div style={{ display: 'flex' }}>
                  <Button type="text" size="small" icon={<ReloadOutlined />} />
                  <Button type="text" size="small" icon={<CopyOutlined />} />
                  <Button type="text" size="small" icon={<LikeOutlined />} />
                  <Button type="text" size="small" icon={<DislikeOutlined />} />
                </div>
              ),
              loadingRender: () => <Spin size="small" />,
            },
            user: { placement: 'end' },
          }}
        />
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
          className={styles.placeholder}
        >
          <Welcome
            variant="borderless"
            icon={<DatabaseOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
            title="Hello, I'm MySQL AI Assistant"
            description="通过自然语言与MySQL数据库交互，让数据查询变得简单直观~"
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
              </Space>
            }
          />
          <Flex gap={16}>
            <Prompts
              items={[HOT_TOPICS]}
              styles={{
                list: { height: '100%' },
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
              className={styles.chatPrompt}
            />

            <Prompts
              items={[DESIGN_GUIDE]}
              styles={{
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { background: '#ffffffa6' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
              className={styles.chatPrompt}
            />
          </Flex>
        </Space>
      )}
    </div>
  );

  /* Current Tool Call Alert */
  const currentToolCallAlert = currentToolCall && loading && (
    <div className={styles.currentToolCall}>
      <Alert
        message={
          <Space>
            <Spin size="small" />
            <span>正在调用工具: {currentToolCall.functionName}</span>
          </Space>
        }
        type="info"
        showIcon={false}
      />
    </div>
  );

  const senderHeader = (
    <Sender.Header
      title="Upload File"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: 'Drop file here' }
            : {
                icon: <CloudUploadOutlined />,
                title: 'Upload files',
                description: 'Click or drag files to this area to upload',
              }
        }
      />
    </Sender.Header>
  );
  
  const chatSender = (
    <>
      {/* 🌟 Current Tool Call */}
      {currentToolCallAlert}
      
      {/* 🌟 提示词 */}
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info) => {
          onSubmit(info.data.description as string);
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className={styles.senderPrompt}
      />
      {/* 🌟 输入框 */}
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          abortControllerRef.current?.abort();
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        disabled={connectionStatus !== "connected"}
        className={styles.sender}
        allowSpeech
        actions={(_, info) => {
          const { SendButton, LoadingButton, SpeechButton } = info.components;
          return (
            <Flex gap={4}>
              <SpeechButton className={styles.speechButton} />
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </Flex>
          );
        }}
        placeholder="输入您的数据库问题... (例如: 数据库里有什么表？)"
      />
    </>
  );

  // ==================== Render =================
  return (
    <div className={styles.layout}>
      {chatSider}

      <div className={styles.chat}>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default App;