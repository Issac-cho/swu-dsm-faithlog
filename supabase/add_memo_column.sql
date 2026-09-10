-- Add memo column to checklist_records
ALTER TABLE public.checklist_records ADD COLUMN IF NOT EXISTS memo text;
