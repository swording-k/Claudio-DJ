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

// 批量获取播放数据（用于歌单）
musicRouter.post('/batch', async (req, res) => {
  const { songs } = req.body;
  if (!Array.isArray(songs)) {
    res.status(400).json({ error: 'songs must be an array' });
    return;
  }

  const results = await Promise.all(
    songs.map(async (name) => {
      const song = await findPlayableSong(name);
      return song || null;
    })
  );

  // 过滤掉找不到的歌曲
  const validSongs = results.filter(Boolean);
  res.json({ songs: validSongs });
});
