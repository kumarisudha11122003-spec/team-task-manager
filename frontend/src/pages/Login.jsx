import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Activity, CheckCircle, FolderKanban, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [panel, setPanel] = useState('login'); // 'login' | 'forgot' | 'sent'
  const [forgotEmail, setForgotEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotEmail(email);
    setPanel('forgot');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen w-full bg-[#050816] text-[var(--text-primary)] flex overflow-hidden font-['Inter',sans-serif]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <style>{`
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

      {/* Left Side - Product Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center relative p-20 z-10">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="max-w-xl"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-[12px] mb-12">
            <div className="logo-icon">
              <div className="outer-square"></div>
              <div className="inner-diamond"></div>
            </div>
            <span className="text-[22px] font-bold tracking-tight text-white">TaskFlow</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-slate-400">
            Intelligent workspace for modern teams.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg text-slate-400 mb-16 leading-relaxed">
            Manage projects, collaborate in real-time, and ship faster with our premium Kanban boards and powerful analytics.
          </motion.p>

          {/* Floating Cards */}
          <div className="relative h-64 w-full">
            <motion.div 
              variants={itemVariants}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-64 p-4 rounded-2xl bg-[#0F172A]/80 backdrop-blur-xl border border-[var(--border-color)] shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">24 Tasks Completed</p>
                  <p className="text-xs text-slate-400">Team productivity +18%</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-20 right-10 w-72 p-4 rounded-2xl bg-[#0F172A]/80 backdrop-blur-xl border border-[var(--border-color)] shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Analytics Active</p>
                  <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2">
                    <div className="w-[75%] h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-0 left-10 w-56 p-4 rounded-2xl bg-[#0F172A]/80 backdrop-blur-xl border border-[var(--border-color)] shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">5 Active Projects</p>
                  <p className="text-xs text-slate-400">All running smoothly</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md p-8 sm:p-10 rounded-[24px] bg-[#0F172A]/60 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_20px_80px_rgba(0,0,0,0.55)]"
        >
          <div className="lg:hidden flex items-center gap-[12px] mb-8 justify-center">
            <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
              <div className="outer-square" style={{ width: '40px', height: '40px', borderRadius: '10px' }}></div>
              <div className="inner-diamond" style={{ width: '16px', height: '16px' }}></div>
            </div>
            <span className="text-[20px] font-bold tracking-tight text-white">TaskFlow</span>
          </div>

          <AnimatePresence mode="wait">
            {panel === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-slate-400 mb-8 text-sm">Sign in to manage your workspace.</p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 group">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl outline-none text-[var(--text-primary)] placeholder-slate-500 focus:bg-[var(--bg-surface)] focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    pointerEvents: 'all',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    color: '#a855f7',
                    fontSize: '14px',
                    transition: 'color 0.2s',
                    textDecoration: 'none'
                  }}
                  className="hover:text-[#c084fc] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl outline-none text-[var(--text-primary)] placeholder-slate-500 focus:bg-[var(--bg-surface)] focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 pb-4">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-surface)] text-purple-500 focus:ring-purple-500/30 focus:ring-offset-0 cursor-pointer" />
              <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">Remember me for 30 days</label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-[var(--text-primary)] font-medium shadow-[0_10px_40px_rgba(124,58,237,0.45)] hover:shadow-[0_10px_50px_rgba(124,58,237,0.6)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>


          <div className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--text-primary)] font-medium hover:text-purple-400 transition-colors">
              Create a free account
            </Link>
          </div>
        </motion.div>
      )}

      {panel === 'forgot' && (
        <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
          <p className="text-slate-400 mb-8 text-sm">Enter your email and we'll send a reset link.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!forgotEmail) return;
            setPanel('sent');
          }} className="space-y-5">
            <div className="space-y-1.5 group">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#a855f7] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0F172A] border border-[var(--border-color)] rounded-xl outline-none text-[var(--text-primary)] placeholder-slate-500 focus:bg-[#0F172A] focus:border-[#a855f7]/50 focus:ring-4 focus:ring-[#a855f7]/20 transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-[var(--text-primary)] font-medium shadow-[0_10px_40px_rgba(124,58,237,0.45)] hover:shadow-[0_10px_50px_rgba(124,58,237,0.6)] flex items-center justify-center gap-2 transition-all"
            >
              Send Reset Link <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setPanel('login')}
              className="text-[#a855f7] hover:text-[#c084fc] hover:underline transition-colors font-medium text-sm cursor-pointer bg-transparent border-none"
            >
              ← Back to Sign In
            </button>
          </div>
        </motion.div>
      )}

      {panel === 'sent' && (
        <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Email Sent</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            We've sent a password reset link to<br/>
            <span className="text-white font-medium mt-2 block">{forgotEmail}</span>
          </p>
          
          <button 
            type="button"
            onClick={() => setPanel('login')}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-[var(--text-primary)] font-medium shadow-[0_10px_40px_rgba(124,58,237,0.45)] hover:shadow-[0_10px_50px_rgba(124,58,237,0.6)] flex items-center justify-center gap-2 transition-all mt-4"
          >
            Back to Sign In
          </button>
        </motion.div>
      )}
      </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
