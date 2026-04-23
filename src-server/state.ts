import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.claudio');
const DB_PATH = path.join(DB_DIR, 'state.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    song_name TEXT NOT NULL,
    artist TEXT NOT NULL
  );
`);

export default db;