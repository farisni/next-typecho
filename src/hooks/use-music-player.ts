"use client";

import * as React from "react";

export interface Song {
  name: string;
  artists: Array<string>;
  album: { name: string; image: string };
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
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isShuffling, setIsShuffling] = React.useState(false);
  const [repeatMode, setRepeatMode] = React.useState<RepeatMode>("off");

  const songDuration = song?.duration ?? 0;

  React.useEffect(() => {
    if (!isPlaying || songDuration === 0) return;

    const interval = window.setInterval(() => {
      setCurrentTime((previousTime) => {
        if (previousTime < songDuration - 1) {
          return previousTime + 1;
        }

        if (repeatMode === "track") {
          return 0;
        }

        setIsPlaying(false);
        return songDuration;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlaying, repeatMode, songDuration]);

  React.useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [song]);

  const togglePlayPause = React.useCallback(() => {
    if (!song) return;

    if (currentTime >= songDuration && songDuration > 0) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((previous) => !previous);
    }
  }, [currentTime, song, songDuration]);

  const handleSliderChangeExternal = (value: number | readonly number[]) => {
    if (!song) return;
    const v = typeof value === "number" ? value : value[0];
    const newTime = Math.floor((v / 100) * songDuration);
    setCurrentTime(newTime);
  };

  const progressPercentage =
    songDuration > 0 ? (currentTime / songDuration) * 100 : 0;

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
    duration: songDuration,
    progressPercentage,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(songDuration),
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
