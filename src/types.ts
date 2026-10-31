/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  memberTier?: 'Standard' | 'Pro Athlete' | 'VIP Master';
  createdAt: string;
  lastLoginAt?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'lose_fat' | 'build_muscle' | 'maintain' | 'recomp';
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  macros: {
    protein: number; // in g
    carbs: number; // in g
    fat: number; // in g
  };
  idealWeightRange: {
    min: number;
    max: number;
  };
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g. "8-12" or "15" or "As many as possible"
  restSeconds: number;
  weightInstructions?: string;
  tips?: string[];
}

export interface WorkoutDay {
  dayName: string; // e.g., "Day 1: Push", "Monday: Full Body"
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  title: string;
  description: string;
  days: WorkoutDay[];
  weeklyGoalMinutes: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  portionSize: string; // e.g. "1 medium apple", "150g grilled chicken"
}

export interface Meal {
  mealName: string; // e.g. "Breakfast", "Lunch"
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionPlan {
  title: string;
  description: string;
  meals: Meal[];
  dailyWaterTargetMl: number;
  nutritionalAdvice: string[];
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  amountMl: number;
}

export interface SleepLog {
  date: string; // YYYY-MM-DD
  durationHours: number;
  quality: 1 | 2 | 3 | 4 | 5; // 1 = Terrible, 5 = Excellent
}

export interface WeightLog {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealName: string; // e.g., "Breakfast"
  foodName: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutExerciseCard {
  name: string;
  imageUrl: string;
  targetMuscle: string;
  setsReps: string;
  instructions?: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  createdAt?: number;
  exercises?: WorkoutExerciseCard[];
}

export interface PostureAnalysisResult {
  bodyType: string;
  postureScore: number; // 0-100
  alignmentRatings: {
    headNeck: 'Good' | 'Forward' | 'Severe Forward';
    shoulders: 'Level' | 'Uneven' | 'Rounded';
    spine: 'Neutral' | 'Kyphosis' | 'Lordosis';
    hipsPelvis: 'Neutral' | 'Anterior Tilt' | 'Posterior Tilt';
  };
  muscleDistribution: {
    upperBody: string; // e.g. "Balanced, moderate tone"
    core: string;
    lowerBody: string;
  };
  estimatedBodyFatPercent: number;
  recommendations: string[];
}

export interface FormCorrectionResult {
  exerciseName: string;
  formScore: number; // 0-100
  feedbackSummary: string;
  keyPointsDetected: {
    joint: string;
    angle?: number;
    status: 'Correct' | 'Warning' | 'Action Needed';
    advice: string;
  }[];
  criticalCorrections: string[];
  safetyCheck: 'Pass' | 'Caution' | 'Danger';
}

export interface SavedWorkoutSession {
  id: string; // unique session ID
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  workoutDurationSeconds: number;
  exercises: {
    name: string;
    setsCompleted: number;
    totalReps: number;
    plankDurationSeconds: number;
  }[];
  totalSets: number;
  totalReps: number;
  totalPlankSeconds: number;
  estimatedCaloriesBurned: number;
  savedAt: string;
}

export interface SetSummaryResult {
  headline: string;
  summary: string;
  biomechanicalNote: string;
  cueForNextSet: string;
  formRating: string;
  overallScore: number;
}

export interface LiveJointAngles {
  knee: number;
  hip: number;
  elbow: number;
  spine: number;
  leftKnee?: number;
  rightKnee?: number;
  leftElbow?: number;
  rightElbow?: number;
  side: 'left' | 'right' | 'both';
}

export interface LiveFormFeedback {
  status: 'correct' | 'warning' | 'alert' | 'idle';
  message: string;
  detail: string;
  repPhase: 'standing' | 'descending' | 'bottom' | 'ascending' | 'plank' | 'lowering' | 'curling' | 'peak' | 'ready';
}

