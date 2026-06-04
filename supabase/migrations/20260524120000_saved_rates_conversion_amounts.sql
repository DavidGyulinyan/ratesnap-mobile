-- Add optional conversion amounts to saved_rates (amount user entered and result).

ALTER TABLE public.saved_rates
  ADD COLUMN IF NOT EXISTS from_amount NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS to_amount NUMERIC(18, 8);

COMMENT ON COLUMN public.saved_rates.from_amount IS 'Source amount the user converted when saving this rate';
COMMENT ON COLUMN public.saved_rates.to_amount IS 'Converted result amount when saving this rate';
