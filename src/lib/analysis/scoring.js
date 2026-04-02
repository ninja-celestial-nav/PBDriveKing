/**
 * Composite Scoring Engine
 * Converts raw metrics into 0-100 scores with weighted composite.
 */

// ─── Threshold Definitions ───
const THRESHOLDS = {
  unitTurn: { optimal: [40, 55], warning: [25, 70], unit: "°" },
  contactPoint: { optimal: [6, 18], warning: [1, 25], unit: " in" },
  backswing: { optimal: [0, 15], warning: [0, 30], unit: "°" },
  kneeBend: { optimal: [140, 160], warning: [130, 170], unit: "°" },
  followThrough: { optimal: true, unit: "" }, // Boolean: crossed = optimal
  weightTransfer: { optimal: [3, 20], warning: [1, 25], unit: " in" },
  swingPath: { optimal: [15, 35], warning: [5, 50], unit: "°" },
};

// ─── Weights for Composite Score ───
const WEIGHTS = {
  contactPoint: 0.25,
  unitTurn: 0.2,
  kneeBend: 0.15,
  backswing: 0.15,
  followThrough: 0.1,
  weightTransfer: 0.1,
  swingPath: 0.05,
};

/**
 * Score a single metric (0–100) based on its distance from optimal range.
 */
function scoreMetric(value, thresholds) {
  if (value === null || value === undefined) return null;

  const { optimal, warning } = thresholds;

  // Boolean metric (followThrough)
  if (typeof optimal === "boolean") {
    if (typeof value === "object") {
      return value.crossed ? 100 : 30;
    }
    return value ? 100 : 30;
  }

  const [optMin, optMax] = optimal;
  const [warnMin, warnMax] = warning;

  // Within optimal range → 85–100
  if (value >= optMin && value <= optMax) {
    const center = (optMin + optMax) / 2;
    const halfRange = (optMax - optMin) / 2;
    const distFromCenter = Math.abs(value - center);
    return Math.round(85 + 15 * (1 - distFromCenter / halfRange));
  }

  // Within warning range → 50–84
  if (value >= warnMin && value <= warnMax) {
    let distFromOpt;
    if (value < optMin) {
      distFromOpt = optMin - value;
      const warnRange = optMin - warnMin;
      return Math.round(50 + 34 * (1 - distFromOpt / warnRange));
    } else {
      distFromOpt = value - optMax;
      const warnRange = warnMax - optMax;
      return Math.round(50 + 34 * (1 - distFromOpt / warnRange));
    }
  }

  // Outside warning range → 0–49
  const outerDist = value < warnMin ? warnMin - value : value - warnMax;
  return Math.max(0, Math.round(49 - outerDist * 3));
}

/**
 * Get severity level from score.
 */
export function getSeverity(score) {
  if (score === null) return "info";
  if (score >= 85) return "optimal";
  if (score >= 50) return "warning";
  return "critical";
}

/**
 * Get letter grade from composite score.
 */
export function getGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 70) return "C+";
  if (score >= 60) return "C";
  return "D";
}

/**
 * Score all metrics and produce a composite result.
 */
export function scoreAllMetrics(metrics) {
  const scores = {};
  const details = {};

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const value = metrics[key];
    const score = scoreMetric(value, threshold);
    scores[key] = score;
    details[key] = {
      value,
      score,
      severity: getSeverity(score),
      threshold,
      unit: threshold.unit,
    };
  }

  // Composite score (weighted average of non-null scores)
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (scores[key] !== null && scores[key] !== undefined) {
      weightedSum += scores[key] * weight;
      totalWeight += weight;
    }
  }

  const composite = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    scores,
    details,
    composite,
    grade: getGrade(composite),
  };
}

/**
 * Aggregate stats across multiple swings to provide a "Session Summary".
 * @param {Array} swingMetrics - Array of metrics for each detected swing peak
 * @returns {Object} Session results with consistency and averages
 */
export function calculateSessionStats(swingMetrics) {
  if (!swingMetrics || swingMetrics.length === 0) {
    return {
      composite: 0,
      grade: "N/A",
      consistency: 0,
      swingsCount: 0,
      averages: {},
      bestSwing: null,
    };
  }

  // Score each swing individually
  const allSwingScores = swingMetrics.map((m) => scoreAllMetrics(m));

  // Calculate averages for each metric
  const averages = {};
  const metricKeys = Object.keys(THRESHOLDS);

  metricKeys.forEach((key) => {
    const values = swingMetrics
      .map((m) => m[key])
      .filter((v) => v !== null && v !== undefined);
    
    if (values.length > 0) {
      if (key === "followThrough") {
        // Average follow-through = mode (did they cross more often than not?)
        const crossedCount = values.filter(v => typeof v === 'object' ? v.crossed : v).length;
        averages[key] = { crossed: crossedCount >= values.length / 2 };
      } else {
        const sum = values.reduce((a, b) => a + b, 0);
        averages[key] = Math.round((sum / values.length) * 10) / 10;
      }
    } else {
      averages[key] = null;
    }
  });

  // Average composite score
  const avgComposite = Math.round(
    allSwingScores.reduce((sum, s) => sum + s.composite, 0) / allSwingScores.length
  );

  // Consistency: 100 - (Standard Deviation of scores)
  // Higher SD = lower consistency
  let consistency = 100;
  if (allSwingScores.length > 1) {
    const mean = avgComposite;
    const variance = allSwingScores.reduce((sum, s) => sum + Math.pow(s.composite - mean, 2), 0) / allSwingScores.length;
    const stdDev = Math.sqrt(variance);
    consistency = Math.max(0, Math.round(100 - stdDev * 2)); // Dynamic scaling
  }

  // Find the best swing
  let bestSwing = allSwingScores[0];
  allSwingScores.forEach(s => {
    if (s.composite > bestSwing.composite) bestSwing = s;
  });

  // Calculate separate view scores (Rear vs Side)
  const calculateSubScore = (view) => {
    const viewWeights = {
      rear: { unitTurn: 0.6, followThrough: 0.4 },
      side: { contactPoint: 0.3, backswing: 0.2, kneeBend: 0.2, weightTransfer: 0.2, swingPath: 0.1 }
    };
    
    let totalW = 0;
    let sumW = 0;
    const weights = viewWeights[view];
    
    for (const [key, w] of Object.entries(weights)) {
      if (averages[key] !== null && averages[key] !== undefined) {
        const score = scoreMetric(averages[key], THRESHOLDS[key]);
        sumW += score * w;
        totalW += w;
      }
    }
    return totalW > 0 ? Math.round(sumW / totalW) : null;
  };

  const rearScore = calculateSubScore('rear');
  const sideScore = calculateSubScore('side');

  return {
    composite: avgComposite,
    grade: getGrade(avgComposite),
    rearScore,
    sideScore,
    consistency,
    swingsCount: allSwingScores.length,
    averages,
    bestSwing,
    allScores: allSwingScores,
  };
}

export { THRESHOLDS, WEIGHTS };
