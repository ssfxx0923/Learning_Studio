import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { CONFIG } from '../config/index.js';
import type { Plan, PlanIndex } from '../types/index.js';

/**
 * 生成 16 位随机 UUID（使用 hex 编码）
 */
function generateId(): string {
  return randomBytes(8).toString('hex'); // 8 字节 = 16 个十六进制字符
}

/**
 * 计划服务 - 处理计划文件存储和管理
 */
export class PlanService {
  private plansBasePath: string;
  private indexPath: string;

  constructor() {
    this.plansBasePath = CONFIG.storage.plansBasePath;
    this.indexPath = path.join(this.plansBasePath, 'index.json');
  }

  /**
   * 初始化计划目录
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.plansBasePath, { recursive: true });
      console.log(`✓ Plans directory ready: ${this.plansBasePath}`);
    } catch (error) {
      console.error('Failed to initialize plans directory:', error);
      throw error;
    }
  }

  /**
   * 生成新的计划 ID
   */
  generatePlanId(): string {
    return generateId();
  }

  /**
   * 读取索引文件
   */
  async readIndex(): Promise<PlanIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      // 如果文件不存在，返回空索引
      if (error.code === 'ENOENT') {
        return { plans: [] };
      }
      throw error;
    }
  }

  /**
   * 更新索引文件
   */
  async updateIndex(index: PlanIndex): Promise<void> {
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2) + '\n',
      'utf-8'
    );
  }

  /**
   * 获取所有计划
   */
  async getAllPlans(): Promise<Plan[]> {
    const index = await this.readIndex();
    const plans: Plan[] = [];

    for (const planId of index.plans) {
      try {
        const plan = await this.getPlan(planId);
        if (plan) {
          plans.push(plan);
        }
      } catch (error) {
        console.error(`Failed to load plan ${planId}:`, error);
      }
    }

    return plans;
  }

  /**
   * 获取单个计划
   */
  async getPlan(planId: string): Promise<Plan | null> {
    try {
      const planPath = path.join(this.plansBasePath, `${planId}.json`);
      const content = await fs.readFile(planPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 创建新计划
   */
  async createPlan(planData: Omit<Plan, 'id'>): Promise<Plan> {
    const planId = this.generatePlanId();
    const plan: Plan = {
      ...planData,
      id: planId,
    };

    // 保存计划文件
    const planPath = path.join(this.plansBasePath, `${planId}.json`);
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2) + '\n', 'utf-8');

    // 更新索引
    const index = await this.readIndex();
    if (!index.plans.includes(planId)) {
      index.plans.push(planId);
      await this.updateIndex(index);
    }

    console.log(`✓ Created plan: ${planId}`);
    return plan;
  }

  /**
   * 更新计划
   */
  async updatePlan(planId: string, planData: Plan): Promise<Plan> {
    // 确保 ID 匹配
    if (planData.id !== planId) {
      throw new Error('Plan ID mismatch');
    }

    // 检查计划是否存在
    const exists = await this.planExists(planId);
    if (!exists) {
      throw new Error('Plan not found');
    }

    // 保存更新后的计划
    const planPath = path.join(this.plansBasePath, `${planId}.json`);
    await fs.writeFile(planPath, JSON.stringify(planData, null, 2) + '\n', 'utf-8');

    console.log(`✓ Updated plan: ${planId}`);
    return planData;
  }

  /**
   * 删除计划
   */
  async deletePlan(planId: string): Promise<void> {
    const planPath = path.join(this.plansBasePath, `${planId}.json`);

    try {
      // 删除文件
      await fs.unlink(planPath);

      // 从索引中移除
      const index = await this.readIndex();
      index.plans = index.plans.filter(id => id !== planId);
      await this.updateIndex(index);

      console.log(`✓ Deleted plan: ${planId}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件不存在，只从索引中移除
        const index = await this.readIndex();
        index.plans = index.plans.filter(id => id !== planId);
        await this.updateIndex(index);
      } else {
        throw error;
      }
    }
  }

  /**
   * 检查计划是否存在
   */
  async planExists(planId: string): Promise<boolean> {
    const planPath = path.join(this.plansBasePath, `${planId}.json`);
    try {
      await fs.access(planPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 扫描所有计划文件，同步索引
   */
  async syncIndex(): Promise<{ added: string[], removed: string[] }> {
    try {
      const files = await fs.readdir(this.plansBasePath);
      const actualPlans = files
        .filter(file => file.endsWith('.json') && file !== 'index.json')
        .map(file => file.replace('.json', ''));

      const index = await this.readIndex();
      const indexedPlans = new Set(index.plans);

      const added: string[] = [];
      const removed: string[] = [];

      // 找出需要添加的计划
      for (const planId of actualPlans) {
        if (!indexedPlans.has(planId)) {
          added.push(planId);
        }
      }

      // 找出需要删除的计划
      const actualPlansSet = new Set(actualPlans);
      for (const planId of index.plans) {
        if (!actualPlansSet.has(planId)) {
          removed.push(planId);
        }
      }

      // 更新索引
      if (added.length > 0 || removed.length > 0) {
        const newIndex: PlanIndex = {
          plans: actualPlans.sort(),
        };
        await this.updateIndex(newIndex);

        if (added.length > 0) {
          console.log(`✓ Added plans to index: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          console.log(`✓ Removed plans from index: ${removed.join(', ')}`);
        }
      }

      return { added, removed };
    } catch (error) {
      console.error('Failed to sync plans index:', error);
      return { added: [], removed: [] };
    }
  }
}

