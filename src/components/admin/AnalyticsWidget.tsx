import { BarChart3, Users, Eye, Activity, ExternalLink, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsWidget = () => {
  const stats = [
    { label: 'Total Visitors', value: '1,284', icon: Users, color: 'text-blue-500', sub: 'Last 30 days' },
    { label: 'Page Views', value: '4,592', icon: Eye, color: 'text-purple-500', sub: 'Last 30 days' },
    { label: 'Active Users', value: '84', icon: Activity, color: 'text-emerald-500', sub: 'Last 7 days' },
    { label: 'Top Page', value: '/gallery', icon: BarChart3, color: 'text-amber-500', sub: 'Most visited' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Website Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor your website's performance and visitor engagement.</p>
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
              <p className="text-2xl font-black text-gray-800 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <p className="font-bold mb-1">Notice on Live Data</p>
            <p>For security and privacy reasons, live Google Analytics data is managed exclusively via the official Google Analytics dashboard. The metrics above are placeholders to demonstrate the layout. Please use the button above to access real-time reports.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
             <Activity size={18} className="text-emerald-500" /> Traffic Sources
          </h4>
          <div className="space-y-4">
             {[
               { name: 'Direct', value: 45 },
               { name: 'Social Media', value: 30 },
               { name: 'Organic Search', value: 15 },
               { name: 'Referral', value: 10 }
             ].map(source => (
               <div key={source.name}>
                 <div className="flex justify-between text-xs mb-1.5 font-medium">
                   <span className="text-gray-600 dark:text-gray-400">{source.name}</span>
                   <span className="text-gray-800 dark:text-white">{source.value}%</span>
                 </div>
                 <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${source.value}%` }}
                     transition={{ duration: 1, delay: 0.5 }}
                     className="h-full bg-[var(--color-leo-maroon)]"
                   />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[var(--color-leo-maroon)]/10 rounded-full flex items-center justify-center mb-4">
               <ExternalLink size={32} className="text-[var(--color-leo-maroon)]" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">Detailed Reports</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mb-6">Access audience demographics, behavior flow, and real-time active users.</p>
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-bold text-[var(--color-leo-maroon)] hover:underline"
            >
              Go to Google Analytics &rarr;
            </a>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
