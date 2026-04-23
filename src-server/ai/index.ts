/**
 * AI Adapter Interface and Registry
 * Supports multiple AI providers (Claude, Qwen, etc.)
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