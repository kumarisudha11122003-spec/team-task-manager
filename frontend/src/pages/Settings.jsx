import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, Palette, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  
  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [memberSince, setMemberSince] = useState(null);
  const [originalData, setOriginalData] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState({
    assigned: true,
    status: true,
    due: false,
    newMember: true,
    project: false
  });

  // Appearance State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const getInitials = (n) => {
    if (!n || typeof n !== 'string' || n.trim() === '') return '?';
    return n.trim().split(/\s+/).map(w => w[0] ? w[0].toUpperCase() : '').slice(0, 2).join('');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.status === 401) { window.location.href = '/login'; return; }
        
        const data = await res.json();
        const user = data.user || data;
        
        setName(user.name || '');
        setEmail(user.email || '');
        setRole(user.role || 'member');
        setMemberSince(user.createdAt || user.created_at);
        setOriginalData({ name: user.name, email: user.email });
      } catch (err) {
        console.error('Profile fetch error:', err);
        setFetchError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/auth/me', {  
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }
      setOriginalData({ name, email });
      alert('Profile updated successfully');
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: { name, email } }));
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Password change failed');
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      alert('Password changed successfully');
      setPasswordError('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      alert('Failed to delete account: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[!@#$%^&*]/.test(newPassword)) score++;
    return score;
  };

  const strengthLabels = ['Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['#FF3D71', '#FFB800', '#7C5CFC', '#00FFA3'];

  if (loading) return <div className="p-10 text-[var(--text-primary)] font-['Syne']">Loading...</div>;

  return (
    <div className="mx-auto max-w-[900px] p-10 pb-20">
      <div className="mb-8">
        <h1 className="font-['Syne'] text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF] mb-2 leading-tight">Settings</h1>
        <p className="text-[var(--text-muted)] font-['DM_Sans'] text-[14px]">Manage your account and preferences</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[14px] p-[6px] grid grid-cols-2 md:inline-flex gap-1 mb-8 w-full md:w-auto">
        {[
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'security', icon: Shield, label: 'Security' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'appearance', icon: Palette, label: 'Appearance' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-2.5 rounded-[10px] text-[13px] sm:text-[14px] font-['DM_Sans'] transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-to-br from-[#7C5CFC]/30 to-[#00E5FF]/15 border border-[#7C5CFC]/40 text-[var(--text-primary)] shadow-[0_0_20px_rgba(124,92,252,0.2)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'}`}>
            <tab.icon className="w-4 h-4 shrink-0" /> <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {fetchError && <div className="text-[#FF3D71] text-sm bg-[#FF3D71]/10 p-4 rounded-xl">{fetchError}</div>}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-8 flex items-center gap-7">
                <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] border-[3px] border-[#7C5CFC]/50 shadow-[0_0_30px_rgba(124,92,252,0.3)] flex items-center justify-center font-['Syne'] font-bold text-[28px] text-[var(--text-primary)]">
                  {getInitials(name)}
                </div>
                <div>
                  <h3 className="font-['Syne'] text-[22px] font-bold text-[var(--text-primary)] mb-1">{name}</h3>
                  <p className="font-['DM_Sans'] text-[14px] text-[var(--text-muted)] mb-3">{email}</p>
                  <div className="flex items-center gap-3">
                    <span className={`font-['JetBrains_Mono'] text-[11px] tracking-[0.1em] px-2.5 py-1 rounded-full uppercase ${role === 'admin' ? 'bg-[#7C5CFC]/20 text-[#A78BFF] border border-[#7C5CFC]/40' : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'}`}>{role}</span>
                    <span className="text-[var(--text-muted)] text-[12px]">Member since {memberSince ? new Date(memberSince).toLocaleDateString('en', {month:'short', year:'numeric'}) : 'recently'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">Full Name</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]/60 focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"/>
                  </div>
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]/60 focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"/>
                  </div>
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">Role</label>
                    <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-muted)] cursor-default flex justify-between uppercase">{role}</div>
                  </div>
                </div>
                {saveError && <div className="text-[#FF3D71] text-sm">{saveError}</div>}
                <button onClick={handleSave} disabled={saving || (name===originalData.name && email===originalData.email)} className="ml-auto bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-8 py-3.5 rounded-[12px] font-['Syne'] text-[15px] font-bold text-[var(--text-primary)] hover:scale-[1.03] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 transition-all">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="border border-[#FF3D71]/30 bg-[#FF3D71]/[0.04] rounded-[16px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-[#FF3D71] font-bold text-[16px] mb-1">Delete Account</h3>
                  <p className="text-[var(--text-muted)] text-[13px]">Permanently remove your account and all of its contents. This cannot be undone.</p>
                </div>
                <button onClick={handleDeleteAccount} disabled={deleting} className="shrink-0 px-5 py-2.5 border border-[#FF3D71] text-[#FF3D71] rounded-lg font-bold text-[14px] hover:bg-[#FF3D71] hover:text-white transition-colors disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-8 max-w-lg">
              <h3 className="font-['Syne'] text-[18px] font-bold text-[var(--text-primary)] mb-6">Change Password</h3>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">Current Password</label>
                  <div className="relative">
                    <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">{showCurrent ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">New Password</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">{showNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(s => (
                          <div key={s} className="h-1 flex-1 rounded-full transition-colors" style={{ background: s <= getPasswordStrength() ? strengthColors[getPasswordStrength()-1] : 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <div className="text-[11px] font-['JetBrains_Mono']" style={{ color: strengthColors[getPasswordStrength()-1] || '#6B6B8A' }}>
                        {getPasswordStrength() > 0 ? strengthLabels[getPasswordStrength()-1] : ''}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">{showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
              </div>
              {passwordError && <div className="text-[#FF3D71] text-[13px] mb-4">{passwordError}</div>}
              <button onClick={handlePasswordChange} className="w-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] py-3.5 rounded-[12px] font-['Syne'] text-[15px] font-bold text-[var(--text-primary)] hover:scale-[1.02] hover:brightness-110 transition-all">Update Password</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-6 space-y-4">
              {[
                { id: 'assigned', icon: User, title: 'Task Assigned to Me', desc: 'Get notified when a task is assigned to you' },
                { id: 'status', icon: Bell, title: 'Status Changes', desc: 'When tasks you own change status' },
                { id: 'due', icon: AlertTriangle, title: 'Due Date Reminders', desc: '24 hours before a task is due' },
                { id: 'newMember', icon: Shield, title: 'New Team Member', desc: 'When someone joins your workspace' },
                { id: 'project', icon: Palette, title: 'Project Updates', desc: 'Activity in projects you\'re a member of' }
              ].map(item => (
                <div key={item.id} className="flex justify-between items-center py-4 border-b border-[var(--border-color)] last:border-0">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]"><item.icon className="w-4 h-4"/></div>
                    <div>
                      <h4 className="font-['DM_Sans'] text-[14px] text-[var(--text-primary)] font-medium">{item.title}</h4>
                      <p className="font-['DM_Sans'] text-[12px] text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifications({...notifications, [item.id]: !notifications[item.id]})} className={`relative w-[44px] h-[24px] rounded-full transition-all duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${notifications[item.id] ? 'bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]' : 'bg-[#2a2a3d]'}`}>
                    <motion.div layout className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-md" animate={{ x: notifications[item.id] ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}/>
                  </button>
                </div>
              ))}
              <div className="pt-4">
                <button className="bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-8 py-3 rounded-[12px] font-['Syne'] text-[15px] font-bold text-[var(--text-primary)] hover:scale-[1.03] transition-all">Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[20px] p-8">
                <h3 className="font-['Syne'] text-[18px] font-bold text-[var(--text-primary)] mb-6">Theme</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setTheme('dark');
                      localStorage.setItem('theme', 'dark');
                      const root = document.documentElement;
                      root.classList.remove('light-theme');
                      root.classList.add('dark-theme');
                      root.style.setProperty('--bg-primary', '#0d0d1a');
                      root.style.setProperty('--bg-surface', '#1a1a2e');
                      root.style.setProperty('--text-primary', '#F0F0FF');
                      root.style.setProperty('--text-muted', '#8585a8');
                      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.05)');
                      document.body.style.background = '#0d0d1a';
                      window.dispatchEvent(new CustomEvent('taskflow-theme-change', { detail: 'dark' }));
                    }}
                    className={`p-4 border-2 rounded-[16px] relative transition-all text-left ${theme === 'dark' ? 'border-[#7C5CFC] bg-[var(--bg-primary)] shadow-[0_0_20px_rgba(124,92,252,0.2)]' : 'border-[var(--border-color)] bg-[var(--bg-surface)] opacity-70 hover:opacity-100'}`}
                  >
                    {theme === 'dark' && <div className="absolute top-3 right-3 w-4 h-4 bg-[#7C5CFC] rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>}
                    <div className="h-20 bg-[#0d0d1a] border border-white/10 rounded-lg mb-3 flex flex-col gap-2 p-2">
                      <div className="w-full h-3 bg-slate-800 rounded-full" />
                      <div className="w-2/3 h-3 bg-slate-800 rounded-full" />
                    </div>
                    <div className="text-[var(--text-primary)] font-['DM_Sans'] text-[14px] font-bold text-center">Dark Theme</div>
                  </button>
                  <button 
                    onClick={() => {
                      setTheme('light');
                      localStorage.setItem('theme', 'light');
                      const root = document.documentElement;
                      root.classList.remove('dark-theme');
                      root.classList.add('light-theme');
                      root.style.setProperty('--bg-primary', '#f4f5f7');
                      root.style.setProperty('--bg-surface', '#ffffff');
                      root.style.setProperty('--text-primary', '#1a1a2e');
                      root.style.setProperty('--text-muted', '#6b6b8a');
                      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.08)');
                      document.body.style.background = '#f4f5f7';
                      window.dispatchEvent(new CustomEvent('taskflow-theme-change', { detail: 'light' }));
                    }}
                    className={`p-4 border-2 rounded-[16px] relative transition-all text-left ${theme === 'light' ? 'border-[#7C5CFC] bg-[var(--bg-primary)] shadow-[0_0_20px_rgba(124,92,252,0.2)]' : 'border-[var(--border-color)] bg-[var(--bg-surface)] opacity-70 hover:opacity-100'}`}
                  >
                    {theme === 'light' && <div className="absolute top-3 right-3 w-4 h-4 bg-[#7C5CFC] rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>}
                    <div className="h-20 bg-[#f4f5f7] border border-black/10 rounded-lg mb-3 flex flex-col gap-2 p-2">
                      <div className="w-full h-3 bg-slate-200 rounded-full" />
                      <div className="w-2/3 h-3 bg-slate-200 rounded-full" />
                    </div>
                    <div className="text-[var(--text-primary)] font-['DM_Sans'] text-[14px] font-bold text-center">Light Theme</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
