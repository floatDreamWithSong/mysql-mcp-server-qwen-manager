import fs from 'fs';
import path from 'path';


const logDir = path.join(process.cwd(), '../..','logs');
console.log(logDir);
// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'query.log');

// 记录查询日志
export function logQuery(sql, params = [], result = null, error = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    sql,
    params,
    success: !error,
    resultCount: result ? (Array.isArray(result) ? result.length : 1) : 0,
    error: error ? error.message : null
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (err) {
    console.error('写入日志失败:', err);
  }
}

// 获取查询日志
export function getQueryLogs(limit = 100) {
  try {
    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    
    return lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse(); // 最新的在前
  } catch (error) {
    console.error('读取日志失败:', error);
    return [];
  }
}