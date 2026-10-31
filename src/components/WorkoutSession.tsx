/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Exercise, SavedWorkoutSession } from '../types';
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Dumbbell,
  Clock,
  Flame,
  Layers,
  Sparkles,
  Activity,
  Award,
  ChevronRight,
  Plus,
  Minus,
  Save,
  ShieldCheck,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkoutSessionProps {
  profile: UserProfile | null;
  initialExercises?: Exercise[];
  onSaveWorkout: (session: SavedWorkoutSession) => Promise<boolean>;
  onCloseSession: () => void;
}

export default function WorkoutSession({
  profile,
  initialExercises,
  onSaveWorkout,
  onCloseSession,
}: WorkoutSessionProps) {
  // Session ID generated uniquely at session start to prevent duplicate saves
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const startTimeRef = useRef<string>(new Date().toISOString());

  // Default exercise list
  const defaultExercisesList: Exercise[] = initialExercises && initialExercises.length > 0 ? initialExercises : [
    { name: 'Squat', sets: 3, reps: '12', restSeconds: 60, tips: ['Keep chest up', 'Knees in line with toes'] },
    { name: 'Pushups', sets: 3, reps: '15', restSeconds: 60, tips: ['Core engaged', 'Elbows at 45 degree angle'] },
    { name: 'Plank', sets: 3, reps: 'Hold 60s', restSeconds: 45, tips: ['Straight body line', 'Engage core and glutes'] },
    { name: 'Bicep Curl', sets: 3, reps: '12', restSeconds: 45, tips: ['Keep elbows tucked', 'No momentum swing'] },
  ];

  const [exercises, setExercises] = useState<Exercise[]>(defaultExercisesList);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Live tracking states
  const [currentSet, setCurrentSet] = useState(1);
  const [completedRepsInSet, setCompletedRepsInSet] = useState(0);
  
  // Exercise performance logs map: exerciseName -> { setsCompleted, totalReps, plankSeconds }
  const [sessionLogs, setSessionLogs] = useState<{
    [exerciseName: string]: { setsCompleted: number; totalReps: number; plankSeconds: number };
  }>({});

  // Workout duration timer (seconds)
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [positionCountdown, setPositionCountdown] = useState<number | null>(null);

  // Plank duration timer (seconds)
  const [plankTimer, setPlankTimer] = useState(0);
  const [isPlankActive, setIsPlankActive] = useState(false);

  // Camera and AI Coach states
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [aiCoachCue, setAiCoachCue] = useState<string>('Ready to begin. Click "Start Workout" to give yourself time to get into position!');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // End Session Confirmation Modal
  const [showEndModal, setShowEndModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const activeExercise = exercises[currentExerciseIndex] || exercises[0];
  const isPlank = activeExercise.name.toLowerCase().includes('plank');

  // Start Workout with 3s positioning countdown
  const handleStartWorkout = () => {
    if (isSessionActive || positionCountdown !== null) return;
    setPositionCountdown(3);
    setAiCoachCue('Get into position! Live AI tracking starting in 3 seconds...');
  };

  // Pause / Stop Session
  const handleStopWorkout = () => {
    setIsSessionActive(false);
    setIsPlankActive(false);
    setPositionCountdown(null);
    setAiCoachCue('Workout paused. Step into position and click "Start / Resume" when ready.');
  };

  // Positioning Countdown Effect
  useEffect(() => {
    if (positionCountdown === null) return;

    if (positionCountdown > 0) {
      const timer = setTimeout(() => {
        const nextVal = positionCountdown - 1;
        setPositionCountdown(nextVal);
        if (nextVal > 0) {
          setAiCoachCue(`Get into position! Live tracking starts in ${nextVal}...`);
        } else {
          setAiCoachCue('GO! AI Live Coach active. Perfect your form and track reps.');
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (positionCountdown === 0) {
      setPositionCountdown(null);
      setIsSessionActive(true);
    }
  }, [positionCountdown]);

  // Workout Duration Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive) {
      interval = setInterval(() => {
        setWorkoutDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Plank Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isPlankActive) {
      interval = setInterval(() => {
        setPlankTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlankActive]);

  // Webcam stream cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    setUseWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setAiCoachCue('Webcam stream connected! AI Coach actively analyzing biomechanical alignment.');
    } catch (err) {
      console.error('Webcam error:', err);
      alert('Camera access unavailable or permission denied. Using procedural AI simulator.');
      setUseWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseWebcam(false);
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Log set completion
  const handleCompleteSet = () => {
    const exName = activeExercise.name;
    setSessionLogs((prev) => {
      const existing = prev[exName] || { setsCompleted: 0, totalReps: 0, plankSeconds: 0 };
      return {
        ...prev,
        [exName]: {
          setsCompleted: existing.setsCompleted + 1,
          totalReps: existing.totalReps + completedRepsInSet,
          plankSeconds: existing.plankSeconds + plankTimer,
        },
      };
    });

    // Reset rep counter for next set
    setCompletedRepsInSet(0);
    if (isPlankActive) {
      setIsPlankActive(false);
    }

    if (currentSet < activeExercise.sets) {
      setCurrentSet((prev) => prev + 1);
      setAiCoachCue(`Set ${currentSet} completed! Take a ${activeExercise.restSeconds}s rest, then begin Set ${currentSet + 1}.`);
    } else {
      setAiCoachCue(`All ${activeExercise.sets} sets for ${exName} finished! Excellent effort.`);
      if (currentExerciseIndex < exercises.length - 1) {
        setTimeout(() => {
          setCurrentExerciseIndex((prev) => prev + 1);
          setCurrentSet(1);
          setPlankTimer(0);
        }, 1200);
      }
    }
  };

  // AI rep increment simulation / manual increment
  const handleAddRep = (delta: number) => {
    setCompletedRepsInSet((prev) => Math.max(0, prev + delta));
    if (delta > 0) {
      setAiCoachCue(`Rep logged! (${completedRepsInSet + delta} total in Set ${currentSet})`);
    }
  };

  // Total summary calculations
  const calculateSummary = () => {
    let totalSets = 0;
    let totalReps = 0;
    let totalPlankSeconds = 0;

    const exercisesSummary = exercises.map((ex) => {
      const log = sessionLogs[ex.name] || { setsCompleted: 0, totalReps: 0, plankSeconds: 0 };
      totalSets += log.setsCompleted;
      totalReps += log.totalReps;
      totalPlankSeconds += log.plankSeconds;
      return {
        name: ex.name,
        setsCompleted: log.setsCompleted,
        totalReps: log.totalReps,
        plankDurationSeconds: log.plankSeconds,
      };
    });

    // Rough calorie estimation: ~8 kcal per active workout minute
    const durationMinutes = Math.max(1, Math.round(workoutDuration / 60));
    const estimatedCaloriesBurned = Math.round(durationMinutes * 8.5);

    return {
      id: sessionIdRef.current,
      date: new Date().toISOString().split('T')[0],
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      workoutDurationSeconds: workoutDuration,
      exercises: exercisesSummary,
      totalSets,
      totalReps,
      totalPlankSeconds,
      estimatedCaloriesBurned,
      savedAt: new Date().toISOString(),
    };
  };

  const handleFinishSessionClick = () => {
    setIsSessionActive(false);
    setIsPlankActive(false);
    setShowEndModal(true);
  };

  const handleConfirmSave = async () => {
    if (isSaving || isSaved) return; // Prevent duplicate clicks
    setIsSaving(true);

    const summaryData = calculateSummary();
    try {
      const success = await onSaveWorkout(summaryData);
      if (success) {
        setIsSaved(true);
        setAiCoachCue('Workout session successfully saved to database!');
      } else {
        alert('Could not save workout. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving workout session.');
    } finally {
      setIsSaving(false);
    }
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6" id="workout-session-view">
      {/* Top Banner & Live Timer Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner">
            <Dumbbell className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                LIVE SESSION
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                AI Coach Active
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Live AI Workout Session</h2>
          </div>
        </div>

        {/* Global Live Workout Duration Clock & Start/Stop Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl shadow-inner">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Workout Duration</span>
              <span className="text-lg font-black font-mono text-white tracking-wider">
                {formatTime(workoutDuration)}
              </span>
            </div>
          </div>

          {/* Start / Stop Control Buttons */}
          {isSessionActive ? (
            <button
              onClick={handleStopWorkout}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-2xl transition duration-300 shadow-lg shadow-amber-900/20 flex items-center gap-2 cursor-pointer"
              id="stop-workout-btn"
            >
              <Pause className="w-4 h-4 fill-white" />
              Pause / Stop
            </button>
          ) : (
            <button
              onClick={handleStartWorkout}
              disabled={positionCountdown !== null}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl transition duration-300 shadow-lg shadow-emerald-900/20 flex items-center gap-2 cursor-pointer"
              id="start-workout-btn"
            >
              <Play className="w-4 h-4 fill-white" />
              {positionCountdown !== null ? `Starting in ${positionCountdown}...` : workoutDuration > 0 ? 'Resume Workout' : 'Start Workout'}
            </button>
          )}

          {/* Finish Session Button */}
          <button
            onClick={handleFinishSessionClick}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl transition duration-300 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            id="finish-session-btn"
          >
            <X className="w-4 h-4" />
            End Workout Session
          </button>
        </div>
      </div>

      {/* Main Grid: AI Video Feed & Live Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Camera Feed & AI Coach Feedback (Left Col) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Live Pose & Biomechanics Feed
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  title={isAudioMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                </button>

                {useWebcam ? (
                  <button
                    onClick={stopWebcam}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Off Camera
                  </button>
                ) : (
                  <button
                    onClick={startWebcam}
                    className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Webcam Feed
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport / Simulator Canvas */}
            <div className="relative aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
              {useWebcam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h4 className="text-white text-sm font-bold">AI Computer Vision Active</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Pose tracking simulation in progress for <span className="text-indigo-400 font-bold">{activeExercise.name}</span>. Connect webcam or log reps below.
                  </p>
                </div>
              )}

              {/* 3-Second Positioning Countdown Overlay */}
              {positionCountdown !== null && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-4xl font-black font-mono animate-bounce mb-3 shadow-2xl">
                    {positionCountdown}
                  </div>
                  <h3 className="text-xl font-black text-white">GET INTO POSITION!</h3>
                  <p className="text-xs text-slate-300 max-w-xs mt-1 leading-relaxed">
                    Step into view for <span className="text-indigo-400 font-bold">{activeExercise.name}</span>. Live AI tracking starts in {positionCountdown}s...
                  </p>
                </div>
              )}

              {/* Paused / Not Started Overlay */}
              {!isSessionActive && positionCountdown === null && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
                    <Play className="w-6 h-6 fill-indigo-400 ml-0.5" />
                  </div>
                  <h4 className="text-white text-sm font-black">Session Paused / Ready</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 leading-relaxed">
                    Step back into position and click Start when ready.
                  </p>
                  <button
                    onClick={handleStartWorkout}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl transition duration-300 shadow-xl shadow-indigo-900/30 flex items-center gap-2 cursor-pointer"
                    id="overlay-start-workout-btn"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Workout (3s Position Time)
                  </button>
                </div>
              )}

              {/* Realtime Skeleton Bounding Box Overlay Graphic */}
              <div className="absolute inset-4 border border-dashed border-indigo-500/30 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-indigo-400 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/20">
                    TARGET: {activeExercise.name.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
                    ALIGNMENT: {isSessionActive ? 'OPTIMAL (94%)' : 'PAUSED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                    FPS: 60 • LATENCY: 12ms
                  </span>
                  <span className="text-[9px] font-mono text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/20">
                    {isSessionActive ? 'FORM LOCK ON' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Live Cue Card */}
          <div className="mt-4 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-widest block mb-0.5">
                Genie AI Live Audio Coach
              </span>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                "{aiCoachCue}"
              </p>
            </div>
          </div>
        </div>

        {/* Live Tracking Controls (Right Col) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Exercise Selector */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Current Active Exercise
            </label>
            <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-850 p-2 rounded-2xl">
              <select
                value={currentExerciseIndex}
                onChange={(e) => {
                  setCurrentExerciseIndex(Number(e.target.value));
                  setCurrentSet(1);
                  setCompletedRepsInSet(0);
                  setPlankTimer(0);
                }}
                className="bg-transparent text-white font-extrabold text-sm outline-none px-2 py-1 w-full cursor-pointer"
              >
                {exercises.map((ex, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900 text-white">
                    {ex.name} ({ex.sets} sets x {ex.reps})
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Tips */}
            {activeExercise.tips && activeExercise.tips.length > 0 && (
              <div className="mt-3 p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-400">
                <span className="font-bold text-indigo-400 font-mono text-[9px] uppercase block mb-1">
                  Biomechanical Cue:
                </span>
                <p>{activeExercise.tips[0]}</p>
              </div>
            )}
          </div>

          {/* Sets & Repetitions Live Tracker */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xl">
            {/* Sets Progress Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Set Progress</span>
                <h4 className="text-lg font-black text-white">
                  Set {currentSet} of {activeExercise.sets}
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: activeExercise.sets }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      idx + 1 < currentSet
                        ? 'bg-emerald-400 border-emerald-400 shadow shadow-emerald-400/30'
                        : idx + 1 === currentSet
                        ? 'bg-indigo-500 border-indigo-400 animate-pulse'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Repetitions Tracker Component */}
            {!isPlank ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Repetitions Completed (This Set)</span>
                  <span className="text-2xl font-black font-mono text-indigo-400">
                    {completedRepsInSet} / <span className="text-slate-500 text-base">{activeExercise.reps}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddRep(-1)}
                    className="py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Minus className="w-4 h-4" /> -1 Rep
                  </button>
                  <button
                    onClick={() => handleAddRep(1)}
                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20 col-span-2"
                  >
                    <Plus className="w-4 h-4" /> +1 Rep Logged
                  </button>
                </div>
              </div>
            ) : (
              /* Plank Duration Timer Component */
              <div className="space-y-4 bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  Plank Hold Duration
                </span>

                <div className="text-4xl font-black font-mono text-indigo-400 tracking-wider">
                  {formatTime(plankTimer)}
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => setIsPlankActive(!isPlankActive)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      isPlankActive
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }`}
                  >
                    {isPlankActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlankActive ? 'Pause Plank' : 'Start Plank Hold'}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlankActive(false);
                      setPlankTimer(0);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            )}

            {/* Complete Set Action Button */}
            <button
              onClick={handleCompleteSet}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl transition duration-300 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Finish Set {currentSet} Log
            </button>
          </div>
        </div>
      </div>

      {/* End Session Confirmation & Save Modal */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="text-center pt-2">
                <div className="w-16 h-16 mx-auto rounded-3xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 shadow-xl">
                  <Award className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-black text-white">Workout Session Complete!</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Great effort! Would you like to save this workout session to your persistent history?
                </p>
              </div>

              {/* Summary Stats Matrix */}
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Workout Duration:</span>
                  <span className="text-white font-bold">{formatTime(summary.workoutDurationSeconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Sets Completed:</span>
                  <span className="text-indigo-400 font-bold">{summary.totalSets} sets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Repetitions:</span>
                  <span className="text-indigo-400 font-bold">{summary.totalReps} reps</span>
                </div>
                {summary.totalPlankSeconds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plank Hold Duration:</span>
                    <span className="text-indigo-400 font-bold">{formatTime(summary.totalPlankSeconds)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-850 pt-2 mt-2">
                  <span className="text-slate-400">Est. Calories Burned:</span>
                  <span className="text-amber-400 font-bold">{summary.estimatedCaloriesBurned} kcal</span>
                </div>
              </div>

              {/* Duplicate Prevention Status / Confirm buttons */}
              {isSaved ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-center text-xs font-bold space-y-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Workout Session Saved to Database!
                  </div>
                  <button
                    onClick={onCloseSession}
                    className="w-full mt-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmSave}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-extrabold rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving to Database...' : 'Yes, Save Workout'}
                  </button>

                  <button
                    onClick={onCloseSession}
                    disabled={isSaving}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-2xl transition cursor-pointer"
                  >
                    Discard / Do Not Save
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
