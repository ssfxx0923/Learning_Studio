import { Request, Response } from 'express';
import { PlanService } from '../services/planService.js';
import type { Plan, ChatMessage } from '../types/index.js';

const planService = new PlanService();

// 初始化服务
planService.initialize().catch(console.error);

/**
 * 获取所有计划
 */
export async function getAllPlans(req: Request, res: Response) {
  try {
    const plans = await planService.getAllPlans();
    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error('Failed to get plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plans',
      details: error.message,
    });
  }
}

/**
 * 获取单个计划
 */
export async function getPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const plan = await planService.getPlan(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error('Failed to get plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plan',
      details: error.message,
    });
  }
}

/**
 * 创建新计划
 */
export async function createPlan(req: Request, res: Response) {
  try {
    const planData: Omit<Plan, 'id'> = req.body;

    // 验证必填字段
    if (!planData.title || !planData.createdAt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, createdAt',
      });
    }

    const plan = await planService.createPlan(planData);

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error('Failed to create plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plan',
      details: error.message,
    });
  }
}

/**
 * 更新计划
 */
export async function updatePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const planData: Plan = req.body;

    // 确保 ID 匹配
    if (planData.id && planData.id !== id) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID mismatch',
      });
    }

    planData.id = id;

    const plan = await planService.updatePlan(id, planData);

    res.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error('Failed to update plan:', error);
    
    if (error.message === 'Plan not found') {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update plan',
      details: error.message,
    });
  }
}

/**
 * 删除计划
 */
export async function deletePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await planService.deletePlan(id);

    res.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plan',
      details: error.message,
    });
  }
}

/**
 * 同步计划索引
 */
export async function syncPlansIndex(req: Request, res: Response) {
  try {
    const result = await planService.syncIndex();
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Failed to sync plans index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync plans index',
      details: error.message,
    });
  }
}

/**
 * 获取聊天历史
 */
export async function getChatHistory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const chatHistory = await planService.getChatHistory(id);

    res.json({
      success: true,
      data: chatHistory,
    });
  } catch (error: any) {
    console.error('Failed to get chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history',
      details: error.message,
    });
  }
}

/**
 * 保存聊天消息
 */
export async function saveChatMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const message: ChatMessage = req.body;

    // 验证必填字段
    if (!message.role || !message.content || !message.timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: role, content, timestamp',
      });
    }

    await planService.addChatMessage(id, message);

    res.json({
      success: true,
      message: 'Chat message saved successfully',
    });
  } catch (error: any) {
    console.error('Failed to save chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save chat message',
      details: error.message,
    });
  }
}

/**
 * AI创建计划 - 接收n8n发送的计划数据
 */
export async function createPlanFromAI(req: Request, res: Response) {
  try {
    // 支持两种格式：直接的 plan 数据或嵌套在 data 字段中
    let rawData = req.body.data || req.body;

    // 如果接收到的是字符串，先解析成对象
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON string in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        });
      }
    }

    const aiPlanData = rawData;

    console.log('Received AI plan data:', JSON.stringify(aiPlanData, null, 2));

    // 验证必填字段
    if (!aiPlanData.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: title',
        received: req.body,
        parsedData: aiPlanData,
      });
    }

    // 为每个任务生成ID和时间戳
    const tasksWithIds = (aiPlanData.tasks || []).map((task: any) => ({
      id: planService.generatePlanId(), // 复用ID生成器
      title: task.title,
      priority: task.priority || 3,
      completed: task.completed || false,
      dueDate: task.dueDate,
      createdAt: new Date().toISOString(),
    }));

    // 构建完整的计划数据
    const planData: Omit<Plan, 'id'> = {
      title: aiPlanData.title,
      description: aiPlanData.description || '',
      priority: aiPlanData.priority || 3,
      tasks: tasksWithIds,
      progress: aiPlanData.progress || 0,
      dueDate: aiPlanData.dueDate,
      createdAt: new Date().toISOString(),
      aiSuggestion: '此计划由AI自动生成',
    };

    const plan = await planService.createPlan(planData);

    console.log(`✓ AI created plan: ${plan.id} - ${plan.title}`);

    // 自动同步索引（类似英语文章系统）
    try {
      await planService.syncIndex();
      console.log('✓ Plan index synced after AI creation');
    } catch (syncError) {
      console.error('Failed to sync plan index:', syncError);
      // 不影响主流程，继续返回成功
    }

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error('Failed to create plan from AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plan from AI',
      details: error.message,
    });
  }
}

