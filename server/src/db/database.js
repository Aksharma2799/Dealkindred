import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

const dbFile = process.env.DATABASE_FILE || './data/dealkindred.sqlite';
fs.mkdirSync(path.dirname(path.resolve(dbFile)), { recursive: true });
export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  terms TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Shopping',
  discount TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'claimed' CHECK(status IN ('claimed','redeemed')),
  claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  redeemed_at TEXT,
  UNIQUE(coupon_id, user_id)
);
CREATE TABLE IF NOT EXISTS affiliate_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  partner TEXT NOT NULL,
  description TEXT NOT NULL,
  offer TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS card_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank TEXT NOT NULL,
  card_name TEXT NOT NULL,
  merchant TEXT NOT NULL,
  offer TEXT NOT NULL,
  category TEXT NOT NULL
);
`);
