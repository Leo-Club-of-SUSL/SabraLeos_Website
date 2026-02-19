import { supabase } from './supabase';
import type { Project, LeadershipMember, GalleryImage, SiteContent, ProjectDB, LeadershipMemberDB, GalleryImageDB } from '../types';

// ============================================
// Data Transformation Helpers
// ============================================

/**
 * Transform database project to frontend project format
 */
const transformProjectFromDB = (dbProject: ProjectDB): Project => ({
    id: dbProject.id,
    title: dbProject.title,
    category: dbProject.category,
    description: dbProject.description,
    image: dbProject.image_url,
    date: dbProject.project_date || undefined,
    registrationLink: dbProject.recruitment_link || undefined,
});

/**
 * Transform frontend project to database format
 */
const transformProjectToDB = (project: Omit<Project, 'id'>): Omit<ProjectDB, 'id' | 'created_at'> => ({
    title: project.title,
    category: project.category,
    description: project.description,
    image_url: project.image,
    project_date: project.date || null,
    recruitment_link: project.registrationLink || null,
});

/**
 * Transform database leadership member to frontend format
 */
const transformLeadershipFromDB = (dbMember: LeadershipMemberDB): LeadershipMember => ({
    id: dbMember.id,
    name: dbMember.name,
    position: dbMember.position,
    image: dbMember.image_url,
    type: dbMember.role_type.toLowerCase() as 'executive' | 'board',
    year: dbMember.year,
});

/**
 * Transform frontend leadership member to database format
 */
const transformLeadershipToDB = (
    member: Omit<LeadershipMember, 'id'>,
    roleType: 'Executive' | 'Board'
): Omit<LeadershipMemberDB, 'id' | 'created_at'> => ({
    name: member.name,
    position: member.position,
    role_type: roleType,
    image_url: member.image,
    year: member.year || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
});

/**
 * Transform database gallery image to frontend format
 */
const transformGalleryFromDB = (dbImage: GalleryImageDB): GalleryImage => ({
    id: dbImage.id,
    src: dbImage.image_url,
    alt: dbImage.caption,
    showOnHome: dbImage.show_on_home,
    sortOrder: dbImage.sort_order,
});

/**
 * Transform frontend gallery image to database format
 */
const transformGalleryToDB = (image: Omit<GalleryImage, 'id'>): Omit<GalleryImageDB, 'id' | 'created_at'> => ({
    image_url: image.src,
    caption: image.alt,
    show_on_home: image.showOnHome,
    sort_order: image.sortOrder,
});

// ============================================
// Projects API
// ============================================

export const projectsAPI = {
    /**
     * Fetch all projects from Supabase
     */
    async getAll(): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }

        return (data || []).map(transformProjectFromDB);
    },

    /**
     * Create a new project
     */
    async create(project: Omit<Project, 'id'>): Promise<Project> {
        const dbProject = transformProjectToDB(project);

        const { data, error } = await supabase
            .from('projects')
            .insert([dbProject])
            .select()
            .single();

        if (error) {
            console.error('Error creating project:', error);
            throw error;
        }

        return transformProjectFromDB(data);
    },

    /**
     * Update an existing project
     */
    async update(id: number, project: Partial<Project>): Promise<Project> {
        const dbProject = transformProjectToDB(project as Omit<Project, 'id'>);

        const { data, error } = await supabase
            .from('projects')
            .update(dbProject)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating project:', error);
            throw error;
        }

        return transformProjectFromDB(data);
    },

    /**
     * Delete a project
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },
};

// ============================================
// Leadership API
// ============================================

export const leadershipAPI = {
    /**
     * Fetch all leadership members from Supabase
     */
    async getAll(): Promise<{ executive: LeadershipMember[]; board: LeadershipMember[] }> {
        const { data, error } = await supabase
            .from('leadership')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching leadership:', error);
            throw error;
        }

        const members = (data || []).map(transformLeadershipFromDB);

        return {
            executive: members.filter(m => m.type === 'executive'),
            board: members.filter(m => m.type === 'board'),
        };
    },

    /**
     * Create a new leadership member
     */
    async create(member: Omit<LeadershipMember, 'id'>, roleType: 'Executive' | 'Board'): Promise<LeadershipMember> {
        const dbMember = transformLeadershipToDB(member, roleType);

        const { data, error } = await supabase
            .from('leadership')
            .insert([dbMember])
            .select()
            .single();

        if (error) {
            console.error('Error creating leadership member:', error);
            throw error;
        }

        return transformLeadershipFromDB(data);
    },

    /**
     * Update an existing leadership member
     */
    async update(id: number, member: Partial<LeadershipMember>, roleType: 'Executive' | 'Board'): Promise<LeadershipMember> {
        const dbMember = transformLeadershipToDB(member as Omit<LeadershipMember, 'id'>, roleType);

        const { data, error } = await supabase
            .from('leadership')
            .update(dbMember)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating leadership member:', error);
            throw error;
        }

        return transformLeadershipFromDB(data);
    },

    /**
     * Delete a leadership member
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('leadership')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting leadership member:', error);
            throw error;
        }
    },
};

// ============================================
// Site Content API
// ============================================

export const siteContentAPI = {
    /**
     * Fetch all site content as a key-value map
     */
    async getAll(): Promise<SiteContent> {
        const { data, error } = await supabase
            .from('site_content')
            .select('*');

        if (error) {
            console.error('Error fetching site content:', error);
            throw error;
        }

        const contentMap: SiteContent = {};
        (data || []).forEach((row: { key: string; value: string }) => {
            contentMap[row.key] = row.value;
        });
        return contentMap;
    },

    /**
     * Update a single site content entry by key
     */
    async update(key: string, value: string): Promise<void> {
        const { error } = await supabase
            .from('site_content')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

        if (error) {
            console.error('Error updating site content:', error);
            throw error;
        }
    },

    /**
     * Bulk update multiple site content entries
     */
    async bulkUpdate(entries: { key: string; value: string }[]): Promise<void> {
        const promises = entries.map(({ key, value }) =>
            supabase
                .from('site_content')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', key)
        );

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Error bulk updating site content:', errors);
            throw errors[0].error;
        }
    },
};

// ============================================
// Gallery API
// ============================================

export const galleryAPI = {
    /**
     * Fetch all gallery images from Supabase
     */
    async getAll(): Promise<GalleryImage[]> {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching gallery:', error);
            throw error;
        }

        return (data || []).map(transformGalleryFromDB);
    },

    /**
     * Create a new gallery image
     */
    async create(image: Omit<GalleryImage, 'id'>): Promise<GalleryImage> {
        const dbImage = transformGalleryToDB(image);

        const { data, error } = await supabase
            .from('gallery')
            .insert([dbImage])
            .select()
            .single();

        if (error) {
            console.error('Error creating gallery image:', error);
            throw error;
        }

        return transformGalleryFromDB(data);
    },

    /**
     * Update a gallery image
     */
    async update(id: number, image: Partial<GalleryImage>): Promise<GalleryImage> {
        const updateData: Record<string, unknown> = {};
        if (image.src !== undefined) updateData.image_url = image.src;
        if (image.alt !== undefined) updateData.caption = image.alt;
        if (image.showOnHome !== undefined) updateData.show_on_home = image.showOnHome;
        if (image.sortOrder !== undefined) updateData.sort_order = image.sortOrder;

        const { data, error } = await supabase
            .from('gallery')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating gallery image:', error);
            throw error;
        }

        return transformGalleryFromDB(data);
    },

    /**
     * Delete a gallery image
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting gallery image:', error);
            throw error;
        }
    },
};
