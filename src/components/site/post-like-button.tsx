"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

export function PostLikeButton({ initialCount = 3 }: { initialCount?: number }) {
  const [liked, setLiked] = useState(false);

  return (
    <button
      className="post-support-like"
      type="button"
      aria-label={liked ? "取消点赞" : "点赞文章"}
      aria-pressed={liked}
      onClick={() => setLiked((current) => !current)}
    >
      <ThumbsUp aria-hidden="true" />
      <span>赞 {initialCount + (liked ? 1 : 0)}</span>
    </button>
  );
}
