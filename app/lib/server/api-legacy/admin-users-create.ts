import { getSupabaseClient } from './utils/supabase';

export default async (req: Request, context: any) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    }

    // Parse request body
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate email format (supports internationalized email addresses per RFC 6531)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Insert new admin user
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users_auth0')
      .insert([{ email }])
      .select('id, email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicate key error
        return new Response(JSON.stringify({ 
          error: 'This email is already registered as an admin user' 
        }), {
          status: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      console.error('Error creating admin user:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to create admin user',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ user: data }), {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Unexpected error in admin-users-create:', error);
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
