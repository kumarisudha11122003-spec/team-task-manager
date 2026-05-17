import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api';
import { motion } from 'framer-motion';
import { LayoutList, Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowUpRight } from 'lucide-react';

// SVG Donut Component Placeholder for the Right Panel
const DonutPlaceholder = ({ value, isDark }) => (
  <div className="relative w-48 h-48 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="96" cy="96" r="80" fill="none" stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"} strokeWidth="16" />
      <motion.circle 
        cx="96" cy="96" r="80" fill="none" stroke="url(#tealGradient)" strokeWidth="16" strokeLinecap="round"
        initial={{ strokeDasharray: "0 502" }}
        animate={{ strokeDasharray: "380 502" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0099CC" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className={`text-4xl font-extrabold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{value}</span>
      <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-1">TASKS</span>
    </div>
  </div>
);

// Animated Counter / Spinner Center Piece
const CardValue = ({ value, loading, isDark }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!loading) {
      let start = 0;
      const end = parseInt(value);
      if (start === end) return;
      let totalMilisekondsIter = 800;
      let timer = setInterval(() => {
        start += 1;
        setDisplayValue(start);
        if (start === end) clearInterval(timer);
      }, totalMilisekondsIter / (end || 1));
      return () => clearInterval(timer);
    }
  }, [value, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`w-8 h-8 border-2 ${isDark ? 'border-slate-800 border-t-purple-500' : 'border-slate-200 border-t-purple-500'} rounded-full`}
        />
      </div>
    );
  }

  return (
    <div className={`text-5xl font-extrabold py-4 flex items-center justify-center h-16 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
      {displayValue}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [timeAgo, setTimeAgo] = useState('just now');
  const [teamData, setTeamData] = useState([]);
  
  // Dynamically check if the page has light-theme or dark-theme active
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Listen to changes in the theme class to update local state
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark-theme'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    const token = localStorage.getItem('token');
    try {
      const [dashRes, usersRes, tasksRes] = await Promise.all([
        dashboardAPI.get(),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const d = dashRes.data;
      const stats = d.stats || {};
      setData({
        totalTasks: stats.total || 0,
        inProgress: stats.inProgress || 0,
        completed: stats.completed || 0,
        overdue: stats.overdue || 0
      });

      const usersArr = await usersRes.json();
      const tasksArr = await tasksRes.json();
      const users = Array.isArray(usersArr) ? usersArr : (usersArr.users || []);
      const tasks = Array.isArray(tasksArr) ? tasksArr : (tasksArr.tasks || []);

      const enriched = users.map(u => {
        const ut = tasks.filter(t => t.assigned_to === u.id || t.assigned_to === u._id);
        const isOnline = u.lastSeen && (Date.now() - new Date(u.lastSeen).getTime()) < 2 * 60 * 1000;
        return {
          ...u,
          todo: ut.filter(t => t.status === 'todo'),
          inProgress: ut.filter(t => t.status === 'in_progress' || t.status === 'in-progress'),
          done: ut.filter(t => t.status === 'done'),
          total: ut.length,
          isOnline
        };
      });
      setTeamData(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 600);
      setLastFetched(Date.now());
      setTimeAgo('just now');
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Live-update the time-ago string every 30 seconds
  useEffect(() => {
    if (!lastFetched) return;
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - lastFetched) / 1000);
      if (secs < 60) setTimeAgo('just now');
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)} min ago`);
      else setTimeAgo(`${Math.floor(secs / 3600)} hr ago`);
    }, 30000);
    return () => clearInterval(interval);
  }, [lastFetched]);

  const statCards = [
    { label: "TOTAL TASKS", value: data?.totalTasks || 0, color: "#7C5CFC", icon: LayoutList, trend: true, bg: "rgba(124, 92, 252, 0.1)" },
    { label: "IN PROGRESS", value: data?.inProgress || 0, color: "#00E5FF", icon: Clock, bg: "rgba(0, 229, 255, 0.1)" },
    { label: "COMPLETED", value: data?.completed || 0, color: "#00FFA3", icon: CheckCircle2, bg: "rgba(0, 255, 163, 0.1)" },
    { label: "OVERDUE", value: data?.overdue || 0, color: "#FF3D71", icon: AlertCircle, bg: "rgba(255, 61, 113, 0.1)" },
  ];

  if (error) return (
    <div className={`flex-1 flex items-center justify-center h-[calc(100vh-100px)] ${isDark ? 'bg-[#0d0d1a]' : 'bg-[#f4f5f7]'}`}>
      <div className={`text-center p-8 rounded-2xl max-w-md border ${isDark ? 'bg-[#FF3D71]/10 border-[#FF3D71]/20' : 'bg-white border-red-200'}`}>
        <AlertCircle className="w-12 h-12 text-[#FF3D71] mx-auto mb-4" />
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Connection Error</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-[#FF3D71] text-white font-bold rounded-xl hover:bg-[#e63565] transition-all flex items-center gap-2 mx-auto shadow-md">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-['Inter',sans-serif] p-8 overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0d1a]' : 'bg-[#f4f5f7]'}`}>
      <style>{`
        .overview-title {
          font-style: italic;
          background: linear-gradient(90deg, #00E5FF 0%, #0077ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-card-light {
          background-color: ${isDark ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
          box-shadow: ${isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.03)'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card-light:hover {
          transform: translateY(-4px);
          box-shadow: ${isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.08)'};
          border-color: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
        }

        .glow-icon-light {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08));
        }

        .small-caps {
          font-variant: all-small-caps;
          letter-spacing: 0.15em;
        }

        .member-panel-gradient {
          background: ${isDark 
            ? 'linear-gradient(135deg, #0d0d2b 0%, #1a1a4e 100%)' 
            : 'linear-gradient(135deg, #e3e3f6 0%, #c3c3e6 100%)'};
        }

        .distribution-card-light {
          background-color: ${isDark ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
          box-shadow: ${isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.03)'};
        }
      `}</style>

      {/* Header Section */}
      <header className="flex justify-between items-start mb-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-['Syne'] text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] mb-2 leading-tight">Overview</h1>
          <p className="text-slate-400 text-sm font-medium">Monitor your team's velocity and project health</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`px-4 py-2 rounded-full border ${isDark ? 'border-white/5 bg-slate-900/50 text-slate-400' : 'border-slate-200 bg-white text-slate-800'} text-xs font-semibold flex items-center gap-2 shadow-sm`}
        >
          <span className="text-[#00E5FF]">●</span>
          Last updated: {timeAgo}
        </motion.div>
      </header>

      {/* Stats Cards Grid (4 equal cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card-light relative rounded-2xl p-6 overflow-hidden"
          >
            {/* Colored top border line */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: card.color }} />
            
            <div className="flex justify-between items-start mb-4">
              {/* Circular colored icon top-left */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white glow-icon-light"
                style={{ backgroundColor: card.color }}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>

              {/* Card 1 only: green trend badge */}
              {card.trend && !loading && (
                <div className="bg-[#00FFA3]/15 text-[#00CC82] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 border border-[#00FFA3]/30">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 12%
                </div>
              )}
            </div>

            {/* Center animated counter */}
            <CardValue value={card.value} loading={loading} isDark={isDark} />

            {/* Label in small caps */}
            <div className="text-center mt-2">
              <span className="small-caps text-slate-400 font-bold text-xs tracking-wider">{card.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Section (2 panels side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[360px] pb-10">
        {/* Left Panel (~65% width) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 member-panel-gradient rounded-[24px] p-6 border border-inherit shadow-md overflow-hidden"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Team Workspace</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {teamData.filter(u => u.isOnline).length} online · {teamData.length} members
              </p>
            </div>
            <span className={`text-[10px] font-bold font-['JetBrains_Mono'] tracking-widest px-2.5 py-1 rounded-full ${
              isDark ? 'bg-white/5 text-slate-400' : 'bg-black/5 text-slate-500'
            }`}>LIVE</span>
          </div>

          {teamData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl mb-2">🏝️</span>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {teamData.map(member => {
                const getGradient = (name) => {
                  const colors = ['#7C5CFC','#00E5FF','#00FFA3','#FF3D71','#FFB800'];
                  const idx = (name?.charCodeAt(0) || 0) % colors.length;
                  return `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx+2)%5]})`;
                };
                const initials = (member.name || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                const completion = member.total > 0 ? Math.round((member.done.length / member.total) * 100) : 0;
                return (
                  <div key={member.id} className={`rounded-[14px] p-4 border transition-all ${
                    isDark ? 'bg-white/5 border-white/5 hover:bg-white/8' : 'bg-white/60 border-white/60 hover:bg-white/80'
                  } backdrop-blur-sm`}>
                    <div className="flex items-center gap-3">
                      {/* Avatar + online dot */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: getGradient(member.name) }}>
                          {initials}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDark ? 'border-[#0d0d2b]' : 'border-[#e3e3f6]'} ${
                          member.isOnline ? 'bg-[#00FFA3]' : 'bg-slate-400'
                        }`} />
                      </div>

                      {/* Name + role */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-[13px] truncate ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{member.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-['JetBrains_Mono'] font-bold tracking-widest shrink-0 ${
                            member.role === 'admin'
                              ? 'bg-[#7C5CFC]/20 text-[#A78BFF]'
                              : 'bg-[#00E5FF]/10 text-[#00E5FF]'
                          }`}>{member.role?.toUpperCase()}</span>
                          <span className={`text-[10px] ml-auto shrink-0 font-['JetBrains_Mono'] ${member.isOnline ? 'text-[#00FFA3]' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {member.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>

                        {/* Task pills */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {member.inProgress.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] font-['DM_Sans']">
                              🔄 {member.inProgress.length} In Progress
                            </span>
                          )}
                          {member.todo.length > 0 && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-['DM_Sans'] ${
                              isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-600'
                            }`}>
                              📋 {member.todo.length} Pending
                            </span>
                          )}
                          {member.done.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00FFA3]/15 text-[#00FFA3] font-['DM_Sans']">
                              ✅ {member.done.length} Done
                            </span>
                          )}
                          {member.total === 0 && (
                            <span className={`text-[10px] italic font-['DM_Sans'] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tasks assigned</span>
                          )}
                        </div>

                        {/* Active task name */}
                        {member.inProgress.length > 0 && (
                          <p className={`text-[11px] mt-1.5 truncate font-['DM_Sans'] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            ▸ Working on: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{member.inProgress[0].title}</span>
                          </p>
                        )}
                      </div>

                      {/* Completion % */}
                      <div className="shrink-0 text-right">
                        <span className={`text-[15px] font-extrabold font-['Syne'] ${
                          completion >= 75 ? 'text-[#00FFA3]' : completion >= 40 ? 'text-[#FFB800]' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>{completion}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right Panel (~35% width) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 distribution-card-light rounded-[24px] p-8 flex flex-col items-center justify-between border shadow-md"
        >
          <h2 className={`text-lg font-bold w-full ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Task Distribution</h2>
          
          {loading ? (
            <div className="w-48 h-48 rounded-full border-4 border-slate-200 animate-pulse" />
          ) : (
            <DonutPlaceholder value={data?.totalTasks || 0} isDark={isDark} />
          )}

          <div className="text-center w-full mt-4">
            <span className="small-caps text-slate-400 font-bold text-xs tracking-wider">TASKS</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
