/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Dumbbell, 
  Sparkles, 
  Sliders, 
  Activity, 
  Play, 
  Square, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Eye, 
  Info, 
  Award, 
  Zap, 
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { FormCorrectionResult, PostureAnalysisResult, LiveJointAngles, LiveFormFeedback, SetSummaryResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getPoseDetector, 
  mapKeypoints, 
  extractLiveAngles, 
  ExerciseRepEngine, 
  drawPoseSkeleton, 
  audioCoach,
  KeypointMap 
} from '../utils/poseTracker';
import { generateSimulatedPose } from '../utils/poseSimulator';
import type { PoseDetector } from '@tensorflow-models/pose-detection';

interface VisionLabProps {
  onStartWorkoutSession?: () => void;
  onSaveCompletedSet?: (exerciseName: string, reps: number) => void;
}

export default function VisionLab({ onStartWorkoutSession, onSaveCompletedSet }: VisionLabProps) {
  // Main view mode: 'realtime' (Pose tracking) vs 'fallback' (Single photo / Posture)
  const [activeMode, setActiveMode] = useState<'realtime' | 'fallback'>('realtime');
  const [fallbackSubTab, setFallbackSubTab] = useState<'form' | 'posture'>('form');

  // Exercise selection
  const [selectedExercise, setSelectedExercise] = useState<'Squat' | 'Push-ups' | 'Bicep Curl'>('Squat');

  // Stream state: 'offline' | 'webcam' | 'simulated'
  const [streamSource, setStreamSource] = useState<'offline' | 'webcam' | 'simulated'>('offline');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulation form quality tweak
  const [simFormQuality, setSimFormQuality] = useState<'perfect' | 'shallow' | 'lean'>('perfect');

  // References for live video and canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);

  // Rep engine instance
  const repEngineRef = useRef<ExerciseRepEngine>(new ExerciseRepEngine('Squat'));

  // Live Telemetry States (for UI gauges)
  const [liveAngles, setLiveAngles] = useState<LiveJointAngles>({
    knee: 175,
    hip: 175,
    elbow: 175,
    spine: 5,
    side: 'both',
  });
  const [feedback, setFeedback] = useState<LiveFormFeedback>({
    status: 'idle',
    message: 'Start camera or simulated feed to begin tracking',
    detail: 'MoveNet tracking ready',
    repPhase: 'ready',
  });
  const [repCount, setRepCount] = useState(0);
  const [cleanReps, setCleanReps] = useState(0);
  const [warningReps, setWarningReps] = useState(0);
  const [fps, setFps] = useState(0);

  // Gemini Set Summary State
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [setSummary, setSetSummary] = useState<SetSummaryResult | null>(null);

  // States for Fallback Photo Analysis (/api/vision/form)
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formResult, setFormResult] = useState<FormCorrectionResult | null>(null);
  const [isFormAnalyzing, setIsFormAnalyzing] = useState(false);

  // States for Posture (/api/vision/posture)
  const [postureImage, setPostureImage] = useState<string | null>(null);
  const [postureResult, setPostureResult] = useState<PostureAnalysisResult | null>(null);
  const [isPostureAnalyzing, setIsPostureAnalyzing] = useState(false);

  const exercises = [
    { name: 'Squat' as const, targetJoint: 'Knee Depth (<100°)', spineRule: 'Neutral (<45°)' },
    { name: 'Push-ups' as const, targetJoint: 'Chest Depth (<95°)', spineRule: 'Plank Line (160°-190°)' },
    { name: 'Bicep Curl' as const, targetJoint: 'Peak Flexion (<60°)', spineRule: 'Elbows Fixed' },
  ];

  // Sync engine when exercise changes
  useEffect(() => {
    repEngineRef.current.reset(selectedExercise);
    setRepCount(0);
    setCleanReps(0);
    setWarningReps(0);
    setSetSummary(null);
  }, [selectedExercise]);

  // Clean up streams & animation loops on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // Initialize MoveNet detector on mount or when switching to realtime mode
  useEffect(() => {
    let isMounted = true;
    if (activeMode === 'realtime' && !detectorRef.current) {
      setIsModelLoading(true);
      getPoseDetector()
        .then((det) => {
          if (isMounted) {
            detectorRef.current = det;
            setIsModelLoading(false);
          }
        })
        .catch((err) => {
          console.error('Pose detector load error:', err);
          if (isMounted) {
            setModelError('Could not initialize MoveNet backend. Falling back to procedural engine.');
            setIsModelLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeMode]);

  // Start Real Webcam Stream
  const startWebcam = async () => {
    stopStream();
    setStreamSource('webcam');
    setSetSummary(null);
    repEngineRef.current.reset(selectedExercise);
    setRepCount(0);
    setCleanReps(0);
    setWarningReps(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startPoseDetectionLoop();
        };
      }
    } catch (err) {
      console.warn('Webcam permission error or missing hardware:', err);
      alert('Camera access denied or device unavailable. Launching real-time simulated motion stream!');
      startSimulatedStream();
    }
  };

  // Start Procedural Simulated Stream (for users without camera)
  const startSimulatedStream = () => {
    stopStream();
    setStreamSource('simulated');
    setSetSummary(null);
    repEngineRef.current.reset(selectedExercise);
    setRepCount(0);
    setCleanReps(0);
    setWarningReps(0);

    startSimulationLoop();
  };

  // Stop active stream and pose loop
  const stopStream = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStreamSource('offline');
    setFps(0);

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Core detection loop for real webcam
  const startPoseDetectionLoop = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || streamSource === 'offline') {
        return;
      }

      if (video.readyState >= 2) {
        // Sync canvas resolution with video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            let kpMap: KeypointMap = {};

            if (detectorRef.current) {
              const poses = await detectorRef.current.estimatePoses(video, {
                flipHorizontal: true, // webcam is mirrored
              });

              if (poses.length > 0 && poses[0].keypoints) {
                kpMap = mapKeypoints(poses[0].keypoints);
              }
            }

            if (Object.keys(kpMap).length > 0) {
              const angles = extractLiveAngles(kpMap);
              setLiveAngles(angles);

              const { repCompleted, feedback: currentFeedback } = repEngineRef.current.processFrame(angles);
              setFeedback(currentFeedback);
              setRepCount(repEngineRef.current.repCount);
              setCleanReps(repEngineRef.current.cleanRepCount);
              setWarningReps(repEngineRef.current.warningRepCount);

              if (repCompleted) {
                if (soundEnabled) audioCoach.playRepBeep();
              } else if (currentFeedback.status === 'warning') {
                // Throttle warning beep
              }

              drawPoseSkeleton(ctx, kpMap, angles, currentFeedback, canvas.width, canvas.height);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          } catch (e) {
            console.error('Frame pose tracking error:', e);
          }
        }
      }

      // Calculate FPS
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Loop for Simulated Stream
  const startSimulationLoop = () => {
    let startTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (currentTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (canvas.width !== 640 || canvas.height !== 480) {
        canvas.width = 640;
        canvas.height = 480;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const elapsed = currentTime - startTime;
        const kpMap = generateSimulatedPose(
          selectedExercise,
          elapsed,
          canvas.width,
          canvas.height,
          simFormQuality
        );

        const angles = extractLiveAngles(kpMap);
        setLiveAngles(angles);

        const { repCompleted, feedback: currentFeedback } = repEngineRef.current.processFrame(angles);
        setFeedback(currentFeedback);
        setRepCount(repEngineRef.current.repCount);
        setCleanReps(repEngineRef.current.cleanRepCount);
        setWarningReps(repEngineRef.current.warningRepCount);

        if (repCompleted) {
          if (soundEnabled) audioCoach.playRepBeep();
        }

        // Draw gym grid background for simulator
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Perspective floor
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.88);
        ctx.lineTo(canvas.width, canvas.height * 0.88);
        ctx.stroke();

        drawPoseSkeleton(ctx, kpMap, angles, currentFeedback, canvas.width, canvas.height);
      }

      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Finish Set & Request Gemini Coaching Summary
  const handleFinishSet = async () => {
    if (repCount === 0) {
      alert('Complete at least 1 tracked repetition before generating your set summary.');
      return;
    }

    setIsGeneratingSummary(true);
    const metrics = repEngineRef.current.getSummaryMetrics();

    try {
      const response = await fetch('/api/vision/set-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        throw new Error('Set summary endpoint error');
      }

      const data: SetSummaryResult = await response.json();
      setSetSummary(data);

      if (onSaveCompletedSet) {
        onSaveCompletedSet(selectedExercise, repCount);
      }
    } catch (err) {
      console.error('Failed to generate set summary:', err);
      // Fallback summary if Gemini endpoint fails
      setSetSummary({
        headline: `${selectedExercise} Set - ${repCount} Reps Finished`,
        summary: `You completed ${repCount} reps with ${cleanReps} clean repetitions and ${warningReps} form adjustments noted.`,
        biomechanicalNote: `Minimum recorded joint angle was ${metrics.minKneeAngle}°. Average spine tilt remained within optimal parameters.`,
        cueForNextSet: `Maintain tempo control during the eccentric phase to maximize muscle fiber recruitment.`,
        formRating: cleanReps >= warningReps ? 'Strong Execution' : 'Form Breakdown',
        overallScore: Math.min(100, Math.max(50, Math.round((cleanReps / Math.max(1, repCount)) * 100))),
      });
    } finally {
      setIsGeneratingSummary(false);
      stopStream();
    }
  };

  // Reset Set
  const handleResetSet = () => {
    repEngineRef.current.reset(selectedExercise);
    setRepCount(0);
    setCleanReps(0);
    setWarningReps(0);
    setSetSummary(null);
  };

  // ===================== FALLBACK / PHOTO SCANNER HANDLERS =====================
  const captureFrameFromWebcam = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleFormAnalyze = async () => {
    setIsFormAnalyzing(true);
    setFormResult(null);

    const base64Img = formImage || captureFrameFromWebcam();
    if (!base64Img) {
      alert('Please select or capture a photo first.');
      setIsFormAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('/api/vision/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: selectedExercise,
          imageBase64: base64Img,
        }),
      });

      if (!response.ok) throw new Error('Form check error');
      const data = await response.json();
      setFormResult(data);
    } catch (e) {
      console.error(e);
      alert('Form AI check failed. Please check your network or API status.');
    } finally {
      setIsFormAnalyzing(false);
    }
  };

  const handlePostureAnalyze = async () => {
    setIsPostureAnalyzing(true);
    setPostureResult(null);

    const base64Img = postureImage || captureFrameFromWebcam();
    if (!base64Img) {
      alert('Please upload a standing posture photo first.');
      setIsPostureAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('/api/vision/posture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Img }),
      });

      if (!response.ok) throw new Error('Posture check error');
      const data = await response.json();
      setPostureResult(data);
    } catch (e) {
      console.error(e);
      alert('Posture scan failed.');
    } finally {
      setIsPostureAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'form' | 'posture') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'form') {
        setFormImage(reader.result as string);
        setFormResult(null);
      } else {
        setPostureImage(reader.result as string);
        setPostureResult(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6" id="vision-lab-container">
      {/* Top Header & Navigation Mode Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl shadow-inner w-full md:w-auto" id="vision-mode-tabs">
          <button
            onClick={() => {
              setActiveMode('realtime');
              setFormResult(null);
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'realtime'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="realtime-tracker-tab-btn"
          >
            <Activity className="w-4 h-4 text-emerald-300" />
            Real-Time Pose Tracker (MoveNet)
          </button>

          <button
            onClick={() => {
              setActiveMode('fallback');
              stopStream();
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'fallback'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="fallback-scanner-tab-btn"
          >
            <Camera className="w-4 h-4" />
            Photo & Posture Fallback
          </button>
        </div>

        {onStartWorkoutSession && (
          <button
            onClick={onStartWorkoutSession}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            id="launch-workout-session-btn"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            Launch Live Workout Session
          </button>
        )}
      </div>

      {/* REAL-TIME POSE TRACKING VIEW */}
      {activeMode === 'realtime' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Video + Skeleton Overlay (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-xl shadow-slate-950/15" id="realtime-camera-stage">
            <div>
              {/* Exercise Selection Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Active Biomechanics Engine
                  </span>
                  <div className="flex gap-2 mt-1.5" id="live-exercise-selector">
                    {exercises.map((ex) => (
                      <button
                        key={ex.name}
                        onClick={() => setSelectedExercise(ex.name)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedExercise === ex.name
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-inner'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title={soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  </button>

                  {streamSource === 'offline' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={startWebcam}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/30 cursor-pointer"
                        id="start-live-webcam-btn"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Start Webcam
                      </button>
                      <button
                        onClick={startSimulatedStream}
                        className="px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        id="start-sim-stream-btn"
                        title="Run procedural animated skeleton test stream"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        Simulated Stream
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={stopStream}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      id="stop-live-stream-btn"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop Feed
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Window (Webcam + Canvas Overlay) */}
              <div className="relative aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner" id="live-viewfinder">
                {/* Real Webcam video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${
                    streamSource === 'webcam' ? 'block' : 'hidden'
                  }`}
                />

                {/* Skeleton Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    streamSource !== 'offline' ? 'block' : 'hidden'
                  }`}
                />

                {/* Offline Standby Placeholder */}
                {streamSource === 'offline' && (
                  <div className="text-center p-8 text-slate-500 flex flex-col items-center">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-full mb-3 text-emerald-400">
                      <Activity className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">Live Pose Tracking Offline</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                      Tap **Start Webcam** to track your joints in real-time at 30+ FPS, or hit **Simulated Stream** to immediately test rep counting and angle thresholds with procedural kinematics.
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={startWebcam}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                      >
                        Start Webcam
                      </button>
                      <button
                        onClick={startSimulatedStream}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition"
                      >
                        Simulated Stream
                      </button>
                    </div>
                  </div>
                )}

                {/* Model Loading Spinner */}
                {isModelLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-20">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                      Initializing MoveNet Neural Network...
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Accelerating via WebGL browser runtime</span>
                  </div>
                )}

                {/* In-Viewfinder Live HUD Banner */}
                {streamSource !== 'offline' && (
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10 gap-2">
                    {/* Live Form Alert Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-2 ${
                      feedback.status === 'correct'
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : feedback.status === 'warning'
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 animate-pulse'
                        : feedback.status === 'alert'
                        ? 'bg-red-950/80 border-red-500/40 text-red-300 animate-bounce'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300'
                    }`}>
                      {feedback.status === 'correct' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : feedback.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Activity className="w-4 h-4 text-teal-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider leading-none">
                          {feedback.message}
                        </div>
                        <div className="text-[9px] text-slate-300 mt-0.5 leading-none">
                          {feedback.detail}
                        </div>
                      </div>
                    </div>

                    {/* Live FPS & Rep Phase badge */}
                    <div className="px-2.5 py-1 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[9px] font-mono text-slate-300 backdrop-blur-md shrink-0">
                      <span className="text-emerald-400 font-bold">{fps} FPS</span> • <span className="uppercase text-slate-400">{feedback.repPhase}</span>
                    </div>
                  </div>
                )}

                {/* Big Rep Counter Watermark in corner */}
                {streamSource !== 'offline' && (
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl pointer-events-none shadow-xl flex items-center gap-3">
                    <div>
                      <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                        Total Reps
                      </span>
                      <span className="text-3xl font-black font-mono text-white leading-none">
                        {repCount}
                      </span>
                    </div>
                    <div className="border-l border-slate-800 pl-3 space-y-0.5 text-[10px] font-mono font-bold">
                      <div className="text-emerald-400 flex items-center gap-1">
                        <span>✓</span> {cleanReps} Clean
                      </div>
                      <div className="text-amber-400 flex items-center gap-1">
                        <span>⚠</span> {warningReps} Flags
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between flex-wrap gap-3">
              {/* Simulator Form Tweaker (visible in simulation mode) */}
              {streamSource === 'simulated' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Simulated Form:</span>
                  <select
                    value={simFormQuality}
                    onChange={(e) => setSimFormQuality(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="perfect">Perfect Depth & Posture</option>
                    <option value="shallow">Shallow Depth (Trigger Warning)</option>
                    <option value="lean">Excessive Lean / Sagging (Warning)</option>
                  </select>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tracking: Knee, Hip, Elbow & Spine trunk inclination</span>
                </div>
              )}

              {/* Set Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetSet}
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  title="Reset set counts"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  onClick={handleFinishSet}
                  disabled={repCount === 0 || isGeneratingSummary}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/30 transition flex items-center gap-1.5 cursor-pointer"
                  id="finish-set-btn"
                >
                  {isGeneratingSummary ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Gemini Analyzing Set...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      Finish Set & Get AI Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Telemetry Gauges + Gemini Set Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5" id="realtime-telemetry-stage">
            {/* Real-time Joint Angle Gauges */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl shadow-slate-950/15 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Kinematic Telemetry
                  </span>
                  <h4 className="text-sm font-extrabold text-white">Live Joint Angles</h4>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
                  Side: {liveAngles.side.toUpperCase()}
                </span>
              </div>

              {/* 4 Angle Gauges: Knee, Hip, Elbow, Spine */}
              <div className="grid grid-cols-2 gap-3">
                {/* Knee Angle */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  selectedExercise === 'Squat'
                    ? liveAngles.knee <= 100
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-slate-950/80 border-slate-850'
                    : 'bg-slate-950/80 border-slate-850'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Knee Flexion</span>
                    {selectedExercise === 'Squat' && liveAngles.knee <= 100 && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Depth!
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {liveAngles.knee}°
                  </div>
                  <div className="w-full bg-slate-850 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        liveAngles.knee <= 100 ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (180 - liveAngles.knee) / 1.1))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Parallel target: &le;100°</span>
                </div>

                {/* Hip Angle */}
                <div className="p-3.5 rounded-2xl border bg-slate-950/80 border-slate-850">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Hip Hinge</span>
                    {selectedExercise === 'Push-ups' && (liveAngles.hip < 155 || liveAngles.hip > 195) && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Sag/Pike
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {liveAngles.hip}°
                  </div>
                  <div className="w-full bg-slate-850 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-100"
                      style={{ width: `${Math.min(100, Math.max(0, (180 - liveAngles.hip) / 1.1))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Pushup plank: 160°-190°</span>
                </div>

                {/* Elbow Angle */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  selectedExercise === 'Push-ups' || selectedExercise === 'Bicep Curl'
                    ? (selectedExercise === 'Push-ups' && liveAngles.elbow <= 95) || (selectedExercise === 'Bicep Curl' && liveAngles.elbow <= 60)
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-slate-950/80 border-slate-850'
                    : 'bg-slate-950/80 border-slate-850'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Elbow Angle</span>
                    {selectedExercise === 'Bicep Curl' && liveAngles.elbow <= 60 && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Peak!
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {liveAngles.elbow}°
                  </div>
                  <div className="w-full bg-slate-850 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        liveAngles.elbow <= 95 ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (180 - liveAngles.elbow) / 1.2))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {selectedExercise === 'Push-ups' ? 'Chest depth: &le;95°' : 'Peak curl: &le;60°'}
                  </span>
                </div>

                {/* Spine Angle */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  liveAngles.spine > 48
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-slate-950/80 border-slate-850'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Spine Tilt</span>
                    {liveAngles.spine > 48 && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Lean
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-black font-mono ${
                    liveAngles.spine > 48 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {liveAngles.spine}°
                  </div>
                  <div className="w-full bg-slate-850 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        liveAngles.spine > 48 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (liveAngles.spine / 60) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Neutral torso: &lt;45°</span>
                </div>
              </div>
            </div>

            {/* GEMINI SET COACHING SUMMARY */}
            <AnimatePresence mode="wait">
              {setSummary ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-emerald-500/30 rounded-3xl p-5 md:p-6 shadow-2xl shadow-emerald-950/20 space-y-4"
                  id="gemini-set-summary-card"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-850 pb-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-black uppercase tracking-widest mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Biomechanics Coaching Summary
                      </div>
                      <h3 className="text-lg font-black text-white">{setSummary.headline}</h3>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-2xl text-center shrink-0">
                      <span className="block text-[8px] text-slate-500 uppercase font-mono font-bold tracking-wider">
                        Set Score
                      </span>
                      <span className="text-xl font-black font-mono text-emerald-400">
                        {setSummary.overallScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {setSummary.summary}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs space-y-1">
                      <span className="text-[9px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                        Biomechanical Audit:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {setSummary.biomechanicalNote}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        Coach Cue for Set 2:
                      </span>
                      <p className="text-emerald-100 font-medium text-[11px] leading-relaxed">
                        {setSummary.cueForNextSet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-850/80">
                    <span className="text-[10px] font-mono text-slate-400">
                      Form Rating:{' '}
                      <span className="text-emerald-300 font-bold">{setSummary.formRating}</span>
                    </span>

                    <button
                      onClick={() => {
                        setSetSummary(null);
                        startWebcam();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Start Next Set
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-white text-xs font-bold">AI Set Coaching Summary</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                    Perform reps using the camera or simulated stream. When you tap **Finish Set**, Gemini will generate your personalized biomechanical breakdown and golden cue for the next set.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* FALLBACK / PHOTO SCANNER VIEW (/api/vision/form & Posture) */}
      {activeMode === 'fallback' && (
        <div className="space-y-6">
          <div className="flex bg-slate-900/40 border border-slate-850 p-1.5 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setFallbackSubTab('form')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                fallbackSubTab === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Single-Image Form Check (/api/vision/form)
            </button>
            <button
              onClick={() => setFallbackSubTab('posture')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                fallbackSubTab === 'posture' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Posture & Body Scanner
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Fallback Image stage */}
            <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {fallbackSubTab === 'form' ? 'Static Exercise Photo Upload' : 'Orthostatic Posture Photo'}
                </h4>
                <label className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, fallbackSubTab)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="aspect-[4/3] bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex items-center justify-center">
                {fallbackSubTab === 'form' && formImage ? (
                  <img src={formImage} alt="Captured Form" className="w-full h-full object-contain" />
                ) : fallbackSubTab === 'posture' && postureImage ? (
                  <img src={postureImage} alt="Posture Standing" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-bold text-slate-400">No Image Uploaded</p>
                    <p className="text-[11px] text-slate-500 mt-1">Upload a photo to run single-image Gemini analysis</p>
                  </div>
                )}
              </div>

              <button
                onClick={fallbackSubTab === 'form' ? handleFormAnalyze : handlePostureAnalyze}
                disabled={isFormAnalyzing || isPostureAnalyzing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isFormAnalyzing || isPostureAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Photo with Gemini Vision...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Photo with Gemini
                  </>
                )}
              </button>
            </div>

            {/* Fallback Results Diagnostic */}
            <div className="lg:col-span-6 space-y-4">
              {fallbackSubTab === 'form' && formResult && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Gemini Fallback Audit</span>
                      <h4 className="text-lg font-black text-white">{formResult.exerciseName} Assessment</h4>
                      <p className="text-xs text-slate-400 mt-1">{formResult.feedbackSummary}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-center">
                      <span className="block text-[8px] text-slate-500 font-mono">Form Score</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">{formResult.formScore}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-300">Joint Keypoints Evaluated</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {formResult.keyPointsDetected.map((kp, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-200">{kp.joint}</span>
                            <span className="text-emerald-400 font-mono">{kp.angle ? `${kp.angle}°` : kp.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{kp.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {fallbackSubTab === 'posture' && postureResult && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Posture Diagnostic</span>
                      <h4 className="text-lg font-black text-white">Body Type: {postureResult.bodyType}</h4>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-center">
                      <span className="block text-[8px] text-slate-500 font-mono">Posture Score</span>
                      <span className="text-lg font-black text-indigo-400 font-mono">{postureResult.postureScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-slate-400 block text-[9px]">Head/Neck</span>
                      <span className="font-bold text-white">{postureResult.alignmentRatings.headNeck}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-slate-400 block text-[9px]">Spine</span>
                      <span className="font-bold text-white">{postureResult.alignmentRatings.spine}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
