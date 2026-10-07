CREATE TABLE users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX sessions_user ON sessions(user_id);
--> statement-breakpoint
CREATE TABLE user_state (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 data TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE login_attempts (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
