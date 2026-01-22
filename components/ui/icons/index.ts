/**
 * Icon components organized by category
 *
 * This barrel export re-exports all icons from their category files.
 * Import icons directly from this module:
 *
 * ```ts
 * import { BotIcon, UserIcon, HomeIcon } from '@/components/ui/icons'
 * ```
 */

// Brand and logo icons
export {
	VercelIcon,
	GitIcon,
	LogoOpenAI,
	LogoGoogle,
	LogoAnthropic,
	PythonIcon,
} from "./brand";

// Navigation and UI layout icons
export {
	HomeIcon,
	MenuIcon,
	SidebarLeftIcon,
	ChevronDownIcon,
	ArrowUpIcon,
	RouteIcon,
	GPSIcon,
	FullscreenIcon,
} from "./navigation";

// Action icons
export {
	CopyIcon,
	TrashIcon,
	UploadIcon,
	DownloadIcon,
	PencilEditIcon,
	UndoIcon,
	RedoIcon,
	ShareIcon,
	PlayIcon,
	StopIcon,
	CrossIcon,
	CrossSmallIcon,
	PlusIcon,
	SettingsIcon,
} from "./action";

// Status and feedback icons
export {
	CheckCircleFillIcon,
	CheckedSquare,
	UncheckedSquare,
	LoaderIcon,
	InfoIcon,
	WarningIcon,
	SparklesIcon,
	ThumbUpIcon,
	ThumbDownIcon,
} from "./status";

// Content and media icons
export {
	FileIcon,
	AttachmentIcon,
	PaperclipIcon,
	ImageIcon,
	CodeIcon,
	MessageIcon,
	TerminalIcon,
	TerminalWindowIcon,
	LineChartIcon,
	LogsIcon,
	InvoiceIcon,
	SummarizeIcon,
} from "./media";

// Miscellaneous icons
export {
	BotIcon,
	UserIcon,
	BoxIcon,
	GlobeIcon,
	LockIcon,
	EyeIcon,
	ClockRewind,
	CpuIcon,
	PenIcon,
	DeltaIcon,
	MoreIcon,
	MoreHorizontalIcon,
} from "./misc";
