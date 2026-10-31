/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, WorkoutPlan, NutritionPlan, Exercise } from '../types';
import { Sparkles, Dumbbell, Apple, Clock, Flame, Info, Check, Printer, Settings2, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlannerViewProps {
  profile: UserProfile | null;
  workoutPlan: WorkoutPlan | null;
  nutritionPlan: NutritionPlan | null;
  onPlansGenerated: (workout: WorkoutPlan, nutrition: NutritionPlan) => void;
  onStartWorkoutSession?: (exercises: Exercise[]) => void;
}

export default function PlannerView({ profile, workoutPlan, nutritionPlan, onPlansGenerated, onStartWorkoutSession }: PlannerViewProps) {
  const [extraPreferences, setExtraPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'workout' | 'nutrition'>('workout');
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Quick preset chips for preferences
  const presets = [
    'Home workout (No equipment)',
    'Focus on chest & shoulder width',
    'High protein vegetarian menu',
    '30-minute quick training sessions',
    'Knee-friendly movements (No squats)',
    'Glute & core enhancement focus',
  ];

  const handleGenerate = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          extraPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not connect to Gemini AI Planner.');
      }

      const data = await response.json();
      if (data.workoutPlan && data.nutritionPlan) {
        onPlansGenerated(data.workoutPlan, data.nutritionPlan);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating plans. Please verify your Gemini API Key or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="planner-view-container">
      {/* Onboarding Lock Gate */}
      {!profile ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-200">Active Profile Required</h3>
          <p className="text-sm text-slate-400 mt-2">
            Please set up your physical metrics and fitness goals on the **Biometrics Dashboard** first, so our AI can craft plans optimized for your body.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Preferences Settings & Trigger (Left Col) */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 h-fit shadow-xl shadow-slate-950/15" id="planner-control-panel">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest block uppercase">AI Model Prefs</span>
                <h2 className="text-base font-extrabold text-white">Plan Customizer</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">Extra Goals & Adaptations</label>
                <textarea
                  className="w-full h-32 bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-slate-200 text-sm outline-none transition duration-300 resize-none"
                  placeholder="e.g., I work out in a home gym with dumbbells only. Make it vegetarian and wheat-free. Keep rest times short for cardiovascular intensity..."
                  value={extraPreferences}
                  onChange={(e) => setExtraPreferences(e.target.value)}
                  id="preferences-textarea"
                />
              </div>

              {/* Preset Chips */}
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-wider">Quick Preference Presets:</span>
                <div className="flex flex-wrap gap-1.5" id="preset-preferences-list">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExtraPreferences((prev) => (prev ? `${prev}. ${preset}` : preset))}
                      className="text-[10px] px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 transition duration-300 cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Trigger */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-bold text-sm rounded-2xl transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
                id="generate-plans-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Generating Dynamic Plans...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Generate Programs with Gemini
                  </>
                )}
              </button>

              {/* Quick AI status info */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/60 rounded-2xl flex gap-2.5 items-start text-xs text-slate-400 leading-relaxed shadow-inner">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Gemini analyzes your BMR, TDEE, macros, and preferences to build an injury-safe program.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Viewer Panel (Right Col) */}
          <div className="lg:col-span-8 space-y-6" id="planner-output-panel">
            {isLoading ? (
              /* Loading screen with fun coaching prompts */
              <div className="bg-slate-900/35 border border-slate-800/60 rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[500px] shadow-xl shadow-slate-950/15" id="planner-loading-screen">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-850 border-t-indigo-500 animate-spin flex items-center justify-center" />
                  <Dumbbell className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white animate-pulse">Consulting FitGenie AI Coach...</h3>
                <div className="max-w-sm text-sm text-slate-400 mt-3 space-y-2">
                  <p className="italic text-indigo-300/80">"Genie is computing your progressive overload weight patterns..."</p>
                  <p className="text-[11px] text-slate-500">"Tailoring amino-acid and macronutrient absorption ratios to match your daily {profile.dailyCalories} calorie requirements."</p>
                </div>
              </div>
            ) : workoutPlan && nutritionPlan ? (
              /* Core plan displaying */
              <div className="space-y-6" id="plans-display-content">
                {/* Header Switcher */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/35 border border-slate-850/80 rounded-3xl p-4">
                  <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-850 self-start shadow-inner">
                    <button
                      onClick={() => setActiveTab('workout')}
                      className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'workout'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      id="tab-workout-btn"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      Workout Split
                    </button>
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'nutrition'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      id="tab-nutrition-btn"
                    >
                      <Apple className="w-3.5 h-3.5" />
                      Nutrition Plan
                    </button>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-850 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-2xl transition duration-300 cursor-pointer"
                    id="print-workout-btn"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-400" />
                    Download PDF / Print
                  </button>
                </div>

                {/* Sub Tab: Workout Plan */}
                {activeTab === 'workout' && (
                  <div className="space-y-6" id="workout-plan-detail">
                    {/* Plan Summary Card */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/10">
                      <div className="flex justify-between items-start gap-4 flex-col md:flex-row">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest">Core Routine</span>
                          <h3 className="text-xl font-black text-white mt-1">{workoutPlan.title}</h3>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{workoutPlan.description}</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 px-4 py-3.5 rounded-2xl text-center shrink-0 w-full md:w-auto shadow-inner">
                          <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Goal Time</span>
                          <span className="text-xl font-black text-indigo-400 font-mono">{workoutPlan.weeklyGoalMinutes}</span>
                          <span className="block text-[9px] text-slate-400">mins/week</span>
                        </div>
                      </div>

                      {/* Day split selectors */}
                      <div className="flex gap-1.5 overflow-x-auto mt-6 pb-2 border-b border-slate-800/50" id="workout-day-tabs">
                        {workoutPlan.days.map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveDayIndex(idx)}
                            className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                              activeDayIndex === idx
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-inner'
                                : 'bg-slate-950/40 border-slate-850/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                            }`}
                          >
                            {day.dayName.split(':')[0] || `Day ${idx + 1}`}
                          </button>
                        ))}
                      </div>

                      {/* Selected Day Exercises list */}
                      <div className="mt-6 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-850 pb-3 gap-2">
                          <div>
                            <h4 className="text-sm font-black text-white">
                              {workoutPlan.days[activeDayIndex]?.dayName}
                            </h4>
                            <span className="text-[11px] text-indigo-400 font-semibold font-mono">
                              Focus: {workoutPlan.days[activeDayIndex]?.focus}
                            </span>
                          </div>

                          {onStartWorkoutSession && workoutPlan.days[activeDayIndex]?.exercises && (
                            <button
                              onClick={() => onStartWorkoutSession(workoutPlan.days[activeDayIndex].exercises)}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                              id="start-live-workout-btn"
                            >
                              <Sparkles className="w-4 h-4 text-indigo-200" />
                              Start Live AI Workout Session
                            </button>
                          )}
                        </div>

                        <div className="space-y-3" id="exercises-list-container">
                          {workoutPlan.days[activeDayIndex]?.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 hover:border-slate-800 transition duration-300"
                            >
                              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-indigo-500/25">
                                      {exIdx + 1}
                                    </span>
                                    <h5 className="font-extrabold text-white text-sm">{ex.name}</h5>
                                  </div>
                                  {ex.weightInstructions && (
                                    <p className="text-[11px] text-indigo-300/80 font-mono mt-1 pl-8">
                                      Load: {ex.weightInstructions}
                                    </p>
                                  )}
                                  {ex.tips && ex.tips.length > 0 && (
                                    <ul className="text-xs text-slate-400 mt-2.5 pl-8 space-y-1 list-disc">
                                      {ex.tips.map((tip, tIdx) => (
                                        <li key={tIdx} className="leading-relaxed">{tip}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 text-right font-mono self-end sm:self-auto">
                                  <div className="bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-xl min-w-[55px] text-center shadow-inner">
                                    <div className="text-[8px] text-slate-500 uppercase font-black">Sets</div>
                                    <div className="text-xs font-bold text-slate-300">{ex.sets}</div>
                                  </div>
                                  <div className="bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-xl min-w-[55px] text-center shadow-inner">
                                    <div className="text-[8px] text-slate-500 uppercase font-black">Reps</div>
                                    <div className="text-xs font-bold text-slate-300">{ex.reps}</div>
                                  </div>
                                  <div className="bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-xl min-w-[55px] text-center shadow-inner">
                                    <div className="text-[8px] text-slate-500 uppercase font-black">Rest</div>
                                    <div className="text-xs font-bold text-slate-300">{ex.restSeconds}s</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Nutrition Plan */}
                {activeTab === 'nutrition' && (
                  <div className="space-y-6" id="nutrition-plan-detail">
                    {/* Menu Overview Card */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/10">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest">Customized Feeding</span>
                          <h3 className="text-xl font-black text-white mt-1">{nutritionPlan.title}</h3>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{nutritionPlan.description}</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 px-4 py-3.5 rounded-2xl text-center shrink-0 self-stretch md:self-auto flex md:flex-col justify-between items-center shadow-inner">
                          <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Daily Water</span>
                          <span className="text-lg font-extrabold text-blue-400">{(nutritionPlan.dailyWaterTargetMl / 1000).toFixed(1)} L</span>
                          <span className="block text-[9px] text-slate-400 font-mono">Target Hydration</span>
                        </div>
                      </div>

                      {/* Meals Accordion / Stack */}
                      <div className="space-y-4" id="meals-list-container">
                        {nutritionPlan.meals.map((meal, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-850 rounded-2xl overflow-hidden shadow-sm"
                          >
                            {/* Meal Title Bar */}
                            <div className="p-4 bg-slate-900/40 border-b border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <div>
                                <h4 className="font-extrabold text-sm text-white">{meal.mealName}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Balanced macro split
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-lg font-bold">
                                  {meal.totalCalories} kcal
                                </span>
                                <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">
                                  P: {meal.totalProtein}g
                                </span>
                                <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">
                                  C: {meal.totalCarbs}g
                                </span>
                                <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">
                                  F: {meal.totalFat}g
                                </span>
                              </div>
                            </div>

                            {/* Food elements inside meal */}
                            <div className="p-4 space-y-3">
                              {meal.items.map((food, fIdx) => (
                                <div
                                  key={fIdx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-850/45 pb-2 last:border-0 last:pb-0"
                                >
                                  <div>
                                    <span className="font-extrabold text-slate-200">{food.name}</span>
                                    <span className="text-slate-500 font-mono ml-2">({food.portionSize})</span>
                                  </div>
                                  <div className="flex gap-3 text-slate-400 font-mono text-[11px]">
                                    <span>{food.calories} kcal</span>
                                    <span className="text-emerald-400 font-bold">P:{food.protein}g</span>
                                    <span className="text-amber-400 font-bold">C:{food.carbs}g</span>
                                    <span className="text-blue-400 font-bold">F:{food.fat}g</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Nutritional Advice Cards */}
                      <div className="mt-6 bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-inner">
                        <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-3">
                          FitGenie Coach Nutritional Directives
                        </h4>
                        <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
                          {nutritionPlan.nutritionalAdvice.map((advice, aIdx) => (
                            <li key={aIdx} className="flex gap-2.5 items-start">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{advice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Prompt state before plan is generated */
              <div className="bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[500px]" id="planner-prompt-screen">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Personalize Your AI Fitness Program</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                  Click the **Generate Programs** button to have Genie Coach build a customized training routine, compound set splits, and matching target macro menus tailored perfectly for your profile.
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  Create Plan Now
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
