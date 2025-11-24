-- Rename calculation_expression to expression in math_calculator_history table
-- This migration handles the case where the table was created with the wrong column name

DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'math_calculator_history') THEN
        -- Check if calculation_expression column exists and expression column doesn't
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'math_calculator_history' AND column_name = 'calculation_expression')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'math_calculator_history' AND column_name = 'expression') THEN
            -- Rename the column
            ALTER TABLE public.math_calculator_history RENAME COLUMN calculation_expression TO expression;
        END IF;
    END IF;
END $$;