const NCM_API = 'http://localhost:3000';

export interface NeteaseSong {
  id: number;
  name: string;
  artists: { name: string }[];
  album: { name: string };
}

export interface PlayableSong {
  name: string;
  artist: string;
  album: string;
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
  const url = `${NCM_API}/song/url/v1?id=${songId}&level=standard`;
  const data = await fetchJson<SongUrlResponse>(url);
  return data?.data?.[0]?.url ?? null;
}

export async function getLyric(songId: number): Promise<string | null> {
  const url = `${NCM_API}/lyric?id=${songId}`;
  const data = await fetchJson<LyricResponse>(url);
  return data?.lrc?.lyric ?? null;
}

export async function findPlayableSong(keyword: string): Promise<PlayableSong | null> {
  const songs = await searchSong(keyword);
  if (songs.length === 0) return null;

  const song = songs[0];
  const [url, lyric] = await Promise.all([
    getSongUrl(song.id),
    getLyric(song.id),
  ]);

  if (!url) return null;

  return {
    name: song.name,
    artist: song.artists.map((a) => a.name).join(', '),
    album: song.album.name,
    url,
    lyric: lyric ?? undefined,
  };
}
