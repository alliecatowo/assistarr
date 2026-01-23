"use client";

import Image, { type ImageProps } from "next/image";

// Known safe domains that are configured in next.config.js and can be optimized
const CONFIGURED_DOMAINS = [
  "image.tmdb.org",
  "artworks.thetvdb.com",
];

function isConfiguredDomain(src: string): boolean {
  try {
    const url = new URL(src);
    return CONFIGURED_DOMAINS.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

interface ExternalImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallback?: React.ReactNode;
}

/**
 * Smart image component that handles both configured (TMDB, TVDB) and
 * dynamic external hostnames (user's Jellyfin, Plex servers).
 *
 * For configured domains: Uses Next.js Image optimization
 * For external domains: Uses native <img> to avoid hostname validation errors
 */
export function ExternalImage({
  src,
  fallback,
  fill,
  width,
  height,
  sizes,
  className,
  alt,
  priority,
  ...props
}: ExternalImageProps) {
  // If no src, show fallback or nothing
  if (!src) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  // Check if this is a configured domain that Next.js can optimize
  const isConfigured = !src.startsWith('http') || isConfiguredDomain(src);

  // For configured domains, use Next.js Image for optimization
  if (isConfigured) {
    return (
      <Image
        {...props}
        alt={alt}
        className={className}
        fill={fill}
        height={height}
        priority={priority}
        sizes={sizes}
        src={src}
        width={width}
      />
    );
  }

  // For external domains (Jellyfin, Plex, etc.), use native img to avoid hostname errors
  // This bypasses Next.js image optimization but ensures images load correctly
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      src={src}
      style={fill ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        inset: 0,
        objectFit: 'cover',
      } : undefined}
      {...((!fill && width) ? { width: typeof width === 'number' ? width : undefined } : {})}
      {...((!fill && height) ? { height: typeof height === 'number' ? height : undefined } : {})}
    />
  );
}
