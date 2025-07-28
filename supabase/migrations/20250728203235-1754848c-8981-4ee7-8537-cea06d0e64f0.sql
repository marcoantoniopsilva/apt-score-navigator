-- Enable real-time updates for the properties table
ALTER TABLE properties REPLICA IDENTITY FULL;

-- Add properties table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE properties;