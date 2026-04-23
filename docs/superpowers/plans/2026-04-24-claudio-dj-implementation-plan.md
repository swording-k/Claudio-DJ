# Claudio DJ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个跨平台个人 AI 电台应用，具备定时广播、语音唤醒、音乐播放、语音合成功能。

**Architecture:** Tauri 跨平台壳 + Node.js 后端服务 + PWA 前端界面。四层架构：交互表层 → 本地大脑 → 运行时聚合 → 外部上下文。

**Tech Stack:** Tauri (Rust) | Node.js | TypeScript | Porcupine | Fish Audio | NeteaseCloudMusicApi | SQLite

---

## 项目结构

```
claudio-dj/
├── src/                      # Tauri / Rust 源码
│   └──-tauri/
│       ├── src/
│       │   └── main.rs       # Tauri 入口
│       └── tauri.conf.json   # Tauri 配置
├── src-web/                  # PWA 前端
│   ├── index.html
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.ts
│   │   ├── components/       # UI 组件
│   │   └── styles/           # CSS
│   └── vite.config.ts
├── src-server/               # Node.js 后端
│   ├── index.ts              # 服务入口
│   ├── router.ts             # 指令路由
│   ├── context.ts            # 上下文组装
│   ├── scheduler.ts          # 定时调度
│   ├── tts.ts                # 语音合成
│   ├── music.ts              # 音乐播放
│   ├── state.ts              # 状态存储
│   └── ai/
│       ├── claude.ts
│       ├── qwen.ts
│       └── index.ts
├── data/                     # 用户数据 (~/.claudio/)
│   ├── config.json
│   ├── taste.md
│   ├── routines.md
│   └── memory/
├── package.json
└── SPEC.md                   # 设计文档链接
```

---

## 里程碑划分

| 阶段 | 目标 | 交付物 |
|------|------|--------|
| Phase 1 | 项目初始化 | Tauri Shell + Node.js 服务骨架 + PWA 界面骨架 |
| Phase 2 | 核心后端 | Router + Context + Scheduler + State 模块 |
| Phase 3 | AI 集成 | Claude/通义/豆包/智谱适配器 + Prompt 组装 |
| Phase 4 | 语音能力 | Porcupine 唤醒 + ASR + TTS |
| Phase 5 | 音乐播放 | NeteaseCloudMusicApi 集成 + 播放器 |
| Phase 6 | 前端界面 | PWA UI + 系统通知 + 媒体控制 |
| Phase 7 | 集成测试 | 完整流程测试 + 打包发布 |

---

## Phase 1: 项目初始化

### 任务 1.1: 初始化 Tauri 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `src-web/index.html`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/Cargo.toml`
- Create: `tsconfig.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "claudio-dj",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:server\"",
    "dev:web": "vite",
    "dev:server": "tsx watch src-server/index.ts",
    "build": "vite build && tauri build",
    "tauri": "tauri"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "better-sqlite3": "^9.4.3",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@tauri-apps/api": "^2.0.0",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "tsx": "^4.7.0",
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src-web',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 3: 创建 src-web/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claudio DJ</title>
  <link rel="manifest" href="/manifest.json" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 Tauri 配置文件 tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Claudio DJ",
  "identifier": "com.claudiodj.app",
  "version": "0.1.0",
  "build": {
    "devUrl": "http://localhost:8080",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "Claudio DJ",
        "width": 400,
        "height": 700,
        "resizable": true,
        "center": true
      }
    ]
  }
}
```

- [ ] **Step 5: 创建 Cargo.toml**

```toml
[package]
name = "claudio-dj"
version = "0.1.0"

[build-dependencies]
tauri-build = "2"

[dependencies]
tauri = "2"
tauri-plugin-shell = "2"
serde = "1"
serde_json = "1"

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

- [ ] **Step 6: 创建 src-tauri/src/main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: 创建 src-tauri/build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 8: 安装依赖并验证构建**

Run: `cd "/Users/baojian/Desktop/Claudio DJ" && npm install`
Expected: 安装成功，无报错

Run: `npm run tauri init -- --ci --app-name "Claudio DJ" --window-title "Claudio DJ" --frontend-dist ../dist --dev-url http://localhost:8080`
Expected: 初始化成功（如果 tauri CLI 可用）

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat: 初始化 Tauri 项目骨架"
```

---

### 任务 1.2: 初始化 Node.js 后端服务

**Files:**
- Create: `src-server/index.ts`
- Create: `src-server/router.ts`
- Create: `src-server/state.ts`

- [ ] **Step 1: 创建 src-server/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { router } from './router';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API 路由
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Claudio DJ 服务运行在 http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 创建 src-server/router.ts**

```typescript
import { Router } from 'express';

export const router = Router();

// TODO: 实现路由逻辑
router.get('/status', (_, res) => {
  res.json({ status: 'running', version: '0.1.0' });
});
```

- [ ] **Step 3: 创建 src-server/state.ts**

```typescript
import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

// 数据目录：~/.claudio/
const DATA_DIR = join(homedir(), '.claudio');

export const db = new Database(join(DATA_DIR, 'state.db'));

// 初始化数据库
db.exec(`
  CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    song_name TEXT NOT NULL,
    artist TEXT
  );
`);
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src-server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src-server/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: 验证后端服务启动**

Run: `cd "/Users/baojian/Desktop/Claudio DJ" && npm run dev:server`
Expected: 服务启动在 3001 端口

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 初始化 Node.js 后端服务骨架"
```

---

### 任务 1.3: 初始化 PWA 前端

**Files:**
- Create: `src-web/src/main.ts`
- Create: `src-web/src/App.ts`
- Create: `src-web/src/styles/main.css`
- Create: `src-web/public/manifest.json`

- [ ] **Step 1: 创建 src-web/src/main.ts**

```typescript
import './styles/main.css';
import { App } from './App';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = '<app-root></app-root>';
customElements.define('app-root', App);
```

- [ ] **Step 2: 创建 src-web/src/App.ts**

```typescript
import { html, css, LitElement } from 'lit';

export class App extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: #08080C;
      color: #E5E5E5;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>Claudio DJ</h1>
        <p>正在初始化...</p>
      </div>
    `;
  }
}
```

- [ ] **Step 3: 创建 src-web/src/styles/main.css**

```css
:root {
  --bg-primary: #08080C;
  --bg-secondary: #141418;
  --color-amber: #F59E0B;
  --color-white: #E5E5E5;
  --color-blue: #3B82F6;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg-primary);
  color: var(--color-white);
  font-family: system-ui, -apple-system, sans-serif;
}

.container {
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}
```

- [ ] **Step 4: 创建 manifest.json**

```json
{
  "name": "Claudio DJ",
  "short_name": "Claudio",
  "description": "个人 AI 电台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#08080C",
  "theme_color": "#F59E0B",
  "icons": []
}
```

- [ ] **Step 5: 添加 lit 依赖并安装**

Run: `cd "/Users/baojian/Desktop/Claudio DJ" && npm install lit && npm run dev:web`
Expected: Vite 开发服务器启动在 8080 端口

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 初始化 PWA 前端骨架"
```

---

## Phase 2: 核心后端模块

### 任务 2.1: Context 模块（Prompt 组装）

**Files:**
- Create: `src-server/context.ts`

- [ ] **Step 1: 创建 src-server/context.ts**

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DATA_DIR = join(homedir(), '.claudio');

// 读取用户偏好文件
function getTaste(): string {
  const path = join(DATA_DIR, 'taste.md');
  if (!existsSync(path)) {
    return '用户尚未配置偏好（taste.md 不存在）';
  }
  return readFileSync(path, 'utf-8');
}

// 读取日程文件
function getRoutines(): string {
  const path = join(DATA_DIR, 'routines.md');
  if (!existsSync(path)) {
    return '用户尚未配置日程（routines.md 不存在）';
  }
  return readFileSync(path, 'utf-8');
}

// 获取记忆文件
function getMemory(): string[] {
  const memoryDir = join(DATA_DIR, 'memory');
  if (!existsSync(memoryDir)) {
    return [];
  }
  // TODO: 实现向量检索
  return [];
}

export interface ContextParams {
  userInput?: string;
  envData?: {
    weather?: string;
    calendar?: string[];
  };
  systemPrompt?: string;
}

export function buildContext(params: ContextParams): string {
  const taste = getTaste();
  const routines = getRoutines();
  const memory = getMemory();

  const parts: string[] = [];

  // 1. 系统提示词
  if (params.systemPrompt) {
    parts.push(`【系统提示词】\n${params.systemPrompt}`);
  }

  // 2. 用户偏好
  parts.push(`【用户偏好】\n${taste}`);

  // 3. 日程安排
  parts.push(`【日程安排】\n${routines}`);

  // 4. 环境信息
  if (params.envData) {
    if (params.envData.weather) {
      parts.push(`【当前天气】\n${params.envData.weather}`);
    }
    if (params.envData.calendar) {
      parts.push(`【今日日历】\n${params.envData.calendar.join('\n')}`);
    }
  }

  // 5. 记忆检索
  if (memory.length > 0) {
    parts.push(`【相关记忆】\n${memory.join('\n\n')}`);
  }

  // 6. 用户输入
  if (params.userInput) {
    parts.push(`【用户输入】\n${params.userInput}`);
  }

  return parts.join('\n\n---\n\n');
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: 实现 Context 模块 - Prompt 组装"
```

---

### 任务 2.2: Scheduler 模块（定时调度）

**Files:**
- Create: `src-server/scheduler.ts`
- Modify: `src-server/index.ts`

- [ ] **Step 1: 创建 src-server/scheduler.ts**

```typescript
import cron from 'node-cron';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { buildContext } from './context';
import { generateBroadcast } from './ai';

const DATA_DIR = join(homedir(), '.claudio');

interface ScheduledTask {
  name: string;
  cron: string;
  handler: () => Promise<void>;
}

// 解析 routines.md 获取定时任务
function parseRoutines(): ScheduledTask[] {
  const path = join(DATA_DIR, 'routines.md');
  if (!existsSync(path)) {
    console.log('routines.md 不存在，跳过定时任务设置');
    return [];
  }

  const content = readFileSync(path, 'utf-8');
  const tasks: ScheduledTask[] = [];

  // 简单解析：- HH:MM 描述
  const regex = /- (\d{1,2}:\d{2})\s+([^:]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const time = match[1];
    const [hours, minutes] = time.split(':');
    // cron 格式：分 时 日 月 周
    const cronExpr = `${minutes} ${hours} * * *`;

    tasks.push({
      name: match[2].trim(),
      cron: cronExpr,
      handler: async () => {
        console.log(`[Scheduler] 触发定时任务: ${match[2]}`);
        const ctx = buildContext({});
        await generateBroadcast(ctx);
      },
    });
  }

  return tasks;
}

const activeJobs: cron.ScheduledTask[] = [];

export function initScheduler() {
  const tasks = parseRoutines();

  for (const task of tasks) {
    const job = cron.schedule(task.cron, task.handler, {
      scheduled: true,
      timezone: 'Asia/Shanghai',
    });
    activeJobs.push(job);
    console.log(`[Scheduler] 已注册任务: ${task.name} (${task.cron})`);
  }
}

export function stopScheduler() {
  for (const job of activeJobs) {
    job.stop();
  }
  activeJobs.length = 0;
}
```

- [ ] **Step 2: 更新 src-server/index.ts 添加 scheduler 初始化**

```typescript
import express from 'express';
import cors from 'cors';
import { router } from './router';
import { initScheduler } from './scheduler';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API 路由
app.use('/api', router);

// 启动调度器
initScheduler();

app.listen(PORT, () => {
  console.log(`Claudio DJ 服务运行在 http://localhost:${PORT}`);
});
```

- [ ] **Step 3: 创建占位的 ai 模块**

```typescript
// src-server/ai/index.ts
export async function generateBroadcast(context: string): Promise<void> {
  // TODO: 实现 AI 生成逻辑
  console.log('[AI] 生成播报:', context.slice(0, 100));
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 实现 Scheduler 模块 - 定时调度"
```

---

## Phase 3: AI 集成

### 任务 3.1: AI 适配器抽象

**Files:**
- Create: `src-server/ai/index.ts`
- Create: `src-server/ai/claude.ts`
- Create: `src-server/ai/qwen.ts`

- [ ] **Step 1: 创建 AI 接口定义 src-server/ai/index.ts**

```typescript
export interface AIResponse {
  say: string;       // 播报内容
  play: string[];    // 播放列表
  segue?: string;    // 衔接词
  reason?: string;   // 决策理由
}

export interface AIAdapter {
  name: string;
  generate(prompt: string): Promise<AIResponse>;
}
```

- [ ] **Step 2: 创建 Claude 适配器 src-server/ai/claude.ts**

```typescript
import type { AIAdapter, AIResponse } from './index';

export class ClaudeAdapter implements AIAdapter {
  name = 'claude';

  async generate(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 未设置');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-7-20250514',
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
      throw new Error(`Claude API 错误: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // 解析 JSON 响应
    try {
      return JSON.parse(text);
    } catch {
      // 如果不是 JSON，包装成纯文本播报
      return {
        say: text,
        play: [],
        reason: '原始响应（非 JSON 格式）',
      };
    }
  }
}
```

- [ ] **Step 3: 创建通义千问适配器 src-server/ai/qwen.ts**

```typescript
import type { AIAdapter, AIResponse } from './index';

export class QwenAdapter implements AIAdapter {
  name = 'qwen';

  async generate(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 未设置');
    }

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n请以 JSON 格式返回，包含 say、play、segue、reason 字段。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`通义千问 API 错误: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    try {
      return JSON.parse(text);
    } catch {
      return {
        say: text,
        play: [],
        reason: '原始响应（非 JSON 格式）',
      };
    }
  }
}
```

- [ ] **Step 4: 更新 src-server/ai/index.ts 导出**

```typescript
import type { AIAdapter, AIResponse } from './index';
import { ClaudeAdapter } from './claude';
import { QwenAdapter } from './qwen';

export * from './index';

// 模型注册表
const adapters: Record<string, AIAdapter> = {
  claude: new ClaudeAdapter(),
  qwen: new QwenAdapter(),
};

export function getAdapter(name: string): AIAdapter {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`未知的 AI 模型: ${name}`);
  }
  return adapter;
}

export async function generateWithModel(model: string, prompt: string): Promise<AIResponse> {
  const adapter = getAdapter(model);
  return adapter.generate(prompt);
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 实现 AI 适配器 - Claude 和通义千问"
```

---

## Phase 4: 语音能力

### 任务 4.1: TTS 模块

**Files:**
- Create: `src-server/tts.ts`

- [ ] **Step 1: 创建 src-server/tts.ts**

```typescript
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DATA_DIR = join(homedir(), '.claudio');
const CACHE_DIR = join(DATA_DIR, 'cache', 'tts');

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
}

// Fish Audio API 调用
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const { text, voice = 'default', speed = 1.0 } = options;

  // 检查缓存
  const cacheKey = `${Buffer.from(text).toString('base64').slice(0, 32)}_${speed}`;
  const cachePath = join(CACHE_DIR, `${cacheKey}.mp3`);

  if (existsSync(cachePath)) {
    console.log(`[TTS] 使用缓存: ${cacheKey}`);
    return await Bun.file(cachePath).arrayBuffer();
  }

  // 确保缓存目录存在
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY 未设置');
  }

  const response = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      text,
      voice,
      speed,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fish Audio API 错误: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // 写入缓存
  await writeFile(cachePath, buffer);

  return buffer;
}

// Azure TTS 备用方案
export async function generateSpeechAzure(text: string): Promise<string> {
  const subscriptionKey = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION;

  if (!subscriptionKey || !region) {
    throw new Error('Azure TTS 凭据未设置');
  }

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
      },
      body: `<speak version='1.0' xml:lang='zh-CN'>
        <voice xml:lang='zh-CN' name='zh-CN-XiaoxiaoNeural'>
          ${text}
        </voice>
      </speak>`,
    }
  );

  if (!response.ok) {
    throw new Error(`Azure TTS API 错误: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer()).toString('base64');
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: 实现 TTS 模块 - 语音合成"
```

---

### 任务 4.2: 语音唤醒（Porcupine）

**Files:**
- Create: `src-tauri/src/wakeword.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 添加 Porcupine 依赖到 Cargo.toml**

```toml
[dependencies]
tauri = "2"
tauri-plugin-shell = "2"
serde = "1"
serde_json = "1"
pv_porcupine = "3"  # 添加
```

- [ ] **Step 2: 创建 src-tauri/src/wakeword.rs**

```rust
use pv_porcupine::{Porcupine, builder::PorcupineBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

pub struct WakeWordDetector {
    porcupine: Porcupine,
}

impl WakeWordDetector {
    pub fn new(keywords: &[&str]) -> Result<Self, Box<dyn std::error::Error>> {
        let porcupine = PorcupineBuilder::from_keywords(keywords)
            .model_path("/path/to/porcupine_params.pv")  // 需要下载模型文件
            .build()?;
        Ok(Self { porcupine })
    }

    pub fn process(&mut self, pcm: &[i16]) -> bool {
        self.porcupine.process(pcm)
    }
}

// 从麦克风持续读取并检测
pub fn start_wakeword_listener(app: AppHandle) {
    // 注意：完整实现需要音频捕获和异步处理
    // 这里给出核心逻辑框架
    println!("[WakeWord] 监听中...");
}
```

- [ ] **Step 3: 更新 main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod wakeword;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            println!("Claudio DJ 启动中...");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 添加 Porcupine 唤醒词检测框架"
```

---

## Phase 5: 音乐播放

### 任务 5.1: NeteaseCloudMusicApi 集成

**Files:**
- Create: `src-server/music.ts`

- [ ] **Step 1: 创建 src-server/music.ts**

```typescript
interface NeteaseSong {
  id: number;
  name: string;
  artists: { name: string }[];
  album: { name: string };
}

interface NeteaseSearchResult {
  result: {
    songs: NeteaseSong[];
  };
}

interface NeteaseUrlResult {
  data: {
    id: number;
    url: string;
    type: string;
  }[];
}

export interface PlayableSong {
  name: string;
  artist: string;
  album: string;
  url: string;
  lyric?: string;
}

// 搜索歌曲
export async function searchSong(keyword: string): Promise<NeteaseSong[]> {
  const response = await fetch(
    `http://localhost:3000/cloudsearch?keywords=${encodeURIComponent(keyword)}`
  );
  if (!response.ok) {
    throw new Error(`搜索失败: ${response.status}`);
  }
  const data: NeteaseSearchResult = await response.json();
  return data.result.songs || [];
}

// 获取歌曲播放 URL
export async function getSongUrl(songId: number): Promise<string | null> {
  const response = await fetch(
    `http://localhost:3000/song/url/v1?id=${songId}&level=standard`
  );
  if (!response.ok) {
    return null;
  }
  const data: NeteaseUrlResult = await response.json();
  const song = data.data[0];
  return song?.url || null;
}

// 获取歌词
export async function getLyric(songId: number): Promise<string | null> {
  const response = await fetch(
    `http://localhost:3000/lyric?id=${songId}`
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.lrc?.lyric || null;
}

// 完整搜索+获取URL
export async function findPlayableSong(keyword: string): Promise<PlayableSong | null> {
  const songs = await searchSong(keyword);
  if (songs.length === 0) {
    return null;
  }

  const song = songs[0];
  const url = await getSongUrl(song.id);
  if (!url) {
    return null;
  }

  const lyric = await getLyric(song.id);

  return {
    name: song.name,
    artist: song.artists.map(a => a.name).join(', '),
    album: song.album.name,
    url,
    lyric: lyric || undefined,
  };
}
```

- [ ] **Step 2: 创建 music router**

```typescript
// src-server/routes/music.ts
import { Router } from 'express';
import { findPlayableSong, searchSong, getSongUrl } from '../music';

export const musicRouter = Router();

musicRouter.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: '缺少搜索关键词' });
    return;
  }
  try {
    const results = await searchSong(q);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: '搜索失败' });
  }
});

musicRouter.get('/play', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: '缺少搜索关键词' });
    return;
  }
  try {
    const song = await findPlayableSong(q);
    if (!song) {
      res.status(404).json({ error: '未找到可播放的歌曲' });
      return;
    }
    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});
```

- [ ] **Step 3: 更新 router.ts 注册 musicRouter**

```typescript
import { Router } from 'express';
import { musicRouter } from './routes/music';

export const router = Router();

router.get('/status', (_, res) => {
  res.json({ status: 'running', version: '0.1.0' });
});

router.use('/music', musicRouter);
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 实现音乐模块 - NeteaseCloudMusicApi 集成"
```

---

## Phase 6: 前端界面

### 任务 6.1: PWA 主界面

**Files:**
- Create: `src-web/src/components/Player.ts`
- Create: `src-web/src/components/StatusBar.ts`
- Create: `src-web/src/components/Controls.ts`
- Modify: `src-web/src/App.ts`

- [ ] **Step 1: 创建状态栏组件**

```typescript
// src-web/src/components/StatusBar.ts
import { html, css, LitElement } from 'lit';

export class StatusBar extends LitElement {
  static properties = {
    status: { type: String },  // 'idle' | 'playing' | 'speaking' | 'listening'
    time: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      text-align: center;
    }
    .status {
      font-size: 14px;
      color: var(--color-amber, #F59E0B);
      margin-bottom: 8px;
    }
    .time {
      font-size: 48px;
      font-weight: 300;
      color: var(--color-white, #E5E5E5);
      font-variant-numeric: tabular-nums;
    }
    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      background: var(--color-amber, #F59E0B);
    }
    .status-indicator.idle {
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `;

  constructor() {
    super();
    this.status = 'idle';
    this.time = '--:--';
  }

  render() {
    return html`
      <div class="status">
        <span class="status-indicator ${this.status}"></span>
        ${this.getStatusText()}
      </div>
      <div class="time">${this.time}</div>
    `;
  }

  getStatusText() {
    switch (this.status) {
      case 'playing': return '正在播放';
      case 'speaking': return 'Claudio 播报中';
      case 'listening': return '正在聆听';
      default: return '待机';
    }
  }
}

customElements.define('status-bar', StatusBar);
```

- [ ] **Step 2: 创建播放器组件**

```typescript
// src-web/src/components/Player.ts
import { html, css, LitElement } from 'lit';

export class Player extends LitElement {
  static properties = {
    isPlaying: { type: Boolean },
    songName: { type: String },
    artist: { type: String },
    progress: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      background: var(--bg-secondary, #141418);
      border-radius: 12px;
      margin: 16px 0;
    }
    .waveform {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      margin-bottom: 12px;
    }
    .wave-bar {
      width: 4px;
      background: var(--color-amber, #F59E0B);
      border-radius: 2px;
      transition: height 0.1s ease;
    }
    .song-info {
      text-align: center;
    }
    .song-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-white, #E5E5E5);
    }
    .artist {
      font-size: 14px;
      color: #888;
      margin-top: 4px;
    }
    .progress-bar {
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin-top: 12px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--color-amber, #F59E0B);
      transition: width 0.3s ease;
    }
  `;

  constructor() {
    super();
    this.isPlaying = false;
    this.songName = '';
    this.artist = '';
    this.progress = 0;
  }

  render() {
    return html`
      <div class="waveform">
        ${this.renderWaveform()}
      </div>
      <div class="song-info">
        <div class="song-name">${this.songName || '未播放'}</div>
        <div class="artist">${this.artist || ''}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${this.progress}%"></div>
      </div>
    `;
  }

  renderWaveform() {
    const bars = 20;
    return Array.from({ length: bars }, (_, i) => {
      const height = this.isPlaying
        ? Math.random() * 30 + 10
        : 10;
      return html`<div class="wave-bar" style="height: ${height}px"></div>`;
    });
  }
}

customElements.define('player-component', Player);
```

- [ ] **Step 3: 创建控制组件**

```typescript
// src-web/src/components/Controls.ts
import { html, css, LitElement } from 'lit';

export class Controls extends LitElement {
  static properties = {
    canPlay: { type: Boolean },
    canPause: { type: Boolean },
  };

  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      padding: 24px;
    }
    .btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--bg-secondary, #141418);
      color: var(--color-white, #E5E5E5);
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: var(--color-amber, #F59E0B);
      color: #000;
    }
    .btn.primary {
      width: 64px;
      height: 64px;
      background: var(--color-amber, #F59E0B);
      color: #000;
    }
    .btn.primary:hover {
      transform: scale(1.05);
    }
    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.canPlay = true;
    this.canPause = false;
  }

  render() {
    return html`
      <button class="btn" ?disabled=${!this.canPlay} @click=${this.onPrev}>
        ◀◀
      </button>
      <button
        class="btn primary"
        @click=${this.onPlayPause}
      >
        ${this.canPause ? '⏸' : '▶'}
      </button>
      <button class="btn" ?disabled=${!this.canPlay} @click=${this.onNext}>
        ▶▶
      </button>
    `;
  }

  onPlayPause() {
    this.dispatchEvent(new CustomEvent('play-pause'));
  }

  onPrev() {
    this.dispatchEvent(new CustomEvent('prev'));
  }

  onNext() {
    this.dispatchEvent(new CustomEvent('next'));
  }
}

customElements.define('controls-component', Controls);
```

- [ ] **Step 4: 更新 App.ts**

```typescript
// src-web/src/App.ts
import { html, css, LitElement } from 'lit';
import './components/StatusBar';
import './components/Player';
import './components/Controls';

export class App extends LitElement {
  static properties = {
    status: { type: String },
    currentTime: { type: String },
    isPlaying: { type: Boolean },
    songName: { type: String },
    artist: { type: String },
    progress: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
      background: var(--bg-primary, #08080C);
      color: var(--color-white, #E5E5E5);
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-amber, #F59E0B);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .card {
      background: var(--bg-secondary, #141418);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .card-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 12px;
      color: #888;
    }
    .card-value {
      font-size: 14px;
      margin-top: 4px;
    }
    .broadcast-text {
      background: var(--bg-secondary, #141418);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      font-size: 14px;
      line-height: 1.6;
      min-height: 80px;
    }
  `;

  constructor() {
    super();
    this.status = 'idle';
    this.currentTime = '--:--';
    this.isPlaying = false;
    this.songName = '';
    this.artist = '';
    this.progress = 0;

    // 更新时钟
    setInterval(() => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }, 1000);
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <div class="logo">Claudio DJ</div>
        </div>

        <status-bar .status=${this.status} .time=${this.currentTime}></status-bar>

        <player-component
          .isPlaying=${this.isPlaying}
          .songName=${this.songName}
          .artist=${this.artist}
          .progress=${this.progress}
        ></player-component>

        <controls-component
          .canPlay=${!this.isPlaying}
          .canPause=${this.isPlaying}
          @play-pause=${this.handlePlayPause}
        ></controls-component>

        <div class="broadcast-text">
          ${this.songName ? `"${this.songName}" - ${this.artist}` : 'Claudio DJ 待机中...'}
        </div>
      </div>
    `;
  }

  handlePlayPause() {
    this.isPlaying = !this.isPlaying;
    this.status = this.isPlaying ? 'playing' : 'idle';
  }
}

customElements.define('app-root', App);
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 实现 PWA 前端界面"
```

---

## Phase 7: 集成与发布

### 任务 7.1: 系统通知集成

**Files:**
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 添加通知权限到 tauri.conf.json**

```json
{
  "plugins": {
    "notification": {
      "all": true
    }
  }
}
```

- [ ] **Step 2: 更新 main.rs 添加通知**

```rust
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // 发送启动通知
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Claudio DJ");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 添加系统通知支持"
```

---

### 任务 7.2: 构建与发布

**Files:**
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: 创建 .env.example**

```
# AI 模型
ANTHROPIC_API_KEY=your-anthropic-key
DASHSCOPE_API_KEY=your-aliyun-key

# TTS
FISH_AUDIO_API_KEY=your-fish-audio-key
AZURE_TTS_KEY=your-azure-key
AZURE_TTS_REGION=eastus

# 网易云音乐（需要运行 NeteaseCloudMusicApi）
NETEASE_API_URL=http://localhost:3000
```

- [ ] **Step 2: 创建 README.md**

```markdown
# Claudio DJ

个人 AI 电台 - 像真人 DJ 一样了解你、陪伴你。

## 功能特性

- 🎵 智能音乐播放（网易云音乐）
- 🎙️ 语音唤醒（"Hey Claudio"）
- ⏰ 定时广播（早/午/晚）
- 🔊 语音合成（TTS）
- 💾 本地记忆存储

## 快速开始

### 前置要求

- Node.js 18+
- Rust 1.70+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置

复制 `.env.example` 为 `.env` 并填入你的 API Key。

### 启动开发服务器

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 技术栈

- Tauri (跨平台桌面应用)
- Node.js (后端服务)
- Lit (Web Components 前端)
- Porcupine (语音唤醒)
- Fish Audio / Azure TTS (语音合成)
- NeteaseCloudMusicApi (音乐服务)

## 隐私说明

所有用户数据存储在本地 `~/.claudio/` 目录。
```

- [ ] **Step 2: 添加构建脚本**

Run: `npm install --save-dev @tauri-apps/cli@^2`
Expected: 安装成功

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 完成项目初始化和文档"
```

---

## 自检清单

- [ ] **Spec 覆盖**: 每个设计需求都有对应任务实现
- [ ] **占位符扫描**: 无 TBD/TODO/模糊描述
- [ ] **类型一致性**: 接口定义在任务间保持一致
- [ ] **可执行性**: 每步都有实际代码或明确命令

---

**Plan complete.** 文件已保存到 `docs/superpowers/plans/2026-04-24-claudio-dj-implementation-plan.md`

**下一步选项：**

**1. Subagent-Driven (推荐)** — 我调度子任务逐个执行，任务间审核，快迭代

**2. Inline Execution** — 在本会话中批量执行任务，带检查点

选择哪个方式？