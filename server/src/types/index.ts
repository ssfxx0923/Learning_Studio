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

// 聊天消息类型
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
}

// 心理咨询相关类型
export interface MentalHealthMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface MentalHealthSession {
  id: string;
  title?: string;  // 会话标题，可选
  messages: MentalHealthMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionIndex {
  sessions: string[]; // 会话ID列表
}

// 笔记相关类型
export interface Note {
  id: string;
  title: string;
  content: string;  // Markdown 内容
  tags: string[];   // 标签
  category?: string; // 分类
  createdAt: string;
  updatedAt: string;
}

export interface NoteIndex {
  notes: string[]; // 笔记ID列表
}

// 研究相关类型
export interface ResearchSession {
  id: string;
  topic?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// 错误响应
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

