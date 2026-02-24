import { getSupabaseClient } from './utils/supabase';

export default async (req: Request, context: any) => {
  try {
    const requestUrl = new URL(req.url);
    console.log('[check-admin-authorization] Incoming request', {
      method: req.method,
      path: requestUrl.pathname,
      search: requestUrl.search,
    });

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
    const email = requestUrl.searchParams.get('email');

    if (!email) {
      console.warn('[check-admin-authorization] Missing email query parameter');
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
      console.error('[check-admin-authorization] Supabase lookup error or no row:', {
        email,
        error,
      });
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
    console.log('[check-admin-authorization] Authorized admin user found', {
      email,
      id: data?.id,
    });
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
    console.error('[check-admin-authorization] Unexpected error:', error);
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
