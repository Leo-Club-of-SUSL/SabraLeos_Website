import { BarChart3, Users, Eye, Activity, ExternalLink, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsWidget = () => {
  const stats = [
    { label: 'Total Visitors', value: 'Collecting...', icon: Users, color: 'text-blue-500', sub: 'Last 30 days' },
    { label: 'Page Views', value: 'Collecting...', icon: Eye, color: 'text-purple-500', sub: 'Last 30 days' },
    { label: 'Active Users', value: '0', icon: Activity, color: 'text-emerald-500', sub: 'Live' },
    { label: 'Top Page', value: 'Pending', icon: BarChart3, color: 'text-amber-500', sub: 'Most visited' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Website Analytics</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Data Collection in Progress</p>
            </div>
          </div>
          <a 
            href="https://analytics.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-leo-maroon)] text-white rounded-xl font-bold hover:bg-red-900 transition-all shadow-md hover:shadow-lg text-sm"
          >
            Open Full Dashboard <ExternalLink size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm group hover:border-[var(--color-leo-maroon)]/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-slate-800 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.sub}</span>
              </div>
              <p className="text-xl font-black text-gray-800 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
          <Info size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <p className="font-bold mb-1">Notice on Google Analytics 4 (GA4)</p>
            <p>Google Analytics has been successfully integrated with ID <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded font-bold">G-57YGDY6C62</code>. Analytics data typically takes <strong>24 to 48 hours</strong> to appear in the dashboard after initial setup. Once Google processes the incoming traffic, real data will be visible on the official platform.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
               <Activity size={32} className="text-blue-500" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">Real-Time Data</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mb-6">Check the "Realtime" report in Google Analytics to see people currently browsing the site!</p>
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-xs"
            >
              Access Reports <ExternalLink size={14} />
            </a>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 opacity-50">
               <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-400 mb-2 text-lg">Charts Unavailable</h4>
            <p className="text-sm text-gray-400 max-w-[250px]">Detailed visual charts will be available here once Google Analytics begins providing reporting data.</p>
        </div>
      </div>
    </div>

  );
};

export default AnalyticsWidget;
