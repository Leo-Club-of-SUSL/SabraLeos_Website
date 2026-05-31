// src/services/magazineService.ts
import type {
  AdminMagazine,
  MagazineListResponse,
  AdminMagazineListResponse,
} from '../types/magazine';

const BASE = '/api';

// ============================================
// Public API
// ============================================

export async function fetchMagazines(
  page = 1,
  limit = 12,
  year?: string,
  tag?: string
): Promise<MagazineListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (year) params.set('year', year);
  if (tag) params.set('tag', tag);

  const res = await fetch(`${BASE}/magazines?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Returns the URL to load the PDF via the secure proxy.
 * PDF.js will stream it — we do NOT fetch it here.
 */
export function fetchMagazinePdfUrl(id: string): string {
  return `${BASE}/magazines/${id}/pdf`;
}

/**
 * Fire-and-forget view count increment.
 * Never await this in a UI path.
 */
export function incrementViewCount(id: string): void {
  fetch(`${BASE}/magazines/${id}/view`, { method: 'POST' }).catch(() => {
    // Intentionally swallow errors — fire and forget
  });
}

// ============================================
// Admin API  (all require JWT token)
// ============================================

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function adminFetchMagazines(
  token: string,
  page = 1,
  limit = 20
): Promise<AdminMagazineListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${BASE}/admin/magazines?${params}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminCreateMagazine(
  token: string,
  data: Omit<AdminMagazine, 'id' | 'cover_url' | 'view_count' | 'created_at' | 'updated_at'>
): Promise<AdminMagazine> {
  const res = await fetch(`${BASE}/admin/magazines`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminUpdateMagazine(
  token: string,
  id: string,
  data: Partial<AdminMagazine>
): Promise<AdminMagazine> {
  const res = await fetch(`${BASE}/admin/magazines/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminDeleteMagazine(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/magazines/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function adminUploadFile(
  token: string,
  file: File,
  type: 'cover' | 'pdf',
  onProgress?: (p: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  if (onProgress) onProgress(10);

  // Use XMLHttpRequest for upload progress
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/admin/magazines/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve(data.path);
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error || `Upload failed (HTTP ${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(formData);
  });
}

/**
 * Check slug uniqueness against admin API.
 * Returns true if slug is available.
 */
export async function checkSlugUnique(
  token: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const allRes = await adminFetchMagazines(token, 1, 50);
    return !allRes.data.some(
      (m) => m.slug === slug && m.id !== excludeId
    );
  } catch {
    return true;
  }
}

/** Generate a URL-safe slug from a title */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
