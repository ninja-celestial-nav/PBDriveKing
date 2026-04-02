"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for synchronizing two video elements.
 */
export function useDualVideoSync() {
  const rearVideoRef = useRef(null);
  const sideVideoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0); // Offset in seconds for side video
  const [playbackRate, setPlaybackRate] = useState(1);
  const [rearReady, setRearReady] = useState(false);
  const [sideReady, setSideReady] = useState(false);

  const animFrameRef = useRef(null);

  // Update duration when videos load
  const handleRearLoaded = useCallback(() => {
    setRearReady(true);
    if (rearVideoRef.current) {
      setDuration((prev) => Math.max(prev, rearVideoRef.current.duration));
    }
  }, []);

  const handleSideLoaded = useCallback(() => {
    setSideReady(true);
    if (sideVideoRef.current) {
      setDuration((prev) => Math.max(prev, sideVideoRef.current.duration));
    }
  }, []);

  // Sync loop during playback
  const syncLoop = useCallback(() => {
    if (rearVideoRef.current && !rearVideoRef.current.paused) {
      const time = rearVideoRef.current.currentTime;
      setCurrentTime(time);

      // Sync side video to rear + offset
      if (sideVideoRef.current) {
        const sideTarget = time + syncOffset;
        if (
          Math.abs(sideVideoRef.current.currentTime - sideTarget) > 0.05
        ) {
          sideVideoRef.current.currentTime = Math.max(0, sideTarget);
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(syncLoop);
  }, [syncOffset]);

  // Play both videos
  const play = useCallback(() => {
    if (rearVideoRef.current) {
      rearVideoRef.current.play();
    }
    if (sideVideoRef.current) {
      sideVideoRef.current.currentTime =
        (rearVideoRef.current?.currentTime || 0) + syncOffset;
      sideVideoRef.current.play();
    }
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(syncLoop);
  }, [syncOffset, syncLoop]);

  // Pause both
  const pause = useCallback(() => {
    if (rearVideoRef.current) rearVideoRef.current.pause();
    if (sideVideoRef.current) sideVideoRef.current.pause();
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Seek to specific time
  const seekTo = useCallback(
    (time) => {
      const clampedTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(clampedTime);
      if (rearVideoRef.current) {
        rearVideoRef.current.currentTime = clampedTime;
      }
      if (sideVideoRef.current) {
        sideVideoRef.current.currentTime = Math.max(
          0,
          clampedTime + syncOffset
        );
      }
    },
    [duration, syncOffset]
  );

  // Step forward/backward by one frame (~1/30s)
  const stepForward = useCallback(() => {
    pause();
    seekTo(currentTime + 1 / 30);
  }, [pause, seekTo, currentTime]);

  const stepBackward = useCallback(() => {
    pause();
    seekTo(currentTime - 1 / 30);
  }, [pause, seekTo, currentTime]);

  // Set playback rate on both videos
  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    if (rearVideoRef.current) rearVideoRef.current.playbackRate = rate;
    if (sideVideoRef.current) sideVideoRef.current.playbackRate = rate;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    rearVideoRef,
    sideVideoRef,
    isPlaying,
    currentTime,
    duration,
    syncOffset,
    playbackRate,
    rearReady,
    sideReady,
    setSyncOffset,
    handleRearLoaded,
    handleSideLoaded,
    play,
    pause,
    togglePlay,
    seekTo,
    stepForward,
    stepBackward,
    changePlaybackRate,
  };
}
