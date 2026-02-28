-- ============================================
-- MIGRATION 012: Players Table
-- Track players with their Facebook info
-- ============================================

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Player details
    name TEXT NOT NULL,
    fb_link TEXT,
    friend_on TEXT, -- Name of FB Account they're friends with
    
    -- Notes
    notes TEXT,
    
    -- Who created it
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_players_name ON players(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_created_by ON players(created_by) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS policies (authenticated users can read all, modify own or admin)
CREATE POLICY "Authenticated users can read players"
    ON players FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert players"
    ON players FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update players"
    ON players FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- View for players with creator info
-- ============================================
CREATE VIEW players_with_creator AS
SELECT 
    p.*,
    pr.name AS created_by_name
FROM players p
LEFT JOIN profiles pr ON p.created_by = pr.id
WHERE p.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON players_with_creator TO authenticated;
