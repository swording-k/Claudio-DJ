import { Router } from 'express';
import { musicRouter } from './routes/music';

export const router = Router();

router.get('/status', (_req, res) => {
  res.json({ status: 'running', version: '0.1.0' });
});

router.use('/music', musicRouter);