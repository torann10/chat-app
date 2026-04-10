import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dbPath = join(process.cwd(), 'chat.db');
const db = new DatabaseSync(dbPath);

export function initDb() {
  const schemaPath = join(process.cwd(), './src/database/schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  
  db.exec(schema);
  
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  
  console.log('SQLite database initialized (WAL mode active)');
}

export default db;