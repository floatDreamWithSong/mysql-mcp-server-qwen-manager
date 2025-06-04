// SQL安全控制模块

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password', 'passwd', 'pwd',
  'salary', 'income', 'wage',
  'ssn', 'social_security_number',
  'credit_card', 'card_number',
  'phone', 'email', 'address'
];

// 危险关键词列表
const DANGEROUS_KEYWORDS = [
  'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
  'TRUNCATE', 'REPLACE', 'MERGE', 'CALL', 'EXEC',
  'UNION', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT'
];

// SQL注入模式 - 移除SELECT检查，因为我们允许SELECT查询
const INJECTION_PATTERNS = [
  /('|\\|;|\/\*.*?\*\/|--.*$)/gim,
  /(exec(\s|\+)+(s|x)p\w+)/gi,
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|MERGE|TRUNCATE)\b)/gi
];

// 检查SQL是否为只读查询
export function isReadOnlySQL(sql) {
  const cleanSQL = sql.trim().toUpperCase();
  
  // 只允许SELECT和SHOW语句
  if (!cleanSQL.startsWith('SELECT') && !cleanSQL.startsWith('SHOW')) {
    return false;
  }
  
  // 检查是否包含危险关键词
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (cleanSQL.includes(keyword)) {
      return false;
    }
  }
  
  return true;
}

// 检查SQL中是否包含敏感字段
export function containsSensitiveFields(sql) {
  const lowerSQL = sql.toLowerCase();
  
  for (const field of SENSITIVE_FIELDS) {
    if (lowerSQL.includes(field)) {
      return {
        hasSensitiveField: true,
        field: field
      };
    }
  }
  
  return { hasSensitiveField: false };
}

// 检查SQL注入
export function detectSQLInjection(sql) {
  // 检查明显的注入模式，但排除正常的SQL语法
  const suspiciousPatterns = [
    /(exec(\s|\+)+(s|x)p\w+)/gi,  // 存储过程执行
    /(\bunion\s+select)/gi,        // UNION SELECT攻击
    /(;\s*(drop|delete|insert|update))/gi  // 多语句攻击
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sql)) {
      return {
        hasInjection: true,
        type: 'pattern_match',
        pattern: pattern.toString()
      };
    }
  }
  
  // 检查单引号不匹配（但允许正常的字符串）
  const singleQuotes = (sql.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    return {
      hasInjection: true,
      type: 'unmatched_quotes'
    };
  }
  
  // 检查多个分号（但允许单个分号结尾）
  const semicolons = (sql.match(/;/g) || []).length;
  const endsWithSemicolon = sql.trim().endsWith(';');
  if (semicolons > 1 || (semicolons === 1 && !endsWithSemicolon)) {
    return {
      hasInjection: true,
      type: 'multiple_statements'
    };
  }
  
  return { hasInjection: false };
}

// 综合安全检查
export function validateSQL(sql) {
  // 检查是否为只读SQL
  if (!isReadOnlySQL(sql)) {
    return {
      valid: false,
      reason: 'SQL语句不是只读查询，仅允许SELECT和SHOW语句'
    };
  }
  
  // 检查敏感字段
  const sensitiveCheck = containsSensitiveFields(sql);
  if (sensitiveCheck.hasSensitiveField) {
    return {
      valid: false,
      reason: `禁止查询敏感字段: ${sensitiveCheck.field}`
    };
  }
  
  // 检查SQL注入
  const injectionCheck = detectSQLInjection(sql);
  if (injectionCheck.hasInjection) {
    return {
      valid: false,
      reason: `检测到潜在的SQL注入攻击: ${injectionCheck.type}`
    };
  }
  
  return { valid: true };
}