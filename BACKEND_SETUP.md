# 后端服务设置指南

## 📋 概述

本项目包含一个完整的 Node.js + TypeScript 后端服务，用于处理文章生成、与 n8n 集成和文件管理。

## 🏗️ 架构说明

### 工作流程

```
用户输入单词
    ↓
前端调用 /api/articles/generate
    ↓
后端生成 UUID (16位)
    ↓
创建文章文件夹: public/data/english/artikel/{uuid}/
    ↓
调用 n8n webhook (message + request_id)
    ↓
等待 n8n 生成文件 (轮询检查，最多5分钟)
    ↓
验证文件: content.json, cover.png
    ↓
更新 index.json 添加文章 ID
    ↓
返回成功响应
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入后端目录
cd server

# 安装依赖
npm install
```

### 2. 配置环境变量

创建 `server/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# n8n Webhook 配置（只需要基础 URL，不含具体路径）
N8N_BASE_URL=http://a.ssfxx.cloud:5678/webhook-test
N8N_TIMEOUT=300000

# 文件存储配置
ARTICLES_BASE_PATH=../public/data/english/artikel

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 3. 启动后端服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3001` 启动。

### 4. 配置前端

在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001
```

### 5. 启动前端

```bash
# 在项目根目录
npm run dev
```

前端将在 `http://localhost:5173` 启动。

## 📡 API 接口

### 1. 健康检查

```http
GET /api/health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 生成文章

```http
POST /api/articles/generate
Content-Type: application/json

{
  "words": ["adventure", "mystery", "journey"]
}
```

响应：
```json
{
  "success": true,
  "articleId": "64789d86c34d4845",
  "message": "Article generated successfully",
  "data": {
    "words": ["adventure", "mystery", "journey"]
  }
}
```

### 3. 获取文章列表

```http
GET /api/articles
```

响应：
```json
{
  "success": true,
  "articles": ["64789d86c34d4845", "64789d86c34d4846"]
}
```

### 4. 删除文章

```http
DELETE /api/articles/{articleId}
```

响应：
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

## 🔗 n8n 集成配置

### n8n Workflow 要求

你的 n8n workflow 需要：

#### 1. 接收参数

- `message`: 单词列表（逗号分隔字符串）
- `request_id`: 16位文章 UUID

示例 webhook 接收数据：
```json
{
  "message": "adventure, mystery, journey",
  "request_id": "64789d86c34d4845"
}
```

#### 2. 生成并保存文件

在 `public/data/english/artikel/{request_id}/` 目录下创建以下文件：

**必需文件：**
- `content.json` - 文章内容
- `cover.png` - 封面图片

**可选文件：**
- `middle.png` - 文章中间插图
- `audio.mp3` - 文章朗读音频

#### 3. content.json 格式

```json
[
  {
    "output": {
      "Title": "A Mysterious Adventure",
      "Words": ["adventure", "mystery", "journey"],
      "Body": "Once upon a time, there was a mysterious adventure waiting to begin. The journey ahead was filled with wonder and excitement..."
    }
  }
]
```

### n8n Workflow 示例结构

```
1. Webhook (接收请求)
   ↓
2. AI 生成文章内容 (使用 message 参数)
   ↓
3. AI 生成封面图片
   ↓
4. 保存 content.json
   ↓
5. 保存 cover.png
   ↓
6. (可选) 生成并保存 middle.png
   ↓
7. (可选) 生成并保存 audio.mp3
   ↓
8. 返回响应
```

## 📁 文件结构

生成的文章文件结构：

```
public/data/english/artikel/
├── index.json                    # 文章索引
├── 64789d86c34d4845/            # 文章1
│   ├── content.json             # 文章内容
│   ├── cover.png                # 封面图
│   ├── middle.png               # 中间配图 (可选)
│   └── audio.mp3                # 朗读音频 (可选)
└── 64789d86c34d4846/            # 文章2
    ├── content.json
    ├── cover.png
    ├── middle.png
    └── audio.mp3
```

### index.json 格式

```json
{
  "articles": [
    "64789d86c34d4845",
    "64789d86c34d4846"
  ]
}
```

## 🐛 调试和测试

### 测试后端服务

```bash
# 测试健康检查
curl http://localhost:3001/api/health

# 测试生成文章
curl -X POST http://localhost:3001/api/articles/generate \
  -H "Content-Type: application/json" \
  -d '{"words": ["test", "example", "demo"]}'

# 获取文章列表
curl http://localhost:3001/api/articles

# 删除文章
curl -X DELETE http://localhost:3001/api/articles/64789d86c34d4845
```

### 查看日志

后端服务会输出详细的日志信息，包括：

- ✓ 成功操作（绿色对勾）
- → 请求发送（箭头）
- ✗ 失败操作（红色叉）

示例日志：
```
=== Starting article generation ===
Article ID: 64789d86c34d4845
Words: adventure, mystery, journey
✓ Created article folder: /path/to/folder
→ Calling n8n webhook with request_id: 64789d86c34d4845
✓ n8n webhook responded with status: 200
Waiting for n8n to generate files...
✓ Files validated successfully
✓ Updated index with article: 64789d86c34d4845
=== Article generation completed successfully ===
```

## ⚠️ 常见问题

### 1. 连接 n8n 失败

**问题**: `n8n webhook timeout or network error`

**解决方案**:
- 检查 `N8N_WEBHOOK_URL` 是否正确
- 确保 n8n 服务正在运行
- 检查网络连接和防火墙设置

### 2. 文件生成超时

**问题**: `Article generation timeout`

**解决方案**:
- 增加 `N8N_TIMEOUT` 值
- 检查 n8n workflow 是否正常工作
- 确保 n8n 有权限写入文件系统

### 3. CORS 错误

**问题**: 前端无法访问后端

**解决方案**:
- 检查 `CORS_ORIGIN` 配置
- 确保前端地址与配置匹配
- 如需支持多个域名，修改 `server/src/index.ts` 的 CORS 配置

### 4. 文件权限错误

**问题**: `EACCES: permission denied`

**解决方案**:
- 确保后端服务有权限创建和写入 `public/data/english/artikel` 目录
- Windows: 检查文件夹权限设置
- Linux/Mac: 使用 `chmod` 修改权限

## 🔧 进阶配置

### 修改文件验证超时

编辑 `server/src/controllers/articleController.ts`:

```typescript
// 修改最大等待时间（默认 5 分钟）
const maxAttempts = 60; // 60次 * 5秒 = 5分钟

// 修改轮询间隔（默认 5 秒）
await new Promise(resolve => setTimeout(resolve, 5000));
```

### 添加自定义中间件

编辑 `server/src/index.ts`:

```typescript
// 添加身份验证
import authMiddleware from './middleware/auth.js';
app.use('/api', authMiddleware);

// 添加请求限流
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
});
app.use('/api', limiter);
```

## 📚 扩展开发

### 添加新的 API 接口

1. 在 `server/src/controllers/` 创建新的控制器
2. 在 `server/src/routes/` 创建新的路由
3. 在 `server/src/routes/index.ts` 注册路由
4. 在前端 `src/services/api.ts` 添加 API 调用

### 集成其他 AI 服务

可以在 `server/src/services/` 创建新的服务类，参考 `n8nService.ts` 的结构。

## 📝 许可证

MIT

