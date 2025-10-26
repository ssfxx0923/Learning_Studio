import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config();

export const CONFIG = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 文件存储配置
  storage: {
    articlesBasePath: process.env.ARTICLES_BASE_PATH || join(__dirname, '../../../public/data/english/artikel'),
    plansBasePath: process.env.PLANS_BASE_PATH || join(__dirname, '../../../public/data/plan'),
    // 索引同步间隔（秒）
    indexSyncInterval: parseInt(process.env.INDEX_SYNC_INTERVAL || '10', 10),
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

