import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ContextParams {
  userInput?: string;
  envData?: {
    weather?: string;
    calendar?: string[];
  };
  systemPrompt?: string;
}

const CLAUDIO_DIR = path.join(os.homedir(), '.claudio');

function readFileIfExists(filePath: string): string | null {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim();
  }
  return null;
}

function readMemoryDirectory(): string[] {
  const memoryDir = path.join(CLAUDIO_DIR, 'memory');

  if (!fs.existsSync(memoryDir) || !fs.statSync(memoryDir).isDirectory()) {
    return [];
  }

  const files = fs.readdirSync(memoryDir).filter((file) => file.endsWith('.md'));

  if (files.length === 0) {
    return [];
  }

  const contents: string[] = [];

  for (const file of files) {
    const filePath = path.join(memoryDir, file);
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (content) {
      contents.push(content);
    }
  }

  return contents;
}

export function buildContext(params: ContextParams): string {
  const taste = readFileIfExists(path.join(CLAUDIO_DIR, 'taste.md'));
  const routines = readFileIfExists(path.join(CLAUDIO_DIR, 'routines.md'));
  const memoryContents = readMemoryDirectory();

  const parts: string[] = [];

  // 系统提示词
  parts.push('【系统提示词】');
  parts.push(params.systemPrompt ?? '');

  // 用户偏好
  parts.push('【用户偏好】');
  if (taste !== null) {
    parts.push(taste);
  } else {
    parts.push('用户尚未配置偏好');
  }

  // 日程安排
  parts.push('【日程安排】');
  if (routines !== null) {
    parts.push(routines);
  } else {
    parts.push('用户尚未配置日程');
  }

  // 当前天气
  parts.push('【当前天气】');
  parts.push(params.envData?.weather ?? '未知');

  // 今日日历
  parts.push('【今日日历】');
  const calendar = params.envData?.calendar ?? [];
  if (calendar.length > 0) {
    parts.push(calendar.join('\n'));
  } else {
    parts.push('无日程安排');
  }

  // 相关记忆
  parts.push('【相关记忆】');
  if (memoryContents.length > 0) {
    parts.push(memoryContents.join('\n\n'));
  } else {
    parts.push('');
  }

  // 用户输入
  parts.push('【用户输入】');
  parts.push(params.userInput ?? '');

  return parts.join('\n');
}
