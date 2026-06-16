CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ads(id),
    user_a VARCHAR(120) NOT NULL,
    user_b VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender VARCHAR(120) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(120) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages (chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_created ON community_messages (created_at DESC);
