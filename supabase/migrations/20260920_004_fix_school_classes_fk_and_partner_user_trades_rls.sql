-- Migration: Fix school_classes foreign key constraint issue and update partner_user_trades RLS policies

-- 1. Drop the composite foreign key constraint on school_classes to prevent hard FK failures when creating classes
ALTER TABLE public.school_classes DROP CONSTRAINT IF EXISTS fk_school_classes_trade;

-- 2. Update RLS policies on partner_user_trades so instructors and school staff can insert/manage their trades
DROP POLICY IF EXISTS "Manage partner_user_trades" ON public.partner_user_trades;

CREATE POLICY "Manage partner_user_trades" ON public.partner_user_trades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partner_users pu 
      WHERE pu.partner_id = partner_user_trades.partner_id 
        AND pu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partner_users pu 
      WHERE pu.partner_id = partner_user_trades.partner_id 
        AND pu.user_id = auth.uid()
    )
  );
