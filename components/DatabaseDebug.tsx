import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase-safe';
import { useAuth } from '@/contexts/AuthContext';

interface DebugResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  data?: any;
}

export default function DatabaseDebug() {
  const { user } = useAuth();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (step: string, status: DebugResult['status'], message: string, data?: any) => {
    setResults(prev => [...prev, { step, status, message, data }]);
  };

  const testDatabaseConnection = async () => {
    setIsTesting(true);
    setResults([]);

    try {
      // Step 1: Test Supabase client initialization
      addResult('1. Supabase Client', 'info', 'Testing client initialization...');
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        addResult('1. Supabase Client', 'error', '❌ Failed to initialize Supabase client');
        return;
      }
      addResult('1. Supabase Client', 'success', '✅ Supabase client initialized successfully');

      // Step 2: Test authentication status
      addResult('2. Authentication', 'info', 'Checking authentication status...');
      if (!user) {
        addResult('2. Authentication', 'warning', '⚠️ No user logged in - this may limit data access');
      } else {
        addResult('2. Authentication', 'success', `✅ User logged in: ${user.email} (${user.id})`);
      }

      // Step 3: Test table existence
      addResult('3. Table Check', 'info', 'Testing if saved_rates table exists...');
      try {
        const { data, error, count } = await supabase
          .from('saved_rates')
          .select('*', { count: 'exact', head: true });

        if (error) {
          addResult('3. Table Check', 'error', `❌ Table access error: ${error.message}`);
          
          if (error.message.includes('relation "public.saved_rates" does not exist')) {
            addResult('3. Table Check', 'error', '❌ Table does not exist - please create it first');
          } else if (error.message.includes('permission denied')) {
            addResult('3. Table Check', 'error', '❌ Permission denied - check RLS policies');
          }
          return;
        }
        
        addResult('3. Table Check', 'success', `✅ Table exists, total records: ${count || 0}`);
      } catch (tableError: any) {
        addResult('3. Table Check', 'error', `❌ Table test failed: ${tableError.message}`);
        return;
      }

      // Step 4: Test RLS policies (if user is logged in)
      if (user) {
        addResult('4. RLS Policies', 'info', 'Testing Row Level Security policies...');
        try {
          const { data, error } = await supabase
            .from('saved_rates')
            .select('*')
            .limit(1);

          if (error) {
            addResult('4. RLS Policies', 'error', `❌ RLS policy error: ${error.message}`);
          } else {
            addResult('4. RLS Policies', 'success', '✅ RLS policies allow reading');
          }
        } catch (rlsError: any) {
          addResult('4. RLS Policies', 'error', `❌ RLS test failed: ${rlsError.message}`);
        }
      }

      // Step 5: Try to fetch actual data
      addResult('5. Data Fetch', 'info', 'Attempting to fetch data...');
      try {
        let query = supabase.from('saved_rates').select('*');
        
        // If user is logged in, fetch their data
        if (user) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query.limit(10);

        if (error) {
          addResult('5. Data Fetch', 'error', `❌ Data fetch error: ${error.message}`);
        } else {
          addResult('5. Data Fetch', 'success', `✅ Data fetched successfully: ${data?.length || 0} records`);
          if (data && data.length > 0) {
            addResult('5. Data Fetch', 'info', '📊 Sample data:', data[0]);
          } else {
            addResult('5. Data Fetch', 'warning', '⚠️ No data found in table');
          }
        }
      } catch (dataError: any) {
        addResult('5. Data Fetch', 'error', `❌ Data fetch failed: ${dataError.message}`);
      }

      // Step 6: Test inserting test data (only if logged in)
      if (user) {
        addResult('6. Insert Test', 'info', 'Testing data insertion...');
        try {
          const testData = {
            user_id: user.id,
            from_currency: 'USD',
            to_currency: 'EUR',
            rate: 0.85
          };

          const { data, error } = await supabase
            .from('saved_rates')
            .insert([testData])
            .select();

          if (error) {
            addResult('6. Insert Test', 'error', `❌ Insert failed: ${error.message}`);
          } else {
            addResult('6. Insert Test', 'success', '✅ Test data inserted successfully');
            
            // Clean up test data
            if (data && data[0]) {
              await supabase.from('saved_rates').delete().eq('id', data[0].id);
              addResult('6. Insert Test', 'info', '🧹 Test data cleaned up');
            }
          }
        } catch (insertError: any) {
          addResult('6. Insert Test', 'error', `❌ Insert test failed: ${insertError.message}`);
        }
      }

    } catch (error: any) {
      addResult('General', 'error', `❌ Unexpected error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status: DebugResult['status']) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Database Debug Tool</Text>
      
      <TouchableOpacity 
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={testDatabaseConnection}
        disabled={isTesting}
      >
        <Text style={styles.testButtonText}>
          {isTesting ? '🔄 Testing...' : '🧪 Run Database Test'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={[styles.resultItem, { borderLeftColor: getStatusColor(result.status) }]}>
            <Text style={[styles.resultStep, { color: getStatusColor(result.status) }]}>
              {result.step}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.data && (
              <Text style={styles.resultData}>
                {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.clearButton}
        onPress={() => setResults([])}
      >
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  testButton: {
    backgroundColor: '#7c3aed',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  resultStep: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  resultData: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  clearButton: {
    backgroundColor: '#6b7280',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});