import React, { useState, useEffect } from 'react';
import { dbService } from './lib/db';
import { ToastProvider, useToast } from './components/Toast';
import EmailGenerator from './components/EmailGenerator';
import AdminPanel from './components/AdminPanel';
import {
  Mail, Shield, Sun, Moon, KeyRound, AlertCircle, X, HelpCircle, Lock, Server, Cpu
} from 'lucide-react';

function AppContent() {
  const { toast } = useToast();
  
  // App Overall Layout States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'generator' | 'admin'>('generator');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Login Form States
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isBruteBlocked, setIsBruteBlocked] = useState<boolean>(false);

  // Load Appearance & Auth State on mount
  useEffect(() => {
    // 1. Theme initialize
    const savedTheme = localStorage.getItem('email_generator_theme') || 'dark';
    setThemeMode(savedTheme as 'dark' | 'light');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    // 2. Clear stale session keys
    sessionStorage.removeItem('admin_session_auth');
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('email_generator_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    toast(`Switched theme to ${nextTheme} mode!`, 'info');
  };

  // Admin Verification Gate
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBruteBlocked) {
      toast('Login attempts locked for security. Please try again soon.', 'error');
      return;
    }

    if (usernameInput.trim() === '' || passwordInput === '') {
      toast('Please supply both your username and credentials password.', 'warning');
      return;
    }

    setIsBruteBlocked(true);
    setTimeout(async () => {
      const isVerified = await dbService.verifyAdmin(usernameInput.trim(), passwordInput);
      
      if (isVerified) {
        setIsAdminLoggedIn(true);
        setCurrentTab('admin');
        setShowLoginModal(false);
        setLoginAttempts(0);
        
        // Log entry
        dbService.addLog('login', 'IPSHAHINUR', 'Admin session initialized', 'Successfully authenticated from management portal.');
        toast('Welcome back, Admin! Session authenticated.', 'success');
        
        // Save temporary session
        sessionStorage.setItem('admin_session_auth', 'active');
      } else {
        const nextAttempts = loginAttempts + 1;
        setLoginAttempts(nextAttempts);
        
        // Add security alarm log
        dbService.addLog('system', 'guest@portal', 'Unauthorized log attempt', `Attempted username: ${usernameInput.trim()}`);
        
        if (nextAttempts >= 4) {
          toast('Security Alarm: Too many incorrect attempts! Submitting throttled access block.', 'error');
          // Brute force protection: Lockout inputs temporarily
          setTimeout(() => {
            setLoginAttempts(0);
            setIsBruteBlocked(false);
          }, 30000); // 30 seconds block
        } else {
          toast(`Incorrect coordinates. ${4 - nextAttempts} attempts remaining.`, 'error');
          setIsBruteBlocked(false);
        }
      }
      
      // Reset sensitive form fields
      setPasswordInput('');
    }, 300);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentTab('generator');
    sessionStorage.removeItem('admin_session_auth');
    dbService.addLog('login', 'IPSHAHINUR', 'Admin session terminated', 'Successfully logged out.');
    toast('Securely logged out from administrator session.', 'success');
  };

  // Navigation tab selections
  const handleSelectTab = (tab: 'generator' | 'admin') => {
    if (tab === 'admin' && !isAdminLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen font-sans bg-zinc-950 dark:bg-zinc-950 text-zinc-100 transition-colors duration-300">
      
      {/* Dynamic Light Background Overrides */}
      {themeMode === 'light' && (
        <style dangerouslySetInnerHTML={{ __html: `
          body { background-color: #f4f4f5 !important; color: #18181b !important; }
          #email-generator-app { color: #18181b !important; }
          #admin-panel-app { color: #18181b !important; }
          .bg-zinc-900\\/40 { background-color: rgba(255, 255, 255, 0.7) !important; border-color: rgba(228, 228, 231, 0.9) !important; }
          .bg-zinc-900\\/60 { background-color: rgba(255, 255, 255, 0.8) !important; border-color: rgba(228, 228, 231, 0.9) !important; }
          .bg-zinc-950 { background-color: #ffffff !important; border-color: #e4e4e7 !important; color: #18181b !important; }
          .bg-zinc-905 { background-color: #f4f4f5 !important; border-color: #e4e4e7 !important; }
          .border-zinc-800 { border-color: #e4e4e7 !important; }
          .border-zinc-850 { border-color: #e4e4e7 !important; }
          .text-white { color: #09090b !important; }
          .text-zinc-400 { color: #52525b !important; }
          .text-zinc-100 { color: #18181b !important; }
          .text-zinc-200 { color: #27272a !important; }
          .text-zinc-300 { color: #3f3f46 !important; }
          .text-zinc-350 { color: #3f3f46 !important; }
          .text-zinc-450 { color: #71717a !important; }
          .text-zinc-500 { color: #71717a !important; }
          .bg-zinc-800 { background-color: #e4e4e7 !important; color: #18181b !important; }
          .bg-zinc-850 { background-color: #f4f4f5 !important; color: #18181b !important; }
          .bg-zinc-900 { background-color: #f4f4f5 !important; }
          .bg-zinc-950\\/80 { background-color: rgba(244, 244, 245, 0.9) !important; }
          .bg-zinc-900\\/35 { background-color: #ffffff !important; }
          .hover\\:bg-zinc-750:hover { background-color: #d4d4d8 !important; }
          .hover\\:bg-zinc-800:hover { background-color: #e4e4e7 !important; }
          .divide-zinc-850\\/40 > :not([hidden]) ~ :not([hidden]) { border-color: #e4e4e7 !important; }
          .divide-zinc-900 > :not([hidden]) ~ :not([hidden]) { border-color: #e4e4e7 !important; }
          .divide-zinc-900\\/60 > :not([hidden]) ~ :not([hidden]) { border-color: #e4e4e7 !important; }
          .text-blue-400 { color: #2563eb !important; }
          .border-blue-500\\/20 { border-color: rgba(37, 99, 235, 0.2) !important; }
          .bg-blue-500\\/10 { background-color: rgba(37, 99, 235, 0.1) !important; }
          code { background-color: #f4f4f5 !important; color: #1f2937 !important; border-color: #e5e7eb !important; }
          select { background-color: #ffffff !important; border-color: #d1d5db !important; color: #1f2937 !important; }
          input[type="text"], input[type="password"], input[type="number"], textarea { background-color: #ffffff !important; border-color: #d1d5db !important; color: #1f2937 !important; }
        ` }} />
      )}

      {/* Primary header branding navigation */}
      <header className="sticky top-0 z-40 w-full bg-zinc-950/80 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSelectTab('generator')}>
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div>
              <span id="app-logo-text" className="font-sans font-bold text-base text-white tracking-tight">InboxCraft</span>
              <span className="text-xxs font-extrabold text-blue-500 block -mt-1 tracking-widest uppercase">PRO</span>
            </div>
          </div>

          {/* Center Tabs navigation switch */}
          <nav className="hidden sm:flex items-center gap-1.5 p-1 bg-zinc-900 dark:bg-zinc-900/60 rounded-xl border border-zinc-900">
            <button
              onClick={() => handleSelectTab('generator')}
              className={`text-xs py-1.5 px-4 font-semibold rounded-lg transition-colors cursor-pointer ${
                currentTab === 'generator'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Email Generator
            </button>
            <button
              onClick={() => handleSelectTab('admin')}
              className={`text-xs py-1.5 px-4 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin Portal
            </button>
          </nav>

          {/* Right Utilities Control actions */}
          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
              title="Toggle Theme"
            >
              {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-zinc-700" />}
            </button>

            {/* Mobile / Quick Admin Button switches */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => handleSelectTab('admin')}
                className="py-1.5 px-3 sm:px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 tracking-tight shadow-md"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Admin Board</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="py-1.5 px-3 sm:px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 tracking-tight"
              >
                <Lock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="hidden xs:inline">Auth Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Workspace block */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {currentTab === 'generator' ? (
          <EmailGenerator />
        ) : (
          <AdminPanel onLogout={handleAdminLogout} />
        )}
      </main>

      {/* Tiny clean footer */}
      <footer className="border-t border-zinc-900 mt-20 py-8 bg-zinc-950 text-center text-xs text-zinc-505 font-sans space-y-2">
        <p>&copy; 2026 InboxCraft Pro. All rights reserved.</p>
        <div className="flex justify-center items-center gap-4 text-zinc-600">
          <span className="flex items-center gap-1"><Server className="h-3 w-3" /> Offline Persistent DB</span>
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> SHA-256 Auth Encryption</span>
        </div>
      </footer>

      {/* LOGIN MODAL GATEWAY POPEUP */}
      {showLoginModal && (
        <div id="auth-login-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl max-w-sm w-full border border-zinc-805 space-y-6 relative shadow-2xl">
            
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-450 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header description */}
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-full flex items-center justify-center mx-auto text-lg shadow-lg">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">Admin Authentication</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unlock database schemas, domain registers, pattern configurations, and event audits logs.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xxs uppercase tracking-wider font-extrabold text-zinc-500">Username</label>
                <input
                  type="text"
                  placeholder="Enter administrator user..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isBruteBlocked}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs uppercase tracking-wider font-extrabold text-zinc-505">Security Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-250 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isBruteBlocked}
                />
              </div>

              {/* Brute force lock warning info boxes */}
              {loginAttempts > 0 && (
                <div className="p-3 bg-rose-500/5 text-rose-400 text-xxs border border-rose-500/10 rounded-xl flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="h-4 w-4 text-rose-405 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Correct default login details checking required!</span> You registers {4 - loginAttempts} attempts left before security lockout.
                  </div>
                </div>
              )}

              {/* Default Credentials Notice */}
              <div className="p-3 bg-blue-500/5 text-blue-400 text-xxs border border-blue-500/10 rounded-xl flex items-start gap-2 leading-relaxed">
                <HelpCircle className="h-4 w-4 text-blue-405 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Default Credentials:</span><br />
                  User: <span className="font-mono bg-blue-500/10 px-1 rounded">IPSHAHINUR</span><br />
                  Pass: <span className="font-mono bg-blue-500/10 px-1 rounded">ip02042005</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-lg disabled:bg-zinc-800 disabled:text-zinc-500"
                disabled={isBruteBlocked}
              >
                Verify Session Credentials
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
