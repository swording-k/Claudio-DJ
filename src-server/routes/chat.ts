import { Router } from 'express';
import { generateWithModel } from '../ai/index.js';
import { buildContext } from '../context.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { model = 'minimax', message } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing or invalid message' });
    return;
  }

  try {
    const context = buildContext({ userInput: message });
    const response = await generateWithModel(model, context);
    res.json(response);
  } catch (err) {
    console.error('[Chat] Error:', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});
