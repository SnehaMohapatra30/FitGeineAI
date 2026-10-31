/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, FoodLogItem, WaterLog, SleepLog, WeightLog, SavedWorkoutSession } from '../types';
import { User, Activity, Flame, ShieldAlert, Sparkles, Scale, RefreshCw, Layers, Trophy, Award, CheckCircle2, Lock, Droplet, Moon, Zap, Target, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  profile: UserProfile | null;
  onProfileUpdate: (newProfile: UserProfile) => void;
  isCalculating: boolean;
  foodLogs?: FoodLogItem[];
  waterLogs?: WaterLog[];
  sleepLogs?: SleepLog[];
  weightLogs?: WeightLog[];
  workoutLogs?: SavedWorkoutSession[];
}

export default function DashboardView({
  profile,
  onProfileUpdate,
  isCalculating,
  foodLogs = [],
  waterLogs = [],
  sleepLogs = [],
  weightLogs = [],
  workoutLogs = [],
}: DashboardViewProps) {
  // Onboarding Form State, pre-filled with professional athlete-level demo data
  const [formData, setFormData] = useState({
    name: 'Alex Carter',
    age: 28,
    gender: 'male' as 'male' | 'female' | 'other',
    height: 180,
    weight: 82,
    activityLevel: 'moderately_active' as UserProfile['activityLevel'],
    goal: 'build_muscle' as UserProfile['goal'],
  });

  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);

  // Synchronize form state with profile when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
    }
  }, [profile]);

  const [localError, setLocalError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      const response = await fetch('/api/profile/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to compute biometric parameters.');
      }
      const data = await response.json();
      onProfileUpdate(data);
    } catch (err: any) {
      setLocalError(err.message || 'Server calculation failed.');
    }
  };

  const getGoalLabel = (goal: UserProfile['goal']) => {
    switch (goal) {
      case 'lose_fat': return 'Calorie Deficit (Fat Loss)';
      case 'build_muscle': return 'Hypertrophy Surplus (Muscle Gain)';
      case 'maintain': return 'Healthy Conditioning (Maintenance)';
      case 'recomp': return 'Lean Body Recomposition (Deficit & Muscle)';
    }
  };

  const getActivityLabel = (activity: UserProfile['activityLevel']) => {
    switch (activity) {
      case 'sedentary': return 'Sedentary (Little to no exercise)';
      case 'lightly_active': return 'Lightly Active (1-3 days/week)';
      case 'moderately_active': return 'Moderately Active (3-5 days/week)';
      case 'very_active': return 'Very Active (6-7 days/week)';
      case 'extra_active': return 'Extra Active (Athlete / Physical Labor)';
    }
  };

  // Dynamic milestone metrics calculation based strictly on user activity logs
  const totalLogsCount = foodLogs.length + waterLogs.length + sleepLogs.length + weightLogs.length + workoutLogs.length;

  // Calculate unique logged days strictly from existing user entries
  const allLogDates = new Set<string>();
  foodLogs.forEach((f) => { if (f.date) allLogDates.add(f.date); });
  waterLogs.forEach((w) => { if (w.date) allLogDates.add(w.date); });
  sleepLogs.forEach((s) => { if (s.date) allLogDates.add(s.date); });
  weightLogs.forEach((wg) => { if (wg.date) allLogDates.add(wg.date); });
  workoutLogs.forEach((wk) => { if (wk.date) allLogDates.add(wk.date); });
  const uniqueLoggedDays = allLogDates.size;

  // Today's water total in ml
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWaterMl = waterLogs
    .filter((w) => w.date === todayStr)
    .reduce((acc, curr) => acc + curr.amountMl, 0);

  // Today's protein intake
  const todayProteinGrams = foodLogs
    .filter((f) => f.date === todayStr)
    .reduce((acc, curr) => acc + (curr.protein || 0), 0);

  // Sleep hours
  const latestSleepHours = sleepLogs.length > 0 ? sleepLogs[0].durationHours : 0;

  // Weight logs count
  const weightLogCount = weightLogs.length;
  const targetProtein = profile?.macros.protein || 150;

  const milestonesList = [
    {
      id: 'first_log',
      title: 'First Log',
      category: 'Initiation',
      icon: CheckCircle2,
      description: 'Record your first biometric, nutrition, hydration, or workout log entry.',
      current: Math.min(totalLogsCount, 1),
      target: 1,
      unit: 'log',
      isUnlocked: totalLogsCount >= 1,
      bgGlow: totalLogsCount >= 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((Math.min(totalLogsCount, 1) / 1) * 100)),
      rewardText: '+50 XP • Athlete Badge Unlocked',
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      category: 'Consistency',
      icon: Flame,
      description: 'Logged biometric, nutrition, or activity data across 7 distinct days.',
      current: uniqueLoggedDays,
      target: 7,
      unit: 'days',
      isUnlocked: uniqueLoggedDays >= 7,
      bgGlow: uniqueLoggedDays >= 7 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((uniqueLoggedDays / 7) * 100)),
      rewardText: '+200 XP • Consistency Pioneer Tier',
    },
    {
      id: 'hydration_champ',
      title: 'Hydration Champion',
      category: 'Hydration',
      icon: Droplet,
      description: 'Reached optimal daily cellular hydration target of 2.5 L or higher.',
      current: (todayWaterMl / 1000).toFixed(1),
      target: 2.5,
      unit: 'L',
      isUnlocked: todayWaterMl >= 2500,
      bgGlow: todayWaterMl >= 2500 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((todayWaterMl / 2500) * 100)),
      rewardText: '+100 XP • Hydration Master Badge',
    },
    {
      id: 'rest_recovery',
      title: 'Night Recovery',
      category: 'Sleep',
      icon: Moon,
      description: 'Logged 7+ hours of quality sleep to optimize nervous system recovery.',
      current: latestSleepHours,
      target: 7,
      unit: 'hrs',
      isUnlocked: sleepLogs.length > 0 && latestSleepHours >= 7,
      bgGlow: (sleepLogs.length > 0 && latestSleepHours >= 7) ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((latestSleepHours / 7) * 100)),
      rewardText: '+100 XP • Anabolic Rest Badge',
    },
    {
      id: 'protein_power',
      title: 'Protein Powerhouse',
      category: 'Nutrition',
      icon: Zap,
      description: 'Hit or exceeded daily target protein macro intake for muscle synthesis.',
      current: todayProteinGrams,
      target: targetProtein,
      unit: 'g',
      isUnlocked: foodLogs.length > 0 && todayProteinGrams >= targetProtein,
      bgGlow: (foodLogs.length > 0 && todayProteinGrams >= targetProtein) ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((todayProteinGrams / targetProtein) * 100)),
      rewardText: '+150 XP • Macro Master Badge',
    },
    {
      id: 'goal_reached',
      title: 'Goal Reached',
      category: 'Milestone',
      icon: Trophy,
      description: 'Completed 5 weight progression check-in entries towards your body composition target.',
      current: Math.min(weightLogCount, 5),
      target: 5,
      unit: 'logs',
      isUnlocked: weightLogCount >= 5,
      bgGlow: weightLogCount >= 5 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500',
      progressPercent: Math.min(100, Math.round((Math.min(weightLogCount, 5) / 5) * 100)),
      rewardText: '+300 XP • Gold Trophy Achiever',
    },
  ];

  const filteredMilestones = milestonesList.filter((m) => {
    if (milestoneFilter === 'unlocked') return m.isUnlocked;
    if (milestoneFilter === 'in_progress') return !m.isUnlocked;
    return true;
  });

  const unlockedCount = milestonesList.filter((m) => m.isUnlocked).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-view-container">
      {/* Onboarding & Input Parameters */}
      <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-slate-950/20" id="onboarding-form-card">
        <div>
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-md">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest block uppercase">Biometric Input</span>
              <h2 className="text-lg font-extrabold text-white">Biological Profile</h2>
            </div>
          </div>

          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                id="profile-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Age (years)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  required
                  id="profile-age-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Biological Gender</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300 cursor-pointer appearance-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  id="profile-gender-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="profile-height-number" className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Height (cm)
                  </label>
                </div>
                <input
                  type="number"
                  min="100"
                  max="250"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none font-mono mb-2"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  id="profile-height-number"
                />
                <input
                  type="range"
                  min="100"
                  max="250"
                  className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  id="profile-height-slider"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="profile-weight-number" className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Weight (kg)
                  </label>
                </div>
                <input
                  type="number"
                  min="30"
                  max="200"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none font-mono mb-2"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  id="profile-weight-number"
                />
                <input
                  type="range"
                  min="30"
                  max="200"
                  className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  id="profile-weight-slider"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Activity Level</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300 cursor-pointer"
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                id="profile-activity-input"
              >
                <option value="sedentary">Sedentary (desk job, minimal walking)</option>
                <option value="lightly_active">Lightly Active (exercise 1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (exercise 3-5 days/week)</option>
                <option value="very_active">Very Active (hard training 6-7 days/week)</option>
                <option value="extra_active">Extra Active (heavy physical labor/athlete)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Primary Fitness Goal</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300 cursor-pointer"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                id="profile-goal-input"
              >
                <option value="lose_fat">Fat Loss (Steady calorie deficit)</option>
                <option value="build_muscle">Muscle Hypertrophy (Anabolic surplus)</option>
                <option value="maintain">Body Conditioning (Maintenance calories)</option>
                <option value="recomp">Body Recomposition (Lean-mass focus)</option>
              </select>
            </div>

            {localError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2" id="profile-error-message">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 cursor-pointer"
              id="calculate-metrics-btn"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Biometrics...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  Apply & Calculate Biometrics
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/40 text-center">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">FitGenie AI • Medical-Grade Biometric Formulas</p>
        </div>
      </div>

      {/* Calculated Metrics Display */}
      <div className="lg:col-span-7 space-y-6" id="dashboard-results-panel">
        {profile ? (
          <div className="space-y-6">
            {/* Header Greeting Bento Box */}
            <div className="p-6 bg-slate-900/35 border border-slate-800/60 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl shadow-xl shadow-slate-950/10">
              <div>
                <span className="text-indigo-400 text-[10px] font-bold tracking-widest uppercase font-mono block mb-1">Diagnostic Report</span>
                <h3 className="text-2xl font-black text-white tracking-tight">{profile.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active goal: <span className="text-indigo-300 font-semibold">{getGoalLabel(profile.goal)}</span>
                </p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold px-4 py-2.5 rounded-2xl text-center shadow-inner">
                TDEE: {profile.tdee} kcal/day
              </div>
            </div>

            {/* Main Biometric Numbers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BMI Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/10" id="bmi-result-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Body Mass Index</span>
                  <Scale className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono">{profile.bmi}</span>
                  <span className="text-xs text-indigo-400 font-mono">kg/m²</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 font-bold uppercase rounded-full">
                    {profile.bmi < 18.5
                      ? 'Underweight'
                      : profile.bmi < 25
                      ? 'Normal'
                      : profile.bmi < 30
                      ? 'Overweight'
                      : 'Obese'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (profile.bmi / 40) * 100))}%` }}
                  />
                </div>
              </div>

              {/* BMR Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden shadow-lg shadow-slate-950/10" id="bmr-result-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Basal Metabolic</span>
                  <Flame className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono">{profile.bmr}</span>
                  <span className="text-xs text-slate-400 font-mono">kcal/d</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 italic leading-tight">Minimum cellular survival energy</p>
              </div>

              {/* Daily Calories Target */}
              <div className="bg-indigo-950/15 border border-indigo-500/20 rounded-3xl p-5 relative overflow-hidden shadow-lg shadow-indigo-950/5" id="calorie-target-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Target Intake</span>
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-indigo-300 font-mono">{profile.dailyCalories}</span>
                  <span className="text-xs text-indigo-400 font-mono">kcal/d</span>
                </div>
                <p className="text-[10px] text-indigo-400/80 mt-3 font-semibold">Goal Adaptive Calorie Level</p>
              </div>
            </div>

            {/* Macros Section */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/10" id="macros-breakdown-card">
              <h4 className="text-xs font-bold font-mono text-slate-300 mb-5 flex items-center gap-2 uppercase tracking-widest">
                <Layers className="w-4 h-4 text-indigo-400" />
                AI Macro Allocation splits
              </h4>

              <div className="grid grid-cols-3 gap-3">
                {/* Protein */}
                <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">Protein</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{profile.macros.protein}g</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1">
                    {Math.round((profile.macros.protein * 4 / profile.dailyCalories) * 100)}% kcal
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">Carbs</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{profile.macros.carbs}g</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1">
                    {Math.round((profile.macros.carbs * 4 / profile.dailyCalories) * 100)}% kcal
                  </div>
                </div>

                {/* Fats */}
                <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">Fats</div>
                  <div className="text-2xl font-black text-blue-400 font-mono">{profile.macros.fat}g</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1">
                    {Math.round((profile.macros.fat * 9 / profile.dailyCalories) * 100)}% kcal
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-semibold text-[11px]">Protein (Satiety & Repair)</span>
                    <span className="text-slate-300 font-mono text-[11px]">{profile.macros.protein}g / {profile.macros.protein}g</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-semibold text-[11px]">Carbohydrates (Performance fuel)</span>
                    <span className="text-slate-300 font-mono text-[11px]">{profile.macros.carbs}g / {profile.macros.carbs}g</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-semibold text-[11px]">Fats (Hormonal Balance)</span>
                    <span className="text-slate-300 font-mono text-[11px]">{profile.macros.fat}g / {profile.macros.fat}g</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Ideal Weight Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/10" id="ideal-weight-card">
              <h4 className="text-xs font-bold font-mono text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                <Scale className="w-4 h-4 text-indigo-400" />
                Ideal Biological Weight Target
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Based on your height of <span className="font-semibold text-slate-200">{profile.height} cm</span>, your ideal healthy BMI weight window is between{' '}
                <span className="font-semibold text-white">{profile.idealWeightRange.min} kg</span> and{' '}
                <span className="font-semibold text-white">{profile.idealWeightRange.max} kg</span>.
              </p>

              <div className="relative pt-4 pb-3 px-4 bg-slate-950/70 border border-slate-800/60 rounded-2xl">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
                  <span>30kg</span>
                  <span className="text-indigo-400 font-semibold">Optimal Healthy Range ({profile.idealWeightRange.min}-{profile.idealWeightRange.max}kg)</span>
                  <span>150kg</span>
                </div>
                <div className="relative h-4 bg-slate-900 rounded-full">
                  {/* Healthy zone */}
                  <div
                    className="absolute h-full bg-indigo-500/20 border-l border-r border-indigo-500/30"
                    style={{
                      left: `${((profile.idealWeightRange.min - 30) / 120) * 100}%`,
                      width: `${((profile.idealWeightRange.max - profile.idealWeightRange.min) / 120) * 100}%`,
                    }}
                  />
                  {/* Current weight pointer */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-400 border-2 border-slate-950 shadow-md flex items-center justify-center cursor-pointer"
                    style={{ left: `${((profile.weight - 30) / 120) * 100}%` }}
                    title={`Your Current Weight: ${profile.weight}kg`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  </div>
                </div>
                <div className="text-center text-xs text-indigo-400 mt-3 font-semibold">
                  Your weight ({profile.weight} kg) is currently{' '}
                  {profile.weight < profile.idealWeightRange.min
                    ? `${profile.idealWeightRange.min - profile.weight} kg below your healthy range.`
                    : profile.weight > profile.idealWeightRange.max
                    ? `${profile.weight - profile.idealWeightRange.max} kg above your healthy range.`
                    : 'fully within the optimal healthy weight range.'}
                </div>
              </div>
            </div>

            {/* Milestone Achievements Section */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/10" id="milestones-achievements-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h4 className="text-sm font-extrabold text-white">Milestone Achievements</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Progress badges unlocked based on your consistency & biological milestones.
                  </p>
                </div>

                {/* Counter & Filter Pills */}
                <div className="flex items-center gap-2">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{unlockedCount} / {milestonesList.length} Unlocked</span>
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                {(['all', 'unlocked', 'in_progress'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMilestoneFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer capitalize whitespace-nowrap ${
                      milestoneFilter === filter
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                        : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? `All (${milestonesList.length})` : filter === 'unlocked' ? `Unlocked (${unlockedCount})` : `In Progress (${milestonesList.length - unlockedCount})`}
                  </button>
                ))}
              </div>

              {/* Milestones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredMilestones.map((m) => {
                  const IconComponent = m.icon;
                  return (
                    <motion.div
                      key={m.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMilestone(m)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        m.isUnlocked
                          ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 shadow-md shadow-slate-950/30'
                          : 'bg-slate-950/40 border-slate-850 opacity-80 hover:opacity-100'
                      }`}
                      id={`milestone-badge-${m.id}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2.5 rounded-xl border ${m.bgGlow}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                {m.title}
                                {m.isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{m.category}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              m.isUnlocked
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {m.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {m.description}
                        </p>
                      </div>

                      {/* Progress Bar & Counter */}
                      <div className="mt-2 pt-2.5 border-t border-slate-850">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className={m.isUnlocked ? 'text-emerald-400 font-bold' : 'text-indigo-300 font-medium'}>
                            {m.current} / {m.target} {m.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              m.isUnlocked ? 'bg-emerald-400' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${m.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Milestone Detail Modal */}
            <AnimatePresence>
              {selectedMilestone && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 12 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                  >
                    <button
                      onClick={() => setSelectedMilestone(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="text-center pt-2 pb-4">
                      <div className={`w-16 h-16 mx-auto rounded-3xl border flex items-center justify-center mb-4 shadow-xl ${selectedMilestone.bgGlow}`}>
                        {React.createElement(selectedMilestone.icon, { className: 'w-8 h-8' })}
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        {selectedMilestone.category} Badge
                      </span>
                      <h3 className="text-xl font-black text-white">{selectedMilestone.title}</h3>

                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold bg-slate-950">
                        {selectedMilestone.isUnlocked ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Badge Earned & Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-slate-500" /> Currently In Progress
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl">
                        {selectedMilestone.description}
                      </p>

                      <div className="mt-4 text-left space-y-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Target Goal:</span>
                          <span className="text-white font-bold">{selectedMilestone.target} {selectedMilestone.unit}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Current Progress:</span>
                          <span className="text-indigo-400 font-bold">{selectedMilestone.current} {selectedMilestone.unit} ({selectedMilestone.progressPercent}%)</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Reward Status:</span>
                          <span className="text-amber-400 font-bold">{selectedMilestone.rewardText}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMilestone(null)}
                        className="w-full mt-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        Close Badge Details
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full bg-slate-900/10 border border-dashed border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[450px]">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full mb-4 animate-bounce">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Biometric Records</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
              Fill out your biological and goal parameters in the profile panel and click Calculate to initialize your AI diagnostic reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
