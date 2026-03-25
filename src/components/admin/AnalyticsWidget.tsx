import { useState, useEffect } from 'react';
import { BarChart3, Users, Eye, Activity, ExternalLink, Info, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalUsers: string;
  pageViews: string;
  activeUsers: string;
  topPage: string;
  lastUpdated?: string;
  error?: string;
  setupNeeded?: boolean;
}

const AnalyticsWidget = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Cloudflare Pages function endpoint
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData({ 
        totalUsers: "0", pageViews: "0", activeUsers: "0", topPage: "N/A", 
        error: "Failed to connect to Analytics server." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const stats = [
    { label: 'Total Visitors', value: loading ? '...' : (data?.totalUsers || '0'), icon: Users, color: 'text-blue-500', sub: 'Last 30 days' },
    { label: 'Page Views', value: loading ? '...' : (data?.pageViews || '0'), icon: Eye, color: 'text-purple-500', sub: 'Last 30 days' },
    { label: 'Active (Live)', value: loading ? '...' : (data?.activeUsers || '0'), icon: Activity, color: 'text-emerald-500', sub: 'Real-time' },
    { label: 'Top Page', value: loading ? '...' : (data?.topPage || '/'), icon: BarChart3, color: 'text-amber-500', sub: 'Path' },
  ];

  if (data?.setupNeeded) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-dashed border-amber-200 dark:border-amber-900/30 text-center max-w-2xl mx-auto shadow-xl">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
           <Key size={32} className="text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Setup Your Analytics Proxy</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
          Almost there! To show live data, you need to add your Google Service Account credentials to Netlify's environment variables.
        </p>
        
        <div className="grid gap-3 text-left mb-8 max-w-sm mx-auto">
           <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
              <span className="w-6 h-6 rounded-lg bg-[var(--color-leo-maroon)] text-white text-[10px] font-black flex items-center justify-center italic shrink-0">1</span>
              <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">GA4_PROPERTY_ID</p>
           </div>
           <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
              <span className="w-6 h-6 rounded-lg bg-[var(--color-leo-maroon)] text-white text-[10px] font-black flex items-center justify-center italic shrink-0">2</span>
              <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">GOOGLE_SERVICE_ACCOUNT_EMAIL</p>
           </div>
           <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
              <span className="w-6 h-6 rounded-lg bg-[var(--color-leo-maroon)] text-white text-[10px] font-black flex items-center justify-center italic shrink-0">3</span>
              <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">GOOGLE_PRIVATE_KEY</p>
           </div>
        </div>

        <button 
          onClick={fetchAnalytics}
          className="px-8 py-3 bg-[var(--color-leo-maroon)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-900 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2"
        >
          Check Connection <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Website Analytics</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${data?.error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {data?.error ? data.error : (loading ? "Refreshing Reports..." : `Live as of ${new Date(data?.lastUpdated || Date.now()).toLocaleTimeString()}`)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2.5 bg-gray-100 dark:bg-slate-700 text-gray-500 hover:text-[var(--color-leo-maroon)] rounded-xl transition-all active:scale-95"
              title="Refresh Analytics"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-leo-maroon)] text-white rounded-xl font-bold hover:bg-red-900 transition-all shadow-md hover:shadow-lg text-sm"
            >
              Open Full Dashboard <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm group hover:border-[var(--color-leo-maroon)]/30 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-slate-800 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.sub}</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white mb-1 truncate">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {data?.error && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 dark:text-red-400 font-medium">
              <p className="font-bold mb-1">Analytics Retrieval Failed</p>
              <p>{data.error}</p>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
          <Info size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <p className="font-bold mb-1">Configuration Note</p>
            <p>Reports are fetched via a secure serverless proxy. Property ID used: <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded font-bold font-mono text-[10px]">GA4 API v1beta</code>. If values show "0", verify that the Service Account has <strong>Viewer</strong> access to your GA4 property.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
               <Activity size={32} className="text-blue-500" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">Real-Time Sync</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mb-6">Live session tracking is active. Real-time reports may have a brief reporting delay from Google servers.</p>
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-xs"
            >
              Access Property <ExternalLink size={14} />
            </a>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[var(--color-leo-maroon)]/10 rounded-full flex items-center justify-center mb-4">
               <BarChart3 size={32} className="text-[var(--color-leo-maroon)]" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">Insights Summary</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">Reports are aggregated over the last 30 days to provide a long-term view of your club's growing digital impact.</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
