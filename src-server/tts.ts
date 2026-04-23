import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';
const CACHE_DIR = path.join(os.homedir(), '.claudio', 'cache', 'tts');

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
}

function getCacheDir(): string {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return CACHE_DIR;
}

function getCacheKey(text: string, speed: number): string {
  const hash = crypto.createHash('sha256').update(text).digest('base64');
  const shortHash = hash.substring(0, 32);
  return `${shortHash}_${speed}.mp3`;
}

function getCachePath(text: string, speed: number): string {
  const cacheKey = getCacheKey(text, speed);
  return path.join(getCacheDir(), cacheKey);
}

function getApiKey(): string {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY environment variable is not set');
  }
  return apiKey;
}

export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const text = options.text;
  const voice = options.voice ?? '';
  const speed = options.speed ?? 1.0;

  // Check cache first
  const cachePath = getCachePath(text, speed);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }

  // Fetch from Fish Audio API
  const apiKey = getApiKey();

  const response = await fetch(FISH_AUDIO_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice,
      speed,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write to cache
  fs.writeFileSync(cachePath, buffer);

  return buffer;
}