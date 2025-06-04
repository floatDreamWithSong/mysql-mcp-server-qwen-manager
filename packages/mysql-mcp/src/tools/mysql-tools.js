import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { executeQuery, SQL_TEMPLATES, config } from '../config/database.js';
import { logQuery, getQueryLogs } from '../utils/logger.js';
import { validateSQL } from '../utils/security.js';
import { 
  createPaginatedResult, 
  getNextPage, 
  getPreviousPage, 
  goToPage,
  getPaginationInfo,
  clearPaginationState
} from '../utils/pagination.js';

// 安全执行查询函数
async function safeExecuteQuery(query, params, sessionId, enablePagination, pageSize) {
  // 安全验证
  const validation = validateSQL(query);
  if (!validation.valid) {
    const error = new Error(validation.reason);
    logQuery(query, params, null, error);
    throw error;
  }

  try {
    const result = await executeQuery(query, params);
    logQuery(query, params, result);
    if(enablePagination === undefined) {
      enablePagination = result.length > pageSize * 2;
    }
    // 如果启用分页且结果是数组
    if (enablePagination && Array.isArray(result)) {
      return createPaginatedResult(result, pageSize, sessionId);
    }
    
    return { result };
  } catch (error) {
    logQuery(query, params, null, error);
    throw error;
  }
}

// 创建MySQL查询工具
export const mysqlQueryTool = createTool({
  id: 'mysql_query',
  description: '安全执行MySQL查询语句并返回结果，支持分页和日志记录',
  inputSchema: z.object({
    query: z.string().describe('SQL查询语句'),
    params: z.array(z.string()).optional().describe('查询参数数组'),
    sessionId: z.string().describe('会话ID，用于分页状态管理，最好是传入一个6位长度的数字并记住，例如123456'),
    enablePagination: z.boolean().optional().describe('是否启用分页，默认会自动根据查询结果自动判断是否启用分页'),
    pageSize: z.number().optional().describe('每页显示条数（最大100），默认10')
  }),
  execute: async ({ context }) => {
    const { 
      query, 
      params = [], 
      sessionId = 'default',
      enablePagination = undefined,
      pageSize = 10
    } = context;

    if (!query) {
      throw new Error('缺少查询语句');
    }
    return await safeExecuteQuery(query, params, sessionId, enablePagination, pageSize);
  }
});

// 创建获取表结构工具
export const mysqlSchemaTool = createTool({
  id: 'mysql_schema',
  description: '获取数据库表结构信息，支持按表名过滤',
  inputSchema: z.object({
    table: z.string().optional().describe('表名，如果不提供则返回所有表'),
    detailed: z.boolean().optional().describe('是否返回详细信息')
  }),
  execute: async ({ context }) => {
    const { table, detailed = true } = context;

    try {
      if (table) {
        // 获取特定表结构
        const result = await executeQuery(
          SQL_TEMPLATES.TABLE_SCHEMA,
          [config.database, table]
        );
        
        logQuery(`获取表结构: ${table}`, [config.database, table], result);
        
        if (detailed) {
          return { 
            table: table,
            schema: result,
            columns: result.length,
            database: config.database
          };
        } else {
          // 简化输出
          const simplified = result.map(col => ({
            name: col.COLUMN_NAME,
            type: col.COLUMN_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            key: col.COLUMN_KEY
          }));
          return { table: table, columns: simplified };
        }
      } else {
        // 获取所有表信息
        const result = await executeQuery(
          SQL_TEMPLATES.ALL_TABLES,
          [config.database]
        );
        
        logQuery('获取所有表信息', [config.database], result);
        
        if (detailed) {
          return { 
            database: config.database,
            tables: result,
            tableCount: result.length
          };
        } else {
          // 简化输出
          const simplified = result.map(table => ({
            name: table.TABLE_NAME,
            type: table.TABLE_TYPE,
            rows: table.TABLE_ROWS
          }));
          return { database: config.database, tables: simplified };
        }
      }
    } catch (error) {
      logQuery(`获取表结构失败: ${table || 'all'}`, [], null, error);
      throw error;
    }
  }
});

// 创建获取DDL工具
export const mysqlDdlTool = createTool({
  id: 'mysql_ddl',
  description: '获取表的DDL语句',
  inputSchema: z.object({
    table: z.string().describe('表名')
  }),
  execute: async ({ context }) => {
    const { table } = context;

    if (!table) {
      throw new Error('缺少表名参数');
    }

    try {
      const query = `SHOW CREATE TABLE ${table}`;
      const result = await executeQuery(query);
      
      logQuery(`获取DDL: ${table}`, [], result);

      if (result && result.length > 0) {
        return { 
          table: table,
          ddl: result[0]['Create Table']
        };
      } else {
        throw new Error('表不存在');
      }
    } catch (error) {
      logQuery(`获取DDL失败: ${table}`, [], null, error);
      throw error;
    }
  }
});

// 创建分页控制工具
export const paginationTool = createTool({
  id: 'pagination_control',
  description: '控制查询结果的分页显示',
  inputSchema: z.object({
    action: z.enum(['next', 'previous', 'goto', 'info', 'clear']).describe('分页操作'),
    page: z.number().optional().describe('跳转到指定页码（仅goto操作需要）'),
    sessionId: z.string().optional().describe('会话ID')
  }),
  execute: async ({ context }) => {
    const { action, page, sessionId = 'default' } = context;

    try {
      switch (action) {
        case 'next':
          return getNextPage(sessionId);
        case 'previous':
          return getPreviousPage(sessionId);
        case 'goto':
          if (!page) {
            throw new Error('跳转操作需要指定页码');
          }
          return goToPage(page, sessionId);
        case 'info':
          const info = getPaginationInfo(sessionId);
          return info ? { paginationInfo: info } : { message: '没有分页状态' };
        case 'clear':
          clearPaginationState(sessionId);
          return { message: '分页状态已清除' };
        default:
          throw new Error('不支持的分页操作');
      }
    } catch (error) {
      logQuery(`分页操作: ${action}`, [sessionId, page], null, error);
      throw error;
    }
  }
});

// 创建查询日志工具
export const queryLogTool = createTool({
  id: 'query_logs',
  description: '获取SQL查询执行日志',
  inputSchema: z.object({
    limit: z.number().optional().describe('返回日志条数限制'),
    filter: z.enum(['all', 'success', 'error']).optional().describe('日志过滤类型')
  }),
  execute: async ({ context }) => {
    const { limit = 50, filter = 'all' } = context;

    try {
      let logs = getQueryLogs(limit);
      
      // 应用过滤器
      if (filter === 'success') {
        logs = logs.filter(log => log.success);
      } else if (filter === 'error') {
        logs = logs.filter(log => !log.success);
      }

      return {
        logs: logs,
        total: logs.length,
        filter: filter
      };
    } catch (error) {
      throw new Error(`获取查询日志失败: ${error.message}`);
    }
  }
});