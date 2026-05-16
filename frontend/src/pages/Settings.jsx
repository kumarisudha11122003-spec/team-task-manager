import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, Palette, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
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

  const getInitials = (n) => {
    if (!n || n.trim() === '') return '?';
    return n.trim().split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
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
      const res = await fetch('http://localhost:5000/api/auth/me', {  
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
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
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

  if (loading) return <div className="p-10 text-white font-['Syne']">Loading...</div>;

  return (
    <div className="mx-auto max-w-[900px] p-10 pb-20">
      <div className="mb-8">
        <h1 className="font-['Syne'] text-[42px] font-[800] text-transparent bg-clip-text bg-gradient-to-br from-white via-[#A78BFF] to-[#00E5FF] mb-2 leading-none">Settings</h1>
        <p className="text-[#6B6B8A] font-['DM_Sans'] text-[14px]">Manage your account and preferences</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-[14px] p-[6px] inline-flex gap-1 mb-8">
        {[
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'security', icon: Shield, label: 'Security' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'appearance', icon: Palette, label: 'Appearance' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[14px] font-['DM_Sans'] transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-to-br from-[#7C5CFC]/30 to-[#00E5FF]/15 border border-[#7C5CFC]/40 text-white shadow-[0_0_20px_rgba(124,92,252,0.2)]' : 'text-[#6B6B8A] hover:bg-white/5 hover:text-white'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {fetchError && <div className="text-[#FF3D71] text-sm bg-[#FF3D71]/10 p-4 rounded-xl">{fetchError}</div>}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-8 flex items-center gap-7">
                <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] border-[3px] border-[#7C5CFC]/50 shadow-[0_0_30px_rgba(124,92,252,0.3)] flex items-center justify-center font-['Syne'] font-bold text-[28px] text-white">
                  {getInitials(name)}
                </div>
                <div>
                  <h3 className="font-['Syne'] text-[22px] font-bold text-white mb-1">{name}</h3>
                  <p className="font-['DM_Sans'] text-[14px] text-[#6B6B8A] mb-3">{email}</p>
                  <div className="flex items-center gap-3">
                    <span className={`font-['JetBrains_Mono'] text-[11px] tracking-[0.1em] px-2.5 py-1 rounded-full uppercase ${role === 'admin' ? 'bg-[#7C5CFC]/20 text-[#A78BFF] border border-[#7C5CFC]/40' : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'}`}>{role}</span>
                    <span className="text-[#6B6B8A] text-[12px]">Member since {memberSince ? new Date(memberSince).toLocaleDateString('en', {month:'short', year:'numeric'}) : 'recently'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">Full Name</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-white outline-none focus:border-[#7C5CFC]/60 focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"/>
                  </div>
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-white outline-none focus:border-[#7C5CFC]/60 focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"/>
                  </div>
                  <div>
                    <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">Role</label>
                    <div className="w-full bg-white/[0.02] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-[#6B6B8A] cursor-default flex justify-between uppercase">{role}</div>
                  </div>
                </div>
                {saveError && <div className="text-[#FF3D71] text-sm">{saveError}</div>}
                <button onClick={handleSave} disabled={saving || (name===originalData.name && email===originalData.email)} className="ml-auto bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-8 py-3.5 rounded-[12px] font-['Syne'] text-[15px] font-bold text-white hover:scale-[1.03] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 transition-all">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="border border-[#FF3D71]/30 bg-[#FF3D71]/[0.04] rounded-[16px] p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-[#FF3D71] font-bold text-[16px] mb-1">Delete Account</h3>
                  <p className="text-[#6B6B8A] text-[13px]">Permanently remove your account and all of its contents. This cannot be undone.</p>
                </div>
                <button className="px-5 py-2.5 border border-[#FF3D71] text-[#FF3D71] rounded-lg font-bold text-[14px] hover:bg-[#FF3D71] hover:text-white transition-colors">Delete Account</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-8 max-w-lg">
              <h3 className="font-['Syne'] text-[18px] font-bold text-white mb-6">Change Password</h3>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">Current Password</label>
                  <div className="relative">
                    <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-white outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B8A] hover:text-white">{showCurrent ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">New Password</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-white outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B8A] hover:text-white">{showNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
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
                  <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-[#6B6B8A] uppercase mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] px-4 py-3.5 font-['DM_Sans'] text-[14px] text-white outline-none focus:border-[#7C5CFC]/60 transition-all"/>
                    <button onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B8A] hover:text-white">{showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
              </div>
              {passwordError && <div className="text-[#FF3D71] text-[13px] mb-4">{passwordError}</div>}
              <button onClick={handlePasswordChange} className="w-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] py-3.5 rounded-[12px] font-['Syne'] text-[15px] font-bold text-white hover:scale-[1.02] hover:brightness-110 transition-all">Update Password</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-6 space-y-4">
              {[
                { id: 'assigned', icon: User, title: 'Task Assigned to Me', desc: 'Get notified when a task is assigned to you' },
                { id: 'status', icon: Bell, title: 'Status Changes', desc: 'When tasks you own change status' },
                { id: 'due', icon: AlertTriangle, title: 'Due Date Reminders', desc: '24 hours before a task is due' },
                { id: 'newMember', icon: Shield, title: 'New Team Member', desc: 'When someone joins your workspace' },
                { id: 'project', icon: Palette, title: 'Project Updates', desc: 'Activity in projects you\'re a member of' }
              ].map(item => (
                <div key={item.id} className="flex justify-between items-center py-4 border-b border-white/[0.04] last:border-0">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]"><item.icon className="w-4 h-4"/></div>
                    <div>
                      <h4 className="font-['DM_Sans'] text-[14px] text-white font-medium">{item.title}</h4>
                      <p className="font-['DM_Sans'] text-[12px] text-[#6B6B8A]">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifications({...notifications, [item.id]: !notifications[item.id]})} className={`relative w-[44px] h-[24px] rounded-full transition-all duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${notifications[item.id] ? 'bg-gradient-to-r from-[#7C5CFC] to-[#00E5FF]' : 'bg-[#2a2a3d]'}`}>
                    <motion.div layout className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-md" animate={{ x: notifications[item.id] ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}/>
                  </button>
                </div>
              ))}
              <div className="pt-4">
                <button className="bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] px-8 py-3 rounded-[12px] font-['Syne'] text-[15px] font-bold text-white hover:scale-[1.03] transition-all">Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-8">
                <h3 className="font-['Syne'] text-[18px] font-bold text-white mb-6">Theme</h3>
                <div className="flex gap-4">
                  <button className="w-[180px] p-4 border-2 border-[#7C5CFC] bg-[#050508] rounded-[16px] relative shadow-[0_0_20px_rgba(124,92,252,0.2)]">
                    <div className="absolute top-3 right-3 w-4 h-4 bg-[#7C5CFC] rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>
                    <div className="h-20 bg-white/5 rounded-lg mb-3 flex flex-col gap-2 p-2">
                      <div className="w-full h-3 bg-white/10 rounded-full" />
                      <div className="w-2/3 h-3 bg-white/10 rounded-full" />
                    </div>
                    <div className="text-white font-['DM_Sans'] text-[14px] font-bold">Dark Theme</div>
                  </button>
                  <button className="w-[180px] p-4 border-2 border-white/10 bg-[#e0e0e0] rounded-[16px] opacity-40 cursor-not-allowed">
                    <div className="h-20 bg-black/10 rounded-lg mb-3" />
                    <div className="text-black font-['DM_Sans'] text-[14px] font-bold">Light Theme</div>
                  </button>
                  <button className="w-[180px] p-4 border-2 border-white/10 bg-gradient-to-br from-[#050508] to-white rounded-[16px] opacity-40 cursor-not-allowed">
                    <div className="h-20 bg-white/20 rounded-lg mb-3" />
                    <div className="text-white font-['DM_Sans'] text-[14px] font-bold drop-shadow-md">System</div>
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-8">
                <h3 className="font-['Syne'] text-[18px] font-bold text-white mb-6">Accent Color</h3>
                <div className="flex gap-4">
                  {['#7C5CFC', '#00E5FF', '#00FFA3', '#FFB800', '#FF3D71', '#818CF8'].map(color => (
                    <button key={color} className="w-8 h-8 rounded-full" style={{ background: color, border: color === '#7C5CFC' ? '3px solid white' : 'none', boxShadow: color === '#7C5CFC' ? `0 0 15px ${color}` : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
