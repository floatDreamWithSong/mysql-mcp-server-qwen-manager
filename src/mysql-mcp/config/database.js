import dotenv from 'dotenv';
import { createPool } from 'mysql2/promise';

// 加载环境变量
dotenv.config();

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'college'
};

// 创建MySQL连接池
const pool = createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 执行查询的辅助函数
export async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('SQL查询错误:', error);
    throw new Error(`数据库查询失败: ${error.message}`);
  }
}

// SQL查询模板
export const SQL_TEMPLATES = {
  TABLE_SCHEMA: `
    SELECT 
      COLUMN_NAME, 
      COLUMN_TYPE, 
      IS_NULLABLE, 
      COLUMN_KEY, 
      COLUMN_DEFAULT, 
      EXTRA, 
      COLUMN_COMMENT
    FROM 
      INFORMATION_SCHEMA.COLUMNS 
    WHERE 
      TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY 
      ORDINAL_POSITION
  `,
  ALL_TABLES: `
    SELECT 
      TABLE_NAME, 
      TABLE_TYPE, 
      ENGINE, 
      TABLE_ROWS,
      CREATE_TIME, 
      TABLE_COMMENT
    FROM 
      INFORMATION_SCHEMA.TABLES
    WHERE 
      TABLE_SCHEMA = ?
    ORDER BY 
      TABLE_NAME
  `
};

// 导出配置信息
export { config };