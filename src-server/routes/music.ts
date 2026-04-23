import { Router } from 'express';
import { findPlayableSong, searchSong } from '../music';

export const musicRouter = Router();

musicRouter.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Missing query parameter: q' });
    return;
  }

  const songs = await searchSong(q);
  res.json({ songs });
});

musicRouter.get('/play', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Missing query parameter: q' });
    return;
  }

  const song = await findPlayableSong(q);
  if (!song) {
    res.status(404).json({ error: 'No playable song found' });
    return;
  }

  res.json(song);
});
