import type { Context } from '@netlify/functions';
import { getCardById, getCardAssets } from './utils/supabase';

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
      const cardId = url.searchParams.get('cardId');

      if (!cardId) {
        return new Response(JSON.stringify({ error: 'Card ID is required' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // Fetch card and assets from database using direct fetch for local development
      let card, assets;
      
      if (process.env.DEV_SETUP === 'true' || !process.env.SUPABASE_URL) {
        // Use direct fetch for local development
        const supabaseUrl = 'http://localhost:54321';
        const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
        
        // Fetch card with customer data
        const cardResponse = await fetch(`${supabaseUrl}/cards?id=eq.${cardId}&select=*,customer:customers(*)`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!cardResponse.ok) {
          throw new Error(`HTTP error! status: ${cardResponse.status}`);
        }
        
        const cardData = await cardResponse.json();
        card = cardData.length > 0 ? cardData[0] : null;
        
        // Fetch card assets
        const assetsResponse = await fetch(`${supabaseUrl}/card_assets?card_id=eq.${cardId}`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!assetsResponse.ok) {
          throw new Error(`HTTP error! status: ${assetsResponse.status}`);
        }
        
        assets = await assetsResponse.json();
      } else {
        // Use Supabase client for production
        const [cardResult, assetsResult] = await Promise.all([
          getCardById(cardId),
          getCardAssets(cardId)
        ]);
        card = cardResult;
        assets = assetsResult;
      }

      if (!card) {
        return new Response(JSON.stringify({ error: 'Card not found' }), {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        card,
        assets
      }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });

    } catch (dbError) {
      console.error('Database error in get-card-details:', dbError);
      
      // Check for specific Supabase configuration errors
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      let statusCode = 500;
      let errorResponse = 'Failed to retrieve card details';
      
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
    console.error('Unexpected error in get-card-details:', error);
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
