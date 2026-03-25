import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_SITE_CONTENT } from '../data';
import type { Award, Project, LeadershipData, GalleryImage, LeadershipMember, SiteContent, ContentLog } from '../types';
import { awardsAPI, projectsAPI, leadershipAPI, galleryAPI, siteContentAPI, contentLogsAPI } from '../lib/supabaseService';
import { useAuth } from './AuthContext';

interface DataContextType {
  projects: Project[];
  leadership: LeadershipData;
  gallery: GalleryImage[];
  awards: Award[];
  siteContent: SiteContent;
  loading: boolean;
  error: string | null;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  addMember: (member: Omit<LeadershipMember, 'id'>, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => Promise<void>;
  updateMember: (member: LeadershipMember, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => Promise<void>;
  deleteMember: (id: number, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => Promise<void>;
  bulkUpdateLeadership: (updates: { id: number; sort_order?: number }[]) => Promise<void>;
  addImage: (image: Omit<GalleryImage, 'id'>) => Promise<void>;
  updateImage: (id: number, image: Partial<GalleryImage>) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  bulkUpdateGallery: (updates: { id: number; showOnHome?: boolean; sortOrder?: number }[]) => Promise<void>;
  addAward: (award: Omit<Award, 'id'>) => Promise<void>;

  updateAward: (id: number, award: Partial<Award>) => Promise<void>;
  deleteAward: (id: number) => Promise<void>;
  bulkUpdateAwards: (updates: { id: number; sort_order?: number }[]) => Promise<void>;
  updateSiteContent: (key: string, value: string) => Promise<void>;
  bulkUpdateSiteContent: (entries: { key: string; value: string }[], section?: string) => Promise<void>;
  logs: ContentLog[];
  refreshData: () => Promise<void>;
  fetchLogs: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadership, setLeadership] = useState<LeadershipData>({ executive: [], chief: [], board: [], pastPresidents: [] });
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [logs, setLogs] = useState<ContentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Helper for logging
  const logAction = async (action: string, section: string, description: string) => {
    if (!user?.email) return;
    try {
      await contentLogsAPI.create({
        action,
        section,
        description,
        performedBy: user.email
      });
      // Refresh logs after action
      const newLogs = await contentLogsAPI.getAll();
      setLogs(newLogs);
    } catch (err) {
      console.error('Logging failed:', err);
    }
  };

  // Fetch data from Supabase on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        projectsAPI.getAll(),
        leadershipAPI.getAll(),
        galleryAPI.getAll(),
        awardsAPI.getAll(),
        siteContentAPI.getAll(),
        contentLogsAPI.getAll(),
      ]);

      // Assign results or keep defaults if they failed
      if (results[0].status === 'fulfilled') setProjects(results[0].value);
      else console.error('Error fetching projects:', results[0].reason);

      if (results[1].status === 'fulfilled') setLeadership(results[1].value);
      else console.error('Error fetching leadership:', results[1].reason);

      if (results[2].status === 'fulfilled') setGallery(results[2].value);
      else console.error('Error fetching gallery:', results[2].reason);

      if (results[3].status === 'fulfilled') setAwards(results[3].value);
      else console.error('Error fetching awards:', results[3].reason);

      if (results[4].status === 'fulfilled') {
        setSiteContent({ ...DEFAULT_SITE_CONTENT, ...results[4].value });
      } else {
        console.error('Error fetching site content:', results[4].reason);
      }

      if (results[5].status === 'fulfilled') setLogs(results[5].value);
      else console.error('Error fetching logs:', results[5].reason);

      // If all critical data failed to load, set a global error
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Failed to load website data. Please check your connection.');
      }

    } catch (err) {
      console.error('Unexpected error in fetchData:', err);
      setError('An unexpected error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Project Actions
  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      const newProject = await projectsAPI.create(project);
      setProjects(prev => [newProject, ...prev]);
      await logAction('created', 'projects', `Added project: ${project.title}`);
    } catch (err) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      const updated = await projectsAPI.update(updatedProject.id, updatedProject);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      await logAction('updated', 'projects', `Updated project: ${updatedProject.title}`);
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const projectToDelete = projects.find(p => p.id === id);
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (projectToDelete) {
        await logAction('deleted', 'projects', `Deleted project: ${projectToDelete.title}`);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  // Leadership Actions
  const addMember = async (member: Omit<LeadershipMember, 'id'>, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => {
    try {
      const roleTypeMap: Record<string, any> = {
        executive: 'Executive',
        board: 'Board',
        chief: 'Chief',
        advisor: 'Advisor',
        past_president: 'PastPresident'
      };
      const roleType = roleTypeMap[type];
      const newMember = await leadershipAPI.create(member, roleType);

      setLeadership(prev => {
        if (type === 'advisor') return { ...prev, advisor: newMember };
        const key = type === 'past_president' ? 'pastPresidents' : type;
        return {
          ...prev,
          [key]: [...(prev[key as keyof LeadershipData] as LeadershipMember[]), newMember]
        };
      });
      await logAction('created', 'leadership', `Added ${type} member: ${member.name}`);
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const updateMember = async (updatedMember: LeadershipMember, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => {
    try {
      const roleTypeMap: Record<string, any> = {
        executive: 'Executive',
        board: 'Board',
        chief: 'Chief',
        advisor: 'Advisor',
        past_president: 'PastPresident'
      };
      const roleType = roleTypeMap[type];
      const updated = await leadershipAPI.update(updatedMember.id, updatedMember, roleType);

      // Handle category change or update
      setLeadership(prev => {
        // 1. Remove member from current slot (wherever they are)
        const cleaned: LeadershipData = {
          ...prev,
          advisor: prev.advisor?.id === updated.id ? undefined : prev.advisor,
          executive: prev.executive.filter(m => m.id !== updated.id),
          chief: prev.chief.filter(m => m.id !== updated.id),
          board: prev.board.filter(m => m.id !== updated.id),
          pastPresidents: prev.pastPresidents.filter(m => m.id !== updated.id),
        };

        // 2. Add member to their NEW designated slot
        if (type === 'advisor') {
          return { ...cleaned, advisor: updated };
        } else {
          const key = type === 'past_president' ? 'pastPresidents' : type;
          const list = cleaned[key as keyof LeadershipData] as LeadershipMember[];
          return {
            ...cleaned,
            [key]: [...list, updated].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          };
        }
      });
      await logAction('updated', 'leadership', `Updated ${type} member: ${updatedMember.name}`);
    } catch (err) {
      console.error('Error updating member:', err);
      throw err;
    }
  };

  const deleteMember = async (id: number, type: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => {
    try {
      // Find the member for logging before deleting
      const findMember = () => {
        if (leadership.advisor?.id === id) return leadership.advisor;
        const listsToSearch: (keyof LeadershipData)[] = ['executive', 'chief', 'board', 'pastPresidents'];
        for (const listKey of listsToSearch) {
          const m = (leadership[listKey] as LeadershipMember[]).find(em => em.id === id);
          if (m) return m;
        }
        return null;
      };

      const memberToDelete = findMember();
      await leadershipAPI.delete(id);

      setLeadership(prev => {
        const newData: LeadershipData = {
          ...prev,
          advisor: prev.advisor?.id === id ? undefined : prev.advisor,
          executive: prev.executive.filter(m => m.id !== id),
          chief: prev.chief.filter(m => m.id !== id),
          board: prev.board.filter(m => m.id !== id),
          pastPresidents: prev.pastPresidents.filter(m => m.id !== id),
        };
        return newData;
      });

      if (memberToDelete) {
        await logAction('deleted', 'leadership', `Deleted ${type} member: ${memberToDelete.name}`);
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      throw err;
    }
  };

  const bulkUpdateLeadership = async (updates: { id: number; sort_order?: number }[]) => {
    try {
      // Optimistic update for instant UI feedback
      setLeadership(prev => {
        const newData = { ...prev };
        (['executive', 'chief', 'board', 'pastPresidents'] as const).forEach(type => {
          newData[type] = newData[type].map(member => {
            const update = updates.find(u => u.id === member.id);
            if (update && update.sort_order !== undefined) {
              return { ...member, sortOrder: update.sort_order };
            }
            return member;
          });
        });
        return newData;
      });

      await leadershipAPI.bulkUpdate(updates);
    } catch (err) {
      console.error('Error bulk updating leadership:', err);
      const freshData = await leadershipAPI.getAll();
      setLeadership(freshData);
      throw err;
    }
  };

  // Gallery Actions (now Supabase-backed)
  const addImage = async (image: Omit<GalleryImage, 'id'>) => {
    try {
      const newImage = await galleryAPI.create(image);
      setGallery(prev => [...prev, newImage]);
      await logAction('created', 'gallery', `Added gallery image: ${image.alt}`);
    } catch (err) {
      console.error('Error adding gallery image:', err);
      throw err;
    }
  };

  const updateImage = async (id: number, updates: Partial<GalleryImage>) => {
    try {
      const updated = await galleryAPI.update(id, updates);
      setGallery(prev => prev.map(img => img.id === updated.id ? updated : img));
      await logAction('updated', 'gallery', `Updated gallery image: ${updated.alt}`);
    } catch (err) {
      console.error('Error updating gallery image:', err);
      throw err;
    }
  };

  const deleteImage = async (id: number) => {
    try {
      const imageToDelete = gallery.find(img => img.id === id);
      await galleryAPI.delete(id);
      setGallery(prev => prev.filter(img => img.id !== id));
      if (imageToDelete) {
        await logAction('deleted', 'gallery', `Deleted gallery image: ${imageToDelete.alt}`);
      }
    } catch (err) {
      console.error('Error deleting gallery image:', err);
      throw err;
    }
  };

  const bulkUpdateGallery = async (updates: { id: number; showOnHome?: boolean; sortOrder?: number }[]) => {
    try {
      const dbUpdates = updates.map(u => ({
        id: u.id,
        show_on_home: u.showOnHome,
        sort_order: u.sortOrder
      }));
      await galleryAPI.bulkUpdate(dbUpdates);
      
      setGallery(prev => prev.map(img => {
        const update = updates.find(u => u.id === img.id);
        if (update) {
          return {
            ...img,
            showOnHome: update.showOnHome !== undefined ? update.showOnHome : img.showOnHome,
            sortOrder: update.sortOrder !== undefined ? update.sortOrder : img.sortOrder
          };
        }
        return img;
      }));
    } catch (err) {
      console.error('Error bulk updating gallery:', err);
      throw err;
    }
  };


  // Award Actions
  const addAward = async (award: Omit<Award, 'id'>) => {
    try {
      const nextSortOrder = awards.length > 0 
        ? Math.max(...awards.map(a => a.sortOrder || 0)) + 1 
        : 0;
      const newAward = await awardsAPI.create({ ...award, sortOrder: nextSortOrder });
      setAwards(prev => [...prev, newAward].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      await logAction('created', 'awards', `Added award: ${award.title}`);
    } catch (err) {
      console.error('Error adding award:', err);
      throw err;
    }
  };

  const updateAward = async (id: number, updates: Partial<Award>) => {
    try {
      const updated = await awardsAPI.update(id, updates);
      setAwards(prev => prev.map(a => a.id === updated.id ? updated : a));
      await logAction('updated', 'awards', `Updated award: ${updated.title}`);
    } catch (err) {
      console.error('Error updating award:', err);
      throw err;
    }
  };

  const deleteAward = async (id: number) => {
    try {
      const awardToDelete = awards.find(a => a.id === id);
      await awardsAPI.delete(id);
      setAwards(prev => prev.filter(a => a.id !== id));
      if (awardToDelete) {
        await logAction('deleted', 'awards', `Deleted award: ${awardToDelete.title}`);
      }
    } catch (err) {
      console.error('Error deleting award:', err);
      throw err;
    }
  };

  const bulkUpdateAwards = async (updates: { id: number; sort_order?: number }[]) => {
    try {
      // Optimistic update
      setAwards(prev => {
        return prev.map(a => {
          const update = updates.find(u => u.id === a.id);
          if (update && update.sort_order !== undefined) {
            return { ...a, sortOrder: update.sort_order };
          }
          return a;
        }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      });

      await awardsAPI.bulkUpdate(updates);
    } catch (err) {
      console.error('Error bulk updating awards:', err);
      const freshData = await awardsAPI.getAll();
      setAwards(freshData);
      throw err;
    }
  };

  // Site Content Actions
  const updateSiteContent = async (key: string, value: string) => {
    try {
      await siteContentAPI.update(key, value);
      setSiteContent(prev => ({ ...prev, [key]: value }));
      await logAction('updated', 'site_content', `Updated ${key}`);
    } catch (err) {
      console.error('Error updating site content:', err);
      throw err;
    }
  };

  const bulkUpdateSiteContent = async (entries: { key: string; value: string }[], section?: string) => {
    try {
      await siteContentAPI.bulkUpdate(entries, section);
      setSiteContent(prev => {
        const updated = { ...prev };
        entries.forEach(({ key, value }) => {
          updated[key] = value;
        });
        return updated;
      });
      await logAction('updated', 'site_content', `Bulk updated ${section || 'multiple'} fields`);
    } catch (err) {
      console.error('Error bulk updating site content:', err);
      throw err;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchData();
  };

  const fetchLogs = async () => {
    try {
      const newLogs = await contentLogsAPI.getAll();
      setLogs(newLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  return (
    <DataContext.Provider value={{
      projects,
      leadership,
      gallery,
      siteContent,
      loading,
      error,
      addProject,
      updateProject,
      deleteProject,
      addMember,
      updateMember,
      deleteMember,
      bulkUpdateLeadership,
      addImage,
      updateImage,
      deleteImage,
      bulkUpdateGallery,
      awards,
      addAward,
      updateAward,
      deleteAward,
      bulkUpdateAwards,
      updateSiteContent,
      bulkUpdateSiteContent,
      logs,
      refreshData,
      fetchLogs
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
