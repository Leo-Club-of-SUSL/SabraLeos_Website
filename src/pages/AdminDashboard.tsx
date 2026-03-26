import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Users, FolderOpen, Image, X, Save, 
  Loader2, Settings, Shield, LogOut, AlertTriangle, CheckCircle, 
  XCircle, Lock, RefreshCw, Mail, Clock, ImagePlus, Trophy, 
  BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';

import { messagesAPI } from '../lib/supabaseService';

import AnalyticsWidget from '../components/admin/AnalyticsWidget';


import { Reorder, motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { securityService } from '../lib/securityService';
import { imageService } from '../lib/imageService';
import type { SecurityLog } from '../lib/securityService';
import type { Project, LeadershipMember, GalleryImage, Award } from '../types';

type TabType = 'projects' | 'leadership' | 'gallery' | 'awards' | 'content' | 'messages' | 'security' | 'analytics' | 'logs';

// ================================================================
// Tab Config
// ================================================================
const TAB_CONFIG: { key: TabType; label: string; icon: any; color: string }[] = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500' },
  { key: 'projects', label: 'Projects', icon: FolderOpen, color: 'text-gray-400' },
  { key: 'leadership', label: 'Team', icon: Users, color: 'text-gray-400' },
  { key: 'gallery', label: 'Gallery', icon: Image, color: 'text-gray-400' },
  { key: 'awards', label: 'Awards', icon: Trophy, color: 'text-gray-400' },
  { key: 'content', label: 'Content', icon: Settings, color: 'text-gray-400' },
  { key: 'messages', label: 'Messages', icon: Mail, color: 'text-gray-400' },
  { key: 'logs', label: 'Activity Log', icon: Clock, color: 'text-gray-400' },
  { key: 'security', label: 'Security', icon: Shield, color: 'text-gray-400' },
];

const CONTENT_SECTIONS = ['hero', 'about', 'contact', 'footer'] as const;

const SECTION_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'image' }[]> = {
  hero: [
    { key: 'hero_title', label: 'Title', type: 'text' },
    { key: 'hero_subtitle', label: 'Subtitle', type: 'text' },
    { key: 'hero_cta', label: 'CTA Button Text', type: 'text' },
    { key: 'hero_tagline', label: 'Tagline', type: 'text' },
    { key: 'site_logo', label: 'Club Logo', type: 'image' },
    { key: 'site_banner', label: 'Homepage Banner', type: 'image' },
    { key: 'hero_bg_image', label: 'Hero Background Image', type: 'image' },
  ],
  about: [
    { key: 'about_mission', label: 'Mission Statement', type: 'textarea' },
    { key: 'about_vision', label: 'Vision Statement', type: 'textarea' },
    { key: 'about_history', label: 'History', type: 'textarea' },
    { key: 'about_values', label: 'Core Values', type: 'textarea' },
  ],
  contact: [
    { key: 'contact_email', label: 'Email Address', type: 'text' },
    { key: 'contact_phone', label: 'Phone Number', type: 'text' },
    { key: 'contact_address', label: 'Address', type: 'text' },
    { key: 'contact_facebook', label: 'Facebook URL', type: 'url' },
    { key: 'contact_instagram', label: 'Instagram URL', type: 'url' },
    { key: 'contact_whatsapp', label: 'WhatsApp Channel URL', type: 'url' },
    { key: 'contact_linkedin', label: 'LinkedIn URL', type: 'url' },
  ],
  footer: [
    { key: 'footer_logo', label: 'Footer Logo (Horizontal)', type: 'image' },
  ],
};


// ================================================================
// Component
// ================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { showToast } = useToast();
  const {
    projects, leadership, gallery, siteContent, awards,
    addProject, updateProject, deleteProject,
    addMember, updateMember, deleteMember,
    addImage, updateImage, deleteImage,
    addAward, updateAward, deleteAward, bulkUpdateAwards,
    bulkUpdateSiteContent, bulkUpdateGallery, bulkUpdateLeadership,
    logs, fetchLogs
  } = useData();


  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isBulkUpload, setIsBulkUpload] = useState(false);

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  // Form States
  const [projectForm, setProjectForm] = useState<Partial<Project>>({ category: 'Upcoming', status: 'Active' });
  const [memberForm, setMemberForm] = useState<Partial<LeadershipMember>>({ type: 'executive', rowNumber: 1 });
  const [imageForm, setImageForm] = useState<Partial<GalleryImage>>({ showOnHome: false, sortOrder: 0 });
  const [awardForm, setAwardForm] = useState<Partial<Award>>({});


  // Content state
  const [contentForm, setContentForm] = useState<Record<string, string>>({});
  const [contentFiles, setContentFiles] = useState<Record<string, File | null>>({});
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSection, setContentSection] = useState<typeof CONTENT_SECTIONS[number]>('hero');


  // Security state
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertEmailSaving, setAlertEmailSaving] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // ---- Handlers ----
  const resetForms = () => {
    setProjectForm({ category: 'Upcoming', status: 'Active' });
    setMemberForm({ type: 'executive', rowNumber: 1 });
    setImageForm({ showOnHome: false, sortOrder: 0 });
    setAwardForm({});
    setContentFiles({});
    setSelectedThumbnail(null);
  };


  const handleAddClick = () => { 
    setEditingItem(null); 
    resetForms(); 
    setSelectedFile(null);
    setSelectedFiles([]);
    setIsBulkUpload(false);
    setIsModalOpen(true); 
  };


  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setSelectedFile(null);
    setSelectedFiles([]);
    setIsBulkUpload(false);
    if (activeTab === 'projects') setProjectForm(item);
    if (activeTab === 'leadership') setMemberForm(item);
    if (activeTab === 'gallery') setImageForm(item);
    if (activeTab === 'awards') setAwardForm(item);
    setIsModalOpen(true);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isBulkUpload && activeTab === 'gallery') {
        setSelectedFiles(Array.from(e.target.files));
      } else {
        const file = e.target.files[0];
        setSelectedFile(file); // Always store the original file
        
        if (activeTab === 'leadership' || activeTab === 'awards') {
          // Open Cropper
          setCropImageSrc(URL.createObjectURL(file));
          setCropModalOpen(true);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        }
      }
    }
  };

  const onCropComplete = (_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  };

  const handleCropSubmit = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels, 'cropped.jpg');
      
      if (activeTab === 'leadership') {
        setSelectedFile(croppedFile);
      } else if (activeTab === 'awards') {
        setSelectedThumbnail(croppedFile);
      }
      
      setCropModalOpen(false);
      setCropImageSrc(null);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    } catch (e) {
      console.error(e);
      showToast('Cropping failed', 'error');
    }
  };


  const handleDeleteClick = (item: any, type?: 'executive' | 'board' | 'chief' | 'advisor' | 'past_president') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this item?',
      onConfirm: async () => {
        try {
          // 1. Delete from storage first
          const imageUrl = item.image || item.image_url || item.src;
          const bucket = activeTab === 'projects' ? 'projects' : 
                         activeTab === 'leadership' ? 'leadership' :
                         activeTab === 'content' ? 'site-content' : undefined;
          
          if (imageUrl) {
            await imageService.deleteFromStorage(imageUrl, bucket);
          }

          // 2. Delete from DB
          if (activeTab === 'projects') await deleteProject(item.id);
          if (activeTab === 'leadership' && type) await deleteMember(item.id, type as any);
          if (activeTab === 'gallery') await deleteImage(item.id);
          if (activeTab === 'awards') await deleteAward(item.id);
          if (activeTab === 'messages') {
            await messagesAPI.delete(item.id);
            fetchMessages();
          }
          showToast('Item deleted successfully', 'success');
        } catch (err) { 
          console.error(err);
          showToast('Failed to delete item', 'error'); 
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let currentImageUrl = '';
    if (activeTab === 'projects') currentImageUrl = projectForm.image || '';
    if (activeTab === 'leadership') currentImageUrl = memberForm.image || '';
    if (activeTab === 'gallery') currentImageUrl = imageForm.src || '';
    if (activeTab === 'awards') currentImageUrl = awardForm.image || '';

    const oldImageUrl = currentImageUrl;

    try {
      // Handle Image Upload if files are selected
      if ((selectedFile || selectedFiles.length > 0)) {
        setUploadingImage(true);
        setUploadProgress(0);
        try {
          if (activeTab === 'gallery' && isBulkUpload && selectedFiles.length > 0) {
            // Bulk Upload for Gallery
            const uploadPromises = selectedFiles.map(async (file, index) => {
              const customName = `${imageForm.alt || 'gallery'}-${index + 1}`;
              const url = await imageService.uploadToCloudinary(file, customName, (p) => {
                // For bulk, we show the overall progress of the current file roughly
                setUploadProgress(Math.round(((index + (p/100)) / selectedFiles.length) * 100));
              });
              // Force showOnHome false for all new uploads (to Library)
              const finalForm = { ...imageForm, src: url, showOnHome: false };
              return addImage(finalForm as Omit<GalleryImage, 'id'>);
            });
            await Promise.all(uploadPromises);
            
            showToast(`Bulk uploaded ${selectedFiles.length} images to Library!`, 'success');
            setIsModalOpen(false);
            resetForms();
            setSelectedFiles([]);
            setSubmitting(false);
            setUploadingImage(false);
            return;
          }

          // Single Upload Logic
          let uploadedUrl = '';
          const fileToUpload = selectedFile!;
          
          if (activeTab === 'gallery' || activeTab === 'awards') {
            // Cloudinary
            const customName = activeTab === 'gallery' ? imageForm.alt : awardForm.title;
            uploadedUrl = await imageService.uploadToCloudinary(fileToUpload, customName, setUploadProgress);

            // Double upload for awards if we have a crop
            if (activeTab === 'awards' && selectedThumbnail) {
              try {
                const thumbUrl = await imageService.uploadToCloudinary(selectedThumbnail, `${customName}_thumb`);
                awardForm.thumbnail = thumbUrl;
              } catch (thumbErr) {
                console.warn('Thumbnail upload failed, falling back to full image:', thumbErr);
              }
            }
          } else {
            // Supabase
            const bucket = activeTab === 'projects' ? 'projects' : 
                           activeTab === 'leadership' ? 'leadership' : 'site-content';
            const customName = activeTab === 'projects' ? projectForm.title : 
                               activeTab === 'leadership' ? memberForm.name : undefined;
            uploadedUrl = await imageService.uploadToSupabase(fileToUpload, bucket, customName, setUploadProgress);
          }

          // If updating and we have a new image, delete the old one from storage
          if (editingItem && oldImageUrl) {
            const bucket = activeTab === 'projects' ? 'projects' : 
                           activeTab === 'leadership' ? 'leadership' : undefined;
            await imageService.deleteFromStorage(oldImageUrl, bucket);
          }

          currentImageUrl = uploadedUrl;
        } catch (err) {
          console.error('Upload process failed:', err);
          showToast(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your environment variables.`, 'error');
          setSubmitting(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
          setUploadProgress(0);
        }
      }

      if (activeTab === 'projects') {
        const finalForm = { ...projectForm, image: currentImageUrl };
        editingItem ? await updateProject(finalForm as Project) : await addProject(finalForm as Omit<Project, 'id'>);
      } else if (activeTab === 'leadership') {
        const finalForm = { ...memberForm, image: currentImageUrl };
        const t = memberForm.type as any;
        editingItem ? await updateMember(finalForm as LeadershipMember, t) : await addMember(finalForm as Omit<LeadershipMember, 'id'>, t);
      } else if (activeTab === 'gallery') {
        // Force new images to Library
        const finalForm = { ...imageForm, src: currentImageUrl, showOnHome: editingItem ? imageForm.showOnHome : false };
        editingItem ? await updateImage(editingItem.id, finalForm as Partial<GalleryImage>) : await addImage(finalForm as Omit<GalleryImage, 'id'>);
      }
 else if (activeTab === 'awards') {
        const finalForm = { ...awardForm, image: currentImageUrl };
        editingItem ? await updateAward(editingItem.id, finalForm as Partial<Award>) : await addAward(finalForm as Omit<Award, 'id'>);
      }
      setIsModalOpen(false);
      resetForms();
      setSelectedFile(null);
      setSelectedThumbnail(null);
      showToast(editingItem ? 'Updated successfully!' : 'Created successfully!', 'success');
    } catch (err) { 
      console.error('Save failed:', err);
      showToast(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`, 'error'); 
    }
    finally { setSubmitting(false); }
  };


  const handleBackToHome = async () => {
    await signOut();
    navigate('/');
  };

  const handleGalleryReorder = async (newOrder: GalleryImage[]) => {
    try {
      const updates = newOrder.map((img, idx) => ({
        id: img.id,
        sortOrder: idx
      }));
      await bulkUpdateGallery(updates);
    } catch (err) {
      console.error(err);
      showToast('Failed to save order', 'error');
    }
  };

  const handleLeadershipReorder = async (newOrder: LeadershipMember[]) => {
    try {
      const updates = newOrder.map((member, idx) => ({
        id: member.id,
        sort_order: idx
      }));
      await bulkUpdateLeadership(updates);
    } catch (err) {
      console.error(err);
      showToast('Failed to save hierarchy order', 'error');
    }
  };

  const moveLeadershipMember = (member: LeadershipMember, groupType: 'executive' | 'board' | 'chief' | 'past_president', direction: 'up' | 'down') => {
    const key = groupType === 'past_president' ? 'pastPresidents' : groupType;
    const items = [...((leadership as any)[key] as LeadershipMember[])].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const idx = items.findIndex(m => m.id === member.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === items.length - 1) return;
    
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    
    handleLeadershipReorder(items);
  };

  const handleToggleShowOnHome = async (img: GalleryImage) => {
    try {
      const newState = !img.showOnHome;
      await updateImage(img.id, { showOnHome: newState });
      showToast(newState ? 'Promoted to Home Page Feed' : 'Moved to Photo Library', 'info');
    } catch { showToast('Failed to update image', 'error'); }
  };

  const moveAward = async (award: Award, direction: 'up' | 'down') => {
    const sortedAwards = [...awards].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const idx = sortedAwards.findIndex(a => a.id === award.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sortedAwards.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sortedAwards[idx], sortedAwards[swapIdx]] = [sortedAwards[swapIdx], sortedAwards[idx]];

    try {
      const updates = sortedAwards.map((a, i) => ({ id: a.id, sort_order: i }));
      await bulkUpdateAwards(updates);
    } catch (err) {
      console.error(err);
      showToast('Failed to save award order', 'error');
    }
  };



  // Content handlers
  const initContentForm = (section: string) => {
    const fields = SECTION_FIELDS[section] || [];
    const form: Record<string, string> = {};
    fields.forEach(f => { form[f.key] = siteContent[f.key] || ''; });
    setContentForm(form);
  };

  const handleContentSectionChange = (section: typeof CONTENT_SECTIONS[number]) => {
    setContentSection(section);
    initContentForm(section);
  };

  const handleContentSave = async () => {
    setContentSaving(true);
    try {
      const entries = { ...contentForm };
      
      // Handle image uploads for content
      for (const [key, file] of Object.entries(contentFiles)) {
        if (file) {
          // Delete old image if exists
          const oldUrl = siteContent[key];
          if (oldUrl) {
            await imageService.deleteFromStorage(oldUrl, 'site-content');
          }
          
          const uploadedUrl = await imageService.uploadToSupabase(file, 'site-content');
          entries[key] = uploadedUrl;
        }
      }

      await bulkUpdateSiteContent(Object.entries(entries).map(([key, value]) => ({ key, value })), contentSection);
      setContentFiles({}); // Clear pending uploads
      showToast(`${contentSection.charAt(0).toUpperCase() + contentSection.slice(1)} content saved!`, 'success');
    } catch (err) { 
      console.error(err);
      showToast('Failed to save content', 'error'); 
    }
    finally { setContentSaving(false); }
  };


  // Security handlers
  const fetchSecurityLogs = async () => {
    setSecurityLoading(true);
    try { setSecurityLogs(await securityService.getRecentLogs(50)); }
    catch { showToast('Failed to load security logs', 'error'); }
    finally { setSecurityLoading(false); }
  };

  const handleAlertEmailSave = async () => {
    setAlertEmailSaving(true);
    try {
      await bulkUpdateSiteContent([{ key: 'alert_email', value: alertEmail }]);
      showToast('Alert email updated!', 'success');
    } catch { showToast('Failed to save alert email', 'error'); }
    finally { setAlertEmailSaving(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate('/admin', { replace: true }); };

  // Message handlers
  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const data = await messagesAPI.getAll();
      setMessages(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'content') initContentForm(contentSection);
    if (tab === 'security') { fetchSecurityLogs(); setAlertEmail(siteContent['alert_email'] || ''); }
    if (tab === 'messages') fetchMessages();
    if (tab === 'logs') {
      setLogsLoading(true);
      fetchLogs().finally(() => setLogsLoading(false));
    }
  };

  useEffect(() => { 
    if (activeTab === 'security') setAlertEmail(siteContent['alert_email'] || ''); 
    if (activeTab === 'messages') fetchMessages();
  }, [siteContent, activeTab]);

  // Counts
  const getTabCount = (tab: TabType) => {
    if (tab === 'projects') return projects.length;
    if (tab === 'leadership') {
      const { advisor, executive, chief, board, pastPresidents } = leadership;
      return (advisor ? 1 : 0) + executive.length + chief.length + board.length + pastPresidents.length;
    }
    if (tab === 'gallery') return gallery.length;
    if (tab === 'awards') return awards.length;
    if (tab === 'messages') return messages.length;
    return null;
  };

  const getEventBadge = (type: string) => {
    const map: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
      login_success: { icon: CheckCircle, label: 'Success', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      login_failed: { icon: XCircle, label: 'Failed', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      brute_force_detected: { icon: AlertTriangle, label: 'Brute Force', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      account_locked: { icon: Lock, label: 'Locked', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      logout: { icon: LogOut, label: 'Logout', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    };
    const m = map[type];
    if (!m) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600"><Shield size={12} /> {type}</span>;
    
    const IconComponent = m.icon;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${m.cls}`}><IconComponent size={12} /> {m.label}</span>;
  };


  // ---- Image Preview Helper ----
  const ImagePreview = ({ url }: { url?: string }) => {
    if (!url) return null;
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 h-32 bg-gray-100 dark:bg-slate-700">
        <img src={url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
  };

  // ================================================================
  // RENDER
  // ================================================================
  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none transition-all text-sm";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackToHome} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400 focus-visible:ring-2 focus-visible:ring-leo-maroon"
              aria-label="Exit dashboard and return to home"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block leading-none mt-1">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Log out of admin account"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" id="admin-main">
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Dashboard sections">
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            const count = getTabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.key}-panel`}
                id={`tab-${tab.key}`}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-leo-maroon)] ${isActive
                  ? 'bg-[var(--color-leo-maroon)] text-white shadow-lg shadow-red-900/20'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700'
                  }`}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
                {count !== null && (
                  <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>


        {/* Main Content Card */}
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {activeTab === 'analytics' ? 'Website Insights' : activeTab === 'content' ? 'Site Content' : activeTab === 'security' ? 'Security Center' : activeTab === 'messages' ? 'Contact Messages' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management`}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {activeTab === 'analytics' && 'Website traffic and visitor insights'}
                {activeTab === 'projects' && 'Manage club projects and events'}
                {activeTab === 'leadership' && 'Update team members and roles'}
                {activeTab === 'gallery' && 'Upload and organize gallery images'}
                {activeTab === 'awards' && 'Manage club awards and milestones'}
                {activeTab === 'content' && 'Edit website text and settings'}
                {activeTab === 'messages' && 'View and manage contact form submissions'}
                {activeTab === 'security' && 'Monitor login activity and alerts'}
              </p>
            </div>
            {['projects', 'leadership', 'gallery', 'awards'].includes(activeTab) && (
              <button 
                onClick={handleAddClick} 
                className="bg-[var(--color-leo-maroon)] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-red-900 transition-all text-sm font-medium shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-leo-maroon"
                aria-label={`Add new ${activeTab.slice(0, -1)}`}
              >
                <Plus size={16} /> Add New
              </button>
            )}

          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* ──── ANALYTICS TAB ──── */}
            {activeTab === 'analytics' && <AnalyticsWidget />}

            {/* ──── PROJECTS TAB ──── */}

            {activeTab === 'projects' && (
              projects.length === 0 ? (
                <EmptyState icon={FolderOpen} text="No projects yet" sub="Add your first project to get started" />
              ) : (
                <div className="grid gap-3">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                      <img src={project.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-100" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${project.category === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            project.category === 'Ongoing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>{project.category}</span>
                          {project.date && <span className="text-xs text-gray-400">{project.date}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(project)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit size={16} /></button>
                         <button onClick={() => handleDeleteClick(project)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>

                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ──── LEADERSHIP TAB ──── */}
            {activeTab === 'leadership' && (
              <div className="space-y-8">
                {/* Advisor Section */}
                <div>
                   <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-leo-gold)] dark:text-[var(--color-leo-gold)] mb-0 flex items-center gap-2">
                        <Users size={14} /> Club Advisor
                      </h3>
                      {!leadership.advisor && (
                        <button onClick={() => { setMemberForm({ type: 'advisor' }); setEditingItem(null); setIsModalOpen(true); }} className="text-[10px] font-black uppercase tracking-widest text-[var(--color-leo-maroon)] hover:underline">+ Set Advisor</button>
                      )}
                   </div>
                   {leadership.advisor ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-white dark:from-red-900/5 dark:to-slate-800 border border-red-100 dark:border-red-900/20 flex items-center gap-4 group">
                         <img src={leadership.advisor.image} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-white dark:border-slate-700 shadow-sm" />
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-tight">{leadership.advisor.name}</h4>
                            <p className="text-[11px] font-bold text-[var(--color-leo-gold)] uppercase tracking-tighter mt-0.5">{leadership.advisor.position}</p>
                         </div>
                         <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(leadership.advisor!)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-blue-500 shadow-sm hover:scale-105 active:scale-95 transition-all"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteClick(leadership.advisor!, 'advisor')} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-red-500 shadow-sm hover:scale-105 active:scale-95 transition-all"><Trash2 size={16} /></button>
                         </div>
                      </div>
                   ) : (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl opacity-50">
                         <p className="text-xs font-medium italic text-gray-400">Advisor not set</p>
                      </div>
                   )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 dark:via-slate-800 to-transparent my-2" />

                {(['executive', 'chief', 'board', 'past_president'] as const).map(groupType => {
                  const key = groupType === 'past_president' ? 'pastPresidents' : groupType;
                  const items = [...((leadership as any)[key] as LeadershipMember[])].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                  return (
                    <div key={groupType}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0">
                           {groupType === 'executive' ? 'Executive Committee' : 
                            groupType === 'chief' ? 'Chief Directors' : 
                            groupType === 'board' ? 'Board of Directors' : 
                            'Past Presidents'}
                        </h3>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 italic block">Use arrows to reorder hierarchy</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl text-center">No members added yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {items.map((member, idx) => (
                            <div
                               key={member.id}
                               className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group bg-white dark:bg-slate-800 hover:shadow-md"
                            >
                              <img src={member.image} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 pointer-events-none" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{member.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-400 truncate">{member.position} {member.type === 'past_president' && `(${member.serviceYear})`}</p>
                                  {groupType === 'executive' && (
                                    <span className="text-[9px] px-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded font-black uppercase tracking-tighter">Line {member.rowNumber || 1}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity items-center">
                                <div className="flex flex-col gap-0.5 border-r border-gray-200 dark:border-slate-700 pr-2 mr-1">
                                  <button disabled={idx === 0} onClick={() => moveLeadershipMember(member, groupType, 'up')} className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><ArrowUp size={14} /></button>
                                  <button disabled={idx === items.length - 1} onClick={() => moveLeadershipMember(member, groupType, 'down')} className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><ArrowDown size={14} /></button>
                                </div>
                                <button onClick={() => handleEditClick(member)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteClick(member, groupType)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ──── GALLERY TAB ──── */}
            {activeTab === 'gallery' && (
              <div className="space-y-12">
                {/* 1. HOME FEED SECTION (TOP) */}
                <div className="relative p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2 tracking-tight">
                        <CheckCircle size={22} className="text-emerald-500" /> Home Page Feed
                      </h3>
                      <p className="text-[11px] font-medium text-emerald-600/60 dark:text-emerald-400/40 uppercase tracking-widest mt-1">
                        Limited selection — These appear on your main homepage
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800/40 rounded-full text-[10px] font-black text-emerald-700 dark:text-emerald-300 shadow-sm">
                      {gallery.filter(i => i.showOnHome).length} VISIBLE
                    </span>
                  </div>

                  {gallery.filter(i => i.showOnHome).length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                      <ImagePlus size={32} className="text-emerald-300 mb-2" />
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-500">Your Home Feed is empty</p>
                      <p className="text-xs text-emerald-700/60">Upload new images or promote them from the library below</p>
                    </div>
                  ) : (
                    <Reorder.Group 
                      axis="x" 
                      values={gallery.filter(i => i.showOnHome).sort((a,b) => a.sortOrder - b.sortOrder)} 
                      onReorder={(newOrder) => handleGalleryReorder(newOrder as GalleryImage[])}
                      className="flex flex-wrap gap-4"
                    >
                      {gallery.filter(i => i.showOnHome).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                        <Reorder.Item 
                          key={item.id} 
                          value={item}
                          className="relative group w-32 aspect-square rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-4 border-white dark:border-slate-800 shadow-xl shadow-emerald-900/5"
                        >
                          <img src={item.src} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-emerald-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <button onClick={() => handleToggleShowOnHome(item)} title="Remove from Home" className="p-2 bg-white rounded-xl text-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-lg"><Trash2 size={16} /></button>
                             <p className="text-[8px] font-black text-white uppercase tracking-tighter">Remove</p>
                          </div>
                          <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm animate-pulse" />
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>

                {/* ──── THE DIVIDER & INSTRUCTIONS ──── */}
                <div className="flex items-center gap-6 py-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
                  <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <RefreshCw size={14} className="text-[var(--color-leo-maroon)] animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Hover images for actions
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
                </div>

                {/* 2. PHOTO LIBRARY SECTION (BOTTOM) */}
                <div className="p-2">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <FolderOpen size={22} className="text-blue-500" /> Photo Library
                      </h3>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">
                         Grouped by Album (Caption)
                      </p>
                    </div>
                  </div>

                  {gallery.filter(i => !i.showOnHome).length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl">
                      <p className="text-gray-400 text-sm font-medium italic">Photos uploaded to the library will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Array.from(new Set(gallery.filter(i => !i.showOnHome).map(img => img.alt || 'Uncategorized'))).map(album => (
                        <div key={album} className="bg-gray-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-gray-100 dark:border-slate-700/50">
                          <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-4 px-2 flex items-center gap-2">
                             <Image size={18} className="text-gray-400" />
                             {album}
                             <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 dark:bg-slate-700 tracking-wider text-gray-500 dark:text-gray-400 rounded-full">
                               {gallery.filter(i => !i.showOnHome && (i.alt || 'Uncategorized') === album).length} PHOTOS
                             </span>
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                            {gallery.filter(i => !i.showOnHome && (i.alt || 'Uncategorized') === album).sort((a,b) => a.sortOrder - b.sortOrder).map((item) => (
                              <div 
                                key={item.id} 
                                className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-slate-800 shadow-md hover:shadow-lg hover:border-blue-500/50 transition-all bg-gray-100 dark:bg-slate-800"
                              >
                                <img src={item.src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-4">
                                   <div className="w-full flex flex-col gap-2">
                                      <button onClick={() => handleToggleShowOnHome(item)} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all">
                                        <Plus size={12} /> Promote to Home
                                      </button>
                                      <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(item)} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[9px] font-bold text-center">Edit</button>
                                        <button onClick={() => handleDeleteClick(item)} className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-200 text-[9px] font-bold text-center">Delete</button>
                                      </div>
                                   </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}




            {activeTab === 'awards' && (
              awards.length === 0 ? (
                <EmptyState icon={Trophy} text="No awards yet" sub="Add your first award to showcase it on the home page" />
              ) : (
                <div className="space-y-3">
                  {awards.map((award, idx) => (
                    <div key={award.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group bg-white dark:bg-slate-800">
                      <img src={award.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-gray-100" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{award.title}</p>
                        <p className="text-xs text-gray-400 truncate">{award.year || 'N/A'}</p>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                        <div className="flex flex-col gap-0.5 border-r border-gray-200 dark:border-slate-700 pr-2 mr-1">
                          <button disabled={idx === 0} onClick={() => moveAward(award, 'up')} className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><ArrowUp size={14} /></button>
                          <button disabled={idx === awards.length - 1} onClick={() => moveAward(award, 'down')} className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><ArrowDown size={14} /></button>
                        </div>
                        <button onClick={() => handleEditClick(award)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteClick(award)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ──── CONTENT TAB ──── */}
            {activeTab === 'content' && (
              <div>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {CONTENT_SECTIONS.map(section => (
                    <button key={section} onClick={() => handleContentSectionChange(section)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${contentSection === section
                        ? 'bg-[var(--color-leo-maroon)] text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >{section}</button>
                  ))}
                </div>
                <div className="space-y-4 max-w-xl">
                  {(SECTION_FIELDS[contentSection] || []).map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea rows={3} className={inputCls} value={contentForm[field.key] || ''} onChange={e => setContentForm({ ...contentForm, [field.key]: e.target.value })} />
                      ) : field.type === 'image' ? (
                        <div className="space-y-2">
                           <ImagePreview url={contentFiles[field.key] ? URL.createObjectURL(contentFiles[field.key]!) : contentForm[field.key]} />
                           <label className={`cursor-pointer w-full p-4 rounded-xl transition-all flex flex-col items-center justify-center border-2 border-dashed ${
                            contentFiles[field.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600 text-gray-400 hover:border-[var(--color-leo-maroon)] hover:text-[var(--color-leo-maroon)]'
                          }`}>
                            <ImagePlus size={24} className="mb-1" />
                            <span className="text-xs font-medium">{contentFiles[field.key] ? 'Replace Selected Image' : 'Click to Upload Image'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setContentFiles(prev => ({ ...prev, [field.key]: e.target.files![0] }));
                              }
                            }} />
                          </label>
                          {contentFiles[field.key] && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700/40 rounded-lg border border-gray-100 dark:border-slate-600">
                              <span className="text-[10px] text-gray-500 truncate flex-1">{contentFiles[field.key]?.name}</span>
                              <button type="button" onClick={() => setContentFiles(prev => ({ ...prev, [field.key]: null }))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input type={field.type === 'url' ? 'url' : 'text'} className={inputCls} value={contentForm[field.key] || ''} onChange={e => setContentForm({ ...contentForm, [field.key]: e.target.value })} />
                      )}
                    </div>
                  ))}
                  <div className="pt-2">
                    <button onClick={handleContentSave} disabled={contentSaving} className="px-6 py-2.5 rounded-xl bg-[var(--color-leo-maroon)] text-white font-bold hover:bg-red-900 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md text-sm">
                      {contentSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ──── SECURITY TAB ──── */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Alert Email Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700/40 dark:to-slate-700/20 rounded-xl p-5 border border-gray-200 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={16} className="text-amber-500" />
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">Alert Email</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Receive email notifications when brute-force attacks are detected.</p>
                  <div className="flex gap-2">
                    <input type="email" placeholder="admin@yourclub.com" className={`${inputCls} flex-1`} value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
                    <button onClick={handleAlertEmailSave} disabled={alertEmailSaving} className="px-4 py-2.5 rounded-xl bg-[var(--color-leo-maroon)] text-white text-sm font-bold hover:bg-red-900 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5">
                      {alertEmailSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                  </div>
                </div>

                {/* Logs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2"><Clock size={16} /> Recent Activity</h3>
                    <button onClick={fetchSecurityLogs} disabled={securityLoading} className="text-xs text-[var(--color-leo-maroon)] hover:underline flex items-center gap-1 disabled:opacity-50">
                      <RefreshCw size={12} className={securityLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </div>
                  {securityLoading && !securityLogs.length ? (
                    <div className="text-center py-12 text-gray-400"><Loader2 size={24} className="animate-spin mx-auto mb-2" />Loading...</div>
                  ) : !securityLogs.length ? (
                    <EmptyState icon={Shield} text="No events yet" sub="Security events will appear here" />
                  ) : (
                    <div className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Event</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold hidden md:table-cell">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                          {securityLogs.map(log => (
                            <tr key={log.id} className={`hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors ${(log.event_type === 'brute_force_detected' || log.event_type === 'account_locked') ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                              }`}>
                              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-4 py-3">{getEventBadge(log.event_type)}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{log.email || '—'}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell max-w-[200px] truncate">{log.details || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ──── ACTIVITY LOG TAB ──── */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2"><Clock size={16} /> Activity Log</h3>
                   <button onClick={() => { setLogsLoading(true); fetchLogs().finally(() => setLogsLoading(false)); }} disabled={logsLoading} className="text-xs text-[var(--color-leo-maroon)] hover:underline flex items-center gap-1 disabled:opacity-50">
                      <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} /> Refresh
                   </button>
                </div>

                {logsLoading && !logs.length ? (
                  <div className="text-center py-12 text-gray-400"><Loader2 size={24} className="animate-spin mx-auto mb-2" />Loading logs...</div>
                ) : logs.length === 0 ? (
                  <EmptyState icon={Clock} text="No activity yet" sub="Content changes will be logged here" />
                ) : (
                  <div className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date & Time</th>
                          <th className="px-4 py-3 font-semibold">Section</th>
                          <th className="px-4 py-3 font-semibold">Action</th>
                          <th className="px-4 py-3 font-semibold">Description</th>
                          <th className="px-4 py-3 font-semibold">Performed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                {log.section}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                log.action === 'created' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                log.action === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs min-w-[200px]">
                              {log.description}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                              {log.performedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ──── MESSAGES TAB ──── */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2"><Mail size={16} /> Recent Submissions</h3>
                   <button onClick={fetchMessages} disabled={messagesLoading} className="text-xs text-[var(--color-leo-maroon)] hover:underline flex items-center gap-1 disabled:opacity-50">
                      <RefreshCw size={12} className={messagesLoading ? 'animate-spin' : ''} /> Refresh
                   </button>
                </div>

                {messagesLoading && !messages.length ? (
                  <div className="text-center py-12 text-gray-400"><Loader2 size={24} className="animate-spin mx-auto mb-2" />Loading messages...</div>
                 ) : messages.length === 0 ? (
                  <EmptyState icon={Mail} text="No messages yet" sub="Contact form submissions will appear here" />
                ) : (
                  <div className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Sender</th>
                          <th className="px-4 py-3 font-semibold">Preview</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {messages.map(msg => (
                          <tr 
                            key={msg.id} 
                            onClick={() => { setSelectedMessage(msg); setIsMessageModalOpen(true); }}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-[var(--color-leo-maroon)]/10 text-[var(--color-leo-maroon)] flex items-center justify-center font-bold text-[10px]">
                                  {msg.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-800 dark:text-white truncate max-w-[120px]">{msg.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{msg.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate leading-relaxed italic">
                              "{msg.message}"
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedMessage(msg); setIsMessageModalOpen(true); }} 
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  aria-label="View message details"
                                >
                                  <Plus size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(msg); }} 
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  aria-label="Delete message"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* ──── CROP MODAL ──── */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden w-full max-w-lg flex flex-col h-[70vh] shadow-2xl">
             <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
               <h3 className="font-bold text-gray-800 dark:text-white">Crop Image</h3>
               <button onClick={() => { setCropModalOpen(false); setCropImageSrc(null); cropImageSrc && URL.revokeObjectURL(cropImageSrc); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400">
                  <X size={20} />
               </button>
             </div>
             <div className="relative flex-1 bg-gray-900 w-full min-h-[300px]">
               <Cropper
                 image={cropImageSrc}
                 crop={crop}
                 zoom={zoom}
                 aspect={1}
                 onCropChange={setCrop}
                 onCropComplete={onCropComplete}
                 onZoomChange={setZoom}
                 cropShape="round"
                 showGrid={false}
               />
             </div>
             <div className="p-6 border-t border-gray-100 dark:border-slate-700">
                <input 
                  type="range" 
                  value={zoom} 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  aria-label="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  className="w-full mb-6 accent-[var(--color-leo-maroon)]" 
                />
                <button 
                  onClick={handleCropSubmit} 
                  className="w-full py-3 bg-[var(--color-leo-maroon)] text-white rounded-xl font-bold shadow-md hover:bg-red-800 active:scale-95 transition-all"
                >
                  Apply Crop
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ──── MODAL ──── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}
            style={{ animation: 'dialogPop 0.2s ease-out' }}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{editingItem ? 'Edit' : 'Add New'} {
                activeTab === 'leadership' ? 'Member' : 
                activeTab === 'gallery' ? 'Image' : 
                activeTab === 'awards' ? 'Award' : 'Project'
              }</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {activeTab === 'projects' && (<>
                <FormField label="Title"><input required className={inputCls} value={projectForm.title || ''} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} /></FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Category">
                    <select className={inputCls} value={projectForm.category} onChange={e => setProjectForm({ ...projectForm, category: e.target.value as any })}>
                      <option value="Completed">Completed</option><option value="Ongoing">Ongoing</option><option value="Upcoming">Upcoming</option>
                    </select>
                  </FormField>
                  <FormField label="Date/Status"><input className={inputCls} value={projectForm.date || projectForm.status || ''} onChange={e => setProjectForm({ ...projectForm, date: e.target.value, status: e.target.value })} placeholder="e.g. Oct 2023" /></FormField>
                </div>
                <FormField label="Description"><textarea required rows={3} className={inputCls} value={projectForm.description || ''} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} /></FormField>
                <ImageUploadField 
                  label="Image" 
                  onFileChange={handleFileChange}
                  selectedFile={selectedFile}
                  uploading={uploadingImage}
                  progress={uploadProgress}
                />

                <ImagePreview url={selectedFile ? URL.createObjectURL(selectedFile) : projectForm.image} />
              </>)}
              {activeTab === 'leadership' && (<>
                <FormField label="Name"><input required className={inputCls} value={memberForm.name || ''} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} /></FormField>
                <FormField label="Position"><input required className={inputCls} value={memberForm.position || ''} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} /></FormField>
                <FormField label="Type">
                  <select className={inputCls} value={memberForm.type} onChange={e => setMemberForm({ ...memberForm, type: e.target.value as any })}>
                    <option value="advisor">Club Advisor</option>
                    <option value="executive">Executive Committee</option>
                    <option value="chief">Chief Director</option>
                    <option value="board">Board of Director</option>
                    <option value="past_president">Past President</option>
                  </select>
                </FormField>
                {memberForm.type === 'executive' && (
                  <FormField label="Arrange in Line (Row)">
                    <select className={inputCls} value={memberForm.rowNumber || 1} onChange={e => setMemberForm({ ...memberForm, rowNumber: parseInt(e.target.value) })}>
                      <option value={1}>Line 1 (Top)</option>
                      <option value={2}>Line 2 (Middle)</option>
                      <option value={3}>Line 3 (Bottom)</option>
                    </select>
                  </FormField>
                )}
                {memberForm.type === 'past_president' && (
                  <FormField label="Service Year"><input required className={inputCls} value={memberForm.serviceYear || ''} onChange={e => setMemberForm({ ...memberForm, serviceYear: e.target.value })} placeholder="e.g. 2022/2023" /></FormField>
                )}
                <ImageUploadField 
                  label="Image" 
                  onFileChange={handleFileChange}
                  selectedFile={selectedFile}
                  uploading={uploadingImage}
                  progress={uploadProgress}
                />

                <ImagePreview url={selectedFile ? URL.createObjectURL(selectedFile) : memberForm.image} />
              </>)}
              {activeTab === 'gallery' && (<>
                {!editingItem && (
                  <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-4">
                    <button type="button" onClick={() => { setIsBulkUpload(false); setSelectedFiles([]); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isBulkUpload ? 'bg-white dark:bg-slate-600 shadow-sm text-[var(--color-leo-maroon)]' : 'text-gray-500 hover:text-gray-700'}`}>
                      Single Upload
                    </button>
                    <button type="button" onClick={() => { setIsBulkUpload(true); setSelectedFile(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isBulkUpload ? 'bg-white dark:bg-slate-600 shadow-sm text-[var(--color-leo-maroon)]' : 'text-gray-500 hover:text-gray-700'}`}>
                      Bulk Upload
                    </button>
                  </div>
                )}
                <FormField label={isBulkUpload ? "Album Name / Event Prefix" : "Album Name (Caption)"}>
                  <input required className={inputCls} value={imageForm.alt || ''} onChange={e => setImageForm({ ...imageForm, alt: e.target.value })} placeholder="e.g. Induction 2024" />
                </FormField>
                <ImageUploadField 
                  label={isBulkUpload ? "Select Images" : "Image"} 
                  onFileChange={handleFileChange}
                  selectedFile={isBulkUpload ? null : selectedFile}
                  multiple={isBulkUpload}
                  uploading={uploadingImage}
                  progress={uploadProgress}
                />
                
                {isBulkUpload && selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span>Selected Files ({selectedFiles.length})</span>
                      <button type="button" onClick={() => setSelectedFiles([])} className="text-red-500 hover:underline">Clear All</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
                          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!isBulkUpload && <ImagePreview url={selectedFile ? URL.createObjectURL(selectedFile) : imageForm.src} />}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Show on Home Page</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={imageForm.showOnHome ?? true} onChange={e => setImageForm({ ...imageForm, showOnHome: e.target.checked })} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
                {!isBulkUpload && <FormField label="Sort Order"><input type="number" className={inputCls} value={imageForm.sortOrder || 0} onChange={e => setImageForm({ ...imageForm, sortOrder: parseInt(e.target.value) || 0 })} /></FormField>}
              </>)}

              {activeTab === 'awards' && (<>
                <FormField label="Award Title"><input required className={inputCls} value={awardForm.title || ''} onChange={e => setAwardForm({ ...awardForm, title: e.target.value })} placeholder="e.g. Best Club Award" /></FormField>
                <FormField label="Award Year"><input className={inputCls} value={awardForm.year || ''} onChange={e => setAwardForm({ ...awardForm, year: e.target.value })} placeholder="e.g. 2024/2025" /></FormField>
                <FormField label="Description"><textarea rows={2} className={inputCls} value={awardForm.description || ''} onChange={e => setAwardForm({ ...awardForm, description: e.target.value })} placeholder="Briefly describe the award..." /></FormField>
                <ImageUploadField 
                  label="Award Image" 
                  onFileChange={handleFileChange}
                  selectedFile={selectedFile}
                  uploading={uploadingImage}
                  progress={uploadProgress}
                />

                <ImagePreview url={selectedFile ? URL.createObjectURL(selectedFile) : awardForm.image} />
              </>)}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[var(--color-leo-maroon)] text-white text-sm font-bold hover:bg-red-900 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {editingItem ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
            <style>{`@keyframes dialogPop { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
          </div>
        </div>
      )}
      
      {/* ──── MESSAGE DETAIL MODAL ──── */}
      {isMessageModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsMessageModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}
            style={{ animation: 'dialogPop 0.2s ease-out' }}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Mail size={18} className="text-[var(--color-leo-gold)]" /> Message Details
              </h3>
              <button onClick={() => setIsMessageModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Sender Name</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{selectedMessage.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Received On</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {new Date(selectedMessage.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{selectedMessage.email}</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-xs font-bold text-[var(--color-leo-maroon)] hover:underline flex items-center gap-1">
                    Reply <ArrowLeft size={12} className="rotate-180" />
                  </a>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Message Content</p>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed shadow-inner italic">
                  "{selectedMessage.message}"
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => {
                   setIsMessageModalOpen(false);
                   handleDeleteClick(selectedMessage);
                }} 
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete Message
              </button>
              <button 
                onClick={() => setIsMessageModalOpen(false)} 
                className="px-6 py-2.5 rounded-xl bg-[var(--color-leo-maroon)] text-white text-sm font-bold hover:bg-red-900 transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      </main>
    </div>
  );
};



// ================================================================
// Helpers
// ================================================================
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{label}</label>
    {children}
  </div>
);

const ImageUploadField = ({ label, onFileChange, selectedFile, uploading, multiple, progress = 0 }: any) => (
  <FormField label={label}>
    <div className="space-y-4">
      <label className={`cursor-pointer w-full p-8 rounded-2xl transition-all flex flex-col items-center justify-center border-2 border-dashed relative overflow-hidden ${
        selectedFile || multiple ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600 text-gray-400 hover:border-[var(--color-leo-maroon)] hover:text-[var(--color-leo-maroon)]'
      }`}>
        {uploading && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${progress || 30}%` }}
            className="absolute bottom-0 left-0 w-full bg-emerald-500/10 pointer-events-none transition-all duration-300"
          />
        )}

        {uploading ? (
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 size={32} className="animate-spin text-[var(--color-leo-maroon)] mb-2" />
            <span className="text-sm font-black text-[var(--color-leo-maroon)] uppercase tracking-widest">
              {progress > 0 ? `${progress}% Uploaded` : 'Processing...'}
            </span>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <ImagePlus size={32} className="mb-2" />
            <span className="text-sm font-bold">{selectedFile ? 'Replace Image' : multiple ? 'Select Multiple Images' : 'Select Image to Upload'}</span>
            <span className="text-[10px] opacity-60 mt-1">PNG, JPG or WebP (Max 10MB)</span>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={uploading} multiple={multiple} />
      </label>

      {uploading && (
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress || 30}%` }}
            className="h-full bg-gradient-to-r from-[var(--color-leo-maroon)] to-[var(--color-leo-gold)]"
          />
        </div>
      )}
      
      {selectedFile && !uploading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/40 rounded-lg border border-gray-100 dark:border-slate-700">
          <Image size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 font-medium">{selectedFile.name}</span>
          <button type="button" onClick={() => onFileChange({ target: { files: null } } as any)} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  </FormField>
);

const EmptyState = ({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Icon size={28} className="text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-gray-500 dark:text-gray-400 font-medium">{text}</p>
    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{sub}</p>
  </div>
);

export default AdminDashboard;
