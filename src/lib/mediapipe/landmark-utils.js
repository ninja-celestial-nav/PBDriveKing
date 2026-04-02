/**
 * Landmark Utilities
 * Geometric calculations for pose landmark analysis.
 */

// MediaPipe Landmark Indices
export const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculate the angle at vertex B formed by points A-B-C in degrees.
 * B is the joint where the angle is measured.
 */
export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Calculate Euclidean distance between two points (2D).
 */
export function calculateDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Calculate 3D Euclidean distance.
 */
export function calculateDistance3D(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow((a.z || 0) - (b.z || 0), 2)
  );
}

/**
 * Convert normalized landmark coords to pixel coordinates.
 */
export function normalizeToPixels(landmark, width, height) {
  return {
    x: landmark.x * width,
    y: landmark.y * height,
    z: landmark.z || 0,
    visibility: landmark.visibility || 0,
  };
}

/**
 * Get the midpoint between two landmarks.
 */
export function getMidpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z || 0) + (b.z || 0)) / 2,
  };
}

/**
 * Get the body midpoint (center of hips).
 */
export function getBodyMidpoint(landmarks) {
  const lHip = landmarks[LANDMARKS.LEFT_HIP];
  const rHip = landmarks[LANDMARKS.RIGHT_HIP];
  return getMidpoint(lHip, rHip);
}

/**
 * Check if a landmark has sufficient visibility.
 */
export function isLandmarkVisible(landmark, threshold = 0.5) {
  return landmark && (landmark.visibility || 0) >= threshold;
}

/**
 * Get landmarks for a specific side based on handedness.
 * "right" = right-handed player (lead = left side for forehand).
 */
export function getSideLandmarks(landmarks, hand = "right") {
  const isRight = hand === "right";
  return {
    paddleShoulder: landmarks[isRight ? LANDMARKS.RIGHT_SHOULDER : LANDMARKS.LEFT_SHOULDER],
    paddleElbow: landmarks[isRight ? LANDMARKS.RIGHT_ELBOW : LANDMARKS.LEFT_ELBOW],
    paddleWrist: landmarks[isRight ? LANDMARKS.RIGHT_WRIST : LANDMARKS.LEFT_WRIST],
    leadShoulder: landmarks[isRight ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER],
    leadHip: landmarks[isRight ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP],
    paddleHip: landmarks[isRight ? LANDMARKS.RIGHT_HIP : LANDMARKS.LEFT_HIP],
    leadKnee: landmarks[isRight ? LANDMARKS.LEFT_KNEE : LANDMARKS.RIGHT_KNEE],
    paddleKnee: landmarks[isRight ? LANDMARKS.RIGHT_KNEE : LANDMARKS.LEFT_KNEE],
    leadAnkle: landmarks[isRight ? LANDMARKS.LEFT_ANKLE : LANDMARKS.RIGHT_ANKLE],
    paddleAnkle: landmarks[isRight ? LANDMARKS.RIGHT_ANKLE : LANDMARKS.LEFT_ANKLE],
  };
}

/**
 * Calculate angle of a trajectory vector relative to horizontal.
 * Used for swing path analysis.
 */
export function trajectoryAngle(pointStart, pointEnd) {
  const dx = pointEnd.x - pointStart.x;
  const dy = pointStart.y - pointEnd.y; // Invert Y (screen coords)
  return (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
}

/**
 * Simple moving average filter for smoothing jittery values.
 */
export function createSmoother(windowSize = 5) {
  const buffer = [];
  return (value) => {
    buffer.push(value);
    if (buffer.length > windowSize) buffer.shift();
    return buffer.reduce((sum, v) => sum + v, 0) / buffer.length;
  };
}
