import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_SITE_CONTENT } from '../data';
import type { Award, Project, LeadershipData, GalleryImage, LeadershipMember, SiteContent } from '../types';
import { awardsAPI, projectsAPI, leadershipAPI, galleryAPI, siteContentAPI } from '../lib/supabaseService';

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
  addMember: (member: Omit<LeadershipMember, 'id'>, type: 'executive' | 'board' | 'chief') => Promise<void>;
  updateMember: (member: LeadershipMember, type: 'executive' | 'board' | 'chief') => Promise<void>;
  deleteMember: (id: number, type: 'executive' | 'board' | 'chief') => Promise<void>;
  addImage: (image: Omit<GalleryImage, 'id'>) => Promise<void>;
  updateImage: (id: number, image: Partial<GalleryImage>) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  bulkUpdateGallery: (updates: { id: number; showOnHome?: boolean; sortOrder?: number }[]) => Promise<void>;
  addAward: (award: Omit<Award, 'id'>) => Promise<void>;

  updateAward: (id: number, award: Partial<Award>) => Promise<void>;
  deleteAward: (id: number) => Promise<void>;
  updateSiteContent: (key: string, value: string) => Promise<void>;
  bulkUpdateSiteContent: (entries: { key: string; value: string }[], section?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadership, setLeadership] = useState<LeadershipData>({ executive: [], chief: [], board: [] });
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      const updated = await projectsAPI.update(updatedProject.id, updatedProject);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  // Leadership Actions
  const addMember = async (member: Omit<LeadershipMember, 'id'>, type: 'executive' | 'board' | 'chief') => {
    try {
      const roleType = type === 'executive' ? 'Executive' : type === 'chief' ? 'Chief' : 'Board';
      const newMember = await leadershipAPI.create(member, roleType);

      setLeadership(prev => ({
        ...prev,
        [type]: [...prev[type], newMember]
      }));
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const updateMember = async (updatedMember: LeadershipMember, type: 'executive' | 'board' | 'chief') => {
    try {
      const roleType = type === 'executive' ? 'Executive' : type === 'chief' ? 'Chief' : 'Board';
      const updated = await leadershipAPI.update(updatedMember.id, updatedMember, roleType);

      setLeadership(prev => ({
        ...prev,
        [type]: prev[type].map(m => m.id === updated.id ? updated : m)
      }));
    } catch (err) {
      console.error('Error updating member:', err);
      throw err;
    }
  };

  const deleteMember = async (id: number, type: 'executive' | 'board' | 'chief') => {
    try {
      await leadershipAPI.delete(id);

      setLeadership(prev => ({
        ...prev,
        [type]: prev[type].filter(m => m.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting member:', err);
      throw err;
    }
  };

  // Gallery Actions (now Supabase-backed)
  const addImage = async (image: Omit<GalleryImage, 'id'>) => {
    try {
      const newImage = await galleryAPI.create(image);
      setGallery(prev => [...prev, newImage]);
    } catch (err) {
      console.error('Error adding gallery image:', err);
      throw err;
    }
  };

  const updateImage = async (id: number, updates: Partial<GalleryImage>) => {
    try {
      const updated = await galleryAPI.update(id, updates);
      setGallery(prev => prev.map(img => img.id === updated.id ? updated : img));
    } catch (err) {
      console.error('Error updating gallery image:', err);
      throw err;
    }
  };

  const deleteImage = async (id: number) => {
    try {
      await galleryAPI.delete(id);
      setGallery(prev => prev.filter(img => img.id !== id));
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
      const newAward = await awardsAPI.create(award);
      setAwards(prev => [newAward, ...prev]);
    } catch (err) {
      console.error('Error adding award:', err);
      throw err;
    }
  };

  const updateAward = async (id: number, updates: Partial<Award>) => {
    try {
      const updated = await awardsAPI.update(id, updates);
      setAwards(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (err) {
      console.error('Error updating award:', err);
      throw err;
    }
  };

  const deleteAward = async (id: number) => {
    try {
      await awardsAPI.delete(id);
      setAwards(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting award:', err);
      throw err;
    }
  };

  // Site Content Actions
  const updateSiteContent = async (key: string, value: string) => {
    try {
      await siteContentAPI.update(key, value);
      setSiteContent(prev => ({ ...prev, [key]: value }));
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
    } catch (err) {
      console.error('Error bulk updating site content:', err);
      throw err;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchData();
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
      addImage,
      updateImage,
      deleteImage,
      bulkUpdateGallery,
      awards,
      addAward,

      updateAward,
      deleteAward,
      updateSiteContent,
      bulkUpdateSiteContent,
      refreshData
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
