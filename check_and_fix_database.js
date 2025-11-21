// Quick script to check and fix the database schema for rate alerts
// Run this in your Supabase SQL editor or database console

const checkAndFixDatabase = async () => {
  console.log('🔍 Checking rate_alerts table schema...');

  // Check if notified column exists
  const columnCheck = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'rate_alerts')
    .eq('column_name', 'notified');

  if (columnCheck.data && columnCheck.data.length > 0) {
    console.log('✅ notified column already exists');
  } else {
    console.log('❌ notified column missing, adding it...');

    // Add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE rate_alerts
        ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

        UPDATE rate_alerts
        SET notified = false
        WHERE notified IS NULL;
      `
    });

    if (error) {
      console.error('❌ Error adding notified column:', error);
    } else {
      console.log('✅ notified column added successfully');
    }
  }

  // Verify the fix
  const verifyCheck = await supabase
    .from('rate_alerts')
    .select('id, notified')
    .limit(1);

  if (verifyCheck.data) {
    console.log('✅ Database schema is ready for notified alerts');
  } else {
    console.error('❌ Database schema check failed');
  }
};

// For manual execution in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  checkAndFixDatabase();
} else {
  // Node.js environment
  console.log('📋 Manual database fix SQL:');
  console.log(`
-- Run this in your Supabase SQL editor:
ALTER TABLE rate_alerts ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;
UPDATE rate_alerts SET notified = false WHERE notified IS NULL;

-- Verify:
SELECT id, from_currency, to_currency, target_rate, condition, is_active, notified
FROM rate_alerts LIMIT 5;
  `);
}