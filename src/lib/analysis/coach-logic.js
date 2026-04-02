/**
 * Coach Logic — Expert Knowledge Engine
 * Maps CV metric data to human-readable coaching feedback, drills, and cues.
 */

const COACHING_RULES = {
  unitTurn: {
    metric: "unitTurn",
    label: "Unit Turn",
    description: "Shoulder-hip rotation during backswing",
    icon: "RotateCw",
    view: "rear",
    rules: [
      {
        condition: (val) => val !== null && val < 25,
        severity: "critical",
        title: "Insufficient Body Rotation",
        feedback:
          "You're hitting almost entirely with your arm. Rotate your shoulders and hips together as one unit — aim for ~45° of turn.",
        drill:
          "Mirror Drill: Stand facing a mirror. Practice turning your chest and paddle together without moving your feet. Your logo should face the sideline.",
        cue: "Turn your jersey logo toward the sideline fence.",
      },
      {
        condition: (val) => val !== null && val >= 25 && val < 40,
        severity: "warning",
        title: "Slightly Under-Rotated",
        feedback:
          "You have some rotation, but loading more will give you significantly more power from your core.",
        drill:
          "Coil & Hold: Pause at full turn for 2 seconds before each practice swing. Feel the coil in your core.",
        cue: "Load your core like a coiled spring.",
      },
      {
        condition: (val) => val !== null && val >= 40 && val <= 55,
        severity: "optimal",
        title: "Excellent Unit Turn",
        feedback:
          "Great rotation! You're properly loading your kinetic chain for maximum power transfer.",
        cue: "Keep it compact and explosive.",
      },
      {
        condition: (val) => val !== null && val > 55 && val <= 70,
        severity: "warning",
        title: "Slightly Over-Rotated",
        feedback:
          "You're turning a bit too far, which may slow your recovery for the next shot. Keep the turn compact.",
        drill:
          "Quick-fire Rally: Practice drives at 70% power focusing on instant recovery to ready position.",
        cue: "Compact turn, quick recovery.",
      },
      {
        condition: (val) => val !== null && val > 70,
        severity: "critical",
        title: "Excessive Rotation",
        feedback:
          "Way too much turn — this is closer to a tennis forehand. In pickleball, you need to recover instantly. Shorten your turn significantly.",
        drill:
          "Wall Drill: Stand 1 foot from a wall behind you. If your paddle hits the wall, your turn is too big.",
        cue: "Think 'punch', not 'swing'.",
      },
    ],
  },

  contactPoint: {
    metric: "contactPoint",
    label: "Contact Point",
    description: "Where you strike the ball relative to your body",
    icon: "Target",
    view: "side",
    rules: [
      {
        condition: (val) => val !== null && val <= 0,
        severity: "critical",
        title: "Late Contact — Behind Your Body",
        feedback:
          "You're making contact at or behind your body. This kills power and causes pop-ups. Step up and meet the ball out front.",
        drill:
          "Tee Drill: Place a ball on a cone 12–18 inches in front of your lead foot. Practice hitting only from this forward position.",
        cue: "Reach forward — paddle meets the ball, not the other way around.",
      },
      {
        condition: (val) => val !== null && val > 0 && val < 6,
        severity: "warning",
        title: "Contact Point Slightly Late",
        feedback:
          "You're making contact in front, but not far enough. Push your contact point forward to fully extend your lever arm.",
        drill:
          "Shadow Swings: Practice slow-motion forehand drives focusing on maximum forward extension at contact.",
        cue: "Imagine pushing the ball toward your target.",
      },
      {
        condition: (val) => val !== null && val >= 6 && val <= 18,
        severity: "optimal",
        title: "Perfect Contact Point",
        feedback:
          "Excellent! You're meeting the ball well out in front, maximizing your kinetic chain and paddle speed at impact.",
        cue: "This is your power zone — own it.",
      },
      {
        condition: (val) => val !== null && val > 18,
        severity: "warning",
        title: "Over-Extended Contact",
        feedback:
          "You're reaching too far forward, which can reduce control and strain your shoulder. Slight adjustment needed.",
        drill:
          "Footwork Focus: Instead of reaching, move your feet closer to the ball to maintain comfortable extension.",
        cue: "Move your feet, not just your arm.",
      },
    ],
  },

  backswing: {
    metric: "backswing",
    label: "Backswing",
    description: "How far your paddle goes behind your body",
    icon: "Undo2",
    view: "side",
    rules: [
      {
        condition: (val) => val !== null && val <= 15,
        severity: "optimal",
        title: "Compact Backswing",
        feedback:
          "Your backswing is short and efficient — perfect for pickleball. This allows quick exchanges at the kitchen line.",
        cue: "Short backswing, explosive forward.",
      },
      {
        condition: (val) => val !== null && val > 15 && val <= 30,
        severity: "warning",
        title: "Backswing Slightly Long",
        feedback:
          "Your paddle is going a bit too far back. This adds time to your swing and makes you late on fast exchanges.",
        drill:
          "Peripheral Vision Test: If you can't see your paddle in peripheral vision, it's too far back. Practice keeping it visible.",
        cue: "You should always be able to see your paddle.",
      },
      {
        condition: (val) => val !== null && val > 30,
        severity: "critical",
        title: "Excessive Backswing",
        feedback:
          "Your backswing is far too long — this is a tennis habit. In pickleball, you'll get burned by fast hands at the net.",
        drill:
          "Wall Behind Drill: Stand with your back 12 inches from a fence. Practice drives without hitting the fence with your paddle.",
        cue: "Think 'punch forward', not 'wind up'.",
      },
    ],
  },

  kneeBend: {
    metric: "kneeBend",
    label: "Knee Bend",
    description: "Athletic stance — knee flexion angle",
    icon: "Accessibility",
    view: "side",
    rules: [
      {
        condition: (val) => val !== null && val > 170,
        severity: "critical",
        title: "Locked Legs — No Athletic Base",
        feedback:
          "You're standing almost straight-legged. This robs you of balance, power, and the ability to move quickly.",
        drill:
          "Wall Sit Prep: Before drilling, do a 30-second wall sit. Then immediately practice drives with that same knee bend.",
        cue: "Stay low, stay loaded.",
      },
      {
        condition: (val) => val !== null && val > 160 && val <= 170,
        severity: "warning",
        title: "Needs More Knee Bend",
        feedback:
          "You're not loading your legs enough. A lower, more athletic stance generates power from the ground up.",
        drill:
          "Split-Step Practice: Before each shot, perform a small hop and land with bent knees.",
        cue: "Bend your knees like you're sitting back in a chair.",
      },
      {
        condition: (val) => val !== null && val >= 140 && val <= 160,
        severity: "optimal",
        title: "Great Athletic Stance",
        feedback:
          "Excellent knee bend! You're in a strong athletic position, allowing power generation from your legs.",
        cue: "Stay grounded and explosive.",
      },
      {
        condition: (val) => val !== null && val < 140,
        severity: "warning",
        title: "Excessive Knee Bend",
        feedback:
          "You're bending too low, which can slow lateral movement and strain your knees. Find a comfortable athletic position.",
        drill:
          "Comfort Zone: Find the knee bend where you can explode in any direction without feeling stuck.",
        cue: "Athletic, not squatting.",
      },
    ],
  },

  followThrough: {
    metric: "followThrough",
    label: "Follow-Through",
    description: "Paddle path after contact",
    icon: "ArrowRight",
    view: "rear",
    rules: [
      {
        condition: (val) => val && typeof val === "object" && !val.crossed,
        severity: "critical",
        title: "Incomplete Follow-Through",
        feedback:
          "You're cutting your swing short. The paddle should finish across your body, over the opposite shoulder for full energy transfer.",
        drill:
          "Catch Drill: After every hit, your non-paddle hand should 'catch' the paddle at the opposite shoulder.",
        cue: "Finish the swing — paddle touches opposite shoulder.",
      },
      {
        condition: (val) =>
          val && typeof val === "object" && val.crossed && val.distance < 3,
        severity: "warning",
        title: "Follow-Through Barely Crossing",
        feedback:
          "Your paddle is crossing the midline, but not by much. Extend your follow-through for more consistent power.",
        drill:
          "Exaggerated Finish: Practice finishing with the paddle pointing toward your target on the opposite side.",
        cue: "Point the paddle where you want the ball to go.",
      },
      {
        condition: (val) =>
          val && typeof val === "object" && val.crossed && val.distance >= 3,
        severity: "optimal",
        title: "Full Follow-Through",
        feedback:
          "Excellent extension through the ball. You're completing the kinetic chain with a full, fluid follow-through.",
        cue: "Smooth and complete — great form.",
      },
    ],
  },

  weightTransfer: {
    metric: "weightTransfer",
    label: "Weight Transfer",
    description: "Body momentum toward target",
    icon: "MoveRight",
    view: "side",
    rules: [
      {
        condition: (val) => val !== null && val <= 0,
        severity: "critical",
        title: "Falling Backward",
        feedback:
          "You're leaning or moving backward during the swing. This kills drive power. Your weight must move TOWARD the target.",
        drill:
          "Step-In Drill: Practice hitting every drive while stepping forward with your lead foot.",
        cue: "Drive through the ball, not away from it.",
      },
      {
        condition: (val) => val !== null && val > 0 && val < 3,
        severity: "warning",
        title: "Minimal Weight Transfer",
        feedback:
          "You're staying fairly static. Push off your back foot and transfer your weight through the ball for more power.",
        drill:
          "Back Foot Push: Focus on driving off your back foot as you initiate the swing.",
        cue: "Feel your back foot push you through the shot.",
      },
      {
        condition: (val) => val !== null && val >= 3,
        severity: "optimal",
        title: "Strong Weight Transfer",
        feedback:
          "You're driving your body weight through the shot — this is where real power comes from.",
        cue: "Momentum through the ball — well done.",
      },
    ],
  },

  swingPath: {
    metric: "swingPath",
    label: "Swing Path",
    description: "Low-to-high trajectory for topspin",
    icon: "TrendingUp",
    view: "side",
    rules: [
      {
        condition: (val) => val !== null && val < 5,
        severity: "critical",
        title: "Flat Swing — No Topspin",
        feedback:
          "Your swing is almost completely flat. A low-to-high path creates topspin, which keeps drives in the court.",
        drill:
          "Brush Up Drill: Imagine brushing up the back of the ball. Finish with your paddle above your head.",
        cue: "Low to high, like painting a fence upward.",
      },
      {
        condition: (val) => val !== null && val >= 5 && val < 15,
        severity: "warning",
        title: "Slightly Flat Swing Path",
        feedback:
          "You have some upward motion, but more low-to-high angle will add topspin for better ball control at pace.",
        drill:
          "Exaggerate: Practice slow swings where you deliberately exaggerate the low-to-high motion.",
        cue: "Start low, finish high.",
      },
      {
        condition: (val) => val !== null && val >= 15 && val <= 35,
        severity: "optimal",
        title: "Excellent Swing Path",
        feedback:
          "Your low-to-high swing path generates great topspin while maintaining drive power. Perfect balance.",
        cue: "Clean topspin — keep it up.",
      },
      {
        condition: (val) => val !== null && val > 35 && val <= 50,
        severity: "warning",
        title: "Steep Upward Path",
        feedback:
          "You're swinging too steeply upward. This creates excessive loft and may result in balls going long.",
        drill:
          "Target Practice: Aim for a target on the net. This flattens your trajectory while keeping topspin.",
        cue: "Drive through, not just up.",
      },
      {
        condition: (val) => val !== null && val > 50,
        severity: "critical",
        title: "Scooping — Excessive Upward Angle",
        feedback:
          "You're scooping the ball upward. This is a lob, not a drive. Flatten your path and drive through the contact zone.",
        drill:
          "Net-Height Target: Set a target just above net height and practice hitting flat drives to it.",
        cue: "Drive through the ball, not under it.",
      },
    ],
  },
};

/**
 * Generate coaching feedback for a set of metrics.
 * @param {Object} metrics - Extracted metrics from metrics.js
 * @returns {Array} Array of coaching card objects
 */
export function generateCoaching(metrics) {
  const cards = [];

  for (const [key, ruleSet] of Object.entries(COACHING_RULES)) {
    const value = metrics[key];

    // Find the matching rule
    const matchedRule = ruleSet.rules.find((rule) => rule.condition(value));

    if (matchedRule) {
      cards.push({
        metric: key,
        label: ruleSet.label,
        description: ruleSet.description,
        icon: ruleSet.icon,
        view: ruleSet.view,
        value: formatValue(value, key),
        rawValue: value,
        ...matchedRule,
      });
    } else if (value === null || value === undefined) {
      cards.push({
        metric: key,
        label: ruleSet.label,
        description: ruleSet.description,
        icon: ruleSet.icon,
        view: ruleSet.view,
        value: "—",
        rawValue: null,
        severity: "info",
        title: "Not Detected",
        feedback: `Could not measure ${ruleSet.label.toLowerCase()} from the ${ruleSet.view} camera. Ensure the full body is visible.`,
        cue: "Check camera angle and distance.",
      });
    }
  }

  return cards;
}

/**
 * Format a metric value for display.
 */
function formatValue(value, key) {
  if (value === null || value === undefined) return "—";

  if (key === "followThrough") {
    if (typeof value === "object") {
      return value.crossed ? "✓ Crossed" : "✗ Incomplete";
    }
    return value ? "✓" : "✗";
  }

  const units = {
    unitTurn: "°",
    contactPoint: " in",
    backswing: "°",
    kneeBend: "°",
    weightTransfer: " in",
    swingPath: "°",
  };

  return `${value}${units[key] || ""}`;
}

export { COACHING_RULES };
