import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, Users, FolderOpen, Image, X, Save, Loader2,
  Settings, Eye, EyeOff, Shield, LogOut, AlertTriangle, CheckCircle, XCircle,
  Lock, RefreshCw, Mail, Clock, ImagePlus
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { securityService } from '../lib/securityService';
import type { SecurityLog } from '../lib/securityService';
import type { Project, LeadershipMember, GalleryImage } from '../types';

type TabType = 'projects' | 'leadership' | 'gallery' | 'content' | 'security';

// ================================================================
// Tab Config
// ================================================================
const TAB_CONFIG: { key: TabType; label: string; icon: typeof FolderOpen; color: string }[] = [
  { key: 'projects', label: 'Projects', icon: FolderOpen, color: 'bg-blue-500' },
  { key: 'leadership', label: 'Team', icon: Users, color: 'bg-emerald-500' },
  { key: 'gallery', label: 'Gallery', icon: Image, color: 'bg-purple-500' },
  { key: 'content', label: 'Content', icon: Settings, color: 'bg-orange-500' },
  { key: 'security', label: 'Security', icon: Shield, color: 'bg-red-600' },
];

const CONTENT_SECTIONS = ['hero', 'about', 'contact', 'footer'] as const;

const SECTION_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'textarea' | 'url' }[]> = {
  hero: [
    { key: 'hero_title', label: 'Title', type: 'text' },
    { key: 'hero_subtitle', label: 'Subtitle', type: 'text' },
    { key: 'hero_cta', label: 'CTA Button Text', type: 'text' },
    { key: 'hero_tagline', label: 'Tagline', type: 'text' },
    { key: 'hero_bg_image', label: 'Background Image URL', type: 'url' },
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
  ],
  footer: [
    { key: 'footer_club_name', label: 'Club Name', type: 'text' },
    { key: 'footer_sponsor', label: 'Sponsor Text', type: 'text' },
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
    projects, leadership, gallery, siteContent,
    addProject, updateProject, deleteProject,
    addMember, updateMember, deleteMember,
    addImage, updateImage, deleteImage,
    bulkUpdateSiteContent
  } = useData();

  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [projectForm, setProjectForm] = useState<Partial<Project>>({ category: 'Upcoming', status: 'Active' });
  const [memberForm, setMemberForm] = useState<Partial<LeadershipMember>>({ type: 'executive' });
  const [imageForm, setImageForm] = useState<Partial<GalleryImage>>({ showOnHome: true, sortOrder: 0 });

  // Content state
  const [contentForm, setContentForm] = useState<Record<string, string>>({});
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSection, setContentSection] = useState<typeof CONTENT_SECTIONS[number]>('hero');

  // Security state
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertEmailSaving, setAlertEmailSaving] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // ---- Handlers ----
  const resetForms = () => {
    setProjectForm({ category: 'Upcoming', status: 'Active' });
    setMemberForm({ type: 'executive' });
    setImageForm({ showOnHome: true, sortOrder: 0 });
  };

  const handleAddClick = () => { setEditingItem(null); resetForms(); setIsModalOpen(true); };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'projects') setProjectForm(item);
    if (activeTab === 'leadership') setMemberForm(item);
    if (activeTab === 'gallery') setImageForm(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, type?: 'executive' | 'board') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this item?',
      onConfirm: async () => {
        try {
          if (activeTab === 'projects') await deleteProject(id);
          if (activeTab === 'leadership' && type) await deleteMember(id, type);
          if (activeTab === 'gallery') await deleteImage(id);
          showToast('Item deleted successfully', 'success');
        } catch { showToast('Failed to delete item', 'error'); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === 'projects') {
        editingItem ? await updateProject(projectForm as Project) : await addProject(projectForm as Omit<Project, 'id'>);
      } else if (activeTab === 'leadership') {
        const t = memberForm.type as 'executive' | 'board';
        editingItem ? await updateMember(memberForm as LeadershipMember, t) : await addMember(memberForm as Omit<LeadershipMember, 'id'>, t);
      } else if (activeTab === 'gallery') {
        editingItem ? await updateImage(editingItem.id, imageForm as Partial<GalleryImage>) : await addImage(imageForm as Omit<GalleryImage, 'id'>);
      }
      setIsModalOpen(false);
      resetForms();
      showToast(editingItem ? 'Updated successfully!' : 'Created successfully!', 'success');
    } catch { showToast('Failed to save. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleToggleShowOnHome = async (img: GalleryImage) => {
    try {
      await updateImage(img.id, { showOnHome: !img.showOnHome });
      showToast(img.showOnHome ? 'Hidden from home page' : 'Now visible on home page', 'info');
    } catch { showToast('Failed to update image', 'error'); }
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
      await bulkUpdateSiteContent(Object.entries(contentForm).map(([key, value]) => ({ key, value })));
      showToast(`${contentSection.charAt(0).toUpperCase() + contentSection.slice(1)} content saved!`, 'success');
    } catch { showToast('Failed to save content', 'error'); }
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'content') initContentForm(contentSection);
    if (tab === 'security') { fetchSecurityLogs(); setAlertEmail(siteContent['alert_email'] || ''); }
  };

  useEffect(() => { if (activeTab === 'security') setAlertEmail(siteContent['alert_email'] || ''); }, [siteContent, activeTab]);

  // Counts
  const getTabCount = (tab: TabType) => {
    if (tab === 'projects') return projects.length;
    if (tab === 'leadership') return leadership.executive.length + leadership.board.length;
    if (tab === 'gallery') return gallery.length;
    return null;
  };

  const getEventBadge = (type: string) => {
    const map: Record<string, { icon: typeof CheckCircle; label: string; cls: string }> = {
      login_success: { icon: CheckCircle, label: 'Success', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      login_failed: { icon: XCircle, label: 'Failed', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      brute_force_detected: { icon: AlertTriangle, label: 'Brute Force', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      account_locked: { icon: Lock, label: 'Locked', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      logout: { icon: LogOut, label: 'Logout', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    };
    const m = map[type] || { icon: Shield, label: type, cls: 'bg-gray-100 text-gray-600' };
    const Icon = m.icon;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${m.cls}`}><Icon size={12} /> {m.label}</span>;
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
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            const count = getTabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                    ? 'bg-[var(--color-leo-maroon)] text-white shadow-lg shadow-red-900/20'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700'
                  }`}
              >
                <Icon size={16} />
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {activeTab === 'content' ? 'Site Content' : activeTab === 'security' ? 'Security Center' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management`}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {activeTab === 'projects' && 'Manage club projects and events'}
                {activeTab === 'leadership' && 'Update team members and roles'}
                {activeTab === 'gallery' && 'Upload and organize gallery images'}
                {activeTab === 'content' && 'Edit website text and settings'}
                {activeTab === 'security' && 'Monitor login activity and alerts'}
              </p>
            </div>
            {['projects', 'leadership', 'gallery'].includes(activeTab) && (
              <button onClick={handleAddClick} className="bg-[var(--color-leo-maroon)] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-red-900 transition-all text-sm font-medium shadow-md hover:shadow-lg">
                <Plus size={16} /> Add New
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-6">
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
                        <button onClick={() => handleDeleteClick(project.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ──── LEADERSHIP TAB ──── */}
            {activeTab === 'leadership' && (
              <div className="space-y-8">
                {(['executive', 'board'] as const).map(groupType => {
                  const members = leadership[groupType];
                  return (
                    <div key={groupType}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{groupType === 'executive' ? 'Executive Committee' : 'Board of Directors'}</h3>
                      {members.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4">No members added yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                              <img src={member.image} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{member.name}</p>
                                <p className="text-xs text-gray-400 truncate">{member.position}</p>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(member)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteClick(member.id, groupType)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
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
              gallery.length === 0 ? (
                <EmptyState icon={ImagePlus} text="Gallery is empty" sub="Add images to showcase your club's activities" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {gallery.map(img => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-slate-700">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-end p-3 gap-2">
                        <p className="text-white text-xs font-medium truncate w-full text-center">{img.alt}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleShowOnHome(img)} className={`p-2 rounded-full text-white transition-colors ${img.showOnHome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-500 hover:bg-gray-600'}`}>
                            {img.showOnHome ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button onClick={() => handleEditClick(img)} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteClick(img.id)} className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${img.showOnHome ? 'bg-emerald-400' : 'bg-gray-400'}`} />
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
                      ) : (
                        <input type={field.type} className={inputCls} value={contentForm[field.key] || ''} onChange={e => setContentForm({ ...contentForm, [field.key]: e.target.value })} />
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
          </div>
        </div>
      </div>

      {/* ──── MODAL ──── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}
            style={{ animation: 'dialogPop 0.2s ease-out' }}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{editingItem ? 'Edit' : 'Add New'} {activeTab === 'leadership' ? 'Member' : activeTab === 'gallery' ? 'Image' : 'Project'}</h3>
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
                <FormField label="Image URL"><input type="url" required className={inputCls} value={projectForm.image || ''} onChange={e => setProjectForm({ ...projectForm, image: e.target.value })} placeholder="https://..." /></FormField>
                <ImagePreview url={projectForm.image} />
              </>)}
              {activeTab === 'leadership' && (<>
                <FormField label="Name"><input required className={inputCls} value={memberForm.name || ''} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} /></FormField>
                <FormField label="Position"><input required className={inputCls} value={memberForm.position || ''} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} /></FormField>
                <FormField label="Type">
                  <select className={inputCls} value={memberForm.type} onChange={e => setMemberForm({ ...memberForm, type: e.target.value as any })}>
                    <option value="executive">Executive Committee</option><option value="board">Board of Directors</option>
                  </select>
                </FormField>
                <FormField label="Image URL"><input type="url" required className={inputCls} value={memberForm.image || ''} onChange={e => setMemberForm({ ...memberForm, image: e.target.value })} placeholder="https://..." /></FormField>
                <ImagePreview url={memberForm.image} />
              </>)}
              {activeTab === 'gallery' && (<>
                <FormField label="Caption"><input required className={inputCls} value={imageForm.alt || ''} onChange={e => setImageForm({ ...imageForm, alt: e.target.value })} /></FormField>
                <FormField label="Image URL"><input type="url" required className={inputCls} value={imageForm.src || ''} onChange={e => setImageForm({ ...imageForm, src: e.target.value })} placeholder="https://..." /></FormField>
                <ImagePreview url={imageForm.src} />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Show on Home Page</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={imageForm.showOnHome ?? true} onChange={e => setImageForm({ ...imageForm, showOnHome: e.target.checked })} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
                <FormField label="Sort Order"><input type="number" className={inputCls} value={imageForm.sortOrder || 0} onChange={e => setImageForm({ ...imageForm, sortOrder: parseInt(e.target.value) || 0 })} /></FormField>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
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

const EmptyState = ({ icon: Icon, text, sub }: { icon: typeof FolderOpen; text: string; sub: string }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Icon size={28} className="text-gray-300 dark:text-gray-500" />
    </div>
    <p className="text-gray-500 dark:text-gray-400 font-medium">{text}</p>
    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{sub}</p>
  </div>
);

export default AdminDashboard;
