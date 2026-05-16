import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Activity, CheckCircle, FolderKanban, Sparkles } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
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

      {/* Left Side - Product Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center relative p-20 z-10">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="max-w-xl"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              <Sparkles className="w-6 h-6 text-[var(--text-primary)]" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TaskFlow</span>
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
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-slate-400 mb-8 text-sm">Join the workspace of the future.</p>

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
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl outline-none text-[var(--text-primary)] placeholder-slate-500 focus:bg-[var(--bg-surface)] focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="text-sm font-medium text-slate-300">Password</label>
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

            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-[var(--text-primary)] font-medium shadow-[0_10px_40px_rgba(124,58,237,0.45)] hover:shadow-[0_10px_50px_rgba(124,58,237,0.6)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--text-primary)] font-medium hover:text-purple-400 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
