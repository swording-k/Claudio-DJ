import type { AIAdapter, AIResponse } from './index.js';

export class MiniMaxAdapter implements AIAdapter {
  name = 'minimax';

  async generate(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY 未设置');
    }

    const response = await fetch('https://api.minimaxi.com/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n重要：请直接返回 JSON，不要包含思考过程。格式：{"say":"播报内容","play":["歌曲名"]}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MiniMax] API Error:', response.status, errorText);
      throw new Error(`MiniMax API 错误: ${response.status}`);
    }

    const data = await response.json();

    // MiniMax API 响应格式：content 是数组，包含 text 类型的内容块
    // 跳过 thinking 类型，只取 text 类型
    let text = '';
    if (data.content && Array.isArray(data.content)) {
      for (const item of data.content) {
        if (item.type === 'text') {
          text += item.text || '';
        }
      }
    }

    if (!text) {
      return {
        say: '抱歉，MiniMax 没有返回有效内容',
        play: [],
        reason: 'Empty response from MiniMax API',
      };
    }

    // 尝试解析 JSON
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      // 确保 say 字段有值
      if (!parsed.say) {
        parsed.say = text.slice(0, 200);
      }
      return parsed;
    } catch {
      // 尝试从文本中提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*?"say"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.say) return parsed;
        } catch { /* ignore */ }
      }
      // 无法解析 JSON，返回原始文本作为 say
      const trimmed = text.trim();
      return {
        say: trimmed.slice(0, 500) || '抱歉，我暂时无法回应',
        play: [],
        reason: '原始响应（非 JSON 格式）',
      };
    }
  }
}
