import type {
  LocationRecord,
  ProductRecord,
  RepairRecord,
} from '../types/cycling.ts';
import type { AssistantHistoryItem } from '../server/geminiAssistant.ts';

export interface PublicConfig {
  googleMapsApiKey: string;
  storageMode: 'supabase' | 'local';
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Error HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore non-json error body
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const res = await fetch('/api/public-config');
  return handleResponse<PublicConfig>(res);
}

export async function fetchLocations(params?: {
  search?: string;
  category?: string;
  bike_type?: string;
  service?: string;
}): Promise<LocationRecord[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.category) sp.set('category', params.category);
  if (params?.bike_type && params.bike_type !== 'Todas')
    sp.set('bike_type', params.bike_type);
  if (params?.service) sp.set('service', params.service);
  const qs = sp.toString();
  const res = await fetch(`/api/locations${qs ? `?${qs}` : ''}`);
  return handleResponse<LocationRecord[]>(res);
}

export async function createLocationApi(
  payload: Omit<LocationRecord, 'id' | 'created_at'>
): Promise<LocationRecord> {
  const res = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<LocationRecord>(res);
}

export async function updateLocationApi(
  id: string,
  payload: Partial<Omit<LocationRecord, 'id' | 'created_at'>>
): Promise<LocationRecord> {
  const res = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<LocationRecord>(res);
}

export async function deleteLocationApi(id: string): Promise<void> {
  const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
  await handleResponse<{ deleted: boolean }>(res);
}

export async function fetchProducts(params?: {
  search?: string;
  item_type?: string;
  bike_type?: string;
  location_id?: string;
  max_price?: string;
  available?: boolean;
}): Promise<ProductRecord[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.item_type) sp.set('item_type', params.item_type);
  if (params?.bike_type && params.bike_type !== 'Todas')
    sp.set('bike_type', params.bike_type);
  if (params?.location_id) sp.set('location_id', params.location_id);
  if (params?.max_price) sp.set('max_price', params.max_price);
  if (params?.available !== undefined)
    sp.set('available', String(params.available));
  const qs = sp.toString();
  const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`);
  return handleResponse<ProductRecord[]>(res);
}

export async function createProductApi(
  payload: Omit<ProductRecord, 'id' | 'created_at'>
): Promise<ProductRecord> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ProductRecord>(res);
}

export async function updateProductApi(
  id: string,
  payload: Partial<Omit<ProductRecord, 'id' | 'created_at'>>
): Promise<ProductRecord> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ProductRecord>(res);
}

export async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  await handleResponse<{ deleted: boolean }>(res);
}

export async function fetchRepairs(params?: {
  search?: string;
  service_category?: string;
  bike_type?: string;
  location_id?: string;
}): Promise<RepairRecord[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.service_category && params.service_category !== 'Todas')
    sp.set('service_category', params.service_category);
  if (params?.bike_type && params.bike_type !== 'Todas')
    sp.set('bike_type', params.bike_type);
  if (params?.location_id) sp.set('location_id', params.location_id);
  const qs = sp.toString();
  const res = await fetch(`/api/repairs${qs ? `?${qs}` : ''}`);
  return handleResponse<RepairRecord[]>(res);
}

export async function createRepairApi(
  payload: Omit<RepairRecord, 'id' | 'created_at'>
): Promise<RepairRecord> {
  const res = await fetch('/api/repairs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<RepairRecord>(res);
}

export async function updateRepairApi(
  id: string,
  payload: Partial<Omit<RepairRecord, 'id' | 'created_at'>>
): Promise<RepairRecord> {
  const res = await fetch(`/api/repairs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<RepairRecord>(res);
}

export async function deleteRepairApi(id: string): Promise<void> {
  const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
  await handleResponse<{ deleted: boolean }>(res);
}

export async function sendAssistantChat(
  message: string,
  history: AssistantHistoryItem[]
): Promise<{ reply: string; toolsUsed: string[] }> {
  const res = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return handleResponse<{ reply: string; toolsUsed: string[] }>(res);
}
