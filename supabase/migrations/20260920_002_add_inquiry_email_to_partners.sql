-- Migration: Add inquiry_email column to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS inquiry_email text;
