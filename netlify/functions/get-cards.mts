import type { Context } from '@netlify/functions';
import { listCards, type CardsListResponse } from './utils/supabase';

export default async (req: Request, context: Context) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    }

    try {
      // Parse query parameters
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const customer_email = url.searchParams.get('customer_email') || undefined;
      const status = url.searchParams.get('status') as 'success' | 'error' | 'pending' | null;
      const date_from = url.searchParams.get('date_from') || undefined;
      const date_to = url.searchParams.get('date_to') || undefined;

      // Validate parameters
      if (limit < 1 || limit > 100) {
        return new Response(JSON.stringify({ error: 'Limit must be between 1 and 100' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      if (offset < 0) {
        return new Response(JSON.stringify({ error: 'Offset must be non-negative' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      if (status && !['success', 'error', 'pending'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Status must be success, error, or pending' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // Validate date format if provided
      if (date_from && isNaN(Date.parse(date_from))) {
        return new Response(JSON.stringify({ error: 'Invalid date_from format' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      if (date_to && isNaN(Date.parse(date_to))) {
        return new Response(JSON.stringify({ error: 'Invalid date_to format' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // Fetch cards from database using Supabase client
      const result: CardsListResponse = await listCards({
        limit,
        offset,
        customer_email,
        status: status || undefined,
        date_from,
        date_to,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });

    } catch (dbError) {
      console.error('Database error in get-cards:', dbError);
      
      // Check for specific Supabase configuration errors
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      let statusCode = 500;
      let errorResponse = 'Failed to retrieve cards';
      
      if (errorMessage.includes('Missing Supabase environment variables')) {
        statusCode = 503; // Service Unavailable
        errorResponse = 'Database configuration error - missing Supabase environment variables';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
        statusCode = 503;
        errorResponse = 'Database connection error - check if database services are running';
      }
      
      return new Response(JSON.stringify({ 
        error: errorResponse,
        details: errorMessage
      }), {
        status: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Unexpected error in get-cards:', error);
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
