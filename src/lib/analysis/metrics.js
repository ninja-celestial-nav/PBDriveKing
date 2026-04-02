/**
 * Metrics Extraction Engine
 * Extracts biomechanical measurements from pose landmarks.
 */

import {
  calculateAngle,
  calculateDistance,
  getBodyMidpoint,
  getSideLandmarks,
  LANDMARKS,
  trajectoryAngle,
  isLandmarkVisible,
} from "../mediapipe/landmark-utils";

/**
 * Extract all metrics from a pair of landmark sets (rear + side views).
 * @param {Object} opts
 * @param {Array|null} opts.rearLandmarks - Landmarks from rear camera
 * @param {Array|null} opts.sideLandmarks - Landmarks from side camera
 * @param {string} opts.hand - "right" or "left"
 * @param {Object|null} opts.prevSideWrist - Previous frame's wrist position (for swing path)
 * @param {Object|null} opts.startHipCenter - Hip center at start of swing (for weight transfer)
 * @returns {Object} Extracted metrics
 */
export function extractMetrics({
  rearLandmarks = null,
  sideLandmarks = null,
  hand = "right",
  prevSideWrist = null,
  startHipCenter = null,
}) {
  const metrics = {
    unitTurn: null,
    contactPoint: null,
    backswing: null,
    kneeBend: null,
    followThrough: null,
    weightTransfer: null,
    swingPath: null,
    raw: {},
  };

  // ─── REAR VIEW METRICS ───
  if (rearLandmarks && rearLandmarks.length >= 33) {
    const lShoulder = rearLandmarks[LANDMARKS.LEFT_SHOULDER];
    const rShoulder = rearLandmarks[LANDMARKS.RIGHT_SHOULDER];
    const hipMid = getBodyMidpoint(rearLandmarks);

    // Unit Turn: angle between shoulders relative to camera (deviation from facing camera)
    if (isLandmarkVisible(lShoulder) && isLandmarkVisible(rShoulder)) {
      // In rear view, shoulders aligned = 180°. Rotation reduces this.
      const shoulderAngle = calculateAngle(lShoulder, hipMid, rShoulder);
      // Unit turn = how far the shoulder line has rotated from square (180°)
      const unitTurn = Math.abs(180 - shoulderAngle);
      metrics.unitTurn = Math.round(unitTurn * 10) / 10;
      metrics.raw.shoulderAngle = shoulderAngle;
    }

    // Follow-Through: check if paddle wrist crosses body midline
    const side = getSideLandmarks(rearLandmarks, hand);
    if (isLandmarkVisible(side.paddleWrist)) {
      const midX = hipMid.x;
      const wristX = side.paddleWrist.x;
      // For right-handed: wrist should cross to the left side (lower x in normalized)
      const isRight = hand === "right";
      const crossed = isRight ? wristX < midX : wristX > midX;
      const crossDistance = Math.abs(wristX - midX);
      metrics.followThrough = {
        crossed,
        distance: Math.round(crossDistance * 1000) / 10, // Normalized units × 100
      };
    }
  }

  // ─── SIDE VIEW METRICS ───
  if (sideLandmarks && sideLandmarks.length >= 33) {
    const side = getSideLandmarks(sideLandmarks, hand);

    // Contact Point: wrist X relative to lead ankle X (positive = in front)
    if (isLandmarkVisible(side.paddleWrist) && isLandmarkVisible(side.leadAnkle)) {
      // In side view, X represents front-to-back.
      // Positive means wrist is in front of ankle.
      const contactDist = side.leadAnkle.x - side.paddleWrist.x;
      // Convert normalized to approximate inches (assume ~72-inch body height fills frame)
      const approxInches = contactDist * 72;
      metrics.contactPoint = Math.round(approxInches * 10) / 10;
      metrics.raw.contactPointNorm = contactDist;
    }

    // Backswing: angle of wrist behind shoulder plane
    if (
      isLandmarkVisible(side.paddleWrist) &&
      isLandmarkVisible(side.paddleShoulder) &&
      isLandmarkVisible(side.paddleHip)
    ) {
      const backswingAngle = calculateAngle(
        side.paddleWrist,
        side.paddleShoulder,
        side.paddleHip
      );
      // Backswing is how far the wrist goes behind the shoulder line
      const behindShoulder = Math.max(0, backswingAngle - 90);
      metrics.backswing = Math.round(behindShoulder * 10) / 10;
      metrics.raw.backswingAngle = backswingAngle;
    }

    // Knee Bend: hip-knee-ankle angle on lead leg
    if (
      isLandmarkVisible(side.leadHip) &&
      isLandmarkVisible(side.leadKnee) &&
      isLandmarkVisible(side.leadAnkle)
    ) {
      const kneeBendAngle = calculateAngle(
        side.leadHip,
        side.leadKnee,
        side.leadAnkle
      );
      metrics.kneeBend = Math.round(kneeBendAngle * 10) / 10;
    }

    // Weight Transfer: hip center X delta from start to current
    if (startHipCenter) {
      const currentHipCenter = getBodyMidpoint(sideLandmarks);
      const hipShift = startHipCenter.x - currentHipCenter.x;
      const approxInches = hipShift * 72;
      metrics.weightTransfer = Math.round(approxInches * 10) / 10;
      metrics.raw.hipShiftNorm = hipShift;
    }

    // Swing Path: angle of wrist trajectory relative to horizontal
    if (prevSideWrist && isLandmarkVisible(side.paddleWrist)) {
      const pathAngle = trajectoryAngle(prevSideWrist, side.paddleWrist);
      metrics.swingPath = Math.round(pathAngle * 10) / 10;
    }
  }

  return metrics;
}

/**
 * Segment the frame history into discrete "Swing Events".
 * A swing is defined by a rapid forward movement of the paddle wrist.
 * @param {Array} frameHistory - Collection of metrics per frame
 * @returns {Array} Array of swing segments (each is a range {start, end, contact})
 */
export function segmentSwings(frameHistory) {
  if (frameHistory.length < 5) return [];

  const swings = [];
  let inSwing = false;
  let currentSwing = { start: 0, end: 0, contact: 0 };
  let maxForwardVel = 0;

  // Track forward velocity (X-delta in side view)
  for (let i = 1; i < frameHistory.length; i++) {
    const prev = frameHistory[i - 1];
    const curr = frameHistory[i];

    // Forward velocity = change in contact point (inches)
    const vel = (curr.contactPoint || 0) - (prev.contactPoint || 0);

    // Threshold: 1.5 inches per frame forward = start of swing
    if (!inSwing && vel > 1.5) {
      inSwing = true;
      currentSwing = { start: Math.max(0, i - 10), end: 0, contact: i };
      maxForwardVel = vel;
    } else if (inSwing) {
      if (vel > maxForwardVel) {
        maxForwardVel = vel;
        currentSwing.contact = i;
      }

      // End: velocity drops or reverses significantly
      if (vel < -0.5 || (i - currentSwing.contact > 20)) {
        inSwing = false;
        currentSwing.end = Math.min(frameHistory.length - 1, i + 5);
        
        // Only keep if the swing has enough weight/movement
        if (currentSwing.end - currentSwing.start > 5) {
          swings.push({ ...currentSwing });
        }
      }
    }
  }

  // If still in swing at the end
  if (inSwing) {
    currentSwing.end = frameHistory.length - 1;
    swings.push(currentSwing);
  }

  return swings;
}

/**
 * Determine the peak moment for each detected swing.
 * @param {Array} frameMetrics - Full session metrics
 * @param {Array} swings - Array from segmentSwings
 * @returns {Array} Metrics for each peak moment
 */
export function getPeakMetricsPerSwing(frameMetrics, swings) {
  return swings.map(swing => {
    // Return metrics at the detected contact frame
    return frameMetrics[swing.contact];
  });
}

/**
 * Heuristic: the frame where the wrist is most extended forward.
 * (Kept for backwards compatibility but now uses segmentSwings)
 */
export function findContactFrame(frameMetrics) {
  const swings = segmentSwings(frameMetrics);
  if (swings.length === 0) return 0;
  
  // Return the contact frame of the "best" swing (most forward extension)
  let bestFrame = swings[0].contact;
  let maxContact = -Infinity;

  swings.forEach(s => {
    const val = frameMetrics[s.contact].contactPoint;
    if (val !== null && val > maxContact) {
      maxContact = val;
      bestFrame = s.contact;
    }
  });

  return bestFrame;
}
