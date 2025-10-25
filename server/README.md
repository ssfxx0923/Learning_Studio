# AI Learning Platform - Backend Service

后端服务，负责处理文章生成、与 n8n 集成和文件管理。

## 功能特性

- 🚀 Express + TypeScript 构建的 RESTful API
- 📝 文章生成流程自动化
- 🔗 n8n Webhook 集成
- 📁 文件系统管理
- ✅ 完整的错误处理
- 🔒 安全中间件（Helmet, CORS）

## 技术栈

- Node.js 20+
- Express 4.x
- TypeScript 5.x
- Axios
- UUID

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# n8n Webhook 配置
N8N_WEBHOOK_URL=http://a.ssfxx.cloud:5678/webhook-test/your-webhook-id
N8N_TIMEOUT=300000

# 文件存储配置
ARTICLES_BASE_PATH=../public/data/english/artikel

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
npm start
```

## API 文档

### 健康检查

```
GET /api/health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 生成文章

```
POST /api/articles/generate
```

请求体：
```json
{
  "message": "whisper, lantern, horizon, puzzle, crystal"
}
```

或者：
```json
{
  "message": "我想学习关于太空探险的英语表达"
}
```

响应：
```json
{
  "success": true,
  "articleId": "64789d86c34d4845",
  "message": "Article generated successfully",
  "data": {
    "inputMessage": "whisper, lantern, horizon, puzzle, crystal"
  }
}
```

### 获取文章列表

```
GET /api/articles
```

响应：
```json
{
  "success": true,
  "articles": ["64789d86c34d4845", "64789d86c34d4846"]
}
```

### 删除文章

```
DELETE /api/articles/:articleId
```

响应：
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

## 工作流程

### 文章生成流程

1. **接收请求** - 前端发送用户输入的文本（可以是单词列表、主题描述等）
2. **生成 UUID** - 创建唯一的 16 位文章 ID
3. **创建文件夹** - 在 `public/data/english/artikel/{uuid}/` 创建目录
4. **调用 n8n** - 发送请求到 n8n webhook，包含：
   - `message`: 用户输入的文本（原样传递）
   - `request_id`: 文章 UUID
5. **等待文件生成** - 轮询检查文件是否生成（最多 5 分钟）
6. **验证文件** - 确保 `content.json` 和 `cover.png` 存在
7. **更新索引** - 将文章 ID 添加到 `index.json`
8. **返回响应** - 返回成功信息和文章 ID

### n8n 集成要求

n8n 工作流需要：

1. **接收参数**：
   - `message`: 用户输入的文本（可以是单词列表、主题描述等任意文本）
   - `request_id`: 文章 UUID

2. **AI 解析**：
   - n8n workflow 中的 AI agent 需要智能解析 `message` 内容
   - 如果是单词列表，提取单词生成文章
   - 如果是主题描述，理解意图生成相关文章
   - AI 自主决定如何处理用户输入

3. **生成文件**：
   - `public/data/english/artikel/{request_id}/content.json`
   - `public/data/english/artikel/{request_id}/cover.png`
   - `public/data/english/artikel/{request_id}/middle.png` (可选)
   - `public/data/english/artikel/{request_id}/audio.mp3` (可选)

3. **content.json 格式**：
```json
[
  {
    "output": {
      "Title": "文章标题",
      "Words": ["word1", "word2"],
      "Body": "文章内容..."
    }
  }
]
```

## 项目结构

```
server/
├── src/
│   ├── config/           # 配置文件
│   │   └── index.ts
│   ├── controllers/      # 控制器
│   │   └── articleController.ts
│   ├── middleware/       # 中间件
│   │   └── errorHandler.ts
│   ├── routes/           # 路由
│   │   ├── articleRoutes.ts
│   │   └── index.ts
│   ├── services/         # 服务层
│   │   ├── fileService.ts
│   │   └── n8nService.ts
│   ├── types/            # TypeScript 类型
│   │   └── index.ts
│   └── index.ts          # 入口文件
├── package.json
├── tsconfig.json
└── README.md
```

## 错误处理

所有错误响应格式：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```

常见错误码：
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

## 开发建议

1. **环境变量**：确保正确配置 `.env` 文件
2. **n8n 配置**：确保 n8n webhook 可访问
3. **文件权限**：确保服务器有文件系统读写权限
4. **超时设置**：根据实际情况调整 n8n 超时时间
5. **日志记录**：查看控制台输出了解详细执行过程

## 许可证

MIT

