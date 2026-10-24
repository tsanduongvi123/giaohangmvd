import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shipment, SupabaseConfig } from '../types';

const SUPABASE_CONFIG_STORAGE_KEY = 'express_supabase_config_v1';

export function getSavedSupabaseConfig(): SupabaseConfig {
  const DEFAULT_URL = 'https://xxuudayxptarztovajlb.supabase.co';
  const DEFAULT_ANON_KEY = 'sb_publishable_AP0mSdmvAJZUa6_XzHvjMg_CorW-hqV';

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading saved Supabase config:', err);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    tableName: 'shipments',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Reset client instance
    supabaseClientInstance = null;
  } catch (err) {
    console.error('Error saving Supabase config:', err);
  }
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    supabaseClientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseClientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  const config = getSavedSupabaseConfig();

  if (!client || !config.url || !config.anonKey) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL và Anon Key.',
    };
  }

  try {
    const { error } = await client.from(config.tableName || 'shipments').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: `Bảng "${config.tableName}" chưa được tạo trong Supabase. Vui lòng chạy lệnh SQL tạo bảng.`,
        };
      }
      return {
        success: false,
        message: `Lỗi kết nối Supabase: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'Kết nối Supabase thành công! Dữ liệu đang được đồng bộ thời gian thực.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối Supabase: ${err?.message || 'Lỗi mạng'}`,
    };
  }
}

export async function fetchShipmentsFromSupabase(): Promise<Shipment[] | null> {
  const client = getSupabaseClient();
  const config = getSavedSupabaseConfig();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(config.tableName || 'shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to local:', error.message);
      return null;
    }

    if (!data) return null;

    // Convert from rows to Shipment format
    return data.map((row: any) => {
      if (row.data && typeof row.data === 'object') {
        return {
          ...row.data,
          id: row.id,
          trackingCode: row.tracking_code || row.data.trackingCode,
        };
      }
      return row as Shipment;
    });
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
}

export async function upsertShipmentToSupabase(shipment: Shipment): Promise<boolean> {
  const client = getSupabaseClient();
  const config = getSavedSupabaseConfig();
  if (!client) return false;

  try {
    const rowPayload = {
      id: shipment.id,
      tracking_code: shipment.trackingCode.toUpperCase(),
      data: shipment,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from(config.tableName || 'shipments')
      .upsert(rowPayload, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert exception:', err);
    return false;
  }
}

export async function deleteShipmentFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const config = getSavedSupabaseConfig();
  if (!client) return false;

  try {
    const { error } = await client
      .from(config.tableName || 'shipments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return false;
  }
}

export const SUPABASE_SQL_HELPER = `-- Tạo bảng lưu trữ thông tin bưu kiện vận đơn trên Supabase:
create table if not exists public.shipments (
  id text primary key,
  tracking_code text unique not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cho phép đọc ghi công khai:
alter table public.shipments enable row level security;
drop policy if exists "Allow public read and write shipments" on public.shipments;
create policy "Allow public read and write shipments"
  on public.shipments for all
  using (true)
  with check (true);
`;
