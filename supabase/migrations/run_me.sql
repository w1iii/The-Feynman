-- Run this in Supabase SQL Editor
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
