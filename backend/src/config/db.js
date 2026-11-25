const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'internlog.db');

let dbInstance = null;

function saveDatabase() {
  if (!dbInstance) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDB() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Create USERS table aligned with SRS Section 5.1 ERD & Increment 1/2 Auth & Profile specs
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      profile_picture_url TEXT,
      student_id_number TEXT,
      contact_number TEXT,
      academic_program TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      last_login_at TEXT
    );
  `);

  // Non-destructive migration for existing Increment 1 SQLite databases
  const userColsStmt = dbInstance.prepare('PRAGMA table_info(users);');
  const existingUserCols = new Set();
  while (userColsStmt.step()) {
    const col = userColsStmt.getAsObject();
    existingUserCols.add(col.name);
  }
  userColsStmt.free();

  const profileMigrations = [
    ['student_id_number', 'TEXT'],
    ['contact_number', 'TEXT'],
    ['academic_program', 'TEXT'],
    ['updated_at', 'TEXT']
  ];
  for (const [colName, colType] of profileMigrations) {
    if (!existingUserCols.has(colName)) {
      dbInstance.run(`ALTER TABLE users ADD COLUMN ${colName} ${colType};`);
    }
  }

  // Create OJT_PROFILES table aligned with SRS Section 3.1 (FR-1.4, FR-1.5) & Section 5.1 ERD
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS ojt_profiles (
      profile_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      required_hours REAL NOT NULL DEFAULT 300,
      rendered_hours REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      working_days TEXT NOT NULL DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
      estimated_completion_date TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `);

  // Create REVOKED_TOKENS table to properly invalidate JWT sessions on logout
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token TEXT PRIMARY KEY,
      revoked_at TEXT NOT NULL
    );
  `);

  // Create PASSWORD_RESET_TOKENS table for expiring, single-use password recovery (Increment 2)
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      reset_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `);

  // Seed default test student account idempotently for out-of-the-box evaluation
  const demoCheckStmt = dbInstance.prepare(
    'SELECT user_id FROM users WHERE LOWER(email) = ?'
  );
  demoCheckStmt.bind(['student.demo@internlog.edu.ph']);
  const demoExists = demoCheckStmt.step();
  demoCheckStmt.free();

  if (!demoExists) {
    const demoUserId = crypto.randomUUID();
    const demoHash = bcrypt.hashSync('InternLog2026!', 10);
    const nowIso = new Date().toISOString();
    const demoAvatar =
      'https://ui-avatars.com/api/?name=Vinzent+Lariosa&background=0D9488&color=fff';

    dbInstance.run(
      `INSERT INTO users (
         user_id, email, full_name, password_hash, role, profile_picture_url,
         student_id_number, contact_number, academic_program, created_at, updated_at, last_login_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demoUserId,
        'student.demo@internlog.edu.ph',
        'Vinzent Emmanuel M. Lariosa',
        demoHash,
        'student',
        demoAvatar,
        '22-4518-892',
        '+63 917 555 0192',
        'BS in Information Technology',
        nowIso,
        nowIso,
        nowIso
      ]
    );

    dbInstance.run(
      `INSERT INTO ojt_profiles (
         profile_id, user_id, company_name, required_hours, rendered_hours,
         start_date, working_days, estimated_completion_date, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        demoUserId,
        'Accenture Technology Solutions PH',
        486,
        120,
        '2026-11-03',
        'Monday,Tuesday,Wednesday,Thursday,Friday',
        '2027-02-09',
        nowIso
      ]
    );
  }

  saveDatabase();
  return dbInstance;
}

function queryOne(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function queryAll(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function execute(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDatabase();
}

module.exports = {
  initDB,
  queryOne,
  queryAll,
  execute,
  DB_PATH
};
