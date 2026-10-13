// src/database/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db;

function getDb() {
  if (!db) {
    const DB_PATH = process.env.DB_PATH || './database/ems.db';
    // ':memory:' is a valid better-sqlite3 in-memory path, no dir creation needed
    if (DB_PATH !== ':memory:') {
      const dbDir = path.dirname(path.resolve(DB_PATH));
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }
    db = new Database(DB_PATH === ':memory:' ? ':memory:' : path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
