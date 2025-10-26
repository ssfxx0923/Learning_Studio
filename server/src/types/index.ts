// API 类型定义（简化版，仅用于文件系统操作）

// 文章索引结构
export interface ArticleIndex {
  articles: string[];
}

// 计划相关类型
export interface Task {
  id: string;
  title: string;
  priority: number;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;  // 任务完成时间
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  priority: number;
  tasks: Task[];
  progress: number;
  dueDate?: string;
  createdAt: string;
  aiSuggestion?: string;
}

export interface PlanIndex {
  plans: string[]; // 计划ID列表
}

// 错误响应
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

