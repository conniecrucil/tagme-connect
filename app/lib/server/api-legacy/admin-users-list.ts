import { getSupabaseClient } from './utils/supabase';

export default async (req: Request, context: any) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch all admin users
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users_auth0')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch admin users',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ users: data || [] }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Unexpected error in admin-users-list:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
