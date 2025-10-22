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

      // Fetch cards from database using direct fetch for local development
      let result: CardsListResponse;
      
      if (process.env.DEV_SETUP === 'true' || !process.env.SUPABASE_URL) {
        // Use direct fetch for local development
        const supabaseUrl = 'http://localhost:54321';
        const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
        
        // Build query parameters
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });
        
        if (customer_email) queryParams.append('customer.email', `eq.${customer_email}`);
        if (status) queryParams.append('generation_status->status', `eq.${status}`);
        if (date_from) queryParams.append('created_at', `gte.${date_from}`);
        if (date_to) queryParams.append('created_at', `lte.${date_to}`);
        
        const response = await fetch(`${supabaseUrl}/cards?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get total count
        const countResponse = await fetch(`${supabaseUrl}/cards?select=count`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        });
        
        const totalCount = countResponse.headers.get('Content-Range')?.split('/')[1] || '0';
        
        result = {
          cards: data,
          total: parseInt(totalCount),
          page: Math.floor(offset / limit) + 1,
          limit
        };
      } else {
        // Use Supabase client for production
        result = await listCards({
          limit,
          offset,
          customer_email,
          status: status || undefined,
          date_from,
          date_to,
        });
      }

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
