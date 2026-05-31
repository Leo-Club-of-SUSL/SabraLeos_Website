// src/types/magazine.ts

export interface Magazine {
  id: string;
  title: string;
  slug: string;
  volume_number: number | null;
  issue_number: number | null;
  published_date: string | null;
  description: string | null;
  cover_url: string | null;       // Resolved public URL (from API)
  is_downloadable: boolean;
  tags: string[] | null;
  view_count: number;
  created_at: string;
}

export interface AdminMagazine extends Magazine {
  cover_image_path: string | null;
  pdf_file_path: string | null;
  is_published: boolean;
  updated_at: string;
}

export interface MagazineListResponse {
  data: Magazine[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminMagazineListResponse {
  data: AdminMagazine[];
  total: number;
  page: number;
  totalPages: number;
}
