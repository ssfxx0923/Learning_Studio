import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config();

export const CONFIG = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // n8n 配置
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678/webhook-test',
    timeout: parseInt(process.env.N8N_TIMEOUT || '300000', 10), // 5分钟
  },

  // 文件存储配置
  storage: {
    articlesBasePath: process.env.ARTICLES_BASE_PATH || join(__dirname, '../../../public/data/english/artikel'),
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

