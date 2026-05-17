import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../utils/api';
import { motion } from 'framer-motion';
import { FolderPlus, Users, LayoutList, X } from 'lucide-react';

import { useRole } from '../hooks/useRole';

function CreateProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create({ name, description });
      onCreated(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Syne'] text-xl font-bold text-[var(--text-primary)]">New Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[var(--text-muted)] mb-1">PROJECT NAME</label>
            <input autoFocus required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC] outline-none transition-all" placeholder="e.g. Nexus Core Redesign" />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[var(--text-muted)] mb-1">DESCRIPTION</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC] outline-none transition-all h-24 resize-none" placeholder="Brief details..." />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-surface)] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] text-[var(--bg-primary)] text-sm font-bold hover:shadow-[0_0_20px_#7C5CFC60] transition-all disabled:opacity-50">{loading ? 'Creating...' : 'Launch Project'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useRole();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    projectsAPI.getAll().then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#0d0d1a]' : 'bg-[#f4f5f7]'}`}>
      <div className="w-12 h-12 border-4 border-[#7C5CFC]/20 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_30px_#00E5FF80]" />
    </div>
  );

  return (
    <div className={`min-h-screen font-['Inter',sans-serif] p-8 overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0d1a]' : 'bg-[#f4f5f7]'}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className={`text-4xl font-extrabold tracking-tight italic bg-gradient-to-r from-[#00E5FF] to-[#7C5CFC] bg-clip-text text-transparent mb-2`}>
              Projects
            </h1>
            <p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">{projects.length} Active Workspaces</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC] text-[var(--text-primary)] font-medium hover:bg-[#684be3] hover:shadow-[0_0_20px_#7C5CFC60] transition-all">
              <FolderPlus className="w-4 h-4" /> New Project
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {projects.map((p, i) => {
            const progress = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/projects/${p.id}`} className="block relative p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] backdrop-blur-xl hover:border-[var(--border-color)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(124,92,252,0.15)] transition-all group overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-xl shadow-inner text-[#00E5FF] group-hover:scale-105 transition-transform">
                      ◈
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-['Syne'] text-lg md:text-xl font-bold group-hover:text-[#00E5FF] transition-colors truncate">{p.name}</h3>
                        <span className={`shrink-0 text-[10px] tracking-widest px-2 py-1 rounded font-['JetBrains_Mono'] ${p.role === 'admin' ? 'bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                          {p.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-sm mb-3 truncate">{p.description || 'No description provided.'}</p>
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-5 text-xs font-['JetBrains_Mono'] shrink-0">
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)]"><LayoutList className="w-3.5 h-3.5"/> {p.task_count} Tasks</div>
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)]"><Users className="w-3.5 h-3.5"/> {p.member_count} Members</div>
                        </div>
                        <div className="flex-1 w-full max-w-sm flex items-center gap-3">
                          <span className={`text-[10px] font-['JetBrains_Mono'] font-bold w-8 ${progress === 100 ? 'text-[#00FFA3]' : 'text-[var(--text-muted)]'}`}>{progress}%</span>
                          <div className="h-1.5 flex-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreated={p => setProjects([p, ...projects])} />}
      </motion.div>
    </div>
  );
}
