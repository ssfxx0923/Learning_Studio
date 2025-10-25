import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../config/index.js';
import type { N8nWebhookPayload, N8nWebhookResponse } from '../types/index.js';

/**
 * n8n 服务 - 处理与 n8n webhook 的通信
 */
export class N8nService {
  private client: AxiosInstance;
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = CONFIG.n8n.webhookUrl;
    this.client = axios.create({
      timeout: CONFIG.n8n.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 调用 n8n webhook 生成文章
   */
  async generateArticle(
    message: string,
    requestId: string
  ): Promise<N8nWebhookResponse> {
    const payload: N8nWebhookPayload = {
      message,
      request_id: requestId,
    };

    console.log(`→ Calling n8n webhook with request_id: ${requestId}`);
    console.log(`→ Message: ${message}`);

    try {
      const response = await this.client.post<N8nWebhookResponse>(
        this.webhookUrl,
        payload
      );

      console.log(`✓ n8n webhook responded with status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error('✗ n8n webhook call failed:', error.message);
      
      if (error.response) {
        throw new Error(
          `n8n webhook error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        throw new Error('n8n webhook timeout or network error');
      } else {
        throw new Error(`n8n webhook error: ${error.message}`);
      }
    }
  }

  /**
   * 验证 webhook URL 是否可访问
   */
  async validateWebhook(): Promise<boolean> {
    try {
      // 尝试发送一个测试请求
      await this.client.head(this.webhookUrl, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

