import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, parseISO, isValid } from 'date-fns';
import { Plus, Settings, Users, ArrowLeft, Calendar, Trash2, X, MoreVertical } from 'lucide-react';

const STATUS_CONFIG = {
  todo: { label: 'TODO', color: '#6B6B8A', bg: 'bg-[#1A1A24]' },
  in_progress: { label: 'IN PROGRESS', color: '#00E5FF', bg: 'bg-[#00E5FF]/10' },
  done: { label: 'DONE', color: '#00FFA3', bg: 'bg-[#00FFA3]/10' }
};

const PRIORITY_COLORS = { high: '#FF3D71', medium: '#FFB800', low: '#00E5FF' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState('board');

  const isAdmin = project?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([ projectsAPI.getOne(id), tasksAPI.getByProject(id) ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch { navigate('/projects'); } 
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex-1 h-full flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#7C5CFC]/20 border-t-[#00E5FF] rounded-full animate-spin shadow-[0_0_30px_#00E5FF80]" /></div>;
  if (!project) return null;

  const tasksByStatus = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col pb-6">
      <div className="flex justify-between items-end mb-6 shrink-0 border-b border-white/5 pb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-[#6B6B8A] hover:text-[#00E5FF] text-xs font-['JetBrains_Mono'] flex items-center gap-1 mb-3 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-3.5 h-3.5"/> Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-['Syne'] text-4xl font-bold">{project.name}</h1>
            <span className="text-[10px] tracking-widest px-2 py-1 bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] rounded font-['JetBrains_Mono'] uppercase">{project.role}</span>
          </div>
          {project.description && <p className="text-[#6B6B8A] mt-2 max-w-2xl">{project.description}</p>}
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex p-1 bg-[#0F0F16] rounded-xl border border-white/5 shadow-inner">
             <button onClick={()=>setActiveTab('board')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab==='board' ? 'bg-gradient-to-r from-[#7C5CFC] to-[#4F46E5] text-white shadow-lg' : 'text-[#6B6B8A] hover:text-white'}`}>Kanban</button>
             <button onClick={()=>setActiveTab('members')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab==='members' ? 'bg-gradient-to-r from-[#7C5CFC] to-[#4F46E5] text-white shadow-lg' : 'text-[#6B6B8A] hover:text-white'}`}>Team</button>
           </div>
           {isAdmin && (
             <button onClick={async () => {
               if(window.confirm('Delete project?')) {
                 await projectsAPI.delete(id); navigate('/projects');
               }
             }} className="p-2 bg-white/5 hover:bg-[#FF3D71]/20 text-[#6B6B8A] hover:text-[#FF3D71] rounded-xl border border-white/5 hover:border-[#FF3D71]/30 transition-colors">
               <Trash2 className="w-5 h-5"/>
             </button>
           )}
        </div>
      </div>

      {activeTab === 'board' && (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="w-[360px] shrink-0 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col max-h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_${config.color}]`} style={{ backgroundColor: config.color }} />
                  <span className="font-['JetBrains_Mono'] text-xs font-bold tracking-widest text-white">{config.label}</span>
                </div>
                <span className="text-xs text-[#6B6B8A] font-['JetBrains_Mono'] bg-[#1A1A24] px-2 py-0.5 rounded-full border border-white/5">{tasksByStatus[status].length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {tasksByStatus[status].map(task => {
                  const isOverdue = task.due_date && task.status !== 'done' && isAfter(new Date(), parseISO(task.due_date));
                  const initials = task.assigned_to_name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
                  return (
                    <motion.div 
                      key={task.id} whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                      className="bg-[#12121A] border border-white/5 p-4 rounded-xl cursor-pointer hover:border-white/20 shadow-lg relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="text-sm font-medium text-[#F0F0FF] leading-snug group-hover:text-[#00E5FF] transition-colors">{task.title}</h4>
                        </div>
                        {task.description && <p className="text-xs text-[#6B6B8A] line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className={`flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] font-bold ${isOverdue ? 'text-[#FF3D71]' : 'text-[#6B6B8A]'}`}>
                            <Calendar className="w-3.5 h-3.5"/>
                            {task.due_date && isValid(parseISO(task.due_date)) ? format(parseISO(task.due_date), 'MMM d') : 'NO DATE'}
                          </div>
                          {initials && (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] text-[9px] font-bold flex items-center justify-center text-[#050508] shadow-sm">
                              {initials}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {isAdmin && (
                <button 
                  onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}
                  className="mt-3 w-full py-3 rounded-xl border border-dashed border-white/10 text-[#6B6B8A] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4"/> Add Task
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.members?.map(member => (
            <div key={member.id} className="p-5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#FF3D71] text-sm font-bold flex items-center justify-center shadow-lg text-white">
                  {member.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="font-medium text-sm text-[#F0F0FF]">{member.name} {member.id===user.id && <span className="text-[#6B6B8A]">(You)</span>}</div>
                  <div className="text-xs text-[#6B6B8A]">{member.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] tracking-widest font-bold font-['JetBrains_Mono'] px-2 py-0.5 rounded ${member.role==='admin' ? 'bg-[#7C5CFC]/20 text-[#7C5CFC]' : 'bg-white/10 text-[#6B6B8A]'}`}>{member.role.toUpperCase()}</span>
                {isAdmin && member.id !== user.id && (
                  <button onClick={async () => {
                    if(window.confirm('Remove member?')){
                      await projectsAPI.removeMember(id, member.id);
                      setProject(p => ({...p, members: p.members.filter(m=>m.id!==member.id)}));
                    }
                  }} className="text-[#6B6B8A] hover:text-[#FF3D71] opacity-0 group-hover:opacity-100 transition-all p-1 bg-white/5 rounded-md"><Trash2 className="w-4 h-4"/></button>
                )}
              </div>
            </div>
          ))}
          {isAdmin && (
             <button onClick={() => setShowMemberModal(true)} className="p-5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#6B6B8A] hover:text-[#00FFA3] hover:border-[#00FFA3]/50 hover:bg-[#00FFA3]/10 transition-all min-h-[100px]">
               <Users className="w-6 h-6"/>
               <span className="text-sm font-medium">Invite Member</span>
             </button>
          )}
        </div>
      )}

      {/* Basic Task/Member Modals */}
      <AnimatePresence>
      {(showTaskModal || showMemberModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#12121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]" />
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-['Syne'] text-xl font-bold">{showTaskModal ? (selectedTask ? 'Edit Task' : 'New Task') : 'Add Member'}</h2>
                <button onClick={() => { setShowTaskModal(false); setShowMemberModal(false); }} className="text-[#6B6B8A] hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
             </div>
             {showTaskModal ? (
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.target);
                 const payload = Object.fromEntries(fd.entries());
                 payload.assigned_to = payload.assigned_to ? parseInt(payload.assigned_to) : null;
                 payload.project_id = parseInt(id);
                 try {
                   if (selectedTask) {
                     const res = await tasksAPI.update(selectedTask.id, payload);
                     setTasks(prev => prev.map(t => t.id === selectedTask.id ? res.data : t));
                   } else {
                     const res = await tasksAPI.create(payload);
                     setTasks(prev => [res.data, ...prev]);
                   }
                   setShowTaskModal(false);
                 } catch (err) { alert('Error saving task'); }
               }} className="space-y-4">
                 <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">TITLE</label><input name="title" defaultValue={selectedTask?.title} required className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]" disabled={!isAdmin && !!selectedTask}/></div>
                 <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">DESCRIPTION</label><textarea name="description" defaultValue={selectedTask?.description} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC] h-20 resize-none" disabled={!isAdmin && !!selectedTask}/></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">STATUS</label><select name="status" defaultValue={selectedTask?.status || 'todo'} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]">
                     <option value="todo">TODO</option><option value="in_progress">IN PROGRESS</option><option value="done">DONE</option>
                   </select></div>
                   <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">PRIORITY</label><select name="priority" defaultValue={selectedTask?.priority || 'medium'} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]" disabled={!isAdmin && !!selectedTask}>
                     <option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option>
                   </select></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">DUE DATE</label><input type="date" name="due_date" defaultValue={selectedTask?.due_date?.split('T')[0]} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]" disabled={!isAdmin && !!selectedTask}/></div>
                   <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">ASSIGNEE</label><select name="assigned_to" defaultValue={selectedTask?.assigned_to || ''} className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#7C5CFC]" disabled={!isAdmin && !!selectedTask}>
                     <option value="">Unassigned</option>{project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select></div>
                 </div>
                 <div className="pt-4 flex justify-between items-center">
                   {isAdmin && selectedTask && <button type="button" onClick={async () => { if(window.confirm('Delete?')) { await tasksAPI.delete(selectedTask.id); setTasks(prev=>prev.filter(t=>t.id!==selectedTask.id)); setShowTaskModal(false); } }} className="px-4 py-2 text-xs font-bold bg-[#FF3D71]/10 text-[#FF3D71] rounded-xl hover:bg-[#FF3D71]/20 transition-colors">Delete Task</button>}
                   <div className="flex gap-2 ml-auto">
                     <button type="button" onClick={()=>setShowTaskModal(false)} className="px-4 py-2 text-sm font-bold bg-white/5 rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
                     <button type="submit" className="px-4 py-2 text-sm font-bold bg-[#7C5CFC] hover:bg-[#684be3] text-white rounded-xl transition-colors shadow-lg">Save Task</button>
                   </div>
                 </div>
               </form>
             ) : (
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 try {
                   const email = e.target.email.value;
                   const res = await projectsAPI.addMember(id, email);
                   setProject(p => ({...p, members: [...p.members, {...res.data.user, role: 'member'}]}));
                   setShowMemberModal(false);
                 } catch (err) { alert(err.response?.data?.error || 'Error'); }
               }} className="space-y-4">
                 <div><label className="block text-[10px] font-bold tracking-widest font-['JetBrains_Mono'] text-[#6B6B8A] mb-1">USER EMAIL</label><input name="email" type="email" required className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00FFA3]" placeholder="colleague@example.com"/></div>
                 <div className="pt-4 flex gap-2 justify-end">
                   <button type="button" onClick={()=>setShowMemberModal(false)} className="px-4 py-2 text-sm font-bold bg-white/5 rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
                   <button type="submit" className="px-4 py-2 text-sm font-bold bg-[#00FFA3] hover:bg-[#00e693] text-[#050508] rounded-xl transition-colors shadow-lg">Send Invite</button>
                 </div>
               </form>
             )}
           </motion.div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
