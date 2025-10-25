import { Router, Request, Response } from 'express';
import axios from 'axios';
import { CONFIG } from '../config/index.js';

const router = Router();

// n8n webhook base URL
const N8N_BASE_URL = CONFIG.n8n.baseUrl;

/**
 * 翻译文本 - 代理到 n8n
 */
router.post('/english/translate', async (req: Request, res: Response) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Missing word parameter' });
    }

    console.log(`→ Translating word: ${word}`);
    
    // 调用 n8n webhook
    const response = await axios.post(
      `${N8N_BASE_URL}/english/translate`,
      { word },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    console.log(`✓ Translation completed`);
    res.json(response.data);
  } catch (error: any) {
    console.error('✗ Translation failed:', error.message);
    res.status(500).json({
      error: 'Translation failed',
      message: error.message,
    });
  }
});

/**
 * 分析文本 - 代理到 n8n
 */
router.post('/english/analyze', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    console.log(`→ Analyzing text: ${text.substring(0, 50)}...`);
    
    // 调用 n8n webhook
    const response = await axios.post(
      `${N8N_BASE_URL}/english/analyze`,
      { text },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    console.log(`✓ Analysis completed`);
    res.json(response.data);
  } catch (error: any) {
    console.error('✗ Analysis failed:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

export default router;

