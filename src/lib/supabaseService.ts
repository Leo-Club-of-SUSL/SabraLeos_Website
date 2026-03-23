import { supabase } from './supabase';
import type { Award, AwardDB, Project, LeadershipMember, LeadershipData, GalleryImage, SiteContent, ProjectDB, LeadershipMemberDB, GalleryImageDB, ContactMessage, ContactMessageDB, ContentLog, ContentLogDB } from '../types';

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
    type: (() => {
        if (dbMember.role_type === 'PastPresident') return 'past_president';
        return dbMember.role_type.toLowerCase() as any;
    })(),
    year: dbMember.year,
    serviceYear: dbMember.service_year,
    sortOrder: dbMember.sort_order || 0,
});

/**
 * Transform frontend leadership member to database format
 */
const transformLeadershipToDB = (
    member: Omit<LeadershipMember, 'id'>,
    roleType: 'Executive' | 'Board' | 'Chief' | 'Advisor' | 'PastPresident'
): Omit<LeadershipMemberDB, 'id' | 'created_at'> => ({
    name: member.name,
    position: member.position,
    role_type: roleType,
    image_url: member.image,
    year: member.year || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    service_year: member.serviceYear,
    sort_order: member.sortOrder || 0,
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

/**
 * Transform database award to frontend award format
 */
const transformAwardFromDB = (dbAward: AwardDB): Award => ({
    id: dbAward.id,
    title: dbAward.title,
    image: dbAward.image_url,
    description: dbAward.description || undefined,
    year: dbAward.year || undefined,
});

/**
 * Transform frontend award to database format
 */
const transformAwardToDB = (award: Omit<Award, 'id'>): Omit<AwardDB, 'id' | 'created_at'> => ({
    title: award.title,
    image_url: award.image,
    description: award.description || null,
    year: award.year || null,
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
    async getAll(): Promise<LeadershipData> {
        const { data, error } = await supabase
            .from('leadership')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching leadership:', error);
            throw error;
        }

        const members = (data || []).map(transformLeadershipFromDB);

        return {
            advisor: members.find(m => m.type === 'advisor'),
            executive: members.filter(m => m.type === 'executive'),
            chief: members.filter(m => m.type === 'chief'),
            board: members.filter(m => m.type === 'board'),
            pastPresidents: members.filter(m => m.type === 'past_president'),
        };
    },

    /**
     * Create a new leadership member
     */
    async create(member: Omit<LeadershipMember, 'id'>, roleType: 'Executive' | 'Board' | 'Chief' | 'Advisor' | 'PastPresident'): Promise<LeadershipMember> {
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
    async update(id: number, member: Partial<LeadershipMember>, roleType: 'Executive' | 'Board' | 'Chief' | 'Advisor' | 'PastPresident'): Promise<LeadershipMember> {
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

    /**
     * Bulk update leadership (e.g., for reordering sort priorities)
     */
    async bulkUpdate(updates: { id: number; sort_order?: number }[]): Promise<void> {
        const promises = updates.map(u => 
            supabase.from('leadership').update({ sort_order: u.sort_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const error = results.find(r => r.error)?.error;

        if (error) {
            console.error('Error bulk updating leadership:', error);
            throw error;
        }
    }
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
    async bulkUpdate(entries: { key: string; value: string }[], section?: string): Promise<void> {
        const promises = entries.map(({ key, value }) => {
            const data: any = { 
                key, 
                value, 
                updated_at: new Date().toISOString() 
            };
            
            // For upsert to work on new rows, we need the section
            if (section) data.section = section;
            else {
                // Infer section from key prefix
                if (key.startsWith('hero_')) data.section = 'hero';
                else if (key.startsWith('about_')) data.section = 'about';
                else if (key.startsWith('contact_')) data.section = 'contact';
                else if (key.startsWith('footer_')) data.section = 'footer';
                else data.section = 'general';
            }

            return supabase
                .from('site_content')
                .upsert(data, { onConflict: 'key' });
        });

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

    /**
     * Bulk update multiple gallery images (useful for reordering)
     */
    async bulkUpdate(updates: { id: number; show_on_home?: boolean; sort_order?: number }[]): Promise<void> {
        const promises = updates.map(update => 
            supabase
                .from('gallery')
                .update(update)
                .eq('id', update.id)
        );

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Error bulk updating gallery:', errors);
            throw errors[0].error;
        }
    }
};


// ============================================
// Awards API
// ============================================

export const awardsAPI = {
    /**
     * Fetch all awards from Supabase
     */
    async getAll(): Promise<Award[]> {
        const { data, error } = await supabase
            .from('awards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching awards:', error);
            throw error;
        }

        return (data || []).map(transformAwardFromDB);
    },

    /**
     * Create a new award
     */
    async create(award: Omit<Award, 'id'>): Promise<Award> {
        const dbAward = transformAwardToDB(award);

        const { data, error } = await supabase
            .from('awards')
            .insert([dbAward])
            .select()
            .single();

        if (error) {
            console.error('Error creating award:', error);
            throw error;
        }

        return transformAwardFromDB(data);
    },

    /**
     * Update an award
     */
    async update(id: number, award: Partial<Award>): Promise<Award> {
        const updateData: Record<string, unknown> = {};
        if (award.title !== undefined) updateData.title = award.title;
        if (award.image !== undefined) updateData.image_url = award.image;
        if (award.description !== undefined) updateData.description = award.description;
        if (award.year !== undefined) updateData.year = award.year;

        const { data, error } = await supabase
            .from('awards')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating award:', error);
            throw error;
        }

        return transformAwardFromDB(data);
    },

    /**
     * Delete an award
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('awards')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting award:', error);
            throw error;
        }
    },
};

// ============================================
// Messages API
// ============================================

/**
 * Transform database contact message to frontend format
 */
const transformMessageFromDB = (dbMessage: ContactMessageDB): ContactMessage => ({
    id: dbMessage.id,
    name: dbMessage.name,
    email: dbMessage.email,
    message: dbMessage.message,
    createdAt: dbMessage.created_at,
});

export const messagesAPI = {
    /**
     * Submit a contact form message
     */
    async create(message: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<ContactMessage> {
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([{
                name: message.name,
                email: message.email,
                message: message.message
            }])
            .select()
            .single();

        if (error) {
            console.error('Error submitting message:', error);
            throw error;
        }

        return transformMessageFromDB(data);
    },

    /**
     * Fetch all messages (for admin dashboard)
     */
    async getAll(): Promise<ContactMessage[]> {
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        return (data || []).map(transformMessageFromDB);
    },

    /**
     * Delete a message
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('contact_messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },
};

// ============================================
// Content Logs API
// ============================================

/**
 * Transform database content log to frontend format
 */
const transformLogFromDB = (dbLog: ContentLogDB): ContentLog => ({
    id: dbLog.id,
    action: dbLog.action,
    section: dbLog.section,
    description: dbLog.description,
    performedBy: dbLog.performed_by,
    createdAt: dbLog.created_at,
});

export const contentLogsAPI = {
    /**
     * Fetch all content logs (for admin dashboard)
     */
    async getAll(limit = 50): Promise<ContentLog[]> {
        const { data, error } = await supabase
            .from('content_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching content logs:', error);
            throw error;
        }

        return (data || []).map(transformLogFromDB);
    },

    /**
     * Create a new content log entry
     */
    async create(log: Omit<ContentLog, 'id' | 'createdAt'>): Promise<void> {
        const { error } = await supabase
            .from('content_logs')
            .insert([{
                action: log.action,
                section: log.section,
                description: log.description,
                performed_by: log.performedBy
            }]);

        if (error) {
            console.error('Error creating content log:', error);
            // Don't throw here to avoid failing the main action if logging fails
        }
    },
};
