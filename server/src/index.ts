import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CONFIG } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: CONFIG.cors.origin,
  credentials: true,
}));

// 日志中间件
app.use(morgan(CONFIG.nodeEnv === 'development' ? 'dev' : 'combined'));

// 请求解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api', routes);

// Webhook 路由 (直接导入，不通过 /api 前缀)
import webhookRoutes from './routes/webhookRoutes.js';
app.use('/webhook', webhookRoutes);

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
  console.log(`🔗 n8n Base URL: ${CONFIG.n8n.baseUrl}`);
  console.log(`📁 Articles Path: ${CONFIG.storage.articlesBasePath}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  / - API information`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  POST /api/articles/generate - Generate article`);
  console.log(`  GET  /api/articles - Get articles list`);
  console.log(`  DELETE /api/articles/:id - Delete article`);
  console.log(`  POST /webhook/english/translate - Translate text (proxy to n8n)`);
  console.log(`  POST /webhook/english/analyze - Analyze text (proxy to n8n)`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

