/**
 * Qwen (通义千问) AI Adapter
 * Uses DashScope Chat Completions API
 */

import type { AIAdapter, AIResponse } from './index.js';

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL = 'qwen-plus';

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) {
    throw new Error('DASHSCOPE_API_KEY environment variable is not set');
  }
  return key;
}

function parseAIResponse(text: string): AIResponse {
  // Try to extract JSON from the response text
  let jsonStr = text;

  // Handle markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // Try to find JSON object in the text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonStr);

  return {
    say: parsed.say ?? '',
    play: Array.isArray(parsed.play) ? parsed.play : [],
    segue: parsed.segue,
    reason: parsed.reason,
  };
}

export const qwenAdapter: AIAdapter = {
  name: 'qwen',

  async generate(prompt: string): Promise<AIResponse> {
    const apiKey = getApiKey();

    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n请以 JSON 格式返回，包含 say、play、segue、reason 字段。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DashScope API error ${response.status}: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };

    // Extract text from the response content
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseAIResponse(text);
  },
};