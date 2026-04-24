/**
 * AI Adapter Interface and Registry
 * Supports multiple AI providers (Claude, Qwen, MiniMax, etc.)
 */

export interface AIResponse {
  say: string;       // 播报内容
  play: string[];    // 播放列表（歌曲名）
  segue?: string;    // 衔接词
  reason?: string;   // 决策理由
}

export interface AIAdapter {
  name: string;
  generate(prompt: string): Promise<AIResponse>;
}

const adapters: Map<string, AIAdapter> = new Map();

// 自动注册内置适配器
import { claudeAdapter } from './claude.js';
import { qwenAdapter } from './qwen.js';
import { MiniMaxAdapter } from './minimax.js';

registerAdapter(claudeAdapter);
registerAdapter(qwenAdapter);
registerAdapter(new MiniMaxAdapter());

/**
 * Register an AI adapter
 */
export function registerAdapter(adapter: AIAdapter): void {
  adapters.set(adapter.name, adapter);
}

/**
 * Get an adapter by name
 */
export function getAdapter(name: string): AIAdapter {
  const adapter = adapters.get(name);
  if (!adapter) {
    throw new Error(`Unknown AI adapter: ${name}. Available: ${[...adapters.keys()].join(', ')}`);
  }
  return adapter;
}

/**
 * Generate with a specific model
 */
export async function generateWithModel(model: string, prompt: string): Promise<AIResponse> {
  const adapter = getAdapter(model);
  return adapter.generate(prompt);
}

/**
 * Check if an adapter is registered
 */
export function hasAdapter(name: string): boolean {
  return adapters.has(name);
}

/**
 * List all registered adapter names
 */
export function listAdapters(): string[] {
  return [...adapters.keys()];
}