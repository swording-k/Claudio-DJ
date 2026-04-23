import cron, { ScheduledTask } from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

// Constants
const ROUTINES_FILE = path.join(process.cwd(), 'routines.md');
const TIMEZONE = 'Asia/Shanghai';

// Placeholder imports - will be implemented in separate modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function context_buildContext(_params: any): Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function ai_generateBroadcast(_ctx: any): Promise<any>;

// Interfaces
interface RoutineTask {
  time: string; // HH:MM format
  description: string;
  cronExpression: string; // minute hour * * *
}

interface ParsedRoutine {
  title: string;
  tasks: RoutineTask[];
}

// Global state
let scheduledTasks: ScheduledTask[] = [];

/**
 * Parse routines.md file and extract scheduled tasks
 */
function parseRoutinesFile(): ParsedRoutine | null {
  try {
    if (!fs.existsSync(ROUTINES_FILE)) {
      console.warn(`[Scheduler] routines.md not found at ${ROUTINES_FILE}`);
      return null;
    }

    const content = fs.readFileSync(ROUTINES_FILE, 'utf-8');
    const lines = content.split('\n');

    const result: ParsedRoutine = {
      title: '',
      tasks: [],
    };

    // Regex to match lines like: `- 07:00 早间播报：天气 + 日历 + 推荐音乐`
    const taskRegex = /^- (\d{2}):(\d{2})\s+(.+)$/;

    for (const line of lines) {
      const trimmed = line.trim();

      // First h1 heading is the title
      if (trimmed.startsWith('# ') && !result.title) {
        result.title = trimmed.slice(2).trim();
        continue;
      }

      // Parse task lines
      const match = trimmed.match(taskRegex);
      if (match) {
        const [, hour, minute, description] = match;
        const time = `${hour}:${minute}`;

        // Convert to cron expression: minute hour * * *
        const cronExpr = `${minute} ${hour} * * *`;

        result.tasks.push({
          time,
          description,
          cronExpression: cronExpr,
        });
      }
    }

    return result.tasks.length > 0 ? result : null;
  } catch (error) {
    console.error('[Scheduler] Error parsing routines.md:', error);
    return null;
  }
}

/**
 * Get current time in Shanghai timezone formatted as HH:MM
 */
function getCurrentShanghaiTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

/**
 * Find the task description for the current time
 */
function getCurrentTaskDescription(routines: ParsedRoutine): string | null {
  const currentTime = getCurrentShanghaiTime();

  for (const task of routines.tasks) {
    if (task.time === currentTime) {
      return task.description;
    }
  }

  return null;
}

/**
 * Execute a scheduled broadcast task
 */
async function executeTask(taskDescription: string): Promise<void> {
  try {
    console.log(`[Scheduler] Executing task: ${taskDescription}`);

    // Step 1: Build context
    const ctx = await context_buildContext({});

    // Step 2: Generate broadcast
    const result = await ai_generateBroadcast(ctx);

    console.log('[Scheduler] Broadcast generated successfully');
  } catch (error) {
    console.error('[Scheduler] Error executing task:', error);
  }
}

/**
 * Initialize the scheduler - starts all scheduled tasks from routines.md
 */
export function initScheduler(): void {
  console.log('[Scheduler] Initializing scheduler...');

  const routines = parseRoutinesFile();

  if (!routines) {
    console.log('[Scheduler] No routines found or failed to parse routines.md');
    return;
  }

  console.log(`[Scheduler] Loaded ${routines.tasks.length} scheduled tasks`);

  for (const task of routines.tasks) {
    const scheduledTask = cron.schedule(
      task.cronExpression,
      () => {
        executeTask(task.description);
      },
      {
        timezone: TIMEZONE,
      }
    );

    scheduledTasks.push(scheduledTask);
    console.log(`[Scheduler] Scheduled task: ${task.time} - ${task.description}`);
  }

  console.log('[Scheduler] Scheduler initialized successfully');
}

/**
 * Stop all scheduled tasks
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler...');

  for (const task of scheduledTasks) {
    task.stop();
  }

  scheduledTasks = [];
  console.log('[Scheduler] Scheduler stopped');
}