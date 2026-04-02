/**
 * MediaPipe Pose Landmarker Engine
 * Singleton manager for initializing and running pose detection in the browser.
 */

let poseLandmarker = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize or return the existing PoseLandmarker instance.
 */
export async function initPoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;
  if (initPromise) return initPromise;

  isInitializing = true;

  initPromise = (async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { PoseLandmarker, FilesetResolver } = vision;

      const wasmFiles = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log("[PoseEngine] PoseLandmarker initialized successfully");
      isInitializing = false;
      return poseLandmarker;
    } catch (err) {
      console.error("[PoseEngine] Failed to initialize:", err);
      // Fallback to CPU
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { PoseLandmarker, FilesetResolver } = vision;

        const wasmFiles = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        console.log("[PoseEngine] PoseLandmarker initialized (CPU fallback)");
        isInitializing = false;
        return poseLandmarker;
      } catch (fallbackErr) {
        isInitializing = false;
        initPromise = null;
        throw fallbackErr;
      }
    }
  })();

  return initPromise;
}

/**
 * Run pose detection on a video element at the given timestamp.
 * @param {HTMLVideoElement} videoElement
 * @param {number} timestampMs - Current video time in milliseconds
 * @returns {import("@mediapipe/tasks-vision").PoseLandmarkerResult | null}
 */
export async function detectPose(videoElement, timestampMs) {
  const landmarker = await initPoseLandmarker();
  if (!landmarker || !videoElement || videoElement.readyState < 2) return null;

  try {
    const result = landmarker.detectForVideo(videoElement, timestampMs);
    return result;
  } catch (err) {
    console.warn("[PoseEngine] Detection error:", err);
    return null;
  }
}

/**
 * Check if the engine is ready.
 */
export function isEngineReady() {
  return poseLandmarker !== null;
}

/**
 * Check if the engine is currently initializing.
 */
export function isEngineInitializing() {
  return isInitializing;
}

/**
 * Destroy the PoseLandmarker instance and free resources.
 */
export function destroyEngine() {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
    initPromise = null;
  }
}
