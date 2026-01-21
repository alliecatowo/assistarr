"use client";

import { motion } from "framer-motion";

// Organic blob paths - outer layer
const OUTER_BLOBS = [
  "M20,4 C28,5 34,12 35,21 C36,30 30,37 21,38 C12,39 5,33 4,24 C3,15 8,6 17,4 C18,3.8 19,3.9 20,4 Z",
  "M22,5 C30,8 35,16 34,25 C33,34 26,39 17,37 C8,35 3,27 5,18 C7,9 14,3 22,5 Z",
  "M19,3 C28,4 36,11 37,21 C38,31 31,38 21,39 C11,40 4,32 3,22 C2,12 9,4 19,3 Z",
  "M23,6 C31,10 34,19 31,28 C28,37 19,40 11,36 C3,32 1,22 6,14 C11,6 18,3 23,6 Z",
];

// Inner core paths - more circular, subtle morph
const INNER_BLOBS = [
  "M20,12 C24,12 28,16 28,20 C28,24 24,28 20,28 C16,28 12,24 12,20 C12,16 16,12 20,12 Z",
  "M21,13 C25,14 27,17 27,21 C27,25 24,27 20,27 C16,27 13,24 13,20 C13,16 16,13 21,13 Z",
  "M19,12 C23,12 28,15 28,20 C28,25 24,28 19,28 C14,28 12,24 12,19 C12,14 15,12 19,12 Z",
  "M20,13 C24,13 27,16 27,20 C27,24 24,27 20,27 C16,27 13,24 13,20 C13,16 16,13 20,13 Z",
];

// Tiny particle positions for energy wisps
const PARTICLES = [
  { cx: 8, cy: 12, delay: 0 },
  { cx: 32, cy: 15, delay: 0.5 },
  { cx: 12, cy: 30, delay: 1 },
  { cx: 28, cy: 32, delay: 1.5 },
  { cx: 6, cy: 22, delay: 2 },
  { cx: 34, cy: 24, delay: 2.5 },
];

interface PlasmaOrbProps {
  size?: number;
  className?: string;
}

export function PlasmaOrb({ size = 40, className = "" }: PlasmaOrbProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 60,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="absolute inset-0"
        style={{ filter: "url(#plasma-glow)" }}
        animate={{
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <defs>
          {/* Multi-stop radial gradient for depth */}
          <radialGradient id="plasma-radial" cx="35%" cy="35%" r="65%">
            <motion.stop
              offset="0%"
              animate={{
                stopColor: [
                  "rgba(255, 255, 255, 0.95)",
                  "rgba(200, 240, 255, 0.95)",
                  "rgba(255, 220, 255, 0.95)",
                  "rgba(255, 255, 255, 0.95)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.stop
              offset="30%"
              animate={{
                stopColor: [
                  "rgba(120, 200, 255, 0.9)",
                  "rgba(180, 130, 255, 0.9)",
                  "rgba(100, 220, 255, 0.9)",
                  "rgba(120, 200, 255, 0.9)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.stop
              offset="70%"
              animate={{
                stopColor: [
                  "rgba(80, 120, 255, 0.85)",
                  "rgba(160, 80, 255, 0.85)",
                  "rgba(80, 180, 255, 0.85)",
                  "rgba(80, 120, 255, 0.85)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.stop
              offset="100%"
              animate={{
                stopColor: [
                  "rgba(40, 60, 180, 0.6)",
                  "rgba(120, 40, 180, 0.6)",
                  "rgba(40, 100, 180, 0.6)",
                  "rgba(40, 60, 180, 0.6)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </radialGradient>

          {/* Iridescent sweep gradient */}
          <linearGradient id="plasma-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              animate={{
                stopColor: [
                  "rgba(255, 100, 200, 0.4)",
                  "rgba(100, 200, 255, 0.4)",
                  "rgba(200, 255, 100, 0.4)",
                  "rgba(255, 100, 200, 0.4)",
                ],
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.stop
              offset="100%"
              animate={{
                stopColor: [
                  "rgba(100, 200, 255, 0.3)",
                  "rgba(200, 255, 100, 0.3)",
                  "rgba(255, 100, 200, 0.3)",
                  "rgba(100, 200, 255, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </linearGradient>

          {/* Inner core glow */}
          <radialGradient id="plasma-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
            <stop offset="40%" stopColor="rgba(200, 230, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(100, 180, 255, 0)" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="plasma-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft blur for particles */}
          <filter id="particle-blur">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {/* Outer aura layer - largest, most transparent */}
        <motion.path
          fill="url(#plasma-radial)"
          opacity={0.6}
          animate={{
            d: [OUTER_BLOBS[0], OUTER_BLOBS[1], OUTER_BLOBS[2], OUTER_BLOBS[3], OUTER_BLOBS[0]],
            scale: [1, 1.08, 1.02, 1.06, 1],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center" }}
        />

        {/* Mid layer with iridescent sweep */}
        <motion.path
          fill="url(#plasma-sweep)"
          opacity={0.7}
          animate={{
            d: [OUTER_BLOBS[2], OUTER_BLOBS[3], OUTER_BLOBS[0], OUTER_BLOBS[1], OUTER_BLOBS[2]],
            rotate: [0, -10, 5, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center" }}
        />

        {/* Inner bright core */}
        <motion.path
          fill="url(#plasma-core)"
          animate={{
            d: [INNER_BLOBS[0], INNER_BLOBS[1], INNER_BLOBS[2], INNER_BLOBS[3], INNER_BLOBS[0]],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center" }}
        />

        {/* Bright center hotspot */}
        <motion.circle
          cx="20"
          cy="20"
          fill="white"
          animate={{
            r: [4, 6, 4],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Energy particles orbiting */}
        {PARTICLES.map((particle, i) => (
          <motion.circle
            key={i}
            r="1.2"
            fill="white"
            filter="url(#particle-blur)"
            animate={{
              cx: [particle.cx, particle.cx + 4, particle.cx - 2, particle.cx],
              cy: [particle.cy, particle.cy - 3, particle.cy + 4, particle.cy],
              opacity: [0.3, 0.9, 0.5, 0.3],
              scale: [0.8, 1.3, 1, 0.8],
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.svg>

      {/* Outer glow ring - separate for better layering */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(100,180,255,0.3) 0%, rgba(150,100,255,0.1) 50%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
