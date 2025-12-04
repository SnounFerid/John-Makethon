const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || './db/sensor_data.db';

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create sensor_data table
  db.run(
    `CREATE TABLE IF NOT EXISTS sensor_data (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      pressure REAL NOT NULL,
      flow REAL NOT NULL,
      leak_status BOOLEAN NOT NULL DEFAULT 0,
      valve_state TEXT NOT NULL DEFAULT 'CLOSED',
      temperature REAL DEFAULT NULL,
      conductivity REAL DEFAULT NULL,
      location TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating sensor_data table:', err);
      } else {
        console.log('sensor_data table ready');
      }
    }
  );

  // Attempt to add optional columns for existing databases (no-op if they already exist)
  db.run(`ALTER TABLE sensor_data ADD COLUMN temperature REAL DEFAULT NULL`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      // ignore duplicate column error, log others
    }
  });

  db.run(`ALTER TABLE sensor_data ADD COLUMN conductivity REAL DEFAULT NULL`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      // ignore duplicate column error
    }
  });

  db.run(`ALTER TABLE sensor_data ADD COLUMN location TEXT DEFAULT NULL`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      // ignore duplicate column error
    }
  });

  // Create model_training_logs table for tracking AI model training
  db.run(
    `CREATE TABLE IF NOT EXISTS model_training_logs (
      id TEXT PRIMARY KEY,
      training_date INTEGER NOT NULL,
      accuracy REAL,
      model_version TEXT,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating model_training_logs table:', err);
      } else {
        console.log('model_training_logs table ready');
      }
    }
  );

  // Create valve_control_logs table for tracking valve operations
  db.run(
    `CREATE TABLE IF NOT EXISTS valve_control_logs (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating valve_control_logs table:', err);
      } else {
        console.log('valve_control_logs table ready');
      }
    }
  );
}

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};
