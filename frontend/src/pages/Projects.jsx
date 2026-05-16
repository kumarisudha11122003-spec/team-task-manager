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

  useEffect(() => {
    projectsAPI.getAll().then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 h-full flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#7C5CFC]/20 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_30px_#00E5FF80]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-['Syne'] text-3xl font-bold mb-2">Projects</h1>
          <p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">{projects.length} Active Workspaces</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC] text-[var(--text-primary)] font-medium hover:bg-[#684be3] hover:shadow-[0_0_20px_#7C5CFC60] transition-all">
            <FolderPlus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p, i) => {
          const progress = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/projects/${p.id}`} className="block p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] backdrop-blur-xl hover:border-[var(--border-color)] hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(124,92,252,0.2)] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A1A24] to-[#2A2A3C] border border-[var(--border-color)] flex items-center justify-center text-lg shadow-inner text-[#00E5FF]">
                    ◈
                  </div>
                  <span className={`text-[10px] tracking-widest px-2 py-1 rounded font-['JetBrains_Mono'] ${p.role === 'admin' ? 'bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>{p.role.toUpperCase()}</span>
                </div>
                <h3 className="font-['Syne'] text-xl font-bold mb-2 group-hover:text-[#00E5FF] transition-colors line-clamp-1">{p.name}</h3>
                <p className="text-[var(--text-muted)] text-sm mb-6 line-clamp-2 h-10">{p.description || 'No description provided.'}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-['JetBrains_Mono']">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]"><LayoutList className="w-3.5 h-3.5"/> {p.task_count} Tasks</div>
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]"><Users className="w-3.5 h-3.5"/> {p.member_count} Members</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-['JetBrains_Mono'] mb-1.5">
                      <span className="text-[var(--text-muted)]">Progress</span>
                      <span className={progress === 100 ? 'text-[#00FFA3]' : 'text-[#F0F0FF]'}>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] rounded-full" style={{ width: `${progress}%` }} />
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
  );
}
