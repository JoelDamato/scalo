ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'salary';

ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS receipt_path TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Finance users can view expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance users can upload expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance users can update expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance users can delete expense receipts" ON storage.objects;

CREATE POLICY "Finance users can view expense receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND public.can_access_finance(auth.uid())
);

CREATE POLICY "Finance users can upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND public.can_access_finance(auth.uid())
);

CREATE POLICY "Finance users can update expense receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND public.can_access_finance(auth.uid())
);

CREATE POLICY "Finance users can delete expense receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND public.can_access_finance(auth.uid())
);
