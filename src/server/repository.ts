import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  LocationCategory,
  LocationRecord,
  ProductItemType,
  ProductRecord,
  RepairRecord,
} from '../types/cycling.ts';
import { SEED_LOCATIONS, SEED_PRODUCTS, SEED_REPAIRS } from './seedData.ts';

interface LocalDatabase {
  locations: LocationRecord[];
  products: ProductRecord[];
  repairs: RepairRecord[];
}

export interface LocationFilters {
  search?: string;
  category?: LocationCategory | '';
  bike_type?: string;
  service?: string;
  available?: boolean;
}

export interface ProductFilters {
  search?: string;
  item_type?: ProductItemType | '';
  bike_type?: string;
  location_id?: string;
  max_price?: number;
  available?: boolean;
}

export interface RepairFilters {
  search?: string;
  service_category?: string;
  bike_type?: string;
  location_id?: string;
  max_price?: number;
  available?: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

let supabaseClient: SupabaseClient | null | undefined;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient !== undefined) {
    return supabaseClient;
  }
  const url = process.env.SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )?.trim();

  if (
    url &&
    key &&
    !url.includes('tu-proyecto') &&
    !key.includes('MY_SUPABASE')
  ) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  } else {
    supabaseClient = null;
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

function readLocalDb(): LocalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: LocalDatabase = {
      locations: [...SEED_LOCATIONS],
      products: [...SEED_PRODUCTS],
      repairs: [...SEED_REPAIRS],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as LocalDatabase;
}

function writeLocalDb(db: LocalDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function matchesSearch(text: string, query?: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return text.toLowerCase().includes(q);
}

// ==========================================
// LOCATIONS CRUD
// ==========================================

export async function listLocations(
  filters: LocationFilters = {}
): Promise<LocationRecord[]> {
  const sb = getSupabaseClient();
  let rows: LocationRecord[];

  if (sb) {
    const { data, error } = await sb
      .from('locations')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Supabase error (locations): ${error.message}`);
    rows = (data ?? []) as LocationRecord[];
  } else {
    rows = readLocalDb().locations;
  }

  return rows.filter((loc) => {
    if (filters.category && loc.category !== filters.category) return false;
    if (
      filters.available !== undefined &&
      loc.available !== filters.available
    ) {
      return false;
    }
    if (
      filters.bike_type &&
      filters.bike_type !== 'Todas' &&
      !loc.bike_types_supported.some(
        (b) => b.toLowerCase() === filters.bike_type!.toLowerCase()
      )
    ) {
      return false;
    }
    if (
      filters.service &&
      !loc.services_summary.some((s) =>
        s.toLowerCase().includes(filters.service!.toLowerCase())
      )
    ) {
      return false;
    }
    if (filters.search) {
      const haystack = [
        loc.name,
        loc.address,
        loc.description,
        loc.category,
        ...loc.bike_types_supported,
        ...loc.services_summary,
      ].join(' ');
      if (!matchesSearch(haystack, filters.search)) return false;
    }
    return true;
  });
}

export async function createLocation(
  input: Omit<LocationRecord, 'id' | 'created_at'>
): Promise<LocationRecord> {
  const sb = getSupabaseClient();
  const newRecord: LocationRecord = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  if (sb) {
    const { data, error } = await sb
      .from('locations')
      .insert(newRecord)
      .select()
      .single();
    if (error) throw new Error(`Supabase error (createLocation): ${error.message}`);
    return data as LocationRecord;
  }

  const db = readLocalDb();
  db.locations.push(newRecord);
  writeLocalDb(db);
  return newRecord;
}

export async function updateLocation(
  id: string,
  updates: Partial<Omit<LocationRecord, 'id' | 'created_at'>>
): Promise<LocationRecord | null> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Supabase error (updateLocation): ${error.message}`);
    return (data as LocationRecord | null) ?? null;
  }

  const db = readLocalDb();
  const idx = db.locations.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  db.locations[idx] = { ...db.locations[idx], ...updates };
  writeLocalDb(db);
  return db.locations[idx];
}

export async function deleteLocation(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (sb) {
    const { error, count } = await sb
      .from('locations')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(`Supabase error (deleteLocation): ${error.message}`);
    return (count ?? 0) > 0;
  }

  const db = readLocalDb();
  const prevLen = db.locations.length;
  db.locations = db.locations.filter((l) => l.id !== id);
  if (db.locations.length === prevLen) return false;
  db.products = db.products.filter((p) => p.location_id !== id);
  db.repairs = db.repairs.filter((r) => r.location_id !== id);
  writeLocalDb(db);
  return true;
}

// ==========================================
// PRODUCTS (BICICLETAS & ACCESORIOS) CRUD
// ==========================================

export async function listProducts(
  filters: ProductFilters = {}
): Promise<ProductRecord[]> {
  const sb = getSupabaseClient();
  let rows: ProductRecord[];

  if (sb) {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Supabase error (products): ${error.message}`);
    rows = ((data ?? []) as ProductRecord[]).map((r) => ({
      ...r,
      price: Number(r.price),
      stock: Number(r.stock),
    }));
  } else {
    rows = readLocalDb().products;
  }

  return rows.filter((p) => {
    if (filters.item_type && p.item_type !== filters.item_type) return false;
    if (filters.location_id && p.location_id !== filters.location_id) {
      return false;
    }
    if (
      filters.bike_type &&
      filters.bike_type !== 'Todas' &&
      p.bike_type.toLowerCase() !== filters.bike_type.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.max_price !== undefined &&
      !Number.isNaN(filters.max_price) &&
      p.price > filters.max_price
    ) {
      return false;
    }
    if (filters.available !== undefined && p.available !== filters.available) {
      return false;
    }
    if (filters.search) {
      const haystack = `${p.name} ${p.brand} ${p.bike_type} ${p.item_type} ${p.specs}`;
      if (!matchesSearch(haystack, filters.search)) return false;
    }
    return true;
  });
}

export async function createProduct(
  input: Omit<ProductRecord, 'id' | 'created_at'>
): Promise<ProductRecord> {
  const sb = getSupabaseClient();
  const newRecord: ProductRecord = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  if (sb) {
    const { data, error } = await sb
      .from('products')
      .insert(newRecord)
      .select()
      .single();
    if (error) throw new Error(`Supabase error (createProduct): ${error.message}`);
    const row = data as ProductRecord;
    return { ...row, price: Number(row.price), stock: Number(row.stock) };
  }

  const db = readLocalDb();
  db.products.unshift(newRecord);
  writeLocalDb(db);
  return newRecord;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<ProductRecord, 'id' | 'created_at'>>
): Promise<ProductRecord | null> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Supabase error (updateProduct): ${error.message}`);
    if (!data) return null;
    const row = data as ProductRecord;
    return { ...row, price: Number(row.price), stock: Number(row.stock) };
  }

  const db = readLocalDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.products[idx] = { ...db.products[idx], ...updates };
  writeLocalDb(db);
  return db.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (sb) {
    const { error, count } = await sb
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(`Supabase error (deleteProduct): ${error.message}`);
    return (count ?? 0) > 0;
  }

  const db = readLocalDb();
  const prevLen = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length === prevLen) return false;
  writeLocalDb(db);
  return true;
}

// ==========================================
// REPAIRS & TARIFFS CRUD
// ==========================================

export async function listRepairs(
  filters: RepairFilters = {}
): Promise<RepairRecord[]> {
  const sb = getSupabaseClient();
  let rows: RepairRecord[];

  if (sb) {
    const { data, error } = await sb
      .from('repairs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Supabase error (repairs): ${error.message}`);
    rows = ((data ?? []) as RepairRecord[]).map((r) => ({
      ...r,
      price: Number(r.price),
      estimated_minutes: Number(r.estimated_minutes),
    }));
  } else {
    rows = readLocalDb().repairs;
  }

  return rows.filter((r) => {
    if (filters.location_id && r.location_id !== filters.location_id) {
      return false;
    }
    if (
      filters.service_category &&
      filters.service_category !== 'Todas' &&
      r.service_category.toLowerCase() !== filters.service_category.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.bike_type &&
      filters.bike_type !== 'Todas' &&
      r.bike_type.toLowerCase() !== 'todas' &&
      r.bike_type.toLowerCase() !== filters.bike_type.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.max_price !== undefined &&
      !Number.isNaN(filters.max_price) &&
      r.price > filters.max_price
    ) {
      return false;
    }
    if (filters.available !== undefined && r.available !== filters.available) {
      return false;
    }
    if (filters.search) {
      const haystack = `${r.service_name} ${r.service_category} ${r.bike_type} ${r.description}`;
      if (!matchesSearch(haystack, filters.search)) return false;
    }
    return true;
  });
}

export async function createRepair(
  input: Omit<RepairRecord, 'id' | 'created_at'>
): Promise<RepairRecord> {
  const sb = getSupabaseClient();
  const newRecord: RepairRecord = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  if (sb) {
    const { data, error } = await sb
      .from('repairs')
      .insert(newRecord)
      .select()
      .single();
    if (error) throw new Error(`Supabase error (createRepair): ${error.message}`);
    const row = data as RepairRecord;
    return {
      ...row,
      price: Number(row.price),
      estimated_minutes: Number(row.estimated_minutes),
    };
  }

  const db = readLocalDb();
  db.repairs.unshift(newRecord);
  writeLocalDb(db);
  return newRecord;
}

export async function updateRepair(
  id: string,
  updates: Partial<Omit<RepairRecord, 'id' | 'created_at'>>
): Promise<RepairRecord | null> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb
      .from('repairs')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Supabase error (updateRepair): ${error.message}`);
    if (!data) return null;
    const row = data as RepairRecord;
    return {
      ...row,
      price: Number(row.price),
      estimated_minutes: Number(row.estimated_minutes),
    };
  }

  const db = readLocalDb();
  const idx = db.repairs.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db.repairs[idx] = { ...db.repairs[idx], ...updates };
  writeLocalDb(db);
  return db.repairs[idx];
}

export async function deleteRepair(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (sb) {
    const { error, count } = await sb
      .from('repairs')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(`Supabase error (deleteRepair): ${error.message}`);
    return (count ?? 0) > 0;
  }

  const db = readLocalDb();
  const prevLen = db.repairs.length;
  db.repairs = db.repairs.filter((r) => r.id !== id);
  if (db.repairs.length === prevLen) return false;
  writeLocalDb(db);
  return true;
}
