"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";

/**
 * Sillage motion language.
 *
 * One easing, one vocabulary: content "condenses" into view, rising a
 * little, sharpening from blur, the way scent settles on glass.
 * Every primitive renders instantly under prefers-reduced-motion.
 */

export const EASE_SILLAGE = [0.16, 1, 0.3, 1] as const;

/**
 * True when entrance animations should be skipped entirely: the user prefers
 * reduced motion, or the document is hidden (background tab, prerender,
 * headless capture) where animation frames never run and content would
 * otherwise stay invisible.
 */
function useClientReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReduced(query.matches);
    syncReducedMotion();
    query.addEventListener("change", syncReducedMotion);
    return () => query.removeEventListener("change", syncReducedMotion);
  }, []);
  return reduced;
}

function useClientCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const syncPointer = () => setCoarse(query.matches);
    syncPointer();
    query.addEventListener("change", syncPointer);
    return () => query.removeEventListener("change", syncPointer);
  }, []);
  return coarse;
}

function useStaticRender() {
  const mediaReduced = useClientReducedMotion();
  const coarsePointer = useClientCoarsePointer();
  const [hiddenAtMount, setHiddenAtMount] = React.useState(false);

  React.useEffect(() => {
    if (document.visibilityState === "hidden") {
      setHiddenAtMount(true);
    }
  }, []);

  return mediaReduced || coarsePointer || hiddenAtMount;
}

/** Plain block wrapper used when animations are skipped, remounts cleanly. */
function StaticDiv({
  children,
  className,
  style,
  role,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
}) {
  return (
    <div className={className} style={style} role={role}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal: blur→sharp rise when scrolled into view                    */
/* ------------------------------------------------------------------ */

interface RevealProps
  extends React.ComponentPropsWithoutRef<typeof motion.div> {
  /** Delay in seconds. */
  delay?: number;
  /** Rise distance in px. */
  distance?: number;
  /** Render once (default) or every time it enters the viewport. */
  once?: boolean;
}

export function Reveal({
  delay = 0,
  distance = 24,
  once = true,
  children,
  ...rest
}: RevealProps) {
  const isStatic = useStaticRender();

  if (isStatic) {
    return (
      <StaticDiv
        className={rest.className}
        style={rest.style as React.CSSProperties}
      >
        {children as React.ReactNode}
      </StaticDiv>
    );
  }

  return (
    <motion.div
      data-sillage-motion="reveal"
      initial={{ opacity: 0, y: distance, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_SILLAGE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Stagger: orchestrated group entrance                               */
/* ------------------------------------------------------------------ */

const staggerParent = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: { staggerChildren: stagger },
  }),
};

const staggerChild = {
  hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_SILLAGE },
  },
};

interface StaggerProps
  extends React.ComponentPropsWithoutRef<typeof motion.div> {
  /** Gap between children entrances, seconds. */
  interval?: number;
  once?: boolean;
}

export function Stagger({
  interval = 0.07,
  once = true,
  children,
  ...rest
}: StaggerProps) {
  const isStatic = useStaticRender();

  if (isStatic) {
    return (
      <StaticDiv
        className={rest.className}
        style={rest.style as React.CSSProperties}
        role={rest.role}
      >
        {children as React.ReactNode}
      </StaticDiv>
    );
  }

  return (
    <motion.div
      data-sillage-motion="stagger"
      variants={staggerParent}
      custom={interval}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const isStatic = useStaticRender();
  if (isStatic) {
    return (
      <StaticDiv
        className={rest.className}
        style={rest.style as React.CSSProperties}
        role={rest.role}
      >
        {children as React.ReactNode}
      </StaticDiv>
    );
  }
  return (
    <motion.div
      data-sillage-motion="stagger-item"
      variants={staggerChild}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Parallax: gentle scroll-linked drift                               */
/* ------------------------------------------------------------------ */

interface ParallaxProps
  extends React.ComponentPropsWithoutRef<typeof motion.div> {
  /** Total drift in px across the element's scroll journey. */
  amount?: number;
}

export function Parallax({
  amount = 60,
  children,
  style,
  ...rest
}: ParallaxProps) {
  const reduced = useClientReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount / 2, -amount / 2]);

  return (
    <motion.div
      ref={ref}
      style={reduced ? style : ({ ...style, y } as MotionStyle)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* TiltStage: 3D perspective tilt following the pointer (desktop)     */
/* ------------------------------------------------------------------ */

interface TiltStageProps
  extends React.ComponentPropsWithoutRef<typeof motion.div> {
  /** Max tilt in degrees. */
  maxTilt?: number;
}

export function TiltStage({
  maxTilt = 7,
  children,
  style,
  ...rest
}: TiltStageProps) {
  const reduced = useClientReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  const rawX = React.useRef(0);
  const rawY = React.useRef(0);
  const springX = useSpring(0, { stiffness: 120, damping: 18 });
  const springY = useSpring(0, { stiffness: 120, damping: 18 });

  React.useEffect(() => {
    // Only enable on devices with a precise pointer (mouse/trackpad).
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.current = ((e.clientY - rect.top) / rect.height - 0.5) * -2 * maxTilt;
    rawY.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * maxTilt;
    springX.set(rawX.current);
    springY.set(rawY.current);
  };

  const handleLeave = () => {
    springX.set(0);
    springY.set(0);
  };

  if (reduced || !enabled) {
    return (
      <motion.div ref={ref} style={style} {...rest}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={
        {
          ...style,
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        } as MotionStyle
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion };
