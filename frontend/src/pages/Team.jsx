import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, MoreHorizontal, Users, X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { usersAPI, tasksAPI } from '../utils/api';

export default function Team() {
  const { isAdmin, userId } = useRole();
  const [users, setUsers] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [selectedUserTasks, setSelectedUserTasks] = useState(null);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [usersRes, tasksRes] = await Promise.all([
        usersAPI.getAll(),
        tasksAPI.getAll(),
      ]);

      const usersData = usersRes.data;
      const tasksData = tasksRes.data;
      
      const usersArray = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
      const tasksArray = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || tasksData.data || []);
      
      const enriched = usersArray.map(user => {
        const userTasks = tasksArray.filter(t => t.assigned_to === user._id || t.assignedTo?._id === user._id || t.assignedTo === user._id);
        const completed = userTasks.filter(t => t.status === 'done').length;
        const inProgress = userTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
        const overdue = userTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
        
        return {
          ...user,
          totalTasks: userTasks.length,
          completed, inProgress, overdue,
          completionRate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0,
          tasks: userTasks
        };
      });
      
      setUsers(enriched);
      setTotalTasks(tasksArray.length);
      setError('');
    } catch (err) {
      console.error('Team fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError('Enter a valid email address');
      return;
    }
    setInviting(true);
    try {
      await usersAPI.invite({ email: inviteEmail, role: inviteRole });
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail(''); setShowInviteModal(false);
      fetchTeamData();
    } catch (err) {
      setInviteError(err.response?.data?.message || err.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from team?`)) return;
    try {
      await usersAPI.delete(id);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to remove user');
    }
  };

  const getGradient = (name) => {
    const colors = ['#7C5CFC','#00E5FF','#00FFA3','#FF3D71','#FFB800'];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx+2)%5]})`;
  };

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  };

  // A user is "online" if their last_seen was within the last 2 minutes
  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) < 2 * 60 * 1000;
  };

  if (loading) return (
    <div className="p-10 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-[250px] rounded-[20px] bg-[linear-gradient(90deg,rgba(255,255,255,0.04)25%,rgba(255,255,255,0.08)50%,rgba(255,255,255,0.04)75%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      ))}
    </div>
  );

  if (error) return <div className="p-10 text-[#FF3D71]">{error} <button onClick={fetchTeamData}>Retry</button></div>;

  const avgCompletion = users.length > 0 ? Math.round(users.reduce((acc, u) => acc + u.completionRate, 0) / users.length) : 0;
  const filteredUsers = users.filter(u => (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-10 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-['Syne'] text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] mb-2 leading-tight">Team</h1>
          <p className="text-[var(--text-muted)] font-['DM_Sans'] text-[14px]">{users.length} members · {totalTasks} tasks assigned · <span className="text-[#00FFA3] font-semibold">{users.filter(u => isOnline(u.lastSeen)).length} online</span></p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInviteModal(true)} className="bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-6 py-3 rounded-[12px] font-['Syne'] text-[14px] font-bold text-[var(--text-primary)] shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:scale-[1.03] transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4"/> Invite Member
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-10">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full px-5 py-2.5 font-['JetBrains_Mono'] text-[13px] text-[var(--text-primary)] shadow-[0_4px_15px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <span className="text-[#00E5FF] mr-2">👥</span> {users.length} Members
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full px-5 py-2.5 font-['JetBrains_Mono'] text-[13px] text-[var(--text-primary)] shadow-[0_4px_15px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <span className="text-[#7C5CFC] mr-2">📋</span> {totalTasks} Active Tasks
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full px-5 py-2.5 font-['JetBrains_Mono'] text-[13px] text-[var(--text-primary)] shadow-[0_4px_15px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <span className="text-[#00FFA3] mr-2">⚡</span> {avgCompletion}% Avg Completion
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative w-[360px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[14px] py-3 pl-11 pr-4 text-[var(--text-primary)] font-['DM_Sans'] text-[14px] outline-none focus:border-[#00E5FF] transition-all"/>
        </div>
        <select className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[14px] px-4 py-3 text-[var(--text-primary)] font-['DM_Sans'] text-[14px] outline-none"><option>Role: All</option></select>
        <select className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[14px] px-4 py-3 text-[var(--text-primary)] font-['DM_Sans'] text-[14px] outline-none"><option>Sort: Most Tasks</option></select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20">
          <Users className="w-20 h-20 text-[var(--text-primary)]/15 mb-6" />
          <h3 className="font-['Syne'] text-[24px] text-[var(--text-primary)] mb-2">No team members yet</h3>
          <p className="text-[var(--text-muted)] font-['DM_Sans'] mb-6">Invite your first team member to get started</p>
          <button onClick={() => setShowInviteModal(true)} className="bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-6 py-3 rounded-[12px] font-['Syne'] text-[14px] font-bold text-[var(--text-primary)] shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:scale-[1.03] transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4"/> Invite Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5 pb-10">
          {filteredUsers.map(user => {
            const barColor = user.completionRate >= 75 ? 'linear-gradient(90deg, #00FFA3, #00CC82)' : user.completionRate >= 40 ? 'linear-gradient(90deg, #FFB800, #FF8C00)' : 'linear-gradient(90deg, #FF3D71, #CC1F4F)';
            const tColor = user.completionRate >= 75 ? '#00FFA3' : user.completionRate >= 40 ? '#FFB800' : '#FF3D71';
            return (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={user._id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-6 hover:-translate-y-1 hover:border-[var(--border-color)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group relative">
                <div className="flex gap-4 mb-6 relative">
                  <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center font-['Syne'] font-bold text-[18px] text-[var(--text-primary)] relative" style={{ background: getGradient(user.name) }}>
                    {getInitials(user.name)}
                    {/* Real-time online/offline indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)] shadow-md transition-all duration-500 ${isOnline(user.lastSeen) ? 'bg-[#00FFA3] shadow-[0_0_8px_#00FFA3] animate-pulse' : 'bg-slate-500'}`} title={isOnline(user.lastSeen) ? 'Online' : 'Offline'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-['Syne'] text-[16px] font-bold text-[var(--text-primary)] leading-tight mb-0.5">{user.name}</h3>
                    <p className="text-[var(--text-muted)] text-[12px] font-['DM_Sans'] mb-1 truncate">{user.email}</p>
                    <p className="text-[var(--text-muted)] text-[10px] font-['DM_Sans']">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en', {month:'short', year:'numeric'}) : 'recently'}</p>
                  </div>
                  <div className={`absolute top-0 right-0 px-2 py-1 border rounded-[6px] font-['JetBrains_Mono'] text-[10px] tracking-wider uppercase ${user.role === 'admin' ? 'bg-[#7C5CFC]/20 text-[#A78BFF] border-[#7C5CFC]/40' : 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'}`}>
                    {user.role}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[12px] font-['DM_Sans'] text-[var(--text-muted)]">Task Completion</span>
                    <span className="font-['Syne'] text-[20px] font-bold" style={{ color: tColor }}>{user.completionRate}%</span>
                  </div>
                  <div className="h-[8px] bg-[var(--bg-surface)] rounded-full overflow-hidden w-full mb-4">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${user.completionRate}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: barColor }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-['DM_Sans']">
                    <span className="text-[var(--text-muted)]"><span className="text-[#00FFA3] mr-1">✅</span>{user.completed} Done</span>
                    <span className="text-[var(--text-muted)]"><span className="text-[#00E5FF] mr-1">🔄</span>{user.inProgress} In Progress</span>
                    <span className="text-[var(--text-muted)]"><span className="text-[var(--text-primary)] mr-1">📋</span>{user.totalTasks} Total</span>
                    {user.overdue > 0 && <span className="text-[#FF3D71] font-bold"><span className="mr-1">⚠</span>{user.overdue} Overdue</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                  <button onClick={() => setSelectedUserTasks(user)} className="border border-[var(--border-color)] text-[12px] font-['DM_Sans'] text-[var(--text-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] hover:border-[var(--border-color)] transition-all">View Tasks →</button>
                  {isAdmin && user._id !== parseInt(userId) && user._id !== userId && (
                    <div className="relative group/menu cursor-pointer">
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                      <div className="absolute right-0 bottom-10 w-36 bg-[#1a1a2e]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-[12px] p-1 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all transform scale-95 group-hover/menu:scale-100 origin-bottom-right z-10">
                        <button onClick={async () => {
                          const newRole = user.role === 'admin' ? 'member' : 'admin';
                          try {
                            await usersAPI.updateRole(user._id, newRole);
                            setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
                          } catch (err) {
                            alert('Failed to change role');
                          }
                        }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-[8px]">{user.role === 'admin' ? 'Make Member' : 'Make Admin'}</button>
                        <button onClick={()=>handleDelete(user._id, user.name)} className="w-full text-left px-3 py-2 text-[12px] text-[#FF3D71] hover:bg-[#FF3D71]/10 rounded-[8px]">Remove Team</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[480px] bg-[var(--bg-primary)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-[24px] overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-['Syne'] text-[22px] font-bold text-[var(--text-primary)]">Invite Team Member</h2>
                  <button onClick={()=>setShowInviteModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-5">
                  <div>
                    <input type="email" placeholder="Email address" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 text-[var(--text-primary)] font-['DM_Sans'] outline-none focus:border-[#00E5FF]"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={()=>setInviteRole('member')} className={`p-4 rounded-[12px] border transition-all ${inviteRole === 'member' ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-color)]'}`}>
                      <div className="text-[20px] mb-2">👤</div><div className="text-[var(--text-primary)] font-bold text-[14px]">Member</div>
                    </button>
                    <button onClick={()=>setInviteRole('admin')} className={`p-4 rounded-[12px] border transition-all ${inviteRole === 'admin' ? 'bg-[#7C5CFC]/10 border-[#7C5CFC] shadow-[0_0_15px_rgba(124,92,252,0.2)]' : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-color)]'}`}>
                      <div className="text-[20px] mb-2">👑</div><div className="text-[var(--text-primary)] font-bold text-[14px]">Admin</div>
                    </button>
                  </div>
                  {inviteError && <div className="text-[#FF3D71] text-[13px]">{inviteError}</div>}
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button onClick={()=>setShowInviteModal(false)} className="px-5 py-2.5 rounded-[12px] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-surface)] transition-colors">Cancel</button>
                  <button onClick={handleInvite} disabled={inviting} className="px-6 py-2.5 bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] rounded-[12px] text-[var(--text-primary)] font-bold hover:brightness-110 disabled:opacity-50">
                    {inviting ? 'Sending...' : 'Send Invitation →'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Member Tasks Overview Modal */}
        {selectedUserTasks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[850px] max-h-[85vh] bg-[var(--bg-primary)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-[24px] overflow-hidden flex flex-col">
              <div className="h-1 w-full bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]" />
              
              {/* Header */}
              <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-['Syne'] font-bold text-[14px] text-[var(--text-primary)]" style={{ background: getGradient(selectedUserTasks.name) }}>
                    {getInitials(selectedUserTasks.name)}
                  </div>
                  <div>
                    <h2 className="font-['Syne'] text-[18px] font-bold text-[var(--text-primary)]">{selectedUserTasks.name}'s Tasks</h2>
                    <p className="text-[var(--text-muted)] text-[12px] font-['DM_Sans']">{selectedUserTasks.email} · {selectedUserTasks.totalTasks} Tasks</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserTasks(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface)] transition-all">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Tasks List Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {(!selectedUserTasks.tasks || selectedUserTasks.tasks.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                    <span className="text-[32px] mb-2">🏝️</span>
                    <p className="font-['DM_Sans'] text-sm">No tasks assigned to this team member.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full align-start">
                    {/* Columns */}
                    {[
                      { id: 'todo', label: 'Todo / Pending', color: '#7C5CFC', icon: Clock },
                      { id: 'in_progress', label: 'In Progress', color: '#00E5FF', icon: Clock },
                      { id: 'done', label: 'Done', color: '#00FFA3', icon: CheckCircle2 }
                    ].map(col => {
                      const colTasks = selectedUserTasks.tasks.filter(t => {
                        if (col.id === 'in_progress') return t.status === 'in_progress' || t.status === 'in-progress';
                        return t.status === col.id;
                      });

                      return (
                        <div key={col.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col min-h-[250px]">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-['JetBrains_Mono'] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5" style={{ color: col.color }}>
                              <col.icon className="w-3.5 h-3.5" />
                              {col.label}
                            </span>
                            <span className="bg-[var(--bg-primary)] px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[11px] text-[var(--text-muted)] border border-[var(--border-color)]">
                              {colTasks.length}
                            </span>
                          </div>
                          
                          <div className="space-y-2 overflow-y-auto flex-1 max-h-[400px] pr-1">
                            {colTasks.length === 0 ? (
                              <div className="h-full flex items-center justify-center py-8 text-[11px] font-['DM_Sans'] text-[var(--text-muted)] italic">
                                No tasks
                              </div>
                            ) : (
                              colTasks.map(task => {
                                const priorityColors = { high: '#FF3D71', medium: '#FFB800', low: '#00E5FF' };
                                return (
                                  <div key={task.id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3" style={{ borderLeft: `3px solid ${priorityColors[task.priority] || '#ccc'}` }}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[8px] uppercase tracking-wider font-bold font-['JetBrains_Mono'] px-1.5 py-0.5 rounded" style={{ color: priorityColors[task.priority], backgroundColor: `${priorityColors[task.priority]}15` }}>
                                        {task.priority}
                                      </span>
                                      <span className="text-[9px] text-[var(--text-muted)] truncate max-w-[80px]">
                                        {task.project_name || 'No Project'}
                                      </span>
                                    </div>
                                    <h4 className="font-['Syne'] font-bold text-[12px] text-[var(--text-primary)] leading-tight mb-1">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-[10px] text-[var(--text-muted)] font-['DM_Sans'] line-clamp-2 mb-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] font-['JetBrains_Mono']">
                                      <Calendar className="w-2.5 h-2.5" />
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en', {month:'short', day:'numeric'}) : 'No date'}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
