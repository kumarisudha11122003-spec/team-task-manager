import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ListTodo, Users, Settings, LogOut, Bell, Search, Moon, ChevronRight } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const avatarRef = useRef(null);
  
  const userName = localStorage.getItem('userName') || user?.name || 'User';
  const userEmail = localStorage.getItem('userEmail') || user?.email || '';
  const userRole = localStorage.getItem('role') || 'member';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.trim().split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };
  const initials = getInitials(userName);

  const getAvatarGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #7C5CFC, #00E5FF)',
      'linear-gradient(135deg, #FF3D71, #FF8C00)',
      'linear-gradient(135deg, #00FFA3, #00E5FF)',
      'linear-gradient(135deg, #FFB800, #FF3D71)',
      'linear-gradient(135deg, #7C5CFC, #FF3D71)',
    ];
    const idx = (name.charCodeAt(0) || 0) % gradients.length;
    return gradients[idx];
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--bg-primary', '#050508');
      root.style.setProperty('--bg-surface', 'rgba(255,255,255,0.03)');
      root.style.setProperty('--text-primary', '#F0F0FF');
      root.style.setProperty('--text-muted', '#6B6B8A');
      root.style.setProperty('--border-color', 'rgba(255,255,255,0.07)');
      document.body.style.background = '#050508';
      localStorage.setItem('theme', 'dark');
    } else {
      root.style.setProperty('--bg-primary', '#F5F5FF');
      root.style.setProperty('--bg-surface', 'rgba(0,0,0,0.04)');
      root.style.setProperty('--text-primary', '#0A0A1A');
      root.style.setProperty('--text-muted', '#6B6B8A');
      root.style.setProperty('--border-color', 'rgba(0,0,0,0.1)');
      document.body.style.background = '#F5F5FF';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const notifs = data.notifications || data || [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        } else {
          throw new Error('No endpoint');
        }
      } catch {
        try {
          const tasksRes = await fetch('/api/tasks', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            const tasks = tasksData.tasks || tasksData || [];
            
            const overdueNotifs = tasks
              .filter(t => 
                t.dueDate && 
                new Date(t.dueDate) < new Date() && 
                t.status !== 'done'
              )
              .map(t => ({
                _id: t._id || t.id,
                message: `Task "${t.title}" is overdue`,
                type: 'overdue',
                read: false,
                createdAt: t.dueDate
              }));
            setNotifications(overdueNotifs);
            setUnreadCount(overdueNotifs.length);
          }
        } catch (e) {}
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getBreadcrumb = () => {
    const path = location.pathname.split('/')[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
  };

  return (
    <>
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        @keyframes rotateSquare {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .bg-app {
          background: radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124, 92, 252, 0.15) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(0, 229, 255, 0.10) 0%, transparent 60%),
                      var(--bg-primary, #050508);
        }
        .grain-overlay {
          position: fixed; inset: 0; z-index: 9999; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdownSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,61,113,0.6); }
          50%      { box-shadow: 0 0 0 6px rgba(255,61,113,0); }
        }
        .navbar-top { position: relative; z-index: 50 !important; }
        .navbar-top button, .navbar-top [role="button"] { pointer-events: all !important; cursor: pointer !important; }
        .navbar-top::after, .navbar-top::before { pointer-events: none !important; }
        .new-task-btn, .btn-primary, [class*="new-task"], [class*="NewTask"] {
          z-index: 10 !important;
          position: relative;
        }
        .navbar, header {
          z-index: 50;
          position: relative;
        }
        .avatar-wrapper {
          position: relative;
          z-index: 100;
        }
        .dropdown-menu {
          isolation: isolate;
        }
        .dropdown-menu::-webkit-scrollbar {
          width: 4px;
        }
        .dropdown-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(124,92,252,0.4);
          border-radius: 99px;
        }
      `}</style>
      
      <div className="flex h-screen bg-app text-[var(--text-primary,#F0F0FF)] overflow-hidden font-['DM_Sans',sans-serif] relative" style={{ backgroundColor: 'var(--bg-primary, #050508)' }}>
        <div className="grain-overlay"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#7C5CFC] opacity-[0.12] blur-[80px] z-0 pointer-events-none" style={{ animation: 'drift 15s alternate infinite ease-in-out' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00E5FF] opacity-[0.12] blur-[80px] z-0 pointer-events-none" style={{ animation: 'drift 15s alternate-reverse infinite ease-in-out' }} />

        {/* Sidebar */}
        <aside className="relative z-10 hidden md:flex flex-col w-[240px] bg-white/[0.02] border-r border-white/[0.06] shadow-[inset_-5px_0_15px_rgba(255,255,255,0.01)] shrink-0 transition-all duration-300">
          <div className="p-6 flex items-center gap-3 h-[56px] shrink-0 border-b border-transparent">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] flex items-center justify-center shrink-0" style={{ animation: 'rotateSquare 8s linear infinite' }}>
              <div className="w-4 h-4 bg-[#050508] rounded-sm" style={{ animation: 'rotateSquare 4s linear infinite reverse' }} />
            </div>
            <span className="font-['Syne'] font-bold text-xl tracking-wide whitespace-nowrap overflow-hidden">TaskFlow</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#3D3D5C] tracking-[0.2em] uppercase mb-4 ml-2 font-['JetBrains_Mono']">Menu</div>
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink key={item.name} to={item.path} className="block relative group">
                  <div className={`relative flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-[#7C5CFC]/25 to-[#00E5FF]/10 text-white border-l-[3px] border-[#7C5CFC] shadow-[inset_0_0_20px_rgba(124,92,252,0.1)]' : 'text-[#6B6B8A] hover:bg-[#7C5CFC]/[0.08] hover:text-[#A78BFF]'}`}>
                    <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-[#A78BFF]'}`} />
                    <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/[0.06] group cursor-pointer hover:bg-[#FF3D71]/5 transition-colors">
            <div className="flex items-center gap-3 p-2 rounded-xl mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#00E5FF] flex items-center justify-center text-sm font-bold shrink-0 shadow-lg relative font-['Syne'] text-[#050508]">
                {initials}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FFA3] border-2 border-[#050508] rounded-full animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate text-white">{user?.name}</div>
                <div className="text-[11px] text-[#6B6B8A] truncate leading-tight">{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[#FF3D71] group-hover:bg-[#FF3D71]/10 rounded-lg transition-all group-hover:translate-x-1">
              <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-xs">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="navbar-top h-[56px] shrink-0 border-b border-white/[0.05] bg-[var(--bg-primary,#050508)]/80 backdrop-blur-[20px] flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-['Syne'] font-medium text-white">{getBreadcrumb()}</span>
              <ChevronRight className="w-4 h-4 text-[#6B6B8A]" />
              <span className="text-[#6B6B8A] text-xs">Overview</span>
            </div>
            
            <div className="relative w-[320px] hidden lg:block group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B8A] group-focus-within:text-[#7C5CFC] transition-colors" />
              <input type="text" placeholder="Search" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-11 pr-12 text-sm outline-none focus:border-[#7C5CFC]/60 focus:ring-[3px] focus:ring-[#7C5CFC]/10 transition-all placeholder-[#6B6B8A] text-[#F0F0FF]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-[#6B6B8A] font-['JetBrains_Mono'] bg-[#1A1A24]">⌘K</div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications Bell */}
              <div className="notif-wrapper" ref={bellRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(prev => !prev);
                    setShowUserMenu(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '10px',
                    color: 'var(--text-muted, #6B6B8A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 200ms'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '4px', right: '4px',
                      background: '#FF3D71',
                      color: '#fff',
                      fontSize: '10px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      minWidth: '16px', height: '16px',
                      borderRadius: '99px',
                      display: 'flex', alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 0 8px rgba(255,61,113,0.6)',
                      animation: 'pulse 2s infinite'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '360px',
                    background: 'var(--bg-surface, rgba(15,15,25,0.95))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'slideDown 200ms ease-out'
                  }}>
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllRead} style={{
                          background: 'none', border: 'none',
                          color: '#7C5CFC', fontSize: '12px',
                          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                        }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B6B8A', fontSize: '14px' }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif._id} style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.04))',
                            background: notif.read ? 'transparent' : 'rgba(124,92,252,0.06)',
                            borderLeft: notif.read ? 'none' : '3px solid #7C5CFC',
                            cursor: 'pointer',
                            transition: 'background 150ms'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface, rgba(255,255,255,0.03))'}
                          onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(124,92,252,0.06)'}
                          >
                            <p style={{ color: 'var(--text-primary, #fff)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 4px' }}>
                              {notif.message}
                            </p>
                            <p style={{ color: '#6B6B8A', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                              {new Date(notif.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setIsDark(prev => !prev)}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  color: isDark ? '#A78BFF' : '#FFB800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms',
                  fontSize: '20px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ display: 'inline-block', transition: 'transform 400ms, opacity 200ms', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                  {isDark ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                </span>
              </button>

              <div className="w-px h-5 bg-white/[0.08]" />

              {/* User Avatar Menu */}
              <div className="avatar-wrapper" ref={avatarRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(prev => !prev);
                    setShowNotifications(false);
                  }}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: getAvatarGradient(userName),
                    border: showUserMenu ? '2px solid rgba(124,92,252,0.8)' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fff',
                    transition: 'all 200ms',
                    boxShadow: showUserMenu ? '0 0 0 3px rgba(124,92,252,0.2)' : 'none',
                    outline: 'none'
                  }}
                >
                  {initials}
                </button>

                {showUserMenu && (
                  <>
                    {/* LAYER 1: Full-page invisible overlay to catch outside clicks */}
                    <div
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 998,
                        background: 'transparent',
                        cursor: 'default'
                      }}
                    />

                    {/* LAYER 2: The actual dropdown */}
                    <div className="dropdown-menu" style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '260px',
                      zIndex: 999,
                      background: '#0D0D1A',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '18px',
                      boxShadow: `
                        0 0 0 1px rgba(124, 92, 252, 0.15),
                        0 8px 32px rgba(0, 0, 0, 0.8),
                        0 24px 64px rgba(0, 0, 0, 0.6),
                        0 2px 8px rgba(0, 0, 0, 0.9)
                      `,
                      overflow: 'hidden',
                      animation: 'dropdownSlideIn 180ms cubic-bezier(0.34,1.56,0.64,1)'
                    }}>
                      <div style={{
                        padding: '18px 18px 14px',
                        background: 'rgba(124, 92, 252, 0.08)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '13px'
                      }}>
                        <div style={{
                          width: '44px', height: '44px',
                          borderRadius: '50%',
                          background: getAvatarGradient(userName),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Syne, sans-serif',
                          fontSize: '16px', fontWeight: 700,
                          color: '#fff', flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}>
                          {initials}
                        </div>

                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <p style={{
                            margin: '0 0 2px',
                            color: '#FFFFFF',
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '15px', fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {userName}
                          </p>
                          <p style={{
                            margin: 0,
                            color: '#8888AA',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: '#0D0D1A'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '99px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          fontWeight: 600,
                          ...(userRole === 'admin' ? {
                            background: 'rgba(124,92,252,0.25)',
                            color: '#C4AAFF',
                            border: '1px solid rgba(124,92,252,0.5)',
                            boxShadow: '0 0 12px rgba(124,92,252,0.2)'
                          } : {
                            background: 'rgba(0,229,255,0.15)',
                            color: '#00E5FF',
                            border: '1px solid rgba(0,229,255,0.35)',
                            boxShadow: '0 0 12px rgba(0,229,255,0.15)'
                          })
                        }}>
                          {userRole === 'admin' ? '👑' : '👤'}
                          {userRole.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ padding: '8px 0', background: '#0D0D1A' }}>
                        {[
                          { 
                            label: 'My Profile', 
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24" 
                                   fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            ),
                            action: () => { navigate('/settings'); setShowUserMenu(false) }
                          },
                          { 
                            label: 'Settings',
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24"
                                   fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                              </svg>
                            ),
                            action: () => { navigate('/settings?tab=security'); setShowUserMenu(false) }
                          },
                          { 
                            label: 'My Tasks',
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24"
                                   fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4"/>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                              </svg>
                            ),
                            action: () => { navigate('/tasks'); setShowUserMenu(false) }
                          },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={item.action}
                            style={{
                              width: '100%',
                              padding: '11px 18px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              color: '#B0B0C8',
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '14px',
                              fontWeight: 500,
                              transition: 'all 150ms ease',
                              outline: 'none'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(124,92,252,0.12)'
                              e.currentTarget.style.color = '#FFFFFF'
                              e.currentTarget.style.paddingLeft = '22px'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none'
                              e.currentTarget.style.color = '#B0B0C8'
                              e.currentTarget.style.paddingLeft = '18px'
                            }}
                          >
                            <span style={{ 
                              color: 'inherit', 
                              display: 'flex',
                              flexShrink: 0 
                            }}>
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <div style={{
                        height: '1px',
                        background: 'rgba(255,255,255,0.07)',
                        margin: '0'
                      }} />

                      <div style={{ padding: '8px 0', background: '#0D0D1A' }}>
                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '11px 18px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#FF3D71',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 150ms ease',
                            outline: 'none'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,61,113,0.12)'
                            e.currentTarget.style.paddingLeft = '22px'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'none'
                            e.currentTarget.style.paddingLeft = '18px'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24"
                               fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Logout
                        </button>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto relative custom-scrollbar">
            <Outlet />
          </main>
          
          {/* Mobile Bottom Nav */}
          <nav className="md:hidden flex justify-around p-3 border-t border-white/10 bg-[#050508]/90 backdrop-blur-xl shrink-0 z-50 relative">
            {navItems.slice(0,5).map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink key={item.name} to={item.path} className={`p-2 rounded-xl ${isActive ? 'bg-[#7C5CFC]/20 text-[#00E5FF]' : 'text-[#6B6B8A]'}`}>
                  <item.icon className="w-6 h-6" />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
