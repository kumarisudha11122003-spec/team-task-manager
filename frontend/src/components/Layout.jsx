import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ListTodo, Users, Settings, LogOut, Search, ChevronRight, Bell, Sun, Moon } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const avatarRef = useRef(null);

  const userName = 'jatin';
  const userEmail = 'jatin@gmail.com';

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
      root.style.setProperty('--bg-primary', '#0d0d1a');
      root.style.setProperty('--bg-surface', '#1a1a2e');
      root.style.setProperty('--text-primary', '#F0F0FF');
      root.style.setProperty('--text-muted', '#8585a8');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.05)');
      document.body.style.background = '#0d0d1a';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
      root.style.setProperty('--bg-primary', '#f4f5f7');
      root.style.setProperty('--bg-surface', '#ffffff');
      root.style.setProperty('--text-primary', '#1a1a2e');
      root.style.setProperty('--text-muted', '#6b6b8a');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.08)');
      document.body.style.background = '#f4f5f7';
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
        }
      } catch (e) {}
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

  return (
    <>
      <style>{`
        .sidebar-light {
          background-color: ${isDark ? '#111118' : '#f0f0f8'};
          border-right: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'};
        }
        .nav-item-active-light {
          background-color: ${isDark ? 'rgba(124, 92, 252, 0.2)' : '#e3e3f6'};
          color: ${isDark ? '#F0F0FF' : '#1a1a2e'} !important;
          font-weight: 700;
        }
        .nav-item-inactive-light {
          color: ${isDark ? '#8585a8' : '#6b6b8a'} !important;
        }
        .nav-item-inactive-light:hover {
          background-color: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'};
          color: ${isDark ? '#white' : '#1a1a2e'} !important;
        }
        .header-light {
          background-color: ${isDark ? '#111118' : '#ffffff'};
          border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'};
        }
        .small-caps {
          font-variant: all-small-caps;
          letter-spacing: 0.15em;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 99px;
        }
        .logo-icon {
          position: relative;
          width: 48px;
          height: 48px;
        }
        .outer-square {
          animation: spinCW 4s linear infinite;
          border-radius: 12px;
          background: linear-gradient(135deg, #38bdf8, #3b82f6);
          width: 48px;
          height: 48px;
          transform-origin: center center;
        }
        .inner-diamond {
          width: 20px;
          height: 20px;
          background: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          animation: spinCCW 4s linear infinite;
          border-radius: 2px;
          transform-origin: center center;
        }
        @keyframes spinCW {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinCCW {
          from { transform: translate(-50%, -50%) rotate(45deg); }
          to   { transform: translate(-50%, -50%) rotate(-315deg); }
        }
      `}</style>
      
      <div className="flex h-screen overflow-hidden font-['Inter',sans-serif] relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
        
        {/* Sidebar */}
        <aside className="relative z-10 hidden md:flex flex-col w-[220px] sidebar-light shrink-0 transition-all duration-300">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-[12px] h-[72px] shrink-0 border-b border-transparent">
            <div className="logo-icon">
              <div className="outer-square"></div>
              <div className="inner-diamond"></div>
            </div>
            <span className={`font-['Inter'] font-bold text-[22px] tracking-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>TaskFlow</span>
          </div>




          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase mb-4 ml-2 text-slate-400 small-caps">MENU</div>
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink key={item.name} to={item.path} className="block relative group">
                  <div className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'nav-item-active-light' : 'nav-item-inactive-light'}`}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Profile Section at Bottom */}
          <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'} flex flex-col gap-3`}>
            <div className="flex items-center gap-3 p-2 rounded-xl">
              {/* Avatar orange circle with initial J */}
              <div className="w-10 h-10 rounded-full bg-[#FF8C00] flex items-center justify-center text-sm font-bold text-white shrink-0 relative font-['Inter'] shadow-md">
                J
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FFA3] border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{userName}</div>
                <div className="text-[11px] text-slate-400 truncate leading-tight">{userEmail}</div>
              </div>
            </div>
            {/* Logout button below user info with red arrow icon */}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[#FF3D71] hover:bg-[#FF3D71]/10 rounded-lg transition-all group">
              <LogOut className="w-4 h-4 shrink-0 text-[#FF3D71] group-hover:translate-x-0.5 transition-transform" />
              <span className="font-semibold text-xs">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="header-light h-[64px] shrink-0 flex items-center justify-between px-6 z-50">
            {/* Breadcrumb Dashboard > Overview */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-400">Dashboard</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={isDark ? 'text-white font-semibold' : 'text-[#1a1a2e] font-semibold'}>Overview</span>
            </div>
            
            {/* Center Search Bar */}
            <div className="relative w-[320px] hidden lg:block group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00E5FF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search" 
                className={`w-full ${isDark ? 'bg-slate-800/50 text-white' : 'bg-[#eef0f6] text-[#1a1a2e]'} border-0 rounded-full py-2 pl-11 pr-12 text-sm outline-none focus:ring-[3px] focus:ring-[#00E5FF]/20 transition-all placeholder-slate-400`} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-300 text-[10px] text-slate-400 font-['Inter'] bg-white/80">⌘K</div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-4">
              {/* Bell notifications */}
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-400 relative transition-colors`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF3D71] rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute top-full right-0 mt-2 w-[320px] rounded-2xl shadow-xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-black/5'} z-50 overflow-hidden`}>
                    <div className="p-4 border-b border-inherit flex justify-between items-center">
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-[#00E5FF] font-semibold">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} className="p-3 border-b border-inherit text-xs">
                            {n.message}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Sun Icon */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-400 transition-colors`}
              >
                {isDark ? <Sun className="w-5 h-5 text-[#FFB800]" /> : <Moon className="w-5 h-5 text-slate-400" />}
              </button>

              <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

              {/* Orange User Avatar */}
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-[#FF8C00] flex items-center justify-center text-sm font-bold text-white shadow-sm font-['Inter'] relative"
              >
                J
              </button>
            </div>
          </header>
          
          {/* Main Area */}
          <main className="flex-1 overflow-y-auto relative custom-scrollbar">
            <Outlet />
          </main>
          
          {/* Mobile Bottom Nav */}
          <nav className={`md:hidden flex justify-around p-3 border-t ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-black/5'} shrink-0 z-50 relative`}>
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink key={item.name} to={item.path} className={`p-2 rounded-xl transition-colors ${isActive ? 'text-[#00E5FF]' : 'text-slate-400'}`}>
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
