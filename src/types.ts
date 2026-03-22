// Database types (matching Supabase schema)
export interface ProjectDB {
    id: number;
    title: string;
    category: 'Completed' | 'Ongoing' | 'Upcoming';
    description: string;
    image_url: string;
    project_date: string | null;
    recruitment_link: string | null;
    created_at: string;
}

export interface LeadershipMemberDB {
    id: number;
    name: string;
    position: string;
    role_type: 'Executive' | 'Board' | 'Chief';
    image_url: string;
    year: string;
    created_at: string;
}

export interface SiteContentDB {
    id: number;
    key: string;
    value: string;
    section: string;
    updated_at: string;
}

export interface GalleryImageDB {
    id: number;
    image_url: string;
    caption: string;
    show_on_home: boolean;
    sort_order: number;
    created_at: string;
}

export interface AwardDB {
    id: number;
    title: string;
    image_url: string;
    description: string | null;
    year: string | null;
    created_at: string;
}

export interface ContactMessageDB {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: string;
}

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    message: string;
    createdAt: string;
}

// Frontend types (for component usage)
export interface Project {
    id: number;
    title: string;
    category: 'Completed' | 'Ongoing' | 'Upcoming';
    description: string;
    image: string;
    committee?: string[];
    date?: string;
    status?: string;
    registrationLink?: string;
}

export interface LeadershipMember {
    id: number;
    name: string;
    position: string;
    image: string;
    type: 'executive' | 'board' | 'chief';
    year?: string;
}

export interface GalleryImage {
    id: number;
    src: string;
    alt: string;
    showOnHome: boolean;
    sortOrder: number;
}

export interface Award {
    id: number;
    title: string;
    image: string;
    description?: string;
    year?: string;
}

export interface LeadershipData {
    executive: LeadershipMember[];
    chief: LeadershipMember[];
    board: LeadershipMember[];
}

// Site content is a simple key-value map
export type SiteContent = Record<string, string>;
