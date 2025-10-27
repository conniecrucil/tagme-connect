import type { Context } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';

export default async (req: Request, context: Context) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    }

    // Parse request body
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'User ID is required' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = getSupabaseClient();

    // First, check how many admin users exist
    const { count, error: countError } = await supabase
      .from('admin_users_auth0')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting admin users:', countError);
      return new Response(JSON.stringify({ 
        error: 'Failed to check admin users',
        details: countError.message
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Prevent deletion if this is the last admin user
    if (count && count <= 1) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete the last admin user' 
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Delete the admin user
    const { error: deleteError } = await supabase
      .from('admin_users_auth0')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting admin user:', deleteError);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete admin user',
        details: deleteError.message
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Admin user deleted successfully'
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Unexpected error in admin-users-delete:', error);
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
