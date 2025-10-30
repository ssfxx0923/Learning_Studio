import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CONFIG } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { IndexWatcher } from './services/indexWatcher.js';

const app = express();

// 创建索引监控服务
const indexWatcher = new IndexWatcher(CONFIG.storage.indexSyncInterval);

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors());

// 日志中间件
app.use(morgan(CONFIG.nodeEnv === 'development' ? 'dev' : 'combined'));

// 请求解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api', routes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'AI Learning Platform API',
    version: '1.0.0',
    status: 'running',
  });
});

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
const server = app.listen(CONFIG.port, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   AI Learning Platform - Backend Service         ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on: http://localhost:${CONFIG.port}`);
  console.log(`📝 Environment: ${CONFIG.nodeEnv}`);
  console.log(`📁 Articles Path: ${CONFIG.storage.articlesBasePath}`);
  console.log(`📋 Plans Path: ${CONFIG.storage.plansBasePath}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    / - API information`);
  console.log(`  GET    /api/health - Health check`);
  console.log('');
  console.log('Articles:');
  console.log(`  POST   /api/articles/create-folder - Create article folder`);
  console.log(`  GET    /api/articles - Get articles list (read index.json)`);
  console.log(`  DELETE /api/articles/:id - Delete article from filesystem`);
  console.log('');
  console.log('Plans:');
  console.log(`  GET    /api/plans - Get all plans`);
  console.log(`  GET    /api/plans/:id - Get single plan`);
  console.log(`  POST   /api/plans - Create new plan`);
  console.log(`  PUT    /api/plans/:id - Update plan`);
  console.log(`  DELETE /api/plans/:id - Delete plan`);
  console.log(`  POST   /api/plans/sync-index - Sync plans index`);
  console.log('');
  console.log('Note: Content generation is handled by n8n webhook');
  console.log('');
  
  // 启动索引监控服务
  indexWatcher.start();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  indexWatcher.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  indexWatcher.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

