@echo off
rem Script to apply database migration for saved rates schema fix
rem This script fixes the column name mismatch issue

echo Applying database migration for saved rates schema fix...

rem Check if Supabase CLI is available
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not installed. Please install it first:
    echo    npm install -g supabase
    pause
    exit /b 1
)

rem Check if we're in the right directory
if not exist "supabase\config.toml" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

rem Apply the migration
echo 🔄 Running migration: 20241114130334_fix_saved_rates_schema.sql
supabase db reset

if %errorlevel% equ 0 (
    echo ✅ Migration applied successfully!
    echo.
    echo Note: If you have existing data, the migration will automatically:
    echo   - Rename base_currency ^>^> from_currency
    echo   - Rename target_currency ^>^> to_currency
    echo   - Add missing updated_at column
    echo   - Add missing RLS policies for UPDATE and DELETE
    echo   - Update indexes to use new column names
) else (
    echo ❌ Migration failed. Please check your database connection and try again.
)

pause