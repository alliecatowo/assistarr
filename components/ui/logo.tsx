"use client";

import { SparklesIcon } from "lucide-react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 32, className = "", showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.svg"
          alt="Assistarr"
          width={size}
          height={size}
          priority
        />
      </div>
      {showText && (
        <span className="font-semibold text-lg">Assistarr</span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/logo.svg"
        alt="Assistarr"
        width={size}
        height={size}
        priority
      />
    </div>
  );
}
