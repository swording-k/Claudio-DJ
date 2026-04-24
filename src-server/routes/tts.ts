import { Router } from 'express';
import { generateSpeech as fishGenerateSpeech } from '../tts.js';

export const ttsRouter = Router();

interface TTSRequest {
  text: string;
  voice_id?: string;
  speed?: number;
  emotion?: string;
}

ttsRouter.post('/', async (req, res) => {
  const { text, voice_id, speed = 1.0, emotion = 'calm' } = req.body as TTSRequest;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing text parameter' });
    return;
  }

  // 首先尝试 MiniMax TTS
  const minimaxResult = await tryMiniMaxTTS(text, speed, emotion);
  if (minimaxResult) {
    res.json(minimaxResult);
    return;
  }

  // MiniMax 失败，降级到 Fish Audio
  console.log('[TTS] MiniMax failed, falling back to Fish Audio');
  try {
    const buffer = await fishGenerateSpeech({ text, speed });
    const base64 = buffer.toString('base64');
    res.json({
      audio: base64,
      format: 'mp3',
      provider: 'fish',
    });
  } catch (err) {
    console.error('[TTS] Fish Audio also failed:', err);
    res.status(500).json({ error: 'All TTS providers failed' });
  }
});

async function tryMiniMaxTTS(text: string, speed: number, emotion: string): Promise<{ audio: string; format: string } | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'speech-02-hd',
        text: text.substring(0, 5000),
        voice_setting: {
          voice_id: 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85',
          speed,
          emotion,
        },
        audio_setting: {
          format: 'mp3',
          bitrate: 32000,
        },
      }),
    });

    if (!response.ok) {
      console.error('[TTS] MiniMax API Error:', response.status);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      audio: base64,
      format: 'mp3',
    };
  } catch (err) {
    console.error('[TTS] MiniMax request failed:', err);
    return null;
  }
}