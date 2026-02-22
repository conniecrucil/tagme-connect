import { getSupabaseClient } from './utils/supabase';

export default async (req: Request, context: any) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Get email from query parameters
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ 
        authorized: false, 
        error: 'Email parameter is required' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if email exists in admin_users_auth0 table
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users_auth0')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error) {
      // User not found or other error
      console.error('Admin authorization check error:', error);
      return new Response(JSON.stringify({ 
        authorized: false, 
        email: email 
      }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // User is authorized
    return new Response(JSON.stringify({ 
      authorized: true, 
      email: email 
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Unexpected error in check-admin-authorization:', error);
    return new Response(JSON.stringify({ 
      authorized: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
