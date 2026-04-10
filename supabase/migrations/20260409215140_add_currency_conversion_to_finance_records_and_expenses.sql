ALTER TABLE public.finance_records
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS',
ADD COLUMN IF NOT EXISTS amount_ars NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS exchange_rate_date DATE,
ADD COLUMN IF NOT EXISTS exchange_source TEXT;

ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS amount_ars NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS exchange_rate_date DATE,
ADD COLUMN IF NOT EXISTS exchange_source TEXT;

UPDATE public.finance_records
SET
  currency = COALESCE(currency, 'ARS'),
  amount_ars = CASE
    WHEN COALESCE(currency, 'ARS') = 'ARS' THEN amount
    ELSE amount_ars
  END
WHERE currency IS NULL
   OR amount_ars IS NULL;

UPDATE public.expenses
SET amount_ars = CASE
  WHEN currency = 'ARS' THEN amount
  ELSE amount_ars
END
WHERE amount_ars IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'finance_records_currency_check'
  ) THEN
    ALTER TABLE public.finance_records
      ADD CONSTRAINT finance_records_currency_check
      CHECK (currency IN ('ARS', 'USD'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_currency_check'
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_currency_check
      CHECK (currency IN ('ARS', 'USD'));
  END IF;
END $$;
