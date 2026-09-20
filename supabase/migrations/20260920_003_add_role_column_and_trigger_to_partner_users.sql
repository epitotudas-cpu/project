-- Migration: Add role column compatibility to partner_users
ALTER TABLE partner_users ADD COLUMN IF NOT EXISTS role text;
UPDATE partner_users SET role = member_role WHERE role IS NULL;

-- Trigger to keep role and member_role in sync
CREATE OR REPLACE FUNCTION sync_partner_users_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_role IS NOT NULL AND (NEW.role IS NULL OR NEW.role <> NEW.member_role) THEN
    NEW.role := NEW.member_role;
  ELSIF NEW.role IS NOT NULL AND (NEW.member_role IS NULL OR NEW.member_role <> NEW.role) THEN
    NEW.member_role := NEW.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_partner_users_role ON partner_users;
CREATE TRIGGER trg_sync_partner_users_role
BEFORE INSERT OR UPDATE ON partner_users
FOR EACH ROW EXECUTE FUNCTION sync_partner_users_role();
