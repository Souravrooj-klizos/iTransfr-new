-- Ownership Validation Migration
-- Adds database-level validation triggers for 100% ownership enforcement
-- Compatible with existing beneficial_owners table schema (uses "clientId" column)

-- Note: The beneficial_owners table already has ownership_percentage constraints
-- The existing constraint is: CHECK (ownership_percentage > 0 AND ownership_percentage <= 100)

-- Create a function to validate total ownership across all owners for a client
CREATE OR REPLACE FUNCTION validate_client_ownership_total()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage numeric(5,2);
    client_id_val uuid;
BEGIN
    -- Get the clientId from the new/updated record (note: camelCase column name)
    client_id_val := COALESCE(NEW."clientId", OLD."clientId");

    -- Calculate total ownership percentage for this client
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_percentage
    FROM beneficial_owners
    WHERE "clientId" = client_id_val;

    -- If total exceeds 100%, prevent the operation
    IF total_percentage > 100 THEN
        RAISE EXCEPTION 'Total ownership percentage for client cannot exceed 100%%. Current total: %%%', total_percentage;
    END IF;

    -- Allow the operation
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate ownership on insert/update/delete
DROP TRIGGER IF EXISTS validate_client_ownership_trigger ON beneficial_owners;
CREATE TRIGGER validate_client_ownership_trigger
    AFTER INSERT OR UPDATE OR DELETE ON beneficial_owners
    FOR EACH ROW EXECUTE FUNCTION validate_client_ownership_total();

-- Add helpful indexes for ownership queries
CREATE INDEX IF NOT EXISTS idx_beneficial_owners_clientId ON beneficial_owners("clientId");
CREATE INDEX IF NOT EXISTS idx_beneficial_owners_percentage ON beneficial_owners(ownership_percentage);

-- Add a computed column to show total ownership per client (optional, for queries)
-- This can be used to quickly check if a client has complete ownership
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS ownership_total numeric(5,2) DEFAULT 0;

-- Function to update ownership total
CREATE OR REPLACE FUNCTION update_client_ownership_total(client_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE client_profiles
    SET ownership_total = (
        SELECT COALESCE(SUM(ownership_percentage), 0)
        FROM beneficial_owners
        WHERE "clientId" = client_uuid
    )
    WHERE id = client_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update existing ownership totals
UPDATE client_profiles
SET ownership_total = 0
WHERE ownership_total IS NULL;

-- Update all existing clients with their current ownership totals
DO $$
DECLARE
    client_record RECORD;
BEGIN
    FOR client_record IN SELECT id FROM client_profiles LOOP
        PERFORM update_client_ownership_total(client_record.id);
    END LOOP;
END $$;

-- Create a view for easy ownership validation queries
CREATE OR REPLACE VIEW client_ownership_summary AS
SELECT
    cp.id as client_id,
    cp.company_name,
    cp.first_name || ' ' || cp.last_name as client_name,
    COUNT(bo.id) as owner_count,
    SUM(bo.ownership_percentage) as total_ownership,
    CASE
        WHEN SUM(bo.ownership_percentage) = 100 THEN 'COMPLETE'
        WHEN SUM(bo.ownership_percentage) > 100 THEN 'OVER_ALLOCATED'
        WHEN SUM(bo.ownership_percentage) < 100 THEN 'UNDER_ALLOCATED'
        ELSE 'NO_OWNERS'
    END as ownership_status
FROM client_profiles cp
LEFT JOIN beneficial_owners bo ON cp.id = bo."clientId"
GROUP BY cp.id, cp.company_name, cp.first_name, cp.last_name;

-- Grant permissions (adjust based on your RLS setup)
-- GRANT SELECT ON client_ownership_summary TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN beneficial_owners.ownership_percentage IS 'Ownership percentage (0-100). Total across all owners for a client must equal exactly 100%.';
COMMENT ON COLUMN client_profiles.ownership_total IS 'Computed total ownership percentage for this client (cached for performance).';
COMMENT ON VIEW client_ownership_summary IS 'Summary view showing ownership status for all clients. Use this to identify clients with incomplete ownership.';

-- Test the constraints work (this should work)
-- INSERT INTO beneficial_owners ("clientId", ownership_percentage) VALUES ('test-uuid', 50);

-- Test the constraints fail (this should fail)
-- INSERT INTO beneficial_owners ("clientId", ownership_percentage) VALUES ('test-uuid', 60); -- Should fail as total would be 110%
