import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../config/index.js';
import type { N8nWebhookPayload, N8nWebhookResponse } from '../types/index.js';

/**
 * n8n 服务 - 处理与 n8n webhook 的通信
 */
export class N8nService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = CONFIG.n8n.baseUrl;
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

    const url = `${this.baseUrl}/english/generate`;
    console.log(`→ Calling n8n webhook: ${url}`);
    console.log(`→ Request ID: ${requestId}`);
    console.log(`→ Message: ${message}`);

    try {
      const response = await this.client.post<N8nWebhookResponse>(
        url,
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
      const url = `${this.baseUrl}/english/generate`;
      await this.client.head(url, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

