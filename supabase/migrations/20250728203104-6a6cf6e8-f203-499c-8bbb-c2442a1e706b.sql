-- Enable real-time updates for the properties table
ALTER TABLE properties REPLICA IDENTITY FULL;

-- Add the properties table to the realtime publication
SELECT pg_create_logical_replication_slot('supabase_realtime_replication_slot', 'wal2json');

-- Check if the publication exists and create if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add properties table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE properties;