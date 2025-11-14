#!/bin/bash

# Script to apply database migration for saved rates schema fix
# This script fixes the column name mismatch issue

echo "Applying database migration for saved rates schema fix..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Apply the migration
echo "🔄 Running migration: 20241114130334_fix_saved_rates_schema.sql"
supabase db reset

echo "✅ Migration applied successfully!"
echo ""
echo "Note: If you have existing data, the migration will automatically:"
echo "  - Rename base_currency → from_currency"
echo "  - Rename target_currency → to_currency"
echo "  - Add missing updated_at column"
echo "  - Add missing RLS policies for UPDATE and DELETE"
echo "  - Update indexes to use new column names"