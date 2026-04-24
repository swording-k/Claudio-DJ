const NCM_API = 'http://localhost:3000';

export interface NeteaseSong {
  id: number;
  name: string;
  ar: { name: string }[];
  al: { name: string; picUrl: string };
}

export interface PlayableSong {
  name: string;
  artist: string;
  album: string;
  albumPic: string;
  url: string;
  lyric?: string;
}

interface SearchResponse {
  result: {
    songs: NeteaseSong[];
  };
}

interface SongUrlResponse {
  data: { url: string }[];
}

interface LyricResponse {
  lrc?: { lyric: string };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function searchSong(keyword: string): Promise<NeteaseSong[]> {
  const url = `${NCM_API}/cloudsearch?keywords=${encodeURIComponent(keyword)}`;
  const data = await fetchJson<SearchResponse>(url);
  return data?.result?.songs ?? [];
}

export async function getSongUrl(songId: number): Promise<string | null> {
  const levels = ['exhigh', 'higher', 'standard'];
  for (const level of levels) {
    const url = `${NCM_API}/song/url/v1?id=${songId}&level=${level}`;
    const data = await fetchJson<SongUrlResponse>(url);
    if (data?.data?.[0]?.url) {
      console.log(`[Music] Song ${songId}: level=${level} success`);
      return data.data[0].url;
    }
  }
  console.log(`[Music] Song ${songId}: no playable URL found`);
  return null;
}

export async function getLyric(songId: number): Promise<string | null> {
  const url = `${NCM_API}/lyric?id=${songId}`;
  const data = await fetchJson<LyricResponse>(url);
  return data?.lrc?.lyric ?? null;
}

export async function findPlayableSong(keyword: string): Promise<PlayableSong | null> {
  const songs = await searchSong(keyword);
  if (songs.length === 0) return null;

  // Try multiple songs until we find one with a playable URL
  for (const song of songs) {
    const url = await getSongUrl(song.id);
    if (!url) continue;

    const lyric = await getLyric(song.id);

    return {
      name: song.name,
      artist: song.ar.map((a) => a.name).join(', '),
      album: song.al.name,
      albumPic: song.al.picUrl || '',
      url,
      lyric: lyric ?? undefined,
    };
  }

  return null;
}
