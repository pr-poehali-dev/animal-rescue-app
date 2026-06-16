CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    species VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    city VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    contact VARCHAR(200) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads (status);
