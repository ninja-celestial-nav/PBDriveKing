"""
YOLOv11-pose Detection Wrapper
Provides a consistent interface for pose detection using Ultralytics YOLOv11.
"""

import numpy as np

# Lazy load to avoid import errors if ultralytics not installed
_model = None


def get_model():
    """Load YOLOv11-pose model (lazy singleton)."""
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO("yolo11n-pose.pt")  # Nano model for speed
        print("[YOLOv11] Model loaded: yolo11n-pose.pt")
    return _model


# YOLOv11-pose keypoint indices → MediaPipe landmark mapping
# YOLOv11 has 17 keypoints, MediaPipe has 33
# We map what we can and interpolate the rest
YOLO_TO_MEDIAPIPE = {
    0: 0,    # Nose
    1: 2,    # Left Eye
    2: 5,    # Right Eye
    3: 7,    # Left Ear
    4: 8,    # Right Ear
    5: 11,   # Left Shoulder
    6: 12,   # Right Shoulder
    7: 13,   # Left Elbow
    8: 14,   # Right Elbow
    9: 15,   # Left Wrist
    10: 16,  # Right Wrist
    11: 23,  # Left Hip
    12: 24,  # Right Hip
    13: 25,  # Left Knee
    14: 26,  # Right Knee
    15: 27,  # Left Ankle
    16: 28,  # Right Ankle
}


def detect_pose(frame):
    """
    Run pose detection on a single frame.

    Args:
        frame: numpy array (BGR image)

    Returns:
        List of 33 landmarks in MediaPipe format [{x, y, z, visibility}, ...]
        or None if no pose detected.
    """
    model = get_model()
    results = model(frame, verbose=False)

    if not results or len(results) == 0:
        return None

    result = results[0]

    if result.keypoints is None or len(result.keypoints) == 0:
        return None

    # Get keypoints for the first detected person
    kps = result.keypoints[0]

    if kps.xy is None or kps.xy.shape[1] == 0:
        return None

    xy = kps.xy[0].cpu().numpy()  # Shape: (17, 2)
    conf = kps.conf[0].cpu().numpy() if kps.conf is not None else np.ones(17)

    h, w = frame.shape[:2]

    # Create 33-landmark array (MediaPipe format)
    landmarks = []
    for i in range(33):
        landmarks.append({
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "visibility": 0.0,
        })

    # Map YOLOv11 keypoints to MediaPipe slots
    for yolo_idx, mp_idx in YOLO_TO_MEDIAPIPE.items():
        if yolo_idx < len(xy):
            x_norm = float(xy[yolo_idx][0]) / w
            y_norm = float(xy[yolo_idx][1]) / h
            vis = float(conf[yolo_idx]) if yolo_idx < len(conf) else 0.0

            landmarks[mp_idx] = {
                "x": x_norm,
                "y": y_norm,
                "z": 0.0,
                "visibility": vis,
            }

    # Interpolate missing landmarks from neighbors
    # Heels (29, 30) ≈ Ankles (27, 28) shifted slightly
    for ankle_idx, heel_idx in [(27, 29), (28, 30)]:
        if landmarks[ankle_idx]["visibility"] > 0:
            landmarks[heel_idx] = {
                "x": landmarks[ankle_idx]["x"],
                "y": min(1.0, landmarks[ankle_idx]["y"] + 0.02),
                "z": 0.0,
                "visibility": landmarks[ankle_idx]["visibility"] * 0.7,
            }

    # Foot index (31, 32) ≈ Ankles shifted forward
    for ankle_idx, foot_idx in [(27, 31), (28, 32)]:
        if landmarks[ankle_idx]["visibility"] > 0:
            landmarks[foot_idx] = {
                "x": landmarks[ankle_idx]["x"] + 0.02,
                "y": landmarks[ankle_idx]["y"] + 0.01,
                "z": 0.0,
                "visibility": landmarks[ankle_idx]["visibility"] * 0.5,
            }

    # Hip midpoint for computing center
    if landmarks[23]["visibility"] > 0 and landmarks[24]["visibility"] > 0:
        mid_x = (landmarks[23]["x"] + landmarks[24]["x"]) / 2
        mid_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2
        # Could set this as a reference point if needed

    return landmarks
