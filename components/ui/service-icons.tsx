/**
 * Service Icons - Polymorphic icon system for media server services
 *
 * This module provides a type-safe, polymorphic approach to rendering service icons.
 * Icons are lazy-loaded based on the ServiceIconId, allowing the system to be
 * extended without modifying existing code.
 */

import type { ServiceIconId } from "@/lib/plugins/registry";
import { cn } from "@/lib/utils";

export interface ServiceIconProps {
	/** Icon identifier from the service metadata */
	iconId: ServiceIconId;
	/** Size in pixels (default: 16) */
	size?: number;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Icon component for Radarr (movie manager)
 */
function RadarrIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm0 448c-110.457 0-200-89.543-200-200S145.543 56 256 56s200 89.543 200 200-89.543 200-200 200z" />
			<circle cx="256" cy="256" r="120" />
		</svg>
	);
}

/**
 * Icon component for Sonarr (TV manager)
 */
function SonarrIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-448 0c0 110.5 89.5 200 200 200s200-89.5 200-200S366.5 56 256 56 56 145.5 56 256z" />
			<path
				d="M256 128v128l85.333 85.333"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="48"
			/>
		</svg>
	);
}

/**
 * Icon component for Jellyfin (media server)
 */
function JellyfinIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208-93.3 208-208 208z" />
			<path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm0 208c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
		</svg>
	);
}

/**
 * Icon component for Jellyseerr (request manager)
 */
function JellyseerrIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32zm104 256H264v96c0 4.4-3.6 8-8 8s-8-3.6-8-8V288H152c-4.4 0-8-3.6-8-8s3.6-8 8-8h96V176c0-4.4 3.6-8 8-8s8 3.6 8 8v96h96c4.4 0 8 3.6 8 8s-3.6 8-8 8z" />
		</svg>
	);
}

/**
 * Icon component for qBittorrent (torrent client)
 */
function QbittorrentIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z" />
			<path d="M352 256c0-53-43-96-96-96v192c53 0 96-43 96-96z" />
			<path
				d="M160 256c0 53 43 96 96 96V160c-53 0-96 43-96 96z"
				opacity="0.6"
			/>
		</svg>
	);
}

/**
 * Icon component for Plex (media server)
 */
function PlexIcon({ size = 16, className }: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 0L128 128v256l128 128 128-128V128L256 0zm0 96l80 80v160l-80 80-80-80V176l80-80z" />
		</svg>
	);
}

/**
 * Icon component for Emby (media server)
 */
function EmbyIcon({ size = 16, className }: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="currentColor"
			height={size}
			viewBox="0 0 512 512"
			width={size}
		>
			<path d="M256 16C123.5 16 16 123.5 16 256s107.5 240 240 240 240-107.5 240-240S388.5 16 256 16zm-64 352V144l160 112-160 112z" />
		</svg>
	);
}

/**
 * Generic fallback icon for unknown services
 */
function GenericIcon({
	size = 16,
	className,
}: Omit<ServiceIconProps, "iconId">) {
	return (
		<svg
			className={className}
			fill="none"
			height={size}
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width={size}
		>
			<path d="M12 2L2 7l10 5 10-5-10-5z" />
			<path d="M2 17l10 5 10-5" />
			<path d="M2 12l10 5 10-5" />
		</svg>
	);
}

/**
 * Icon component registry - maps icon IDs to their components
 */
const ICON_COMPONENTS: Record<
	ServiceIconId,
	(props: Omit<ServiceIconProps, "iconId">) => JSX.Element
> = {
	radarr: RadarrIcon,
	sonarr: SonarrIcon,
	jellyfin: JellyfinIcon,
	jellyseerr: JellyseerrIcon,
	qbittorrent: QbittorrentIcon,
	plex: PlexIcon,
	emby: EmbyIcon,
	prowlarr: GenericIcon,
	readarr: GenericIcon,
	lidarr: GenericIcon,
	whisparr: GenericIcon,
	bazarr: GenericIcon,
	generic: GenericIcon,
};

/**
 * Polymorphic service icon component.
 * Renders the appropriate icon based on the iconId from service metadata.
 *
 * @example
 * // Using with service metadata
 * <ServiceIcon iconId={service.iconId} size={24} />
 *
 * // Direct usage
 * <ServiceIcon iconId="radarr" className="text-yellow-500" />
 */
export function ServiceIcon({
	iconId,
	size = 16,
	className,
}: ServiceIconProps) {
	const IconComponent = ICON_COMPONENTS[iconId] ?? ICON_COMPONENTS.generic;
	return <IconComponent className={cn("shrink-0", className)} size={size} />;
}

/**
 * Get the icon component for a specific service.
 * Useful for custom rendering scenarios.
 */
export function getServiceIconComponent(
	iconId: ServiceIconId,
): (props: Omit<ServiceIconProps, "iconId">) => JSX.Element {
	return ICON_COMPONENTS[iconId] ?? ICON_COMPONENTS.generic;
}

/**
 * Check if a service has a dedicated icon
 */
export function hasServiceIcon(iconId: string): iconId is ServiceIconId {
	return iconId in ICON_COMPONENTS;
}
