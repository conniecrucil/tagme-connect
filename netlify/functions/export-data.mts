import type { Context } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    const supabase = getSupabaseClient();

    const [
      { data: customers, error: customersError },
      { data: orders, error: ordersError },
      { data: cards, error: cardsError },
      { data: cardAssets, error: cardAssetsError },
      { data: adminUsers, error: adminUsersError },
    ] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: true }),
      supabase.from('cards').select('*').order('created_at', { ascending: true }),
      supabase.from('card_assets').select('*').order('created_at', { ascending: true }),
      supabase.from('admin_users_auth0').select('*').order('created_at', { ascending: true }),
    ]);

    if (customersError) throw customersError;
    if (ordersError) throw ordersError;
    if (cardsError) throw cardsError;
    if (cardAssetsError) throw cardAssetsError;
    if (adminUsersError) throw adminUsersError;

    const exportPayload = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      counts: {
        customers: customers?.length ?? 0,
        orders: orders?.length ?? 0,
        cards: cards?.length ?? 0,
        card_assets: cardAssets?.length ?? 0,
        admin_users: adminUsers?.length ?? 0,
      },
      data: {
        customers: customers ?? [],
        orders: orders ?? [],
        cards: cards ?? [],
        card_assets: cardAssets ?? [],
        admin_users_auth0: adminUsers ?? [],
      },
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
