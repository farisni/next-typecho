"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PauseIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  MusicIcon,
  PlayIcon,
  Repeat1Icon,
} from "lucide-react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import type { Song } from "@/hooks/use-music-player";

export default function MusicPlayerApple({
  song,
  compact = false,
}: {
  song: Song;
  compact?: boolean;
}) {
  const {
    isPlaying,
    duration,
    progressPercentage,
    formattedCurrentTime,
    formattedDuration,
    isShuffling,
    repeatMode,
    togglePlayPause,
    handleSliderChange,
    toggleShuffle,
    toggleRepeat,
  } = useMusicPlayer({ song });

  if (compact) {
    return (
      <div className="lite-apple-music-player lite-apple-music-player-compact">
        {song.album.image ? (
          <img
            src={song.album.image}
            alt=""
            className="size-7 shrink-0 rounded object-cover"
          />
        ) : (
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded bg-muted"
            aria-hidden="true"
          >
            <MusicIcon />
          </div>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-xs font-bold">{song.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {song.artists.join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" aria-label="上一首">
            <SkipBackIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="下一首">
            <SkipForwardIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lite-apple-music-player flex w-full flex-col gap-2.5 rounded-xl bg-popover p-4">
      <div className="flex min-w-0 items-center gap-4">
        {song.album.image ? (
          <img
            src={song.album.image}
            alt={`${song.name} by ${song.artists.join(", ")}`}
            className="size-14 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted"
            aria-hidden="true"
          >
            <MusicIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{song.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {song.artists.join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "mr-1.5 size-7 rounded-full",
              isShuffling
                ? "text-apple hover:text-apple"
                : "text-muted-foreground",
            )}
            aria-label={`Shuffle ${isShuffling ? "on" : "off"}`}
            onClick={toggleShuffle}
          >
            <ShuffleIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Previous track"
          >
            <SkipBackIcon className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="size-5 text-apple" />
            ) : (
              <PlayIcon className="size-5 text-apple" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Next track"
          >
            <SkipForwardIcon className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-1.5 size-7 rounded-full",
              repeatMode !== "off"
                ? "text-apple hover:text-apple"
                : "text-muted-foreground",
            )}
            aria-label={`Repeat: ${repeatMode}`}
            onClick={toggleRepeat}
          >
            {repeatMode === "track" ? (
              <Repeat1Icon className="size-3.5" />
            ) : (
              <RepeatIcon className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div className="relative flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formattedCurrentTime}
        </span>
        <Slider
          value={[progressPercentage]}
          max={100}
          step={1}
          aria-label="Music progress slider"
          onValueChange={handleSliderChange}
          disabled={duration === 0}
          style={{ "--primary": "var(--apple)" } as CSSProperties}
        />
        <span className="text-xs text-muted-foreground">
          {formattedDuration}
        </span>
      </div>
    </div>
  );
}
