import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client utility for server-side operations
 * 
 * This file provides a configured Supabase client for use in Netlify functions.
 * It is set up but not yet integrated into the application.
 * 
 * Usage (future implementation):
 * ```typescript
 * import { getSupabaseClient } from './utils/supabase';
 * 
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('orders').select('*');
 * ```
 */

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create a Supabase client instance
 * Uses singleton pattern to reuse the client across function invocations
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Use hard-coded values for local development
  // Check if we're running locally (either through DEV_SETUP env var or if SUPABASE_URL is not set)
  const isDevSetup = process.env.DEV_SETUP === 'true' || !process.env.SUPABASE_URL;
  
  const supabaseUrl = isDevSetup 
    ? 'http://localhost:54321'
    : process.env.SUPABASE_URL;
    
  const supabaseServiceKey = isDevSetup
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  console.log('Creating Supabase client with URL:', supabaseUrl);
  console.log('Service key length:', supabaseServiceKey?.length || 0);
  
  // For local development, try a different approach
  if (isDevSetup) {
    // Create client with minimal configuration for local development
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
      },
    });
  } else {
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
  }
  
  console.log('Supabase client created successfully');

  return supabaseClient;
}

/**
 * Database types for the complete schema
 */

// Legacy types (keeping for backward compatibility)
export interface Order {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface ContactCard {
  id: string;
  uuid: string;
  order_id: string;
  card_data?: Record<string, any>;
  s3_url?: string;
  created_at: string;
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
  uuid: string;
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

export async function createContactCard(cardData: Omit<ContactCard, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contact_cards')
    .insert([cardData])
    .select()
    .single();

  if (error) throw error;
  return data as ContactCard;
}

export async function getContactCardByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contact_cards')
    .select('*')
    .eq('uuid', uuid)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ContactCard | null;
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

export async function listCards(options: {
  limit?: number;
  offset?: number;
  customer_email?: string;
  status?: 'success' | 'error' | 'pending';
  date_from?: string;
  date_to?: string;
} = {}) {
  const supabase = getSupabaseClient();
  const { limit = 20, offset = 0, customer_email, status, date_from, date_to } = options;

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



