import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { tasksAPI } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Calendar, MoreHorizontal, AlertCircle, X } from 'lucide-react';
import { isAfter, parseISO, isValid, format } from 'date-fns';

import { useRole } from '../hooks/useRole';

const PRIORITY_COLORS = { high: '#FF3D71', medium: '#FFB800', low: '#00E5FF' };

export default function Tasks() {
  const { isAdmin } = useRole();
  const { tasks, users, projects, loading, refetch } = useApp();
  
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  if (loading) return (
    <div className="p-8 flex gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex-1 min-h-[500px] bg-white/[0.02] border border-white/[0.06] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      ))}
    </div>
  );

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    const matchProject = !projectFilter || t.project_id === parseInt(projectFilter);
    const matchAssignee = !assigneeFilter || t.assigned_to === parseInt(assigneeFilter);
    return matchSearch && matchPriority && matchProject && matchAssignee;
  });

  const columns = [
    { id: 'todo', label: 'TO DO', color: '#7C5CFC', tasks: filteredTasks.filter(t => t.status === 'todo') },
    { id: 'in_progress', label: 'IN PROGRESS', color: '#00E5FF', tasks: filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress') },
    { id: 'done', label: 'DONE', color: '#00FFA3', tasks: filteredTasks.filter(t => t.status === 'done') }
  ];

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    try {
      await tasksAPI.update(taskId, { status });
      refetch();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="font-['Syne'] text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A78BFF] mb-2">Tasks</h1>
          <p className="text-[#6B6B8A] font-['DM_Sans'] text-sm">Manage and track all your team's work</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setDefaultStatus('todo'); setShowModal(true); }} className="bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] px-5 py-2.5 rounded-xl font-['Syne'] font-bold text-[#050508] shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:scale-105 transition-transform flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-8 shrink-0 flex-wrap">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B8A]" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-[#7C5CFC] text-white" />
        </div>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white outline-none">
          <option value="">Priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white outline-none">
          <option value="">Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={assigneeFilter} onChange={e=>setAssigneeFilter(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white outline-none">
          <option value="">Assignee</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        {(search || priorityFilter || projectFilter || assigneeFilter) && (
          <button onClick={()=>{setSearch(''); setPriorityFilter(''); setProjectFilter(''); setAssigneeFilter('');}} className="text-xs text-[#FF3D71] hover:underline font-bold">Clear filters</button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="w-[360px] shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col max-h-full" onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver}>
            <div className="h-1 w-full rounded-full mb-4" style={{ background: col.color }} />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-['JetBrains_Mono'] text-xs font-bold tracking-widest text-white">{col.label}</h3>
              <span className="bg-[#1A1A24] px-2 py-0.5 rounded font-['JetBrains_Mono'] text-xs text-[#6B6B8A]">{col.tasks.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {col.tasks.map(task => {
                const isOverdue = task.due_date && task.status !== 'done' && isAfter(new Date(), parseISO(task.due_date));
                const initials = task.assigned_to_name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
                return (
                  <motion.div layoutId={`task-${task.id}`} draggable onDragStart={(e) => handleDragStart(e, task.id)} key={task.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors" style={{ borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}` }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold font-['JetBrains_Mono'] px-1.5 py-0.5 rounded" style={{ color: PRIORITY_COLORS[task.priority], backgroundColor: `${PRIORITY_COLORS[task.priority]}15` }}>{task.priority}</span>
                      <span className="text-[10px] text-[#6B6B8A] bg-white/5 px-2 py-0.5 rounded">{task.project_name || 'No Project'}</span>
                    </div>
                    <h4 className="font-['Syne'] font-semibold text-sm text-white line-clamp-2 leading-snug mb-1">{task.title}</h4>
                    {task.description && <p className="text-xs text-[#6B6B8A] font-['DM_Sans'] line-clamp-2 mb-3">{task.description}</p>}
                    <div className="flex justify-between items-center mt-3">
                      <div className={`text-[10px] font-['JetBrains_Mono'] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded ${isOverdue ? 'bg-[#FF3D71]/20 text-[#FF3D71]' : 'text-[#6B6B8A]'}`}>
                        <Calendar className="w-3 h-3" /> {task.due_date && isValid(parseISO(task.due_date)) ? format(parseISO(task.due_date), 'MMM d') : 'No date'}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.assigned_to && <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] flex items-center justify-center text-[9px] font-bold text-[#050508]">{initials}</div>}
                        <button className="text-[#6B6B8A] hover:text-white"><MoreHorizontal className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {isAdmin && (
              <button onClick={() => { setDefaultStatus(col.id); setShowModal(true); }} className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-white/10 text-[#6B6B8A] hover:text-white hover:bg-white/5 transition-all text-sm font-bold font-['Syne'] flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add task
              </button>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#12121A] border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-['Syne'] text-xl font-bold">New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-[#6B6B8A] hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const payload = Object.fromEntries(fd.entries());
                payload.assigned_to = payload.assigned_to ? parseInt(payload.assigned_to) : null;
                payload.project_id = parseInt(payload.project_id);
                try {
                  await tasksAPI.create(payload);
                  refetch();
                  setShowModal(false);
                } catch (err) { alert(err.response?.data?.error || 'Failed to create task'); }
              }} className="space-y-4">
                <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">TITLE*</label><input name="title" required className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"/></div>
                <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">DESCRIPTION</label><textarea name="description" rows={3} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC] resize-none"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">PROJECT*</label><select name="project_id" required className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"><option value="">Select...</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">ASSIGN TO</label><select name="assigned_to" className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"><option value="">Unassigned</option>{users.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">PRIORITY*</label><select name="priority" defaultValue="medium" className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                  <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">STATUS*</label><select name="status" defaultValue={defaultStatus} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div>
                  <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">DUE DATE</label><input type="date" name="due_date" className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]"/></div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={()=>setShowModal(false)} className="px-5 py-2 text-sm font-bold text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-bold text-[#050508] bg-[#00E5FF] hover:bg-[#00e6e6] shadow-[0_0_15px_rgba(0,229,255,0.4)] rounded-xl transition-all">Create Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
