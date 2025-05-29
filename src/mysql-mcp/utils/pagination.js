// 分页工具模块

// 分页配置
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// 分页状态存储
const paginationStates = new Map();

// 创建分页结果
export function createPaginatedResult(results, pageSize = DEFAULT_PAGE_SIZE, sessionId = 'default') {
  if (!Array.isArray(results)) {
    return { data: results, pagination: null };
  }

  pageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  
  if (results.length <= pageSize) {
    return { data: results, pagination: null };
  }

  // 存储完整结果到分页状态
  paginationStates.set(sessionId, {
    results,
    pageSize,
    currentPage: 1,
    totalPages: Math.ceil(results.length / pageSize),
    totalItems: results.length
  });

  const firstPageData = results.slice(0, pageSize);
  return {
    data: firstPageData,
    pagination: {
      currentPage: 1,
      totalPages: Math.ceil(results.length / pageSize),
      totalItems: results.length,
      pageSize,
      hasNext: results.length > pageSize,
      hasPrevious: false
    }
  };
}

// 获取下一页
export function getNextPage(sessionId = 'default') {
  const state = paginationStates.get(sessionId);
  
  if (!state) {
    throw new Error(`没有找到分页状态，请先执行查询${Object.keys(paginationStates)}`);
  }

  if (state.currentPage >= state.totalPages) {
    return {
      data: [],
      pagination: {
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        totalItems: state.totalItems,
        pageSize: state.pageSize,
        hasNext: false,
        hasPrevious: state.currentPage > 1,
        message: '已经是最后一页'
      }
    };
  }

  state.currentPage++;
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const pageData = state.results.slice(startIndex, endIndex);

  return {
    data: pageData,
    pagination: {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalItems: state.totalItems,
      pageSize: state.pageSize,
      hasNext: state.currentPage < state.totalPages,
      hasPrevious: state.currentPage > 1
    }
  };
}

// 获取上一页
export function getPreviousPage(sessionId = 'default') {
  const state = paginationStates.get(sessionId);
  
  if (!state) {
    throw new Error('没有找到分页状态，请先执行查询');
  }

  if (state.currentPage <= 1) {
    return {
      data: [],
      pagination: {
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        totalItems: state.totalItems,
        pageSize: state.pageSize,
        hasNext: state.currentPage < state.totalPages,
        hasPrevious: false,
        message: '已经是第一页'
      }
    };
  }

  state.currentPage--;
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const pageData = state.results.slice(startIndex, endIndex);

  return {
    data: pageData,
    pagination: {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalItems: state.totalItems,
      pageSize: state.pageSize,
      hasNext: state.currentPage < state.totalPages,
      hasPrevious: state.currentPage > 1
    }
  };
}

// 跳转到指定页
export function goToPage(pageNumber, sessionId = 'default') {
  const state = paginationStates.get(sessionId);
  
  if (!state) {
    throw new Error('没有找到分页状态，请先执行查询');
  }

  if (pageNumber < 1 || pageNumber > state.totalPages) {
    throw new Error(`页码超出范围，有效范围: 1-${state.totalPages}`);
  }

  state.currentPage = pageNumber;
  const startIndex = (pageNumber - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const pageData = state.results.slice(startIndex, endIndex);

  return {
    data: pageData,
    pagination: {
      currentPage: pageNumber,
      totalPages: state.totalPages,
      totalItems: state.totalItems,
      pageSize: state.pageSize,
      hasNext: pageNumber < state.totalPages,
      hasPrevious: pageNumber > 1
    }
  };
}

// 清除分页状态
export function clearPaginationState(sessionId = 'default') {
  paginationStates.delete(sessionId);
}

// 获取分页状态信息
export function getPaginationInfo(sessionId = 'default') {
  const state = paginationStates.get(sessionId);
  
  if (!state) {
    return null;
  }

  return {
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    pageSize: state.pageSize,
    hasNext: state.currentPage < state.totalPages,
    hasPrevious: state.currentPage > 1
  };
}