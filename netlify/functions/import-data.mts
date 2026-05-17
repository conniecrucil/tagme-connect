import type { Context } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

interface ImportPayload {
  version: string;
  exported_at: string;
  data: {
    customers?: Record<string, unknown>[];
    orders?: Record<string, unknown>[];
    cards?: Record<string, unknown>[];
    card_assets?: Record<string, unknown>[];
    admin_users_auth0?: Record<string, unknown>[];
  };
}

// Upsert a batch of rows into a table, resolving conflicts by primary key id.
// Returns the count of rows processed.
async function upsertTable(
  supabase: ReturnType<typeof getSupabaseClient>,
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn = 'id'
): Promise<number> {
  if (!rows.length) return 0;

  // Process in chunks to avoid payload size limits
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictColumn, ignoreDuplicates: false });
    if (error) throw new Error(`Failed to upsert into ${table}: ${error.message}`);
  }

  return rows.length;
}

// Delete all rows from a table in the correct FK-safe order for a full replace.
async function clearAllTables(supabase: ReturnType<typeof getSupabaseClient>) {
  // Delete in reverse dependency order to satisfy FK constraints
  const tables = ['card_assets', 'cards', 'orders', 'customers', 'admin_users_auth0'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  let body: ImportPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  if (!body?.data) {
    return new Response(JSON.stringify({ error: 'Missing data field in payload' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const url = new URL(req.url);
  // mode=replace clears all existing data before inserting; mode=upsert (default) merges
  const mode = url.searchParams.get('mode') === 'replace' ? 'replace' : 'upsert';

  try {
    const supabase = getSupabaseClient();
    const { data } = body;

    if (mode === 'replace') {
      await clearAllTables(supabase);
    }

    // Insert in FK-safe order: independent tables first, then dependents
    const counts = {
      admin_users: 0,
      customers: 0,
      orders: 0,
      cards: 0,
      card_assets: 0,
    };

    counts.admin_users = await upsertTable(
      supabase,
      'admin_users_auth0',
      data.admin_users_auth0 ?? [],
      'email'
    );

    counts.customers = await upsertTable(
      supabase,
      'customers',
      data.customers ?? [],
      'email'
    );

    counts.orders = await upsertTable(
      supabase,
      'orders',
      data.orders ?? [],
      'stripe_session_id'
    );

    counts.cards = await upsertTable(
      supabase,
      'cards',
      data.cards ?? [],
      'uuid'
    );

    counts.card_assets = await upsertTable(
      supabase,
      'card_assets',
      data.card_assets ?? [],
      'id'
    );

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        imported_at: new Date().toISOString(),
        counts,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
