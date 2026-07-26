"use client";

import * as React from "react";

export interface Song {
  name: string;
  artists: Array<string>;
  album: { name: string; image: string };
  src?: string;
  duration: number; // Duration in seconds
}

// Helper function to format time from seconds to MM:SS
export const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export type RepeatMode = "off" | "track" | "context";

export interface UseMusicPlayerProps {
  song: Song | null;
}

export interface UseMusicPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progressPercentage: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  togglePlayPause: () => void;
  handleSliderChange: (value: number | readonly number[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}

export function useMusicPlayer({
  song,
}: UseMusicPlayerProps): UseMusicPlayerReturn {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(song?.duration ?? 0);
  const [isShuffling, setIsShuffling] = React.useState(false);
  const [repeatMode, setRepeatMode] = React.useState<RepeatMode>("off");

  React.useEffect(() => {
    setCurrentTime(0);
    setDuration(song?.duration ?? 0);
    setIsPlaying(false);

    if (!song?.src) return;

    const audio = new Audio(song.src);
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setCurrentTime(audio.duration);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [song?.duration, song?.src]);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === "track";
    }
  }, [repeatMode]);

  const togglePlayPause = React.useCallback(() => {
    const audio = audioRef.current;
    if (!song || !audio) return;

    if (audio.paused) {
      if (currentTime >= duration && duration > 0) {
        audio.currentTime = 0;
      }
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTime, duration, song]);

  const handleSliderChangeExternal = (value: number | readonly number[]) => {
    const audio = audioRef.current;
    if (!song || !audio) return;
    const v = typeof value === "number" ? value : value[0];
    const newTime = Math.floor((v / 100) * duration);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercentage =
    duration > 0 ? (currentTime / duration) * 100 : 0;

  const toggleShuffle = React.useCallback(() => {
    setIsShuffling((prev) => !prev);
  }, []);

  const toggleRepeat = React.useCallback(() => {
    setRepeatMode((prevMode) => {
      if (prevMode === "off") return "context";
      if (prevMode === "context") return "track";
      return "off";
    });
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    progressPercentage,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    isShuffling,
    repeatMode,
    togglePlayPause,
    handleSliderChange: handleSliderChangeExternal,
    toggleShuffle,
    toggleRepeat,
    setIsPlaying, // Exposing these if direct manipulation is needed
    setCurrentTime, // Exposing these if direct manipulation is needed
  };
}
