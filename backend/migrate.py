"""
migrate.py — Run this ONCE to add device_id columns to existing SQLite DB
Usage: python migrate.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "health_tracker.db")

def migrate():
    if not os.path.exists(DB_PATH):
        print("No existing DB found — fresh start, no migration needed.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    # Tables that need device_id column added
    migrations = [
        ("activities",  "ALTER TABLE activities  ADD COLUMN device_id TEXT DEFAULT 'default'"),
        ("nutrition",   "ALTER TABLE nutrition   ADD COLUMN device_id TEXT DEFAULT 'default'"),
        ("sleep_logs",  "ALTER TABLE sleep_logs  ADD COLUMN device_id TEXT DEFAULT 'default'"),
        ("water_logs",  "ALTER TABLE water_logs  ADD COLUMN device_id TEXT DEFAULT 'default'"),
        ("goals",       "ALTER TABLE goals       ADD COLUMN device_id TEXT DEFAULT 'default'"),
    ]

    for table, sql in migrations:
        # Check if column already exists
        cur.execute(f"PRAGMA table_info({table})")
        cols = [row[1] for row in cur.fetchall()]
        if "device_id" not in cols:
            cur.execute(sql)
            print(f"✅ Added device_id to {table}")
        else:
            print(f"⏭️  {table} already has device_id — skipped")

    # Create new tables if they don't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id  TEXT UNIQUE NOT NULL,
            name       TEXT DEFAULT 'User',
            age        INTEGER DEFAULT 25,
            weight     REAL DEFAULT 70.0,
            height     REAL DEFAULT 170.0,
            language   TEXT DEFAULT 'en',
            avatar     TEXT DEFAULT '👤',
            points     INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ user_profiles table ready")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS medications (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id  TEXT NOT NULL,
            name       TEXT NOT NULL,
            dosage     TEXT DEFAULT '',
            frequency  TEXT DEFAULT 'daily',
            time       TEXT DEFAULT '08:00',
            notes      TEXT DEFAULT '',
            active     INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ medications table ready")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS med_logs (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id     TEXT NOT NULL,
            medication_id INTEGER NOT NULL,
            taken         INTEGER DEFAULT 1,
            date          TEXT NOT NULL,
            time_taken    TEXT DEFAULT '',
            notes         TEXT DEFAULT '',
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ med_logs table ready")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS badges (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id  TEXT NOT NULL,
            badge_id   TEXT NOT NULL,
            earned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ badges table ready")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id  TEXT NOT NULL,
            type       TEXT NOT NULL,
            value      TEXT NOT NULL,
            unit       TEXT DEFAULT '',
            notes      TEXT DEFAULT '',
            date       TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ health_records table ready")

    # Insert default user_profile if not exists
    cur.execute("SELECT COUNT(*) FROM user_profiles WHERE device_id='default'")
    if cur.fetchone()[0] == 0:
        cur.execute("INSERT INTO user_profiles (device_id, name) VALUES ('default', 'User')")
        print("✅ Default user profile created")

    conn.commit()
    conn.close()
    print("\n🎉 Migration complete! Now restart uvicorn.")

if __name__ == "__main__":
    migrate()
