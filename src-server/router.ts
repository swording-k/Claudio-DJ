import { Router } from 'express';
import { musicRouter } from './routes/music';
import { chatRouter } from './routes/chat.js';
import { ttsRouter } from './routes/tts.js';

export const router = Router();

router.get('/status', (_req, res) => {
  res.json({ status: 'running', version: '0.1.0' });
});

router.use('/music', musicRouter);
router.use('/chat', chatRouter);
router.use('/tts', ttsRouter);