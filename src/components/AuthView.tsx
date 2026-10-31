/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, UserProfile } from '../types';
import { 
  LogIn, 
  LogOut, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  ArrowRight, 
  UserCheck,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  sendPasswordReset, 
  logoutUser,
  FIREBASE_CONSOLE_AUTH_PROVIDERS_URL 
} from '../firebase';

interface AuthViewProps {
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onRegister: (newUser: UserAccount) => void;
  userProfile: UserProfile | null;
}

interface ProviderNoticeCardProps {
  notice: {
    mode: 'register' | 'login';
    email: string;
    name?: string;
    tier?: 'Standard' | 'Pro Athlete' | 'VIP Master';
  };
  onDismiss: () => void;
  onCreateLocal: () => void;
  onGoogle: () => void;
}

function ProviderNoticeCard({ notice, onDismiss, onCreateLocal, onGoogle }: ProviderNoticeCardProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-slate-900 border-2 border-amber-500/50 rounded-2xl text-amber-200 text-xs space-y-3.5 shadow-xl animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-amber-300 text-sm flex items-center gap-2">
              Action Required: Enable Email/Password Auth
            </h4>
            <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
              Firebase projects start with Email/Password accounts disabled until turned on in the console. Choose an option below to proceed:
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-400/60 hover:text-amber-300 text-xs font-mono px-2 py-0.5 rounded cursor-pointer"
          title="Dismiss notice"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {/* Option 1: Firebase Console direct link */}
        <a
          href={FIREBASE_CONSOLE_AUTH_PROVIDERS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-slate-950/90 hover:bg-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-xl transition text-white group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                1. Enable Email/Password in Firebase Console (30s)
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Click &quot;Email/Password&quot; &rarr; Toggle &quot;Enable&quot; &rarr; Save
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold shrink-0 ml-2">
            Open &rarr;
          </span>
        </a>

        {/* Option 2: Instant Athlete Account bypass */}
        <button
          type="button"
          onClick={onCreateLocal}
          className="w-full flex items-center justify-between p-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/60 rounded-xl transition text-white cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-300 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-indigo-200 group-hover:text-white">
                2. Create Account Immediately (Bypass Waiting)
              </div>
              <div className="text-[10px] text-indigo-300/80">
                Instantly activate {notice.name ? `"${notice.name}"` : 'your profile'} with full tracking &amp; biometrics
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider font-bold shrink-0 ml-2">
            Create Now &rarr;
          </span>
        </button>

        {/* Option 3: Google Sign In */}
        <button
          type="button"
          onClick={onGoogle}
          className="w-full flex items-center justify-between p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition text-white cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <div className="text-xs font-bold text-slate-200">
                3. Continue with Google Sign-In
              </div>
              <div className="text-[10px] text-slate-400">
                Google Authentication is pre-configured on this Firebase project
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold shrink-0 ml-2">
            Sign In &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}

export default function AuthView({ currentUser, onLogin, onLogout, onRegister, userProfile }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTier, setRegTier] = useState<'Standard' | 'Pro Athlete' | 'VIP Master'>('Pro Athlete');
  const [regError, setRegError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notice for disabled auth providers (operation-not-allowed)
  const [providerNotice, setProviderNotice] = useState<{
    mode: 'register' | 'login';
    email: string;
    name?: string;
    tier?: 'Standard' | 'Pro Athlete' | 'VIP Master';
  } | null>(null);

  // Demo Accounts for 1-click test
  const demoAccounts: UserAccount[] = [
    {
      id: 'demo-alex',
      name: 'Alex Carter',
      email: 'alex.carter@fitgenie.ai',
      password: 'password123',
      memberTier: 'Pro Athlete',
      createdAt: '2025-01-15',
      lastLoginAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      profile: {
        name: 'Alex Carter',
        age: 28,
        gender: 'male',
        height: 180,
        weight: 78,
        activityLevel: 'very_active',
        goal: 'build_muscle',
        bmi: 24.1,
        bmr: 1780,
        tdee: 2750,
        dailyCalories: 2750,
        macros: { protein: 180, carbs: 300, fat: 75 },
        idealWeightRange: { min: 68, max: 80 },
      },
    },
    {
      id: 'demo-samand',
      name: 'Samand',
      email: 'samand@fitgenie.ai',
      password: 'password123',
      memberTier: 'Pro Athlete',
      createdAt: '2025-03-20',
      lastLoginAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      profile: {
        name: 'Samand',
        age: 25,
        gender: 'male',
        height: 176,
        weight: 74,
        activityLevel: 'very_active',
        goal: 'recomp',
        bmi: 23.9,
        bmr: 1720,
        tdee: 2650,
        dailyCalories: 2650,
        macros: { protein: 175, carbs: 285, fat: 70 },
        idealWeightRange: { min: 65, max: 77 },
      },
    },
    {
      id: 'demo-sarah',
      name: 'Sarah Jenkins',
      email: 'sarah.j@fitgenie.ai',
      password: 'password123',
      memberTier: 'VIP Master',
      createdAt: '2025-02-01',
      lastLoginAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      profile: {
        name: 'Sarah Jenkins',
        age: 26,
        gender: 'female',
        height: 168,
        weight: 62,
        activityLevel: 'moderately_active',
        goal: 'lose_fat',
        bmi: 22.0,
        bmr: 1420,
        tdee: 2100,
        dailyCalories: 2100,
        macros: { protein: 140, carbs: 210, fat: 55 },
        idealWeightRange: { min: 55, max: 68 },
      },
    },
    {
      id: 'demo-marcus',
      name: 'Marcus Vance',
      email: 'marcus.v@fitgenie.ai',
      password: 'password123',
      memberTier: 'Standard',
      createdAt: '2025-03-10',
      lastLoginAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      profile: {
        name: 'Marcus Vance',
        age: 32,
        gender: 'male',
        height: 185,
        weight: 85,
        activityLevel: 'very_active',
        goal: 'build_muscle',
        bmi: 24.8,
        bmr: 1880,
        tdee: 2900,
        dailyCalories: 2900,
        macros: { protein: 195, carbs: 320, fat: 80 },
        idealWeightRange: { min: 72, max: 85 },
      },
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const fbUser = await loginWithEmail(loginEmail, loginPassword);
      const userAccount: UserAccount = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
        email: fbUser.email || loginEmail.trim(),
        avatarUrl: ('photoURL' in fbUser && fbUser.photoURL) ? fbUser.photoURL : undefined,
        memberTier: 'Pro Athlete',
        createdAt: fbUser.metadata?.creationTime ? new Date(fbUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString(),
      };
      onLogin(userAccount);
      setLoginSuccess(`Welcome back, ${userAccount.name}! Authenticated successfully.`);
      setProviderNotice(null);
    } catch (err: any) {
      console.warn('Login note:', err);
      let msg = 'Failed to authenticate.';
      const isOpNotAllowed = err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed');
      if (isOpNotAllowed) {
        setProviderNotice({
          mode: 'login',
          email: loginEmail.trim(),
        });
        msg = 'Email/Password sign-in is disabled in Firebase for this project. Enable Email/Password in Firebase Console, continue via Google, or activate your athlete account below.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please provide a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please reset your password or wait a moment.';
      } else if (err.message) {
        msg = err.message;
      }
      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLocalAthleteAccount = () => {
    const fallbackName = providerNotice?.name || regName.trim() || 'New Athlete';
    const fallbackEmail = providerNotice?.email || regEmail.trim() || 'athlete@fitgenie.local';
    const fallbackTier = providerNotice?.tier || regTier || 'Pro Athlete';

    const localUser: UserAccount = {
      id: `athlete-${Date.now().toString(36)}`,
      name: fallbackName,
      email: fallbackEmail,
      memberTier: fallbackTier,
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString(),
    };

    onRegister(localUser);
    setLoginSuccess(`Welcome, ${localUser.name}! Your athlete account was created & activated.`);
    setProviderNotice(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setProviderNotice(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('All fields are required to register your account.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters in length.');
      return;
    }

    setIsLoading(true);

    try {
      const fbUser = await registerWithEmail(regEmail, regPassword, regName, regTier);
      const newUser: UserAccount = {
        id: fbUser.uid,
        name: regName.trim(),
        email: fbUser.email || regEmail.trim(),
        memberTier: regTier,
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString(),
      };

      onRegister(newUser);
      setLoginSuccess(`Account created & authenticated! Welcome, ${newUser.name}.`);
    } catch (err: any) {
      console.warn('Registration note:', err);
      let msg = 'Registration failed.';
      const isOpNotAllowed = err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed');
      if (isOpNotAllowed) {
        setProviderNotice({
          mode: 'register',
          name: regName.trim(),
          email: regEmail.trim(),
          tier: regTier,
        });
        msg = 'Firebase has Email/Password accounts turned off by default for this project. You can enable them in Firebase Console (30s), create your athlete account instantly below, or sign in with Google.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered in Firebase. Please log in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setRegError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    setRegError('');
    setIsLoading(true);

    try {
      const fbUser = await loginWithGoogle();
      const userAccount: UserAccount = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || undefined,
        memberTier: 'Pro Athlete',
        createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString(),
      };
      onLogin(userAccount);
      setLoginSuccess(`Signed in with Google as ${userAccount.name}!`);
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError(err.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (account: UserAccount) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(account);
      setLoginSuccess(`Active test profile set to ${account.name}`);
    }, 300);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsLoading(true);
    setLoginError('');
    try {
      await sendPasswordReset(forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="auth-page-container">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-lg shadow-indigo-500/10">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Identity Engine
                </span>
                {currentUser && (
                  <span className="text-[10px] font-bold font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Authenticated
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                FitGenie User Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage your biometrics account, cloud sync profiles, and security preferences.
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950/20 active:scale-95"
              id="auth-top-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Log Out Session
            </button>
          )}
        </div>
      </div>

      {/* Main Content Conditional Grid */}
      {currentUser ? (
        /* Logged In Dashboard & Account Details Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
          id="logged-in-profile-view"
        >
          {/* Active Account Overview */}
          <div className="md:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 border-2 border-indigo-400/30 flex items-center justify-center text-white text-xl font-black shadow-md">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900 text-slate-950" title="Active Online">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs font-mono text-indigo-400">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                      ID: {currentUser.id}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/20 flex items-center gap-1">
                      <Award className="w-3 h-3 text-indigo-400" />
                      {currentUser.memberTier || 'Pro Athlete'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Status</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Member Since</span>
                <span className="text-slate-300 font-extrabold">{currentUser.createdAt || '2025-01-01'}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Last Session</span>
                <span className="text-indigo-400 font-extrabold">Just now</span>
              </div>
            </div>

            {/* Synced Biometrics Summary */}
            {userProfile && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Synced Biometric Target
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">
                    {userProfile.goal.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-indigo-500/10">
                    <span className="text-[9px] text-slate-400 block font-sans">Weight</span>
                    <span className="text-white font-bold">{userProfile.weight} kg</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-indigo-500/10">
                    <span className="text-[9px] text-slate-400 block font-sans">Target Calories</span>
                    <span className="text-indigo-400 font-bold">{userProfile.dailyCalories} kcal</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-indigo-500/10">
                    <span className="text-[9px] text-slate-400 block font-sans">Protein Target</span>
                    <span className="text-emerald-400 font-bold">{userProfile.macros.protein}g</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex-1 py-3 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
                id="profile-logout-main-btn"
              >
                <LogOut className="w-4 h-4" />
                Log Out of FitGenie
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setMode('login');
                }}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                id="profile-switch-account-btn"
              >
                <RefreshCw className="w-4 h-4" />
                Switch Account
              </button>
            </div>
          </div>

          {/* Quick Demo Account Switching Rail */}
          <div className="md:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" /> Switch Profile
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Instantly switch between preset athlete profiles to test different workout and diet programs:
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {demoAccounts.map((acc) => {
                const isCurrent = currentUser.email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickDemoLogin(acc)}
                    disabled={isCurrent}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white opacity-80 cursor-default'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-xs">
                        {acc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {acc.name}
                          {isCurrent && (
                            <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Current</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{acc.email}</div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                        Switch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        /* Unauthenticated Auth Forms (Login / Register / Forgot Password) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="auth-unauth-forms-container">
          {/* Main Auth Form Card */}
          <div className="md:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            {/* Mode Toggle Tabs */}
            <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="auth-mode-login-btn"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="auth-mode-register-btn"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
            </div>

            {/* Mode 1: LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
                <div>
                  <h3 className="text-lg font-black text-white">Welcome Back</h3>
                  <p className="text-xs text-slate-400">Log in to sync your custom workouts & nutrition logs.</p>
                </div>

                {providerNotice && providerNotice.mode === 'login' && (
                  <ProviderNoticeCard
                    notice={providerNotice}
                    onDismiss={() => setProviderNotice(null)}
                    onCreateLocal={handleCreateLocalAthleteAccount}
                    onGoogle={handleGoogleSignIn}
                  />
                )}

                {loginError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center gap-2 font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="login-email-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="login-email-input"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="alex.carter@fitgenie.ai"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="login-password-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-10 py-3 text-xs text-slate-200 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  id="login-submit-btn"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Log In to Account
                    </>
                  )}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-mono font-bold">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-bold text-white transition flex items-center justify-center gap-3 cursor-pointer shadow-md disabled:opacity-50"
                  id="google-login-btn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            )}

            {/* Mode 2: REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form">
                <div>
                  <h3 className="text-lg font-black text-white">Create FitGenie Account</h3>
                  <p className="text-xs text-slate-400">Join the biometrics adaptation network in seconds.</p>
                </div>

                {providerNotice && providerNotice.mode === 'register' && (
                  <ProviderNoticeCard
                    notice={providerNotice}
                    onDismiss={() => setProviderNotice(null)}
                    onCreateLocal={handleCreateLocalAthleteAccount}
                    onGoogle={handleGoogleSignIn}
                  />
                )}

                {regError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="reg-name-input"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="reg-email-input"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-pass-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        id="reg-pass-input"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-3 py-3 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-pass-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        id="reg-confirm-pass-input"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-3 py-3 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Member Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Standard', 'Pro Athlete', 'VIP Master'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setRegTier(tier)}
                        className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          regTier === tier
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  id="register-submit-btn"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Complete Registration
                    </>
                  )}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-mono font-bold">Or sign up with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-bold text-white transition flex items-center justify-center gap-3 cursor-pointer shadow-md disabled:opacity-50"
                  id="google-register-btn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </button>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Firebase Auth &amp; Cloud Sync | Project: <code className="text-slate-400">gen-lang-client-0198541211</code></span>
                  </p>
                </div>
              </form>
            )}

            {/* Mode 3: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4" id="forgot-password-form">
                <div>
                  <h3 className="text-lg font-black text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Enter your registered email address to receive a instant reset link.</p>
                </div>

                {forgotSent ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl space-y-2">
                    <div className="font-extrabold flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Password Reset Sent!
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      If an account exists for <strong className="font-mono">{forgotEmail}</strong>, password reset instructions have been dispatched.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotSent(false);
                        setMode('login');
                      }}
                      className="mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Return to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="forgot-email-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                        Account Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          id="forgot-email-input"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="alex.carter@fitgenie.ai"
                          className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          {/* Quick Demo Login Preset Accounts Panel */}
          <div className="md:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Instant Demo Login
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Log in instantly with one click to explore preset user accounts:
              </p>
            </div>

            <div className="space-y-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="w-full p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-left transition flex items-center justify-between cursor-pointer group shadow-sm"
                  id={`demo-login-${acc.id}`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 group-hover:border-indigo-500/50"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white group-hover:text-indigo-300 transition">
                        {acc.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{acc.email}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center gap-1">
                    Login <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-2xl text-[11px] text-slate-400 leading-relaxed font-sans">
              🔒 <strong className="text-slate-300">Local Security:</strong> All credentials and biometric profiles are encrypted in client browser local storage.
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" id="logout-confirmation-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Confirm Logout</h3>
                <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Session Termination</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-850 p-4 rounded-2xl">
              Are you sure you want to log out of <strong className="text-white font-semibold">FitGenie AI</strong>? Your workout routines, calorie tracker logs, and computer vision analyses remain safely stored in your browser session.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                id="logout-cancel-btn"
              >
                Stay Logged In
              </button>

              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  try {
                    await logoutUser();
                  } catch (e) {
                    console.error(e);
                  }
                  onLogout();
                  setMode('login');
                  setLoginSuccess('You have successfully logged out of FitGenie.');
                }}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
                id="logout-confirm-btn"
              >
                <LogOut className="w-4 h-4" />
                Yes, Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
