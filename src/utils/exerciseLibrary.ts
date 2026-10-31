/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExerciseDefinition {
  name: string;
  aliases: string[];
  imageUrl: string;
  targetMuscle: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'cardio';
  defaultSetsReps: string;
  instructions: string;
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // CHEST
  {
    name: 'Flat Barbell Bench Press',
    aliases: ['bench press', 'flat bench', 'barbell bench', 'chest press'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Pectoralis Major & Anterior Deltoid',
    category: 'chest',
    defaultSetsReps: '4 sets × 8-10 reps',
    instructions: 'Plant feet flat, retract scapulae, lower bar to mid-chest with elbows at ~45°, and press up explosively.',
  },
  {
    name: 'Standard Bodyweight Pushups',
    aliases: ['pushups', 'push-up', 'push-ups', 'push up', 'standard pushup'],
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Pectorals, Anterior Deltoids & Triceps',
    category: 'chest',
    defaultSetsReps: '3-4 sets × 15-20 reps',
    instructions: 'Maintain a rigid high-plank line, lower chest until elbows reach 90 degrees, and push back up through your palms.',
  },
  {
    name: 'Incline Dumbbell Press',
    aliases: ['incline press', 'incline dumbbell press', 'upper chest press'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Clavicular Upper Chest & Triceps',
    category: 'chest',
    defaultSetsReps: '3 sets × 10-12 reps',
    instructions: 'Set bench to 30 degrees, press dumbbells overhead in a smooth converging arc without locking elbows.',
  },
  {
    name: 'Cable Chest Flyes',
    aliases: ['cable fly', 'chest flyes', 'pec fly', 'cable crossover'],
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Sternal Pectoralis Major',
    category: 'chest',
    defaultSetsReps: '3 sets × 12-15 reps',
    instructions: 'Keep a slight bend in elbows, bring hands together in a wide hugging motion, and squeeze chest at peak contraction.',
  },

  // LEGS / GLUTES
  {
    name: 'Barbell Back Squat',
    aliases: ['squat', 'squats', 'back squat', 'barbell squat', 'deep squat'],
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Quadriceps, Glutes & Adductors',
    category: 'legs',
    defaultSetsReps: '4 sets × 6-8 reps',
    instructions: 'Rest bar across upper traps, brace core 360°, descend until hips break parallel, drive through whole foot.',
  },
  {
    name: 'Walking Lunges & Split Squats',
    aliases: ['lunge', 'lunges', 'walking lunges', 'split squat', 'bulgarian split squat'],
    imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Quadriceps, Gluteus Medius & Hamstrings',
    category: 'legs',
    defaultSetsReps: '3 sets × 12 reps per leg',
    instructions: 'Step forward keeping torso upright, lower trailing knee to 1 inch above the floor, and push back forcefully.',
  },
  {
    name: 'Romanian Deadlift (RDL)',
    aliases: ['deadlift', 'rdl', 'romanian deadlift', 'stiff leg deadlift', 'hamstring deadlift'],
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Hamstrings, Gluteus Maximus & Erector Spinae',
    category: 'legs',
    defaultSetsReps: '3-4 sets × 8-10 reps',
    instructions: 'Hinge back at the hips while maintaining a neutral flat spine, keep bar close to shins, and squeeze glutes to lockout.',
  },
  {
    name: 'Barbell Hip Thrusts',
    aliases: ['hip thrust', 'hip thrusts', 'glute bridge', 'glute bridges'],
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Gluteus Maximus & Hamstrings',
    category: 'legs',
    defaultSetsReps: '3-4 sets × 10-12 reps',
    instructions: 'Rest upper back against bench, place barbell over pelvis, drive through heels to achieve full hip extension at top.',
  },

  // BACK
  {
    name: 'Wide-Grip Lat Pulldown',
    aliases: ['lat pulldown', 'pulldown', 'lat pull-down', 'cable pulldown'],
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Latissimus Dorsi, Teres Major & Biceps',
    category: 'back',
    defaultSetsReps: '4 sets × 10-12 reps',
    instructions: 'Grip bar wider than shoulders, lean torso back 10-15°, and drive elbows down toward ribs to touch upper collarbone.',
  },
  {
    name: 'Overhand Pull-ups / Chin-ups',
    aliases: ['pullup', 'pullups', 'pull-up', 'pull-ups', 'chin-up', 'chin-ups'],
    imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Latissimus Dorsi, Rhomboids & Upper Back',
    category: 'back',
    defaultSetsReps: '3-4 sets × 6-10 reps',
    instructions: 'Hang from bar with full scapular stretch, depress shoulder blades first, and pull chin clearly over bar.',
  },
  {
    name: 'Bent-Over Dumbbell / Barbell Row',
    aliases: ['row', 'rows', 'dumbbell row', 'barbell row', 'bent over row', 'pendlay row'],
    imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Middle Trapezius, Rhomboids & Latissimus Dorsi',
    category: 'back',
    defaultSetsReps: '4 sets × 8-10 reps',
    instructions: 'Hinge to 45°, brace lower back, pull weight into hip crease with elbows skimming close to body.',
  },
  {
    name: 'Cable Face Pulls',
    aliases: ['face pull', 'face pulls', 'rear delt pull'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Posterior Deltoids & Scapular Retractors',
    category: 'back',
    defaultSetsReps: '3 sets × 15-20 reps',
    instructions: 'Attach rope at eye level, pull handles toward temples while externally rotating hands back and apart.',
  },

  // SHOULDERS
  {
    name: 'Overhead Barbell / Dumbbell Press',
    aliases: ['overhead press', 'shoulder press', 'military press', 'arnold press', 'ohp'],
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Anterior & Medial Deltoids, Triceps',
    category: 'shoulders',
    defaultSetsReps: '3-4 sets × 8-10 reps',
    instructions: 'Keep core braced and ribs pulled down, press straight upward overhead until arms lock out with biceps by ears.',
  },
  {
    name: 'Dumbbell Lateral Raises',
    aliases: ['lateral raise', 'lateral raises', 'side raises', 'side lateral'],
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Lateral (Side) Deltoid Head',
    category: 'shoulders',
    defaultSetsReps: '4 sets × 12-15 reps',
    instructions: 'Tilt torso slightly forward, lead with elbows up to shoulder level, and control the 3-second negative descent.',
  },

  // ARMS (BICEPS / TRICEPS)
  {
    name: 'Standing Dumbbell Bicep Curls',
    aliases: ['curl', 'curls', 'bicep curl', 'bicep curls', 'dumbbell curl', 'hammer curl'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Biceps Brachii & Brachialis',
    category: 'arms',
    defaultSetsReps: '3-4 sets × 10-12 reps',
    instructions: 'Pin elbows to your ribs, curl dumbbells up while supinating wrists, and hold the peak peak isometric squeeze.',
  },
  {
    name: 'Parallel Bar / Bench Tricep Dips',
    aliases: ['dips', 'tricep dips', 'bench dips', 'tricep dip', 'parallel bar dips'],
    imageUrl: 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Triceps Brachii (All 3 Heads)',
    category: 'arms',
    defaultSetsReps: '3 sets × 10-15 reps',
    instructions: 'Stay upright to target triceps, lower body until upper arms are parallel to floor, push through palms to lock out.',
  },

  // CORE / ABS
  {
    name: 'Isometric Core Plank',
    aliases: ['plank', 'planks', 'forearm plank', 'core plank', 'isometric plank'],
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Rectus Abdominis & Transverse Abdominis',
    category: 'core',
    defaultSetsReps: '3 sets × 45-60 sec hold',
    instructions: 'Rest on forearms, tuck pelvis under, brace abs as if expecting a blow, and maintain a dead straight line head to heel.',
  },
  {
    name: 'Bicycle & Floor Abdominal Crunches',
    aliases: ['crunches', 'crunch', 'abs', 'ab workout', 'bicycle crunch', 'russian twist', 'deadbug'],
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Upper & Lower Rectus Abdominis, Obliques',
    category: 'core',
    defaultSetsReps: '3-4 sets × 15-20 reps',
    instructions: 'Lie on floor, curl ribcage toward pelvis by contracting abdominals rather than pulling on neck, control descent.',
  },

  // FULL BODY / CARDIO / HIIT
  {
    name: 'Kettlebell Explosive Swings',
    aliases: ['kettlebell', 'kettlebell swing', 'kettlebell swings', 'kb swing'],
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Posterior Chain, Glutes & Cardiovascular Power',
    category: 'full_body',
    defaultSetsReps: '4 sets × 15-20 reps',
    instructions: 'Hinge deep at hips, thrust pelvis forward explosively to propel kettlebell to chest height without arm lifting.',
  },
  {
    name: 'Full Body Burpees & Agility Jumps',
    aliases: ['burpee', 'burpees', 'hiit', 'cardio', 'jump rope', 'mountain climber', 'jumping jacks'],
    imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Full Body Conditioning & Heart Rate Aerobic Spike',
    category: 'cardio',
    defaultSetsReps: '4 sets × 45 sec work / 15 sec rest',
    instructions: 'Drop chest to floor into pushup position, jump feet forward quickly, and leap up explosively with arms overhead.',
  },
  {
    name: 'Active Mobility & Static Stretching',
    aliases: ['stretch', 'stretches', 'stretching', 'mobility', 'yoga', 'warm up', 'cooldown'],
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    targetMuscle: 'Full Body Fascia, Hamstrings & Thoracic Spine',
    category: 'full_body',
    defaultSetsReps: 'Hold each stretch 30-45 seconds',
    instructions: 'Breathe deeply into diaphragm, relax into end range of motion without bouncing, and increase flexibility safely.',
  },
];

export interface WorkoutExerciseCard {
  name: string;
  imageUrl: string;
  targetMuscle: string;
  setsReps: string;
  instructions: string;
  category?: string;
}

/**
 * Searches the exercise database for exercises matching keywords or categories in a user or coach text.
 */
export function findMatchingExercises(text: string, maxItems: number = 4): WorkoutExerciseCard[] {
  if (!text) return [];
  const lower = text.toLowerCase();

  const matched: ExerciseDefinition[] = [];

  // Check specific exercise names and aliases
  for (const ex of EXERCISE_DATABASE) {
    if (lower.includes(ex.name.toLowerCase())) {
      if (!matched.some((m) => m.name === ex.name)) matched.push(ex);
      continue;
    }
    for (const alias of ex.aliases) {
      if (lower.includes(alias)) {
        if (!matched.some((m) => m.name === ex.name)) matched.push(ex);
        break;
      }
    }
  }

  // If general workout categories are mentioned (chest, leg, back, arm, shoulder, core, cardio, full body)
  if (matched.length < 2) {
    if (lower.includes('chest') || lower.includes('pec')) {
      const chestEx = EXERCISE_DATABASE.filter((e) => e.category === 'chest');
      chestEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('leg') || lower.includes('quad') || lower.includes('glute') || lower.includes('hamstring') || lower.includes('squat')) {
      const legEx = EXERCISE_DATABASE.filter((e) => e.category === 'legs');
      legEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('back') || lower.includes('lat') || lower.includes('pull')) {
      const backEx = EXERCISE_DATABASE.filter((e) => e.category === 'back');
      backEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('shoulder') || lower.includes('delt')) {
      const shoulderEx = EXERCISE_DATABASE.filter((e) => e.category === 'shoulders');
      shoulderEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) {
      const armEx = EXERCISE_DATABASE.filter((e) => e.category === 'arms');
      armEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('abs') || lower.includes('core') || lower.includes('belly')) {
      const coreEx = EXERCISE_DATABASE.filter((e) => e.category === 'core');
      coreEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('cardio') || lower.includes('hiit') || lower.includes('fat burn')) {
      const cardioEx = EXERCISE_DATABASE.filter((e) => e.category === 'cardio' || e.name.includes('Burpee'));
      cardioEx.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
    if (lower.includes('full body') || lower.includes('workout routine') || lower.includes('what workout')) {
      // Pick 1 from chest, 1 from legs, 1 from back, 1 from core
      const combo = [
        EXERCISE_DATABASE.find((e) => e.name === 'Barbell Back Squat')!,
        EXERCISE_DATABASE.find((e) => e.name === 'Flat Barbell Bench Press')!,
        EXERCISE_DATABASE.find((e) => e.name === 'Overhand Pull-ups / Chin-ups')!,
        EXERCISE_DATABASE.find((e) => e.name === 'Isometric Core Plank')!,
      ].filter(Boolean);
      combo.forEach((e) => {
        if (!matched.some((m) => m.name === e.name)) matched.push(e);
      });
    }
  }

  // If user just generally asks for "workout" without specific target
  if (matched.length === 0 && (lower.includes('workout') || lower.includes('routine') || lower.includes('exercise'))) {
    matched.push(
      EXERCISE_DATABASE.find((e) => e.name === 'Barbell Back Squat')!,
      EXERCISE_DATABASE.find((e) => e.name === 'Standard Bodyweight Pushups')!,
      EXERCISE_DATABASE.find((e) => e.name === 'Standing Dumbbell Bicep Curls')!,
      EXERCISE_DATABASE.find((e) => e.name === 'Isometric Core Plank')!
    );
  }

  return matched.slice(0, maxItems).map((ex) => ({
    name: ex.name,
    imageUrl: ex.imageUrl,
    targetMuscle: ex.targetMuscle,
    setsReps: ex.defaultSetsReps,
    instructions: ex.instructions,
    category: ex.category,
  }));
}
