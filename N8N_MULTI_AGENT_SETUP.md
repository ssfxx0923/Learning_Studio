# Research Multi-Agent Workflow 配置说明

## 🎯 工作流概述

这是一个智能的多Agent协作系统，能够根据问题复杂度自动选择单Agent或多Agent模式处理研究问题。

## 📊 工作流程图

```
用户提问
    ↓
【Coordinator Agent - 任务协调者】
    ├─ 分析任务复杂度
    ├─ 判断是否需要多Agent协作
    └─ 分配角色和任务
    ↓
   判断
    ├─ 简单问题 → 【Simple Agent】→ 直接返回
    └─ 复杂问题 ↓
         【3个专业Agent并行】
            ├─ Research Agent 1（角色A）
            ├─ Research Agent 2（角色B）
            └─ Research Agent 3（角色C）
            ↓
         【Integration Agent - 整合者】
            └─ 综合所有结果
            ↓
         返回最终答案
```

## 🔧 n8n 导入步骤

### 1. 导入工作流

1. 打开 n8n 界面
2. 点击右上角的 **三个点** → **Import from File**
3. 选择 `n8n_research_multi_agent.json` 文件
4. 工作流将自动导入

### 2. 配置 OpenAI 凭证

**需要替换的凭证ID：**
```json
"credentials": {
  "openAiApi": {
    "id": "YOUR_OPENAI_CREDENTIAL_ID",  // ← 替换为你的凭证ID
    "name": "OpenAi account"
  }
}
```

**步骤：**
1. 在 n8n 中创建 OpenAI API 凭证（如果还没有）
2. 记录凭证ID
3. 在工作流中找到所有 OpenAI Chat Model 节点
4. 为每个节点配置正确的凭证

**需要配置凭证的节点：**
- OpenAI - Coordinator
- OpenAI - Agent 1
- OpenAI - Agent 2
- OpenAI - Agent 3
- OpenAI - Integration
- OpenAI - Simple

### 3. 配置 Webhook

Webhook 路径已预设为：`/research/generate`

**测试 URL：**
```
POST http://your-n8n-domain/webhook/research/generate
```

**测试请求：**
```bash
curl -X POST http://localhost:5678/webhook/research/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "请分析AI在教育领域的应用前景",
    "context": ""
  }'
```

## 📦 节点说明

### 核心节点

| 节点名称 | 类型 | 作用 |
|---------|------|------|
| **Webhook - Research Entry** | Webhook | 接收用户请求 |
| **Coordinator Agent** | AI Agent | 分析任务，分配角色 |
| **需要多Agent协作?** | IF | 判断复杂度，路由请求 |
| **Research Agent 1/2/3** | AI Agent | 并行处理子任务 |
| **Integration Agent** | AI Agent | 整合所有结果 |
| **Simple Agent** | AI Agent | 处理简单问题 |

### 输出格式

#### Coordinator Agent 输出示例：

```json
{
  "needsMultiAgent": true,
  "agents": [
    {
      "role": "理论研究专家",
      "systemPrompt": "你是一位教育理论研究专家，擅长分析教育理论、学习科学和认知心理学。请从理论角度分析AI在教育领域的应用。",
      "task": "从教育理论角度分析AI的应用价值和理论基础"
    },
    {
      "role": "技术应用专家",
      "systemPrompt": "你是一位教育技术专家，熟悉各类AI教育工具和平台。请分析具体的技术应用和实践案例。",
      "task": "分析AI在教育中的具体技术应用和成功案例"
    },
    {
      "role": "批判性分析专家",
      "systemPrompt": "你是一位批判性思维专家，擅长发现问题和评估风险。请分析AI教育应用中的潜在问题和挑战。",
      "task": "识别AI教育应用的风险、挑战和伦理问题"
    }
  ],
  "integrationPrompt": "你是一位资深教育顾问，需要综合理论、实践和批判性分析，给出全面客观的结论。"
}
```

#### 最终返回格式：

**多Agent模式：**
```json
{
  "response": "综合三位专家的分析...",
  "mode": "multi-agent"
}
```

**Simple模式：**
```json
{
  "response": "直接回答...",
  "mode": "simple"
}
```

## 🎨 自定义建议

### 1. 调整复杂度判断

在 **Coordinator Agent** 的系统提示词中修改判断逻辑：

```
如果问题满足以下任一条件，使用多Agent：
1. 需要多角度分析（理论+实践+批判）
2. 涉及多个领域知识
3. 需要深度研究
4. 用户明确要求全面分析

否则使用简单模式。
```

### 2. 修改Agent角色

根据你的需求，可以自定义3个Agent的角色：

**示例角色组合：**

**组合1：学术研究**
- Agent 1: 文献综述专家
- Agent 2: 数据分析专家
- Agent 3: 方法论专家

**组合2：商业分析**
- Agent 1: 市场分析师
- Agent 2: 财务分析师
- Agent 3: 战略顾问

**组合3：技术评估**
- Agent 1: 技术架构师
- Agent 2: 安全专家
- Agent 3: 性能优化专家

### 3. 调整模型选择

| 节点 | 推荐模型 | 理由 |
|------|---------|------|
| Coordinator | GPT-4o-mini | 快速判断，成本低 |
| Agent 1/2/3 | GPT-4o-mini | 并行执行，成本控制 |
| Integration | GPT-4o | 质量优先，最终输出 |
| Simple | GPT-4o-mini | 简单问题，快速响应 |

## 🔍 调试技巧

### 1. 查看Coordinator输出

在 **Coordinator Agent** 节点后添加 **Set** 节点打印输出：
```json
{
  "coordinatorOutput": "={{ $json.output }}"
}
```

### 2. 查看各Agent响应

在 **合并Agent结果** 节点后查看数据：
```json
{
  "agent1Response": "={{ $('Research Agent 1').item.json.output }}",
  "agent2Response": "={{ $('Research Agent 2').item.json.output }}",
  "agent3Response": "={{ $('Research Agent 3').item.json.output }}"
}
```

### 3. 测试单个Agent

临时禁用其他Agent，只测试一个：
1. 右键点击节点
2. 选择 **Disable**
3. 运行工作流

## ⚡ 性能优化

### 1. 并行执行

3个Research Agent已配置为并行执行，无需等待。

### 2. 超时设置

在 Webhook 节点设置超时：
```json
{
  "options": {
    "timeout": 120000  // 2分钟
  }
}
```

### 3. 缓存结果

可以添加 **Redis** 节点缓存常见问题的结果。

## 📝 常见问题

### Q1: Agent没有按预期分配角色？

**解决方案：**
- 检查 Coordinator 的系统提示词
- 增加角色分配的示例
- 调整输出解析器的 JSON Schema

### Q2: 整合结果不理想？

**解决方案：**
- 优化 Integration Agent 的提示词
- 使用更强的模型（GPT-4o）
- 调整整合提示词的结构

### Q3: 响应太慢？

**解决方案：**
- 减少Agent数量（3个改为2个）
- 使用更快的模型（GPT-4o-mini）
- 优化提示词长度

## 🚀 扩展建议

### 1. 添加流式输出

将每个Agent的输出实时推送到前端。

### 2. 添加记忆功能

使用 **Memory** 节点保存上下文，支持多轮对话。

### 3. 添加工具调用

为Agent添加工具（搜索、计算器等）增强能力。

### 4. 添加人工审核

在整合前添加人工审核节点，确保质量。

## 📊 监控和日志

### 添加日志节点

在关键位置添加 **Function** 节点记录日志：

```javascript
console.log('Coordinator决策:', $input.item.json.output.needsMultiAgent);
console.log('分配的角色:', $input.item.json.output.agents.map(a => a.role));
return $input.all();
```

### 监控指标

- 多Agent使用频率
- 平均响应时间
- Token消耗量
- 错误率

---

## 🎯 快速开始清单

- [ ] 导入工作流文件
- [ ] 配置所有OpenAI凭证
- [ ] 激活工作流
- [ ] 测试简单问题
- [ ] 测试复杂问题
- [ ] 验证多Agent协作
- [ ] 查看整合结果
- [ ] 根据需求调整提示词

**祝你使用愉快！** 🎉
