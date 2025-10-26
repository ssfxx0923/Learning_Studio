import { Request, Response } from 'express';
import { PlanService } from '../services/planService.js';
import type { Plan } from '../types/index.js';

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

