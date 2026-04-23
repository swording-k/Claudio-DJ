/**
 * Claude AI Adapter
 * Uses Anthropic Messages API (2023-06-01)
 */

import type { AIAdapter, AIResponse } from './index.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-7-20250514';

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return key;
}

function parseAIResponse(text: string): AIResponse {
  // Try to extract JSON from the response text
  // The response might contain JSON embedded in markdown code blocks or plain text
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

export const claudeAdapter: AIAdapter = {
  name: 'claude',

  async generate(prompt: string): Promise<AIResponse> {
    const apiKey = getApiKey();

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
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
      throw new Error(`Claude API error ${response.status}: ${error}`);
    }

    const data = await response.json() as { content: Array<{ text: string }> };

    // Extract text from the response content
    const text = data.content?.[0]?.text ?? '';
    return parseAIResponse(text);
  },
};