/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WorkoutPlan, NutritionPlan, WaterLog, SleepLog, FoodLogItem, WeightLog, ChatMessage, UserAccount, SavedWorkoutSession, Exercise, WorkoutExerciseCard } from './types';
import { findMatchingExercises } from './utils/exerciseLibrary';
import DashboardView from './components/DashboardView';
import PlannerView from './components/PlannerView';
import VisionLab from './components/VisionLab';
import TrackerView from './components/TrackerView';
import ChatbotView from './components/ChatbotView';
import AuthView from './components/AuthView';
import WorkoutSession from './components/WorkoutSession';
import { Dumbbell, Scale, Activity, Camera, MessageSquare, Flame, Sparkles, Droplet, Plus, X, User, LogIn, LogOut, ShieldCheck, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  validateFirestoreConnection,
  getUserFirestoreData,
  saveUserProfileToFirestore,
  savePlansToFirestore,
  getWorkoutSessionsFromFirestore,
  saveWorkoutSessionToFirestore,
  getFoodLogsFromFirestore,
  saveFoodLogToFirestore,
  deleteFoodLogFromFirestore,
  getWaterLogsFromFirestore,
  saveWaterLogToFirestore,
  getSleepLogsFromFirestore,
  saveSleepLogToFirestore,
  getWeightLogsFromFirestore,
  saveWeightLogToFirestore,
  getChatMessagesFromFirestore,
  saveChatMessageToFirestore,
  clearChatMessagesFromFirestore,
  logoutUser
} from './firebase';

// Seeding standard initial demo values so the app looks stunning and functional on startup
const demoProfile: UserProfile = {
  name: 'Alex Carter',
  age: 28,
  gender: 'male',
  height: 180,
  weight: 82,
  activityLevel: 'moderately_active',
  goal: 'build_muscle',
  bmi: 25.3,
  bmr: 1818,
  tdee: 2818,
  dailyCalories: 3118,
  macros: { protein: 164, carbs: 412, fat: 87 },
  idealWeightRange: { min: 60, max: 81 },
};

const demoWorkout: WorkoutPlan = {
  title: 'AI 7-Day Hypertrophy & Conditioning Split',
  description: 'A scientifically validated weekly split combining high-intensity compound muscle hypertrophy with dedicated active recovery, core stability, and kinetic mobility.',
  weeklyGoalMinutes: 300,
  days: [
    {
      dayName: 'Day 1: Upper Body Push (Chest/Shoulders/Triceps)',
      focus: 'Chest & Shoulder Hypertrophy',
      exercises: [
        { name: 'Incline Dumbbell Chest Press', sets: 4, reps: '8-10', restSeconds: 90, weightInstructions: 'Ramp to a heavy set of 10, leave 1-2 reps in reserve', tips: ['Keep shoulder blades retracted', 'Control the eccentric tempo down to 3 seconds'] },
        { name: 'Overhead Barbell Military Press', sets: 3, reps: '8', restSeconds: 120, weightInstructions: 'Use moderate barbell load', tips: ['Squeeze glutes and brace core', 'Avoid arching your lower back'] },
        { name: 'Dumbbell Lateral Raises', sets: 4, reps: '12-15', restSeconds: 60, weightInstructions: 'Light control loads', tips: ['Lead with the elbows', 'Pause briefly at peak extension'] },
      ],
    },
    {
      dayName: 'Day 2: Upper Body Pull (Back/Biceps)',
      focus: 'Lat Width & Upper Back Density',
      exercises: [
        { name: 'Pullups (Bodyweight or Weighted)', sets: 4, reps: '8-10', restSeconds: 90, weightInstructions: 'Self load', tips: ['Focus on pulling with your elbows', 'Fully extend at the bottom hang'] },
        { name: 'Seated Cable Rows (Close-grip)', sets: 3, reps: '10-12', restSeconds: 90, weightInstructions: 'Moderate stack', tips: ['Squeeze scapula for 1 second', 'Keep torso steady'] },
        { name: 'Dumbbell Hammer Curls', sets: 3, reps: '10-12', restSeconds: 60, weightInstructions: 'Control weight', tips: ['Keep elbows tucked in', 'Avoid using body momentum'] },
      ],
    },
    {
      dayName: 'Day 3: Lower Body Legs (Quads/Calves)',
      focus: 'Compound Leg Strength & Hypertrophy',
      exercises: [
        { name: 'Barbell Back Squats', sets: 4, reps: '6-8', restSeconds: 120, weightInstructions: 'Heavy compound load', tips: ['Drive knees outwards on the ascent', 'Keep chest proud and brace core'] },
        { name: 'Leg Extensions', sets: 3, reps: '12-15', restSeconds: 90, weightInstructions: 'Moderate stack', tips: ['Squeeze quads hard at the top', 'Control the descent'] },
        { name: 'Standing Calf Raises', sets: 4, reps: '15', restSeconds: 60, weightInstructions: 'Moderate load', tips: ['Hold the stretch at the bottom', 'Squeeze at peak contraction'] },
      ],
    },
    {
      dayName: 'Day 4: Active Recovery & Mobility',
      focus: 'Joint Decompression & Cardio',
      exercises: [
        { name: 'Low Intensity Steady State (LISS) Cardio', sets: 1, reps: '30-40 mins', restSeconds: 0, weightInstructions: 'Treadmill, Elliptical, or Cycling', tips: ['Keep heart rate between 120-135 BPM', 'Breathe comfortably through the nose'] },
        { name: 'Dynamic Full-Body Mobility Routine', sets: 2, reps: '10 mins', restSeconds: 45, weightInstructions: 'Bodyweight only', tips: ['Focus on hips, shoulders, and thoracic spine', 'Do not force end-range of motion'] },
      ],
    },
    {
      dayName: 'Day 5: Arms & Shoulders Hypertrophy',
      focus: 'Upper Body Isolation & Pump',
      exercises: [
        { name: 'Dumbbell Shoulder Press', sets: 4, reps: '10-12', restSeconds: 90, weightInstructions: 'Moderate load', tips: ['Keep elbows slightly tucked forward', 'Do not lock out elbows at the top'] },
        { name: 'Incline Dumbbell Bicep Curls', sets: 3, reps: '12', restSeconds: 60, weightInstructions: 'Moderate load', tips: ['Keep elbows stationary behind hips', 'Get a full bicep stretch'] },
        { name: 'Overhead Cable Triceps Extensions', sets: 3, reps: '12-15', restSeconds: 60, weightInstructions: 'Control stack', tips: ['Keep upper arms fixed by ears', 'Fully extend forearms'] },
      ],
    },
    {
      dayName: 'Day 6: Lower Body Posterior & Core',
      focus: 'Glutes, Hamstrings & Core Stability',
      exercises: [
        { name: 'Romanian Deadlifts (RDLs)', sets: 4, reps: '8-10', restSeconds: 90, weightInstructions: 'Heavy dumbbells or barbell', tips: ['Hinge at the hips, keeping back flat', 'Push hips backwards to load hamstrings'] },
        { name: 'Hanging Leg Raises', sets: 3, reps: '12-15', restSeconds: 60, weightInstructions: 'Bodyweight', tips: ['Minimize swinging, control descent', 'Exhale completely at the top'] },
        { name: 'Plank Hold (Core Stability)', sets: 3, reps: '60 secs', restSeconds: 60, weightInstructions: 'Bodyweight', tips: ['Keep glutes and abs fully squeezed', 'Line elbows directly under shoulders'] },
      ],
    },
    {
      dayName: 'Day 7: Full Rest & Regeneration',
      focus: 'Muscle Repair & Nervous System Recovery',
      exercises: [
        { name: 'Foam Rolling & Myofascial Release', sets: 1, reps: '15 mins', restSeconds: 0, weightInstructions: 'Foam roller / Lacrosse ball', tips: ['Spend 1-2 minutes on tight areas', 'Keep breathing deep and relaxed'] },
        { name: 'Static Deep Stretching', sets: 1, reps: '15 mins', restSeconds: 0, weightInstructions: 'Relaxed bodyweight', tips: ['Hold each stretch for 30-45 seconds', 'Never stretch to the point of pain'] },
      ],
    },
  ],
};

const demoNutrition: NutritionPlan = {
  title: 'Anabolic Muscle Hypertrophy Program',
  description: 'Designed to establish a clean caloric surplus with structured complex carbohydrates and bioavailable proteins to sustain intense training sessions.',
  dailyWaterTargetMl: 3000,
  nutritionalAdvice: [
    'Consume a high-quality protein source every 3-4 hours to stimulate continuous muscle protein synthesis.',
    'Eat pre-workout complex carbohydrates roughly 60-90 minutes before your workout to fully load glycogen stores.',
  ],
  meals: [
    {
      mealName: 'Breakfast: Power Oats & Eggs',
      totalCalories: 720,
      totalProtein: 42,
      totalCarbs: 85,
      totalFat: 18,
      items: [
        { name: 'Rolled Oats', calories: 300, protein: 12, carbs: 56, fat: 5, portionSize: '80g dry' },
        { name: 'Whey Protein Isolate', calories: 120, protein: 25, carbs: 2, fat: 1, portionSize: '1 scoop' },
        { name: 'Whole Eggs', calories: 300, protein: 5, carbs: 27, fat: 12, portionSize: '2 large eggs boiled' },
      ],
    },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'vision' | 'tracker' | 'chatbot' | 'auth' | 'workout-session'>('dashboard');
  const [selectedWorkoutExercises, setSelectedWorkoutExercises] = useState<Exercise[] | undefined>(undefined);

  // Active authenticated user state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('fitgenie_currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default demo authenticated athlete account
    return {
      id: 'demo-alex',
      name: 'Alex Carter',
      email: 'alex.carter@fitgenie.ai',
      memberTier: 'Pro Athlete',
      createdAt: '2025-01-15',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  });

  // Saved Workout Sessions State (localStorage acts as offline cache)
  const [workoutLogs, setWorkoutLogs] = useState<SavedWorkoutSession[]>(() => {
    const saved = localStorage.getItem('fitgenie_workout_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Verify connection to Firestore on initial boot
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  // Listen to real-time Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userAccount: UserAccount = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
          email: fbUser.email || '',
          avatarUrl: fbUser.photoURL || undefined,
          memberTier: 'Pro Athlete',
          createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastLoginAt: new Date().toISOString(),
        };
        setCurrentUser(userAccount);

        // Hydrate all user datasets directly from Firestore
        try {
          const [firestoreData, dbWorkouts, dbFood, dbWater, dbSleep, dbWeight, dbChat] = await Promise.all([
            getUserFirestoreData(fbUser.uid),
            getWorkoutSessionsFromFirestore(fbUser.uid),
            getFoodLogsFromFirestore(fbUser.uid),
            getWaterLogsFromFirestore(fbUser.uid),
            getSleepLogsFromFirestore(fbUser.uid),
            getWeightLogsFromFirestore(fbUser.uid),
            getChatMessagesFromFirestore(fbUser.uid),
          ]);

          if (firestoreData.account?.memberTier) {
            userAccount.memberTier = firestoreData.account.memberTier;
          }

          if (firestoreData.profile) {
            setProfile({ ...firestoreData.profile, name: userAccount.name });
          } else {
            // First login: sync existing profile or initial defaults to Firestore under user UID
            setProfile((current) => {
              const p = current || demoProfile;
              const initialized = { ...p, name: userAccount.name };
              saveUserProfileToFirestore(fbUser.uid, initialized, userAccount);
              return initialized;
            });
          }

          if (firestoreData.workoutPlan) setWorkoutPlan(firestoreData.workoutPlan);
          if (firestoreData.nutritionPlan) setNutritionPlan(firestoreData.nutritionPlan);

          if (dbWorkouts && dbWorkouts.length > 0) {
            setWorkoutLogs(dbWorkouts);
          } else {
            // Fallback to server route /api/workouts/history for this logged-in user
            fetch(`/api/workouts/history?userId=${encodeURIComponent(fbUser.uid)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
                  setWorkoutLogs(data.sessions);
                }
              })
              .catch((err) => console.error('Error fetching workout history:', err));
          }

          if (dbFood && dbFood.length > 0) setFoodLogs(dbFood);
          if (dbWater && dbWater.length > 0) setWaterLogs(dbWater);
          if (dbSleep && dbSleep.length > 0) setSleepLogs(dbSleep);
          if (dbWeight && dbWeight.length > 0) setWeightLogs(dbWeight);
          if (dbChat && dbChat.length > 0) setChatMessages(dbChat);
        } catch (err) {
          console.error('[Firestore] Error hydrating user data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync workout history from backend for active user
  useEffect(() => {
    const targetUserId = currentUser?.id || 'guest_user';
    fetch(`/api/workouts/history?userId=${encodeURIComponent(targetUserId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions && Array.isArray(data.sessions)) {
          setWorkoutLogs((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const merged = [...prev];
            for (const s of data.sessions) {
              if (!existingIds.has(s.id)) {
                merged.push(s);
                existingIds.add(s.id);
              }
            }
            return merged;
          });
        }
      })
      .catch((err) => console.error('Error fetching workout history:', err));
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem('fitgenie_workout_sessions', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  const handleSaveWorkoutSession = async (session: SavedWorkoutSession): Promise<boolean> => {
    try {
      const targetUserId = currentUser?.id || 'guest_user';

      // Local state duplicate guard
      if (workoutLogs.some((s) => s.id === session.id)) {
        console.log(`[Frontend] Session ${session.id} already saved locally.`);
        return true;
      }

      // 1. Post to backend endpoint reading and writing the database
      const response = await fetch('/api/workouts/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': targetUserId,
        },
        body: JSON.stringify({
          session,
          userId: targetUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Server error while saving workout session.');
      }

      const data = await response.json();

      // 2. Direct Firestore client-side sync under user ID
      if (currentUser?.id) {
        saveWorkoutSessionToFirestore(currentUser.id, session).catch((err) =>
          console.warn('[Firestore] Direct session sync notice:', err)
        );
      }

      setWorkoutLogs((prev) => {
        if (prev.some((s) => s.id === session.id)) return prev;
        return [session, ...prev];
      });

      return true;
    } catch (err) {
      console.error('Save workout session error:', err);
      // Ensure cached locally even offline
      setWorkoutLogs((prev) => {
        if (prev.some((s) => s.id === session.id)) return prev;
        return [session, ...prev];
      });
      return false;
    }
  };

  const handleStartWorkoutSession = (exercises?: Exercise[]) => {
    setSelectedWorkoutExercises(exercises);
    setActiveTab('workout-session');
  };

  // Load state from localstorage or fall back to pre-seeded demo parameters
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const savedUserStr = localStorage.getItem('fitgenie_currentUser');
    if (savedUserStr) {
      try {
        const u: UserAccount = JSON.parse(savedUserStr);
        if (u && u.profile) {
          return { ...u.profile, name: u.name };
        }
        if (u && u.name) {
          const savedProf = localStorage.getItem('fitgenie_profile');
          const baseProf = savedProf ? JSON.parse(savedProf) : demoProfile;
          return { ...baseProf, name: u.name };
        }
      } catch (e) {
        console.error(e);
      }
    }
    const saved = localStorage.getItem('fitgenie_profile');
    return saved ? JSON.parse(saved) : demoProfile;
  });

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(() => {
    const saved = localStorage.getItem('fitgenie_workout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WorkoutPlan;
        if (parsed && parsed.days && parsed.days.length >= 5) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return demoWorkout;
  });

  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(() => {
    const saved = localStorage.getItem('fitgenie_nutrition');
    return saved ? JSON.parse(saved) : demoNutrition;
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('fitgenie_water');
    return saved ? JSON.parse(saved) : [];
  });

  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
    const saved = localStorage.getItem('fitgenie_sleep');
    return saved ? JSON.parse(saved) : [];
  });

  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>(() => {
    const saved = localStorage.getItem('fitgenie_food');
    return saved ? JSON.parse(saved) : [];
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem('fitgenie_weight');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('fitgenie_chat');
    return saved ? JSON.parse(saved) : [];
  });

  const [isResponding, setIsResponding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showQuickWeightModal, setShowQuickWeightModal] = useState(false);
  const [quickWeight, setQuickWeight] = useState('');

  // Sync to localstorage
  useEffect(() => {
    if (profile) localStorage.setItem('fitgenie_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (workoutPlan) localStorage.setItem('fitgenie_workout', JSON.stringify(workoutPlan));
  }, [workoutPlan]);

  useEffect(() => {
    if (nutritionPlan) localStorage.setItem('fitgenie_nutrition', JSON.stringify(nutritionPlan));
  }, [nutritionPlan]);

  useEffect(() => {
    localStorage.setItem('fitgenie_water', JSON.stringify(waterLogs));
  }, [waterLogs]);

  useEffect(() => {
    localStorage.setItem('fitgenie_sleep', JSON.stringify(sleepLogs));
  }, [sleepLogs]);

  useEffect(() => {
    localStorage.setItem('fitgenie_food', JSON.stringify(foodLogs));
  }, [foodLogs]);

  useEffect(() => {
    localStorage.setItem('fitgenie_weight', JSON.stringify(weightLogs));
  }, [weightLogs]);

  useEffect(() => {
    localStorage.setItem('fitgenie_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fitgenie_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fitgenie_currentUser');
    }
  }, [currentUser]);

  const handleLogin = async (user: UserAccount) => {
    setCurrentUser(user);
    // Reset transient states so previous user's records never linger
    setWorkoutLogs([]);
    setFoodLogs([]);
    setWaterLogs([]);
    setSleepLogs([]);
    setWeightLogs([]);
    setSelectedWorkoutExercises(undefined);

    // Hydrate data from Firestore for the logged-in user
    try {
      const [firestoreData, dbWorkouts, dbFood, dbWater, dbSleep, dbWeight, dbChat] = await Promise.all([
        getUserFirestoreData(user.id),
        getWorkoutSessionsFromFirestore(user.id),
        getFoodLogsFromFirestore(user.id),
        getWaterLogsFromFirestore(user.id),
        getSleepLogsFromFirestore(user.id),
        getWeightLogsFromFirestore(user.id),
        getChatMessagesFromFirestore(user.id),
      ]);

      if (firestoreData.profile) {
        setProfile({ ...firestoreData.profile, name: user.name });
      } else if (user.profile) {
        setProfile({ ...user.profile, name: user.name });
      } else {
        setProfile({
          name: user.name,
          age: 26,
          gender: 'male',
          height: 175,
          weight: 70,
          activityLevel: 'moderately_active',
          goal: 'build_muscle',
          bmi: 22.9,
          bmr: 1680,
          tdee: 2600,
          dailyCalories: 2600,
          macros: { protein: 160, carbs: 280, fat: 65 },
          idealWeightRange: { min: 62, max: 76 },
        });
      }

      setWorkoutPlan(firestoreData.workoutPlan || null);
      setNutritionPlan(firestoreData.nutritionPlan || null);

      setWorkoutLogs(dbWorkouts || []);
      setFoodLogs(dbFood || []);
      setWaterLogs(dbWater || []);
      setSleepLogs(dbSleep || []);
      setWeightLogs(dbWeight || []);
      setChatMessages(
        dbChat && dbChat.length > 0
          ? dbChat
          : [
              {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                content: `👋 Welcome back, ${user.name}! Ready to review your workouts and nutrition?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]
      );
    } catch (e) {
      console.warn('Error hydrating user on login:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    setWorkoutLogs([]);
    setFoodLogs([]);
    setWaterLogs([]);
    setSleepLogs([]);
    setWeightLogs([]);
    setWorkoutPlan(null);
    setNutritionPlan(null);
    setChatMessages([]);
    localStorage.removeItem('fitgenie_workout_sessions');
    localStorage.removeItem('fitgenie_food');
    localStorage.removeItem('fitgenie_water');
    localStorage.removeItem('fitgenie_sleep');
    localStorage.removeItem('fitgenie_weight');
    localStorage.removeItem('fitgenie_workout');
    localStorage.removeItem('fitgenie_nutrition');
    localStorage.removeItem('fitgenie_chat');
    localStorage.removeItem('fitgenie_currentUser');
  };

  const handleRegister = (newUser: UserAccount) => {
    setCurrentUser(newUser);

    // Fresh default profile tailored to the new athlete
    const freshProfile: UserProfile = newUser.profile || {
      name: newUser.name,
      age: 26,
      gender: 'male',
      height: 175,
      weight: 70,
      activityLevel: 'moderately_active',
      goal: 'build_muscle',
      bmi: 22.9,
      bmr: 1680,
      tdee: 2600,
      dailyCalories: 2600,
      macros: { protein: 160, carbs: 280, fat: 65 },
      idealWeightRange: { min: 62, max: 76 },
    };
    setProfile(freshProfile);

    // Complete data reset for the brand new account
    setWorkoutLogs([]);
    setFoodLogs([]);
    setWaterLogs([]);
    setSleepLogs([]);
    setWeightLogs([]);
    setSelectedWorkoutExercises(undefined);
    setWorkoutPlan(null);
    setNutritionPlan(null);

    // Clear stale cached items from local storage
    localStorage.removeItem('fitgenie_workout_sessions');
    localStorage.removeItem('fitgenie_food');
    localStorage.removeItem('fitgenie_water');
    localStorage.removeItem('fitgenie_sleep');
    localStorage.removeItem('fitgenie_weight');
    localStorage.removeItem('fitgenie_workout');
    localStorage.removeItem('fitgenie_nutrition');

    // Fresh personalized welcome message for the new athlete
    const freshWelcomeChat: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `👋 Welcome to FitGenie AI, ${newUser.name}! I'm Genie, your dedicated biometrics coach. I'm ready to craft your custom workout splits, macro targets, and form reviews. What fitness goal would you like to achieve first?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setChatMessages(freshWelcomeChat);
    localStorage.setItem('fitgenie_chat', JSON.stringify(freshWelcomeChat));

    // Save initial clean state to Firestore
    saveUserProfileToFirestore(newUser.id, freshProfile, newUser).catch((err) =>
      console.warn('Error initializing user profile in Firestore:', err)
    );
  };

  const handleProfileUpdate = (newProfile: UserProfile) => {
    setIsCalculating(true);
    setProfile(newProfile);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: newProfile.name || currentUser.name,
        profile: newProfile,
      };
      setCurrentUser(updatedUser);
      saveUserProfileToFirestore(currentUser.id, newProfile, updatedUser).catch((err) =>
        console.error('Error saving profile to Firestore:', err)
      );
    }

    // Auto add starting weight log
    const todayStr = new Date().toISOString().split('T')[0];
    const weightLogEntry: WeightLog = { date: todayStr, weightKg: newProfile.weight };
    setWeightLogs((prevLogs) => {
      const logIndex = prevLogs.findIndex((l) => l.date === todayStr);
      if (logIndex > -1) {
        const updated = [...prevLogs];
        updated[logIndex].weightKg = newProfile.weight;
        return updated;
      } else {
        return [...prevLogs, weightLogEntry];
      }
    });

    if (currentUser?.id) {
      saveWeightLogToFirestore(currentUser.id, weightLogEntry).catch((err) =>
        console.error('Error saving initial weight to Firestore:', err)
      );
    }

    setTimeout(() => {
      setIsCalculating(false);
    }, 400);
  };

  const handlePlansGenerated = (workout: WorkoutPlan, nutrition: NutritionPlan) => {
    setWorkoutPlan(workout);
    setNutritionPlan(nutrition);
    if (currentUser?.id) {
      savePlansToFirestore(currentUser.id, workout, nutrition).catch((err) =>
        console.error('Error saving generated plans to Firestore:', err)
      );
    }
  };

  const onAddWater = (amountMl: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logIndex = waterLogs.findIndex((l) => l.date === todayStr);
    let finalAmount = amountMl;

    if (logIndex > -1) {
      const updated = [...waterLogs];
      finalAmount = Math.max(0, updated[logIndex].amountMl + amountMl);
      updated[logIndex].amountMl = finalAmount;
      setWaterLogs(updated);
    } else if (amountMl > 0) {
      setWaterLogs([...waterLogs, { date: todayStr, amountMl }]);
    }

    if (currentUser?.id) {
      saveWaterLogToFirestore(currentUser.id, { date: todayStr, amountMl: finalAmount }).catch((err) =>
        console.error('Error saving water log to Firestore:', err)
      );
    }
  };

  const onAddSleep = (durationHours: number, quality: SleepLog['quality']) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logIndex = sleepLogs.findIndex((l) => l.date === todayStr);
    const sleepEntry: SleepLog = { date: todayStr, durationHours, quality };

    if (logIndex > -1) {
      const updated = [...sleepLogs];
      updated[logIndex].durationHours = durationHours;
      updated[logIndex].quality = quality;
      setSleepLogs(updated);
    } else {
      setSleepLogs([...sleepLogs, sleepEntry]);
    }

    if (currentUser?.id) {
      saveSleepLogToFirestore(currentUser.id, sleepEntry).catch((err) =>
        console.error('Error saving sleep log to Firestore:', err)
      );
    }
  };

  const onAddFood = (food: Omit<FoodLogItem, 'id' | 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newItem: FoodLogItem = {
      ...food,
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr,
    };
    setFoodLogs([newItem, ...foodLogs]);

    if (currentUser?.id) {
      saveFoodLogToFirestore(currentUser.id, newItem).catch((err) =>
        console.error('Error saving food log to Firestore:', err)
      );
    }
  };

  const onDeleteFood = (id: string) => {
    setFoodLogs(foodLogs.filter((f) => f.id !== id));
    if (currentUser?.id) {
      deleteFoodLogFromFirestore(currentUser.id, id).catch((err) =>
        console.error('Error deleting food log from Firestore:', err)
      );
    }
  };

  const onAddWeight = (weightKg: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const weightEntry: WeightLog = { date: todayStr, weightKg };

    setWeightLogs((prevLogs) => {
      const logIndex = prevLogs.findIndex((l) => l.date === todayStr);
      if (logIndex > -1) {
        const updated = [...prevLogs];
        updated[logIndex].weightKg = weightKg;
        return updated;
      } else {
        return [...prevLogs, weightEntry];
      }
    });

    if (currentUser?.id) {
      saveWeightLogToFirestore(currentUser.id, weightEntry).catch((err) =>
        console.error('Error saving weight log to Firestore:', err)
      );
    }

    setProfile((currentProfile) => {
      if (!currentProfile) return null;
      
      const hM = currentProfile.height / 100;
      const bmi = Number((weightKg / (hM * hM)).toFixed(1));

      // Mifflin-St Jeor Equation
      let bmr = 0;
      if (currentProfile.gender === 'male') {
        bmr = 10 * weightKg + 6.25 * currentProfile.height - 5 * currentProfile.age + 5;
      } else if (currentProfile.gender === 'female') {
        bmr = 10 * weightKg + 6.25 * currentProfile.height - 5 * currentProfile.age - 161;
      } else {
        bmr = 10 * weightKg + 6.25 * currentProfile.height - 5 * currentProfile.age - 78;
      }
      bmr = Math.round(bmr);

      // Activity Multiplier
      const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extra_active: 1.9,
      };
      const tdee = Math.round(bmr * (multipliers[currentProfile.activityLevel as keyof typeof multipliers] || 1.2));

      // Daily Calorie Target
      let dailyCalories = tdee;
      if (currentProfile.goal === 'lose_fat') {
        dailyCalories = tdee - 500;
      } else if (currentProfile.goal === 'build_muscle') {
        dailyCalories = tdee + 300;
      } else if (currentProfile.goal === 'recomp') {
        dailyCalories = tdee - 150;
      }
      dailyCalories = Math.max(1200, Math.round(dailyCalories));

      // Macros
      let proteinG = 0;
      if (currentProfile.goal === 'lose_fat' || currentProfile.goal === 'recomp') {
        proteinG = Math.round(2.2 * weightKg);
      } else if (currentProfile.goal === 'build_muscle') {
        proteinG = Math.round(2.0 * weightKg);
      } else {
        proteinG = Math.round(1.8 * weightKg);
      }

      let fatG = Math.round((dailyCalories * 0.25) / 9);
      const proteinCal = proteinG * 4;
      const fatCal = fatG * 9;
      let carbsG = Math.round((dailyCalories - proteinCal - fatCal) / 4);
      if (carbsG < 50) {
        carbsG = 50;
        fatG = Math.round((dailyCalories - proteinCal - carbsG * 4) / 9);
      }

      const idealMin = Math.round(18.5 * hM * hM);
      const idealMax = Math.round(24.9 * hM * hM);

      const updatedProfile: UserProfile = {
        ...currentProfile,
        weight: weightKg,
        bmi,
        bmr,
        tdee,
        dailyCalories,
        macros: {
          protein: proteinG,
          carbs: carbsG,
          fat: fatG,
        },
        idealWeightRange: {
          min: idealMin,
          max: idealMax,
        },
      };

      if (currentUser?.id) {
        saveUserProfileToFirestore(currentUser.id, updatedProfile).catch((err) =>
          console.error('Error syncing updated profile to Firestore:', err)
        );
      }

      return updatedProfile;
    });
  };

  const onSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
      createdAt: Date.now(),
    };

    // Filter out any past error notices before sending to avoid poisoning history
    const sanitizedPast = chatMessages.filter(
      (m) =>
        m &&
        typeof m.content === 'string' &&
        !m.content.startsWith('Error:') &&
        !m.content.includes('connectivity delays') &&
        !m.content.includes('Gemini API key')
    );

    const newMessages = [...sanitizedPast, userMsg];
    setChatMessages(newMessages);

    if (currentUser?.id) {
      saveChatMessageToFirestore(currentUser.id, userMsg).catch((err) =>
        console.error('Error saving user chat to Firestore:', err)
      );
    }

    setIsResponding(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userMetrics: profile,
        }),
      });

      const data = await response.json().catch(() => null);
      const replyText =
        data?.text ||
        `I am fully primed and ready to help build your conditioning split, ${profile?.name || 'Athlete'}. What specific exercise mechanics or nutrition goals shall we explore?`;

      // Extract exercises from backend response or matched locally
      const extractedExercises: WorkoutExerciseCard[] =
        data?.exercises && data.exercises.length > 0
          ? data.exercises
          : findMatchingExercises(text + ' ' + replyText, 4);

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        exercises: extractedExercises.length > 0 ? extractedExercises : undefined,
      };
      setChatMessages([...newMessages, assistantMsg]);

      if (currentUser?.id) {
        saveChatMessageToFirestore(currentUser.id, assistantMsg).catch((err) =>
          console.error('Error saving assistant message to Firestore:', err)
        );
      }
    } catch (err: any) {
      console.warn('Chatbot fetch notice:', err);
      const fallbackText = `I'm with you, ${profile?.name || 'Athlete'}! Remember to maintain your daily hydration target (${profile ? Math.round(profile.weight * 35) : 2500}ml) and keep consistency in your training. What specific movement or macro question would you like to review?`;
      const fallbackExercises = findMatchingExercises(text, 4);

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        exercises: fallbackExercises.length > 0 ? fallbackExercises : undefined,
      };
      setChatMessages([...newMessages, assistantMsg]);

      if (currentUser?.id) {
        saveChatMessageToFirestore(currentUser.id, assistantMsg).catch((e) =>
          console.error('Error saving assistant message to Firestore:', e)
        );
      }
    } finally {
      setIsResponding(false);
    }
  };

  const onClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('fitgenie_chat');
    if (currentUser?.id) {
      clearChatMessagesFromFirestore(currentUser.id).catch((err) =>
        console.error('Error clearing chat history in Firestore:', err)
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200" id="fitgenie-app-root">
      {/* Dynamic Grid Pattern Header */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6">
        <header className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl shadow-indigo-950/10" id="app-top-header">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                FitGenie <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase font-bold tracking-wider">AI Lab</span>
              </h1>
              <p className="text-[11px] text-slate-400">Personalized Biometric Adaptation Platform</p>
            </div>
          </div>

          {/* Right Header Section: Biometrics & User Account Login/Logout badge */}
          <div className="flex flex-wrap items-center gap-3">
            {profile && (
              <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/60 px-3.5 py-1.5 rounded-2xl text-xs shadow-inner" id="header-user-badge">
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">Target</span>
                  <span className="font-extrabold text-indigo-400 font-mono text-xs">{profile.dailyCalories} kcal</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <button
                  onClick={() => {
                    setQuickWeight(profile.weight.toString());
                    setShowQuickWeightModal(true);
                  }}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition duration-200 cursor-pointer flex items-center justify-center shadow shadow-indigo-600/20 active:scale-95"
                  title="Log daily weight"
                  id="header-quick-add-weight-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Account Login / Logout Quick Widget */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-2xl">
              {currentUser ? (
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('auth')} title="View Account Details">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-7 h-7 rounded-xl object-cover border border-indigo-500/40" />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                        {currentUser.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden md:block">
                      <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
                      <div className="text-[9px] font-mono text-indigo-400">{currentUser.memberTier || 'Pro Athlete'}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('auth')}
                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title="Log Out or Switch Account"
                    id="header-logout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('auth')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow shadow-indigo-600/20"
                  id="header-login-btn"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main navigation core rail tabs styled as a Bento row with Framer Motion layout animation */}
        <nav className="mt-4 bg-slate-900/30 border border-slate-800/60 p-1.5 rounded-2xl flex flex-wrap gap-1 md:gap-1.5 relative" id="main-navigation-tabs">
          {[
            { id: 'dashboard', label: 'Biometrics Dashboard', icon: Scale },
            { id: 'planner', label: 'Intelligent AI Planners', icon: Dumbbell },
            { id: 'workout-session', label: 'Live AI Coach Workout', icon: Flame },
            { id: 'vision', label: 'Computer Vision Lab', icon: Camera },
            { id: 'tracker', label: 'Food Scanner & Logs', icon: Activity },
            { id: 'chatbot', label: 'GenieCoach Chatbot', icon: MessageSquare },
            { id: 'auth', label: currentUser ? `Account (${currentUser.name.split(' ')[0]})` : 'Log In / Register', icon: ShieldCheck },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                id={`nav-${tab.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-indigo-600 border border-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 z-0"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main active subview container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8" id="fitgenie-main-view">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full"
          >
            {activeTab === 'auth' && (
              <AuthView
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onRegister={handleRegister}
                userProfile={profile}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                isCalculating={isCalculating}
                foodLogs={foodLogs}
                waterLogs={waterLogs}
                sleepLogs={sleepLogs}
                weightLogs={weightLogs}
                workoutLogs={workoutLogs}
              />
            )}

            {activeTab === 'planner' && (
              <PlannerView
                profile={profile}
                workoutPlan={workoutPlan}
                nutritionPlan={nutritionPlan}
                onPlansGenerated={handlePlansGenerated}
                onStartWorkoutSession={handleStartWorkoutSession}
              />
            )}

            {activeTab === 'workout-session' && (
              <WorkoutSession
                profile={profile}
                initialExercises={selectedWorkoutExercises}
                onSaveWorkout={handleSaveWorkoutSession}
                onCloseSession={() => setActiveTab('tracker')}
              />
            )}

            {activeTab === 'vision' && (
              <VisionLab onStartWorkoutSession={() => handleStartWorkoutSession()} />
            )}

            {activeTab === 'tracker' && (
              <TrackerView
                profile={profile}
                waterLogs={waterLogs}
                sleepLogs={sleepLogs}
                foodLogs={foodLogs}
                weightLogs={weightLogs}
                workoutLogs={workoutLogs}
                onAddWater={onAddWater}
                onAddSleep={onAddSleep}
                onAddFood={onAddFood}
                onDeleteFood={onDeleteFood}
                onAddWeight={onAddWeight}
              />
            )}

            {activeTab === 'chatbot' && (
              <ChatbotView
                profile={profile}
                chatMessages={chatMessages}
                onSendMessage={onSendMessage}
                isResponding={isResponding}
                onClearChat={onClearChat}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Subtle margin system footer credits */}
      <footer className="border-t border-slate-900 bg-[#07090C] py-5 text-center text-[10px] text-slate-500 tracking-widest uppercase font-mono">
        FitGenie AI Platform • Deep Learning Sports Science Engine
      </footer>

      {showQuickWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" id="quick-weight-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQuickWeightModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              id="quick-weight-modal-close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Quick Log Weight</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Instant Metrics Update</p>
              </div>
            </div>

            {/* Explanatory Info */}
            <p className="text-xs text-slate-400 leading-relaxed mb-4 bg-slate-950/50 border border-slate-850 p-3.5 rounded-2xl shadow-inner font-sans">
              Logging your body weight recalculates your <strong className="text-slate-300 font-semibold">BMI</strong>, <strong className="text-slate-300 font-semibold">BMR</strong>, <strong className="text-slate-300 font-semibold">TDEE</strong>, calorie budget, and macronutrient targets immediately.
            </p>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const weightNum = parseFloat(quickWeight);
                if (!isNaN(weightNum) && weightNum > 0) {
                  onAddWeight(weightNum);
                  setShowQuickWeightModal(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="quick-weight-input" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Body Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    required
                    id="quick-weight-input"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-slate-200 text-xs outline-none font-mono tracking-wide"
                    placeholder={profile?.weight?.toString() || '75.0'}
                    value={quickWeight}
                    onChange={(e) => setQuickWeight(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-xs font-bold font-mono text-slate-500">
                    KG
                  </div>
                </div>
                {profile && (
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
                    <span>Current: {profile.weight} kg</span>
                    <span>Goal: {profile.goal.replace('_', ' ').toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuickWeightModal(false)}
                  className="flex-1 py-2.5 px-4 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-indigo-600/20 active:scale-95"
                >
                  Save Weight
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
