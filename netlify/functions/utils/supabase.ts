import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client utility for server-side operations
 * 
 * This file provides a configured Supabase client for use in Netlify functions.
 * Configured for SaaS Supabase using PROJECT_URL and SUPABASE_KEY environment variables.
 * 
 * Usage:
 * ```typescript
 * import { getSupabaseClient } from './utils/supabase';
 * 
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('orders').select('*');
 * ```
 */

let supabaseClient: SupabaseClient | null = null;

export interface SupabaseEnvConfig {
  url: string;
  serviceKey: string;
  source: 'local' | 'saas';
}

export function resolveSupabaseEnvConfig(): SupabaseEnvConfig {
  const localUrl = process.env.SUPABASE_URL;
  const localKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const saasUrl = process.env.PROJECT_URL;
  const saasKey = process.env.SUPABASE_KEY;

  const preferLocal =
    process.env.SUPABASE_PREFER_LOCAL === 'true' ||
    process.env.NETLIFY_DEV === 'true' ||
    process.env.NODE_ENV === 'development';

  if (preferLocal && localUrl && localKey) {
    return { url: localUrl, serviceKey: localKey, source: 'local' };
  }

  if (saasUrl && saasKey) {
    return { url: saasUrl, serviceKey: saasKey, source: 'saas' };
  }

  if (localUrl && localKey) {
    return { url: localUrl, serviceKey: localKey, source: 'local' };
  }

  throw new Error(
    'Missing Supabase environment variables. Please set either:\n' +
    '- For SaaS: PROJECT_URL and SUPABASE_KEY\n' +
    '- For local dev: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

/**
 * Get or create a Supabase client instance
 * Uses singleton pattern to reuse the client across function invocations
 * 
 * Supports both local development and SaaS Supabase:
 * - SaaS: PROJECT_URL and SUPABASE_KEY (for production)
 * - Local: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for local development)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const resolved = resolveSupabaseEnvConfig();
  const supabaseUrl = resolved.url;
  const supabaseServiceKey = resolved.serviceKey;

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey,
      },
    },
  });
  
  console.log(`Supabase client created successfully for URL: ${supabaseUrl} (source: ${resolved.source})`);

  return supabaseClient;
}

/**
 * Database types for the complete schema
 */

// Legacy types (keeping for backward compatibility)
export interface Order {
  id: string;
  customer_id?: string | null;
  stripe_session_id: string;
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  cart_data: Array<{
    productType: string;
    quantity: number;
    price: number;
    [key: string]: any;
  }>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  shipped: boolean;
  fulfilled: boolean;
  stripe_receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}


export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  otp_secret?: string;
  otp_enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// New types for customer and card management
export interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  stripe_customer_id?: string;
  shipping_address?: ShippingAddress;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Action {
  name: string;
  value: string;
  color?: string;
}

export interface CardData {
  name?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  pronouns?: string;
  prefix?: string;
  mobile?: string;
  fname?: string;
  lname?: string;
  biz?: string;
  desc?: string;
  photo?: string;
}

export interface GenerationStatus {
  status: 'success' | 'error' | 'pending';
  error?: string;
  timestamp: string;
}

export interface Card {
  id: string;
  customer_id?: string;
  order_id?: string;
  uuid: string;
  card_type: 'basic' | 'core';
  website_url?: string;
  design_file_url?: string;
  card_data: CardData;
  primary_actions: Action[];
  secondary_actions: Action[];
  logo_or_header: boolean;
  has_logo: boolean;
  has_photo: boolean;
  has_cover: boolean;
  s3_base_url?: string;
  generated_at?: string;
  generation_status: GenerationStatus;
  created_at: string;
  updated_at: string;
}

export interface CardAsset {
  id: string;
  card_id: string;
  asset_type: 'logo' | 'photo' | 'cover' | 'html' | 'vcf';
  s3_key: string;
  s3_url: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
}

// Extended types for API responses
export interface CardWithCustomer extends Card {
  customer?: Customer;
}

export interface CardsListResponse {
  cards: CardWithCustomer[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Helper functions for common database operations
 */

// Legacy functions (keeping for backward compatibility)
export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrderByStripeSession(stripeSessionId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data as Order | null;
}

export async function getOrderById(orderId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(shipping_address)')
    .eq('id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  
  if (!data) return null;
  
  // If customer has shipping_address, add it to customer_info
  const order = data as any;
  if (order.customers && order.customers.shipping_address) {
    order.customer_info = {
      ...order.customer_info,
      shipping_address: order.customers.shipping_address
    };
  }
  
  // Remove the joined customers object
  delete order.customers;
  
  return order as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderFulfillment(orderId: string, updates: { shipped?: boolean; fulfilled?: boolean }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function listOrders(options: {
  limit?: number;
  offset?: number;
  status?: Order['status'];
  shipped?: boolean;
  fulfilled?: boolean;
} = {}) {
  const supabase = getSupabaseClient();
  const { limit = 50, offset = 0, status, shipped, fulfilled } = options;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  
  if (shipped !== undefined) {
    query = query.eq('shipped', shipped);
  }
  
  if (fulfilled !== undefined) {
    query = query.eq('fulfilled', fulfilled);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    orders: data as Order[],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit
  };
}


// Customer CRUD operations
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function getCustomerByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Customer | null;
}

export async function getCustomerById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Customer | null;
}

export async function updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function upsertCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .upsert([customerData], { onConflict: 'email' })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

// Card CRUD operations
export async function createCard(cardData: Omit<Card, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cards')
    .insert([cardData])
    .select()
    .single();

  if (error) throw error;
  return data as Card;
}

export async function getCardById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as CardWithCustomer | null;
}

export async function getCardByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('uuid', uuid)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as CardWithCustomer | null;
}

export async function getCardsByOrderId(orderId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Card[];
}

export async function updateCard(id: string, updates: Partial<Omit<Card, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Card;
}

export async function deleteCard(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function listCards(options: {
  limit?: number;
  offset?: number;
  customer_email?: string;
  status?: 'success' | 'error' | 'pending';
  date_from?: string;
  date_to?: string;
  card_type?: 'basic' | 'core';
} = {}) {
  const supabase = getSupabaseClient();
  const { limit = 20, offset = 0, customer_email, status, date_from, date_to, card_type } = options;

  let query = supabase
    .from('cards')
    .select(`
      *,
      customer:customers(*)
    `, { count: 'exact' });

  // Apply filters
  if (customer_email) {
    query = query.eq('customer.email', customer_email);
  }
  
  if (status) {
    query = query.eq('generation_status->status', status);
  }
  
  if (card_type) {
    query = query.eq('card_type', card_type);
  }
  
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  
  if (date_to) {
    query = query.lte('created_at', date_to);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    cards: data as CardWithCustomer[],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit
  } as CardsListResponse;
}

// Card Asset operations
export async function createCardAsset(assetData: Omit<CardAsset, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('card_assets')
    .insert([assetData])
    .select()
    .single();

  if (error) throw error;
  return data as CardAsset;
}

export async function getCardAssets(cardId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('card_assets')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as CardAsset[];
}

export async function deleteCardAssets(cardId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('card_assets')
    .delete()
    .eq('card_id', cardId);

  if (error) throw error;
}

export async function getCardAssetByType(cardId: string, assetType: CardAsset['asset_type']) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('card_assets')
    .select('*')
    .eq('card_id', cardId)
    .eq('asset_type', assetType)
    .maybeSingle();

  if (error) throw error;
  return data as CardAsset | null;
}

export async function updateCardAsset(id: string, updates: Partial<Omit<CardAsset, 'id' | 'created_at'>>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('card_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CardAsset;
}

export async function upsertCardAsset(assetData: Omit<CardAsset, 'id' | 'created_at'>) {
  // First, try to find an existing asset with the same card_id and asset_type
  const existingAsset = await getCardAssetByType(assetData.card_id, assetData.asset_type);
  
  if (existingAsset) {
    // Update existing asset
    return await updateCardAsset(existingAsset.id, {
      s3_key: assetData.s3_key,
      s3_url: assetData.s3_url,
      mime_type: assetData.mime_type,
      file_size: assetData.file_size,
    });
  } else {
    // Create new asset
    return await createCardAsset(assetData);
  }
}


