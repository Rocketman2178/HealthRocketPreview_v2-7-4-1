import { supabase } from '../lib/supabase/client';

async function queryUsers() {
  try {
    const userIds = [
      '33b449e7-a0a3-4b64-8cb8-6c5f2d4fdc65',
      '82ecf5cb-7b60-4ea7-9c3c-c31655cd1964'
    ];

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, burn_streak, longest_burn_streak, days_since_fp')
      .in('id', userIds);

    if (error) {
      console.error('Error querying users:', error);
      return;
    }

    console.log('User data:');
    console.table(data);
    
    return data;
  } catch (err) {
    console.error('Failed to query users:', err);
  }
}

// Export for use in other scripts or components
export { queryUsers };

// If running directly
if (import.meta.env.DEV) {
  queryUsers();
}