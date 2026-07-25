"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function HeaderScrollProgress() {
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    damping: 40,
    stiffness: 300,
  });
  const [ready, setReady] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    const getProgress = () => {
      const scrollRange =
        document.documentElement.scrollHeight - window.innerHeight;
      return scrollRange > 0 ? window.scrollY / scrollRange : 0;
    };

    const updateProgress = () => rawProgress.set(getProgress());

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    if (!initialised.current) {
      initialised.current = true;
      const progress = getProgress();
      rawProgress.jump(progress);
      smoothProgress.jump(progress);
      window.requestAnimationFrame(() => setReady(true));
    }

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [rawProgress, smoothProgress]);

  return (
    <div className="handsome-header-progress" aria-hidden="true">
      <motion.div
        className="handsome-header-progress-bar"
        style={{ scaleX: smoothProgress, transformOrigin: "left" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.15, ease: "linear" }}
      />
    </div>
  );
}
