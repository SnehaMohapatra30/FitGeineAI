/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeypointMap } from './poseTracker';

/**
 * Generates realistic procedural kinematic keypoints for live testing without a camera.
 * Simulates real human motion cycles (squat descent/ascent, push-up plank/press, bicep curl).
 */
export function generateSimulatedPose(
  exerciseName: string,
  timeMs: number,
  canvasWidth: number,
  canvasHeight: number,
  formQuality: 'perfect' | 'shallow' | 'lean' = 'perfect'
): KeypointMap {
  const ex = exerciseName.toLowerCase();
  const cycleSeconds = 3.2; // 3.2s per rep
  const phase = ((timeMs / 1000) % cycleSeconds) / cycleSeconds; // 0.0 to 1.0
  // Sine curve: 0 at top, 1 at bottom, 0 at top
  const t = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;

  const centerX = canvasWidth * 0.5;
  const baseY = canvasHeight * 0.85;

  const kp: KeypointMap = {};

  if (ex.includes('squat')) {
    // Squat kinematics
    // Max knee flexion at t = 1
    const maxDrop = formQuality === 'shallow' ? 65 : 110;
    const hipDrop = t * maxDrop;
    const torsoTilt = formQuality === 'lean' ? t * 45 : t * 22;

    const ankleY = baseY;
    const ankleLeftX = centerX - 40;
    const ankleRightX = centerX + 40;

    const kneeY = baseY - 120 + hipDrop * 0.35;
    const kneeLeftX = centerX - 60;
    const kneeRightX = centerX + 60;

    const hipY = baseY - 240 + hipDrop;
    const hipLeftX = centerX - 35;
    const hipRightX = centerX + 35;

    const shoulderY = hipY - 130 + Math.sin((torsoTilt * Math.PI) / 180) * 20;
    const shoulderLeftX = centerX - 45 - Math.sin((torsoTilt * Math.PI) / 180) * 40;
    const shoulderRightX = centerX + 45 - Math.sin((torsoTilt * Math.PI) / 180) * 40;

    const headY = shoulderY - 50;
    const headX = (shoulderLeftX + shoulderRightX) / 2;

    kp['nose'] = { x: headX, y: headY, score: 0.95 };
    kp['left_eye'] = { x: headX - 8, y: headY - 5, score: 0.95 };
    kp['right_eye'] = { x: headX + 8, y: headY - 5, score: 0.95 };
    kp['left_ear'] = { x: headX - 16, y: headY, score: 0.95 };
    kp['right_ear'] = { x: headX + 16, y: headY, score: 0.95 };

    kp['left_shoulder'] = { x: shoulderLeftX, y: shoulderY, score: 0.95 };
    kp['right_shoulder'] = { x: shoulderRightX, y: shoulderY, score: 0.95 };

    // Hands out in front for balance
    kp['left_elbow'] = { x: shoulderLeftX - 30, y: shoulderY + 40, score: 0.9 };
    kp['right_elbow'] = { x: shoulderRightX + 30, y: shoulderY + 40, score: 0.9 };
    kp['left_wrist'] = { x: shoulderLeftX - 50, y: shoulderY + 20, score: 0.9 };
    kp['right_wrist'] = { x: shoulderRightX + 50, y: shoulderY + 20, score: 0.9 };

    kp['left_hip'] = { x: hipLeftX, y: hipY, score: 0.95 };
    kp['right_hip'] = { x: hipRightX, y: hipY, score: 0.95 };

    kp['left_knee'] = { x: kneeLeftX, y: kneeY, score: 0.95 };
    kp['right_knee'] = { x: kneeRightX, y: kneeY, score: 0.95 };

    kp['left_ankle'] = { x: ankleLeftX, y: ankleY, score: 0.95 };
    kp['right_ankle'] = { x: ankleRightX, y: ankleY, score: 0.95 };
  } else if (ex.includes('push')) {
    // Push-up side profile kinematics
    const maxChestDrop = formQuality === 'shallow' ? 45 : 95;
    const chestDrop = t * maxChestDrop;

    const ankleX = canvasWidth * 0.2;
    const ankleY = canvasHeight * 0.72;

    const hipX = canvasWidth * 0.45;
    const hipY = formQuality === 'lean' // simulate hip sag
      ? ankleY - 20 + chestDrop * 0.6 + 25
      : ankleY - 25 + chestDrop * 0.5;

    const kneeX = (ankleX + hipX) / 2;
    const kneeY = (ankleY + hipY) / 2;

    const shoulderX = canvasWidth * 0.7;
    const shoulderY = hipY - 30 + chestDrop;

    const headX = shoulderX + 35;
    const headY = shoulderY - 15;

    const wristX = canvasWidth * 0.68;
    const wristY = canvasHeight * 0.75;

    // Elbow flares back and bends as chest drops
    const elbowX = (shoulderX + wristX) / 2 - t * 30;
    const elbowY = (shoulderY + wristY) / 2 - 20 + t * 15;

    kp['nose'] = { x: headX, y: headY, score: 0.95 };
    kp['left_eye'] = { x: headX - 5, y: headY - 5, score: 0.95 };
    kp['right_eye'] = { x: headX, y: headY - 5, score: 0.9 };
    kp['left_ear'] = { x: headX - 12, y: headY, score: 0.9 };
    kp['right_ear'] = { x: headX - 8, y: headY, score: 0.85 };

    kp['left_shoulder'] = { x: shoulderX, y: shoulderY, score: 0.95 };
    kp['right_shoulder'] = { x: shoulderX + 10, y: shoulderY - 5, score: 0.9 };

    kp['left_elbow'] = { x: elbowX, y: elbowY, score: 0.95 };
    kp['right_elbow'] = { x: elbowX + 10, y: elbowY - 5, score: 0.9 };

    kp['left_wrist'] = { x: wristX, y: wristY, score: 0.95 };
    kp['right_wrist'] = { x: wristX + 10, y: wristY, score: 0.9 };

    kp['left_hip'] = { x: hipX, y: hipY, score: 0.95 };
    kp['right_hip'] = { x: hipX + 10, y: hipY - 5, score: 0.9 };

    kp['left_knee'] = { x: kneeX, y: kneeY, score: 0.95 };
    kp['right_knee'] = { x: kneeX + 10, y: kneeY - 5, score: 0.9 };

    kp['left_ankle'] = { x: ankleX, y: ankleY, score: 0.95 };
    kp['right_ankle'] = { x: ankleX + 10, y: ankleY - 5, score: 0.9 };
  } else {
    // Bicep curl profile kinematics
    const shoulderX = centerX - 20;
    const shoulderY = canvasHeight * 0.35;

    const elbowX = shoulderX + (formQuality === 'lean' ? t * 25 : 5); // drift if bad form
    const elbowY = shoulderY + 85;

    // Wrist arcs up towards shoulder during curl
    const armLen = 80;
    const maxAngleDeg = formQuality === 'shallow' ? 85 : 45; // peak angle
    const startAngleDeg = 165;
    const currentAngleDeg = startAngleDeg - t * (startAngleDeg - maxAngleDeg);
    const angleRad = (currentAngleDeg * Math.PI) / 180;

    const wristX = elbowX + Math.sin(angleRad) * armLen * 0.6;
    const wristY = elbowY - Math.cos(angleRad) * armLen;

    const hipX = centerX - 25;
    const hipY = canvasHeight * 0.58;

    const kneeX = centerX - 20;
    const kneeY = canvasHeight * 0.75;

    const ankleX = centerX - 20;
    const ankleY = canvasHeight * 0.9;

    const headX = shoulderX;
    const headY = shoulderY - 55;

    kp['nose'] = { x: headX, y: headY, score: 0.95 };
    kp['left_eye'] = { x: headX - 6, y: headY - 4, score: 0.95 };
    kp['right_eye'] = { x: headX + 6, y: headY - 4, score: 0.9 };
    kp['left_ear'] = { x: headX - 14, y: headY, score: 0.9 };
    kp['right_ear'] = { x: headX + 14, y: headY, score: 0.85 };

    kp['left_shoulder'] = { x: shoulderX, y: shoulderY, score: 0.95 };
    kp['right_shoulder'] = { x: shoulderX + 30, y: shoulderY, score: 0.9 };

    kp['left_elbow'] = { x: elbowX, y: elbowY, score: 0.95 };
    kp['right_elbow'] = { x: elbowX + 30, y: elbowY, score: 0.85 };

    kp['left_wrist'] = { x: wristX, y: wristY, score: 0.95 };
    kp['right_wrist'] = { x: wristX + 30, y: wristY, score: 0.85 };

    kp['left_hip'] = { x: hipX, y: hipY, score: 0.95 };
    kp['right_hip'] = { x: hipX + 30, y: hipY, score: 0.9 };

    kp['left_knee'] = { x: kneeX, y: kneeY, score: 0.95 };
    kp['right_knee'] = { x: kneeX + 30, y: kneeY, score: 0.9 };

    kp['left_ankle'] = { x: ankleX, y: ankleY, score: 0.95 };
    kp['right_ankle'] = { x: ankleX + 30, y: ankleY, score: 0.9 };
  }

  return kp;
}
