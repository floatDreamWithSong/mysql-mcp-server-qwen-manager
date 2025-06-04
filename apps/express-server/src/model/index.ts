import { createQwen } from "qwen-ai-provider";
import dotenv from "dotenv";
dotenv.config();
export const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY,
  baseURL:
    process.env.QWEN_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
}); 