/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { LiveJointAngles, LiveFormFeedback } from '../types';

let detectorInstance: poseDetection.PoseDetector | null = null;
let isInitializing = false;

/**
 * Initializes and returns the MoveNet Pose Detector singleton.
 */
export async function getPoseDetector(): Promise<poseDetection.PoseDetector> {
  if (detectorInstance) {
    return detectorInstance;
  }

  if (isInitializing) {
    // Wait for in-flight initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (detectorInstance) return detectorInstance;
  }

  isInitializing = true;
  try {
    try {
      await tf.setBackend('webgl');
    } catch {
      try {
        await tf.setBackend('cpu');
      } catch (e) {
        console.warn('Backend setup fallback warning:', e);
      }
    }
    await tf.ready();

    detectorInstance = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
    return detectorInstance;
  } finally {
    isInitializing = false;
  }
}

export interface KeypointMap {
  [name: string]: { x: number; y: number; score: number };
}

/**
 * Converts detected keypoint array to named map for fast lookups.
 */
export function mapKeypoints(keypoints: poseDetection.Keypoint[]): KeypointMap {
  const map: KeypointMap = {};
  keypoints.forEach((kp) => {
    if (kp.name) {
      map[kp.name] = { x: kp.x, y: kp.y, score: kp.score ?? 0 };
    }
  });
  return map;
}

/**
 * Calculates 2D angle between vectors BA and BC in degrees (vertex at B).
 */
export function calculateJointAngle(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  pointC: { x: number; y: number }
): number {
  const baX = pointA.x - pointB.x;
  const baY = pointA.y - pointB.y;
  const bcX = pointC.x - pointB.x;
  const bcY = pointC.y - pointB.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);

  if (magBA === 0 || magBC === 0) return 180;
  let cosAngle = dot / (magBA * magBC);
  // Clamp for numerical safety
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
}

/**
 * Calculates trunk inclination angle relative to vertical (0° = vertical upright).
 */
export function calculateTorsoInclination(
  shoulder: { x: number; y: number },
  hip: { x: number; y: number }
): number {
  // Vector from Hip to Shoulder
  const dx = shoulder.x - hip.x;
  const dy = hip.y - shoulder.y; // invert Y since screen Y is down
  const angleRad = Math.atan2(Math.abs(dx), Math.max(0.001, dy));
  return Math.round(angleRad * (180 / Math.PI));
}

/**
 * Computes all essential live joint angles from keypoints.
 */
export function extractLiveAngles(kpMap: KeypointMap): LiveJointAngles {
  const minScore = 0.25;

  // Left side confidence
  const leftValid =
    (kpMap.left_shoulder?.score ?? 0) > minScore &&
    (kpMap.left_hip?.score ?? 0) > minScore &&
    (kpMap.left_knee?.score ?? 0) > minScore;

  // Right side confidence
  const rightValid =
    (kpMap.right_shoulder?.score ?? 0) > minScore &&
    (kpMap.right_hip?.score ?? 0) > minScore &&
    (kpMap.right_knee?.score ?? 0) > minScore;

  // Left angles
  let leftKnee = 180;
  let leftHip = 180;
  let leftElbow = 180;
  let leftSpine = 0;

  if (kpMap.left_hip && kpMap.left_knee && kpMap.left_ankle) {
    leftKnee = calculateJointAngle(kpMap.left_hip, kpMap.left_knee, kpMap.left_ankle);
  }
  if (kpMap.left_shoulder && kpMap.left_hip && kpMap.left_knee) {
    leftHip = calculateJointAngle(kpMap.left_shoulder, kpMap.left_hip, kpMap.left_knee);
  }
  if (kpMap.left_shoulder && kpMap.left_elbow && kpMap.left_wrist) {
    leftElbow = calculateJointAngle(kpMap.left_shoulder, kpMap.left_elbow, kpMap.left_wrist);
  }
  if (kpMap.left_shoulder && kpMap.left_hip) {
    leftSpine = calculateTorsoInclination(kpMap.left_shoulder, kpMap.left_hip);
  }

  // Right angles
  let rightKnee = 180;
  let rightHip = 180;
  let rightElbow = 180;
  let rightSpine = 0;

  if (kpMap.right_hip && kpMap.right_knee && kpMap.right_ankle) {
    rightKnee = calculateJointAngle(kpMap.right_hip, kpMap.right_knee, kpMap.right_ankle);
  }
  if (kpMap.right_shoulder && kpMap.right_hip && kpMap.right_knee) {
    rightHip = calculateJointAngle(kpMap.right_shoulder, kpMap.right_hip, kpMap.right_knee);
  }
  if (kpMap.right_shoulder && kpMap.right_elbow && kpMap.right_wrist) {
    rightElbow = calculateJointAngle(kpMap.right_shoulder, kpMap.right_elbow, kpMap.right_wrist);
  }
  if (kpMap.right_shoulder && kpMap.right_hip) {
    rightSpine = calculateTorsoInclination(kpMap.right_shoulder, kpMap.right_hip);
  }

  // Determine dominant side
  let side: 'left' | 'right' | 'both' = 'left';
  let knee = leftKnee;
  let hip = leftHip;
  let elbow = leftElbow;
  let spine = leftSpine;

  const leftAvgScore =
    ((kpMap.left_shoulder?.score ?? 0) +
      (kpMap.left_hip?.score ?? 0) +
      (kpMap.left_knee?.score ?? 0) +
      (kpMap.left_elbow?.score ?? 0)) / 4;

  const rightAvgScore =
    ((kpMap.right_shoulder?.score ?? 0) +
      (kpMap.right_hip?.score ?? 0) +
      (kpMap.right_knee?.score ?? 0) +
      (kpMap.right_elbow?.score ?? 0)) / 4;

  if (rightAvgScore > leftAvgScore + 0.1) {
    side = 'right';
    knee = rightKnee;
    hip = rightHip;
    elbow = rightElbow;
    spine = rightSpine;
  } else if (Math.abs(rightAvgScore - leftAvgScore) <= 0.1 && leftValid && rightValid) {
    side = 'both';
    knee = Math.round((leftKnee + rightKnee) / 2);
    hip = Math.round((leftHip + rightHip) / 2);
    elbow = Math.round((leftElbow + rightElbow) / 2);
    spine = Math.round((leftSpine + rightSpine) / 2);
  }

  return {
    knee,
    hip,
    elbow,
    spine,
    leftKnee,
    rightKnee,
    leftElbow,
    rightElbow,
    side,
  };
}

/**
 * Exercise rep tracker and real-time state machine.
 */
export class ExerciseRepEngine {
  exerciseName: string;
  repCount = 0;
  cleanRepCount = 0;
  warningRepCount = 0;
  currentPhase: string = 'ready';
  repStartTime = 0;
  setStartTime = Date.now();
  currentRepMinKneeAngle = 180;
  currentRepMinElbowAngle = 180;
  currentRepMaxTorsoAngle = 0;
  overallMinKneeAngle = 180;
  overallMinElbowAngle = 180;
  spineAngleReadings: number[] = [];
  formWarningsEncountered: Set<string> = new Set();
  lastFeedback: LiveFormFeedback = {
    status: 'idle',
    message: 'Get in position to begin',
    detail: 'Camera is tracking joint coordinates',
    repPhase: 'ready',
  };

  constructor(exerciseName: string) {
    this.exerciseName = exerciseName;
  }

  reset(newExercise?: string) {
    if (newExercise) this.exerciseName = newExercise;
    this.repCount = 0;
    this.cleanRepCount = 0;
    this.warningRepCount = 0;
    this.currentPhase = 'ready';
    this.repStartTime = 0;
    this.setStartTime = Date.now();
    this.currentRepMinKneeAngle = 180;
    this.currentRepMinElbowAngle = 180;
    this.currentRepMaxTorsoAngle = 0;
    this.overallMinKneeAngle = 180;
    this.overallMinElbowAngle = 180;
    this.spineAngleReadings = [];
    this.formWarningsEncountered.clear();
    this.lastFeedback = {
      status: 'idle',
      message: 'Get in position to begin',
      detail: 'Tracking live joint kinematics',
      repPhase: 'ready',
    };
  }

  /**
   * Process a new frame with computed joint angles.
   * Returns true if a rep was just completed on this frame.
   */
  processFrame(angles: LiveJointAngles): { repCompleted: boolean; feedback: LiveFormFeedback } {
    let repCompleted = false;
    const ex = this.exerciseName.toLowerCase();

    this.spineAngleReadings.push(angles.spine);
    if (this.spineAngleReadings.length > 300) {
      this.spineAngleReadings.shift();
    }

    if (ex.includes('squat')) {
      repCompleted = this.processSquat(angles);
    } else if (ex.includes('push')) {
      repCompleted = this.processPushup(angles);
    } else if (ex.includes('curl')) {
      repCompleted = this.processBicepCurl(angles);
    } else {
      // Default to squat logic for leg movements
      repCompleted = this.processSquat(angles);
    }

    return { repCompleted, feedback: this.lastFeedback };
  }

  private processSquat(angles: LiveJointAngles): boolean {
    const { knee, hip, spine } = angles;
    let completed = false;

    // Track min knee angle reached during current repetition
    if (knee < this.currentRepMinKneeAngle) {
      this.currentRepMinKneeAngle = knee;
    }
    if (knee < this.overallMinKneeAngle) {
      this.overallMinKneeAngle = knee;
    }
    if (spine > this.currentRepMaxTorsoAngle) {
      this.currentRepMaxTorsoAngle = spine;
    }

    // Squat State Machine
    // Standing: knee > 155°
    // Descending: knee < 145°
    // Bottom inflection: knee <= 100° (deep squat <= 85°)
    // Ascending: moving back up
    // Completed: knee > 155° after reaching inflection

    if (this.currentPhase === 'ready' || this.currentPhase === 'standing') {
      if (knee > 155) {
        this.currentPhase = 'standing';
        this.currentRepMinKneeAngle = 180;
        this.currentRepMaxTorsoAngle = spine;
        this.lastFeedback = {
          status: 'idle',
          message: 'Stand tall & initiate descent',
          detail: `Knee: ${knee}° • Spine: ${spine}° (Neutral)`,
          repPhase: 'standing',
        };
      } else if (knee <= 145) {
        this.currentPhase = 'descending';
        this.repStartTime = Date.now();
        this.lastFeedback = {
          status: 'correct',
          message: 'Descending — control tempo',
          detail: `Current Knee Angle: ${knee}° (Aim for <= 100°)`,
          repPhase: 'descending',
        };
      }
    } else if (this.currentPhase === 'descending') {
      if (knee <= 100) {
        this.currentPhase = 'bottom';
        this.lastFeedback = {
          status: 'correct',
          message: 'GREAT DEPTH! Parallel reached — drive up!',
          detail: `Depth Knee Angle: ${knee}° (Parallel standard)`,
          repPhase: 'bottom',
        };
      } else if (knee > 145 && this.currentRepMinKneeAngle > 115) {
        // Reversed too early without hitting depth
        this.currentPhase = 'ascending';
        this.formWarningsEncountered.add('Shallow squat: Did not reach 100° parallel depth');
        this.lastFeedback = {
          status: 'warning',
          message: 'WARNING: Shallow depth! Squat deeper',
          detail: `Minimum depth reached was only ${this.currentRepMinKneeAngle}°`,
          repPhase: 'ascending',
        };
      } else {
        // Still descending
        let detail = `Depth: ${knee}°`;
        let status: 'correct' | 'warning' = 'correct';
        let msg = 'Going down — push hips back';

        if (spine > 48) {
          status = 'warning';
          msg = 'WARNING: Chest falling forward!';
          this.formWarningsEncountered.add('Excessive forward torso lean on descent');
        }

        this.lastFeedback = {
          status,
          message: msg,
          detail,
          repPhase: 'descending',
        };
      }
    } else if (this.currentPhase === 'bottom') {
      if (knee > 110) {
        this.currentPhase = 'ascending';
        this.lastFeedback = {
          status: 'correct',
          message: 'Drive through heels to top lockout',
          detail: `Ascending — Knees tracking outward`,
          repPhase: 'ascending',
        };
      } else {
        // Holding depth
        this.lastFeedback = {
          status: 'correct',
          message: 'Solid depth hold! Drive up now',
          detail: `Bottom inflection: ${knee}°`,
          repPhase: 'bottom',
        };
      }
    } else if (this.currentPhase === 'ascending') {
      if (knee >= 155) {
        // Rep completed!
        this.repCount += 1;
        completed = true;

        const isClean = this.currentRepMinKneeAngle <= 100 && this.currentRepMaxTorsoAngle <= 50;
        if (isClean) {
          this.cleanRepCount += 1;
          this.lastFeedback = {
            status: 'correct',
            message: `REP ${this.repCount} COMPLETE! (Clean parallel depth)`,
            detail: `Min Knee: ${this.currentRepMinKneeAngle}° • Torso: ${this.currentRepMaxTorsoAngle}°`,
            repPhase: 'standing',
          };
        } else {
          this.warningRepCount += 1;
          this.lastFeedback = {
            status: 'warning',
            message: `REP ${this.repCount} RECORDED (Form Warning)`,
            detail: this.currentRepMinKneeAngle > 100
              ? `Shallow depth (${this.currentRepMinKneeAngle}° vs 100° target)`
              : `Torso leaned forward (${this.currentRepMaxTorsoAngle}°)`,
            repPhase: 'standing',
          };
        }

        this.currentPhase = 'standing';
        this.currentRepMinKneeAngle = 180;
      }
    }

    return completed;
  }

  private processPushup(angles: LiveJointAngles): boolean {
    const { elbow, hip, spine } = angles;
    let completed = false;

    if (elbow < this.currentRepMinElbowAngle) {
      this.currentRepMinElbowAngle = elbow;
    }
    if (elbow < this.overallMinElbowAngle) {
      this.overallMinElbowAngle = elbow;
    }

    // Plank top: elbow > 150°
    // Lowering: elbow < 135°
    // Bottom chest touch: elbow <= 95°
    // Ascending / Push up
    // Finish: elbow > 150°

    if (this.currentPhase === 'ready' || this.currentPhase === 'standing' || this.currentPhase === 'plank') {
      if (elbow > 150) {
        this.currentPhase = 'plank';
        this.currentRepMinElbowAngle = 180;

        // Hip plank check
        const isSagging = hip > 195;
        const isPiking = hip < 155;

        if (isSagging) {
          this.formWarningsEncountered.add('Plank sag: Core disengaged');
          this.lastFeedback = {
            status: 'warning',
            message: 'WARNING: Hips sagging! Squeeze abs & glutes',
            detail: `Plank Hip Angle: ${hip}° (Aim for 170°-185°)`,
            repPhase: 'plank',
          };
        } else if (isPiking) {
          this.formWarningsEncountered.add('Plank pike: Hips too high');
          this.lastFeedback = {
            status: 'warning',
            message: 'WARNING: Lower hips into straight line',
            detail: `Plank Hip Angle: ${hip}° (Pike detected)`,
            repPhase: 'plank',
          };
        } else {
          this.lastFeedback = {
            status: 'correct',
            message: 'Plank locked — begin descent to floor',
            detail: `Elbows: ${elbow}° • Straight spine`,
            repPhase: 'plank',
          };
        }
      } else if (elbow <= 135) {
        this.currentPhase = 'lowering';
        this.lastFeedback = {
          status: 'correct',
          message: 'Lowering chest with controlled tempo',
          detail: `Current Elbow: ${elbow}° (Aim for <= 95°)`,
          repPhase: 'lowering',
        };
      }
    } else if (this.currentPhase === 'lowering') {
      if (elbow <= 95) {
        this.currentPhase = 'bottom';
        this.lastFeedback = {
          status: 'correct',
          message: 'FULL CHEST DEPTH! Push the floor away!',
          detail: `Elbow Flexion: ${elbow}° (90° standard)`,
          repPhase: 'bottom',
        };
      } else if (elbow > 135 && this.currentRepMinElbowAngle > 105) {
        this.currentPhase = 'ascending';
        this.formWarningsEncountered.add('Partial pushup: Incomplete chest depth');
        this.lastFeedback = {
          status: 'warning',
          message: 'WARNING: Incomplete depth! Lower chest closer',
          detail: `Min elbow reached: ${this.currentRepMinElbowAngle}°`,
          repPhase: 'ascending',
        };
      }
    } else if (this.currentPhase === 'bottom') {
      if (elbow > 110) {
        this.currentPhase = 'ascending';
        this.lastFeedback = {
          status: 'correct',
          message: 'Locking out elbows smoothly',
          detail: `Driving upward with chest and triceps`,
          repPhase: 'ascending',
        };
      }
    } else if (this.currentPhase === 'ascending') {
      if (elbow >= 150) {
        this.repCount += 1;
        completed = true;

        const isClean = this.currentRepMinElbowAngle <= 95 && hip >= 155 && hip <= 195;
        if (isClean) {
          this.cleanRepCount += 1;
          this.lastFeedback = {
            status: 'correct',
            message: `REP ${this.repCount} COMPLETE! (Full ROM & Rigid Plank)`,
            detail: `Elbow: ${this.currentRepMinElbowAngle}° • Hip line: ${hip}°`,
            repPhase: 'plank',
          };
        } else {
          this.warningRepCount += 1;
          this.lastFeedback = {
            status: 'warning',
            message: `REP ${this.repCount} RECORDED (Form Warning)`,
            detail: this.currentRepMinElbowAngle > 95
              ? `Partial depth (${this.currentRepMinElbowAngle}°)`
              : `Plank misalignment (${hip}°)`,
            repPhase: 'plank',
          };
        }

        this.currentPhase = 'plank';
        this.currentRepMinElbowAngle = 180;
      }
    }

    return completed;
  }

  private processBicepCurl(angles: LiveJointAngles): boolean {
    const { elbow } = angles;
    let completed = false;

    if (elbow < this.currentRepMinElbowAngle) {
      this.currentRepMinElbowAngle = elbow;
    }
    if (elbow < this.overallMinElbowAngle) {
      this.overallMinElbowAngle = elbow;
    }

    // Extended down: elbow > 145°
    // Curling up: elbow < 120°
    // Peak contraction: elbow <= 60°
    // Lowering: returning down
    // Finished: elbow > 145°

    if (this.currentPhase === 'ready' || this.currentPhase === 'standing' || this.currentPhase === 'ready_down') {
      if (elbow > 145) {
        this.currentPhase = 'ready_down';
        this.currentRepMinElbowAngle = 180;
        this.lastFeedback = {
          status: 'idle',
          message: 'Full stretch at bottom — curl up',
          detail: `Arm extended: ${elbow}°`,
          repPhase: 'standing',
        };
      } else if (elbow <= 125) {
        this.currentPhase = 'curling';
        this.lastFeedback = {
          status: 'correct',
          message: 'Curling up — keep elbow pinned to ribcage',
          detail: `Elbow Flexion: ${elbow}°`,
          repPhase: 'curling',
        };
      }
    } else if (this.currentPhase === 'curling') {
      if (elbow <= 60) {
        this.currentPhase = 'peak';
        this.lastFeedback = {
          status: 'correct',
          message: 'PEAK CONTRACTION! Squeeze bicep & lower slowly',
          detail: `Peak Angle: ${elbow}° (Full contraction)`,
          repPhase: 'peak',
        };
      } else if (elbow > 130 && this.currentRepMinElbowAngle > 80) {
        this.currentPhase = 'lowering';
        this.formWarningsEncountered.add('Incomplete curl: Missed peak bicep contraction');
        this.lastFeedback = {
          status: 'warning',
          message: 'WARNING: Half-rep! Curl all the way to top',
          detail: `Min curl angle: ${this.currentRepMinElbowAngle}° (Goal <= 60°)`,
          repPhase: 'lowering',
        };
      }
    } else if (this.currentPhase === 'peak') {
      if (elbow > 75) {
        this.currentPhase = 'lowering';
        this.lastFeedback = {
          status: 'correct',
          message: 'Lowering under control (eccentric phase)',
          detail: `Extend arm fully down`,
          repPhase: 'lowering',
        };
      }
    } else if (this.currentPhase === 'lowering') {
      if (elbow >= 145) {
        this.repCount += 1;
        completed = true;

        const isClean = this.currentRepMinElbowAngle <= 65;
        if (isClean) {
          this.cleanRepCount += 1;
          this.lastFeedback = {
            status: 'correct',
            message: `REP ${this.repCount} COMPLETE! (Peak squeeze & full lockout)`,
            detail: `Peak Flexion: ${this.currentRepMinElbowAngle}°`,
            repPhase: 'standing',
          };
        } else {
          this.warningRepCount += 1;
          this.lastFeedback = {
            status: 'warning',
            message: `REP ${this.repCount} RECORDED (Short ROM)`,
            detail: `Did not reach peak contraction (${this.currentRepMinElbowAngle}°)`,
            repPhase: 'standing',
          };
        }

        this.currentPhase = 'ready_down';
        this.currentRepMinElbowAngle = 180;
      }
    }

    return completed;
  }

  getSummaryMetrics() {
    const durationSeconds = Math.max(1, Math.round((Date.now() - this.setStartTime) / 1000));
    const avgSpine =
      this.spineAngleReadings.length > 0
        ? Math.round(
            this.spineAngleReadings.reduce((a, b) => a + b, 0) / this.spineAngleReadings.length
          )
        : 15;

    return {
      exerciseName: this.exerciseName,
      repsCompleted: this.repCount,
      cleanReps: this.cleanRepCount,
      warningReps: this.warningRepCount,
      durationSeconds,
      minKneeAngle: this.overallMinKneeAngle === 180 ? 95 : this.overallMinKneeAngle,
      minElbowAngle: this.overallMinElbowAngle === 180 ? 60 : this.overallMinElbowAngle,
      avgSpineAngle: avgSpine,
      formIssues: Array.from(this.formWarningsEncountered),
    };
  }
}

/**
 * Standard MoveNet Keypoint Skeletons connections.
 */
export const SKELETON_CONNECTIONS = [
  // Face
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
  // Upper body
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  // Torso
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  // Lower body
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

/**
 * Renders the live cybernetic skeleton overlay on a canvas.
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  kpMap: KeypointMap,
  angles: LiveJointAngles,
  feedback: LiveFormFeedback,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);

  // Status-dependent theme colors
  let primaryColor = '#10b981'; // emerald green
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  if (feedback.status === 'warning') {
    primaryColor = '#f59e0b'; // amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (feedback.status === 'alert') {
    primaryColor = '#ef4444'; // red
    glowColor = 'rgba(239, 68, 68, 0.4)';
  }

  // Draw bone connections
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = primaryColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;

  SKELETON_CONNECTIONS.forEach(([startName, endName]) => {
    const ptA = kpMap[startName];
    const ptB = kpMap[endName];
    if (ptA && ptB && ptA.score > 0.25 && ptB.score > 0.25) {
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    }
  });

  // Reset shadow for joint nodes
  ctx.shadowBlur = 0;

  // Draw joint nodes
  Object.entries(kpMap).forEach(([name, pt]) => {
    if (pt.score < 0.25) return;

    // Highlight key joints with larger glowing nodes
    const isMajorJoint = [
      'left_knee',
      'right_knee',
      'left_hip',
      'right_hip',
      'left_elbow',
      'right_elbow',
      'left_shoulder',
      'right_shoulder',
    ].includes(name);

    ctx.fillStyle = isMajorJoint ? '#ffffff' : primaryColor;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isMajorJoint ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Render on-canvas real-time angle badges
  const renderAngleBadge = (
    x: number,
    y: number,
    label: string,
    val: number,
    targetWarning: boolean
  ) => {
    ctx.save();
    const text = `${label}: ${val}°`;
    ctx.font = 'bold 12px monospace';
    const textWidth = ctx.measureText(text).width;
    const padding = 6;
    const badgeW = textWidth + padding * 2;
    const badgeH = 20;

    // Background badge pill
    ctx.fillStyle = targetWarning ? 'rgba(239, 68, 68, 0.85)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = targetWarning ? '#ef4444' : primaryColor;
    ctx.lineWidth = 1.5;

    const bx = Math.max(10, Math.min(width - badgeW - 10, x - badgeW / 2));
    const by = Math.max(20, Math.min(height - badgeH - 10, y - 25));

    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, bx + padding, by + 14);
    ctx.restore();
  };

  // Render active angle badges near corresponding joints
  if (kpMap.left_knee && kpMap.left_knee.score > 0.3) {
    const isWarn = angles.knee > 105 && feedback.repPhase === 'bottom';
    renderAngleBadge(kpMap.left_knee.x, kpMap.left_knee.y, 'Knee', angles.knee, isWarn);
  } else if (kpMap.right_knee && kpMap.right_knee.score > 0.3) {
    const isWarn = angles.knee > 105 && feedback.repPhase === 'bottom';
    renderAngleBadge(kpMap.right_knee.x, kpMap.right_knee.y, 'Knee', angles.knee, isWarn);
  }

  if (kpMap.left_elbow && kpMap.left_elbow.score > 0.3) {
    renderAngleBadge(kpMap.left_elbow.x, kpMap.left_elbow.y, 'Elbow', angles.elbow, false);
  } else if (kpMap.right_elbow && kpMap.right_elbow.score > 0.3) {
    renderAngleBadge(kpMap.right_elbow.x, kpMap.right_elbow.y, 'Elbow', angles.elbow, false);
  }

  if (kpMap.left_hip && kpMap.left_hip.score > 0.3) {
    renderAngleBadge(kpMap.left_hip.x, kpMap.left_hip.y, 'Hip', angles.hip, false);
  } else if (kpMap.right_hip && kpMap.right_hip.score > 0.3) {
    renderAngleBadge(kpMap.right_hip.x, kpMap.right_hip.y, 'Hip', angles.hip, false);
  }
}

/**
 * Creates audio cues for rep milestones and form alerts using Web Audio API.
 */
class AudioCoach {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playRepBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  playWarningBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.setValueAtTime(293.66, this.ctx.currentTime + 0.1); // D4

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }
}

export const audioCoach = new AudioCoach();
