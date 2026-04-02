"""
PBDriveKing — YOLOv11-pose Backend Server
FastAPI server that processes video files using YOLOv11-pose and returns
pose landmarks via Server-Sent Events (SSE) for real-time progress updates.

Usage:
    pip install -r requirements.txt
    python server.py
"""

import io
import json
import tempfile
import os
import time
import base64
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from yolo_pose import detect_pose

app = FastAPI(
    title="PBDriveKing YOLOv11 Backend",
    version="1.0.0",
)

# Allow CORS from Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "engine": "YOLOv11-pose"}


@app.post("/api/detect-pose")
async def detect_pose_endpoint(request: Request):
    """
    Detect pose on a single base64-encoded image.

    Request body: { "image": "base64_string" }
    Response: { "landmarks": [...] }
    """
    data = await request.json()
    image_b64 = data.get("image", "")

    if not image_b64:
        return JSONResponse({"error": "No image provided"}, status_code=400)

    # Decode base64 to numpy array
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]  # Remove data:image/... prefix

    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if frame is None:
        return JSONResponse({"error": "Invalid image"}, status_code=400)

    landmarks = detect_pose(frame)

    return {
        "landmarks": landmarks,
        "detected": landmarks is not None,
    }


@app.post("/api/analyze-video")
async def analyze_video(video: UploadFile = File(...), rotation: int = 0):
    """
    Analyze an entire video file using YOLOv11-pose.
    Returns results via Server-Sent Events (SSE) for real-time progress.

    SSE event types:
        - progress: { frame, total_frames, progress }
        - frame: { frame, landmarks, timestamp }
        - complete: { total_frames, fps }
        - error: { message }
    """

    # Save uploaded video to temp file
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, video.filename or "video.mp4")

    try:
        with open(temp_path, "wb") as f:
            content = await video.read()
            f.write(content)

        async def event_stream():
            cap = cv2.VideoCapture(temp_path)

            # Enable auto-orientation so OpenCV rotates portrait-mode videos shot on phones
            cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)

            if not cap.isOpened():
                yield f"data: {json.dumps({'type': 'error', 'message': 'Cannot open video file'})}\n\n"
                return

            # Read one frame to double check orientation if AUTO failed
            ret, first_frame = cap.read()
            if ret:
                h_orig, w_orig = first_frame.shape[:2]
                # If width is much larger than height, but video is likely intended to be portrait
                # Or if the user explicitly says it's vertical, we can force rotation
                # For now, we trust ORIENTATION_AUTO but log the dimensions
                print(f"[Backend] First frame dimensions: {w_orig}x{h_orig}")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Reset to start

            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_skip = 3  # Analyze every 3rd frame for speed

            # Log orientation info for debugging
            w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            print(f"[Backend] Processing video: {video.filename} ({int(w)}x{int(h)}, {int(total_frames)} frames)")

            frames_to_process = total_frames // frame_skip
            frame_idx = 0
            processed = 0

            # Send initial progress so the UI knows the total frame count immediately
            yield f"data: {json.dumps({'type': 'progress', 'frame': 0, 'total_frames': max(frames_to_process, 1), 'progress': 0})}\n\n"

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_idx += 1

                # Skip frames for performance
                if frame_idx % frame_skip != 0:
                    continue

                processed += 1
                
                # Apply manual rotation if requested
                if rotation == 90:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                elif rotation == 180:
                    frame = cv2.rotate(frame, cv2.ROTATE_180)
                elif rotation == 270:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)

                # Run detection
                landmarks = detect_pose(frame)
                timestamp = frame_idx / fps

                if landmarks is not None:
                    # Update status for logging
                    if processed % 10 == 0:
                        print(f"  [Frame {processed}] Pose detected with high confidence.")
                else:
                    if processed % 10 == 0:
                        print(f"  [Frame {processed}] No pose detected in this frame.")

                # Send progress
                progress_pct = (processed / max(frames_to_process, 1)) * 100
                yield f"data: {json.dumps({'type': 'progress', 'frame': processed, 'total_frames': frames_to_process, 'progress': round(progress_pct, 1)})}\n\n"

                # Send frame result
                if landmarks is not None:
                    yield f"data: {json.dumps({'type': 'frame', 'frame': processed, 'landmarks': landmarks, 'timestamp': round(timestamp, 3)})}\n\n"

            cap.release()

            # Send completion
            yield f"data: {json.dumps({'type': 'complete', 'total_frames': processed, 'fps': fps})}\n\n"

            # Cleanup temp file
            try:
                os.unlink(temp_path)
                os.rmdir(temp_dir)
            except Exception:
                pass

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        # Cleanup on error
        try:
            os.unlink(temp_path)
            os.rmdir(temp_dir)
        except Exception:
            pass

        return JSONResponse(
            {"error": str(e)},
            status_code=500,
        )


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    print("╔══════════════════════════════════════════╗")
    print("║   PBDriveKing YOLOv11 Backend Server     ║")
    print(f"║   Host: 0.0.0.0 | Port: {port}             ║")
    print("╚══════════════════════════════════════════╝")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
