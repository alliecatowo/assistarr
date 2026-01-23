import type { Story, StoryDefault } from "@ladle/react";
import {
  // Brand icons
  GitIcon,
  LogoAnthropic,
  LogoGoogle,
  LogoOpenAI,
  PythonIcon,
  VercelIcon,
  // Navigation icons
  ArrowUpIcon,
  ChevronDownIcon,
  FullscreenIcon,
  GPSIcon,
  HomeIcon,
  MenuIcon,
  RouteIcon,
  SidebarLeftIcon,
  // Action icons
  CopyIcon,
  CrossIcon,
  CrossSmallIcon,
  DownloadIcon,
  PencilEditIcon,
  PlayIcon,
  PlusIcon,
  RedoIcon,
  SettingsIcon,
  ShareIcon,
  StopIcon,
  TrashIcon,
  UndoIcon,
  UploadIcon,
  // Status icons
  CheckCircleFillIcon,
  CheckedSquare,
  InfoIcon,
  LoaderIcon,
  SparklesIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  UncheckedSquare,
  WarningIcon,
  // Media icons
  AttachmentIcon,
  CodeIcon,
  FileIcon,
  ImageIcon,
  InvoiceIcon,
  LineChartIcon,
  LogsIcon,
  MessageIcon,
  PaperclipIcon,
  SummarizeIcon,
  TerminalIcon,
  TerminalWindowIcon,
  // Misc icons
  BotIcon,
  BoxIcon,
  ClockRewind,
  CpuIcon,
  DeltaIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  MoreIcon,
  PenIcon,
  UserIcon,
} from "./index";

export default {
  title: "UI / Icons",
} satisfies StoryDefault;

// Brand icons
export const BrandIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Brand Icons</h3>
    <div className="flex flex-wrap gap-4">
      {[
        { Icon: VercelIcon, name: "Vercel" },
        { Icon: GitIcon, name: "Git" },
        { Icon: LogoOpenAI, name: "OpenAI" },
        { Icon: LogoGoogle, name: "Google" },
        { Icon: LogoAnthropic, name: "Anthropic" },
        { Icon: PythonIcon, name: "Python" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Navigation icons
export const NavigationIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Navigation Icons</h3>
    <div className="flex flex-wrap gap-4">
      {[
        { Icon: HomeIcon, name: "Home" },
        { Icon: MenuIcon, name: "Menu" },
        { Icon: SidebarLeftIcon, name: "Sidebar" },
        { Icon: ChevronDownIcon, name: "Chevron" },
        { Icon: ArrowUpIcon, name: "ArrowUp" },
        { Icon: RouteIcon, name: "Route" },
        { Icon: GPSIcon, name: "GPS" },
        { Icon: FullscreenIcon, name: "Fullscreen" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Action icons
export const ActionIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Action Icons</h3>
    <div className="flex flex-wrap gap-4">
      {[
        { Icon: CopyIcon, name: "Copy" },
        { Icon: TrashIcon, name: "Trash" },
        { Icon: UploadIcon, name: "Upload" },
        { Icon: DownloadIcon, name: "Download" },
        { Icon: PencilEditIcon, name: "Edit" },
        { Icon: UndoIcon, name: "Undo" },
        { Icon: RedoIcon, name: "Redo" },
        { Icon: ShareIcon, name: "Share" },
        { Icon: PlayIcon, name: "Play" },
        { Icon: StopIcon, name: "Stop" },
        { Icon: CrossIcon, name: "Cross" },
        { Icon: CrossSmallIcon, name: "CrossSm" },
        { Icon: PlusIcon, name: "Plus" },
        { Icon: SettingsIcon, name: "Settings" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Status icons
export const StatusIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Status Icons</h3>
    <div className="flex flex-wrap gap-4">
      {[
        { Icon: CheckCircleFillIcon, name: "CheckFill" },
        { Icon: CheckedSquare, name: "Checked" },
        { Icon: UncheckedSquare, name: "Unchecked" },
        { Icon: LoaderIcon, name: "Loader" },
        { Icon: InfoIcon, name: "Info" },
        { Icon: WarningIcon, name: "Warning" },
        { Icon: SparklesIcon, name: "Sparkles" },
        { Icon: ThumbUpIcon, name: "ThumbUp" },
        { Icon: ThumbDownIcon, name: "ThumbDown" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Media icons
export const MediaIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Media Icons</h3>
    <div className="flex flex-wrap gap-4">
      {[
        { Icon: FileIcon, name: "File" },
        { Icon: AttachmentIcon, name: "Attach" },
        { Icon: PaperclipIcon, name: "Paperclip" },
        { Icon: ImageIcon, name: "Image" },
        { Icon: CodeIcon, name: "Code" },
        { Icon: MessageIcon, name: "Message" },
        { Icon: TerminalIcon, name: "Terminal" },
        { Icon: TerminalWindowIcon, name: "TermWin" },
        { Icon: LineChartIcon, name: "Chart" },
        { Icon: LogsIcon, name: "Logs" },
        { Icon: InvoiceIcon, name: "Invoice" },
        { Icon: SummarizeIcon, name: "Summary" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Misc icons
export const MiscIcons: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Misc Icons</h3>
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col items-center gap-1 w-16">
        <BotIcon />
        <span className="text-xs text-muted-foreground">Bot</span>
      </div>
      {[
        { Icon: UserIcon, name: "User" },
        { Icon: BoxIcon, name: "Box" },
        { Icon: GlobeIcon, name: "Globe" },
        { Icon: LockIcon, name: "Lock" },
        { Icon: EyeIcon, name: "Eye" },
        { Icon: ClockRewind, name: "History" },
        { Icon: CpuIcon, name: "CPU" },
        { Icon: PenIcon, name: "Pen" },
        { Icon: DeltaIcon, name: "Delta" },
        { Icon: MoreIcon, name: "More" },
        { Icon: MoreHorizontalIcon, name: "MoreH" },
      ].map(({ Icon, name }) => (
        <div key={name} className="flex flex-col items-center gap-1 w-16">
          <Icon size={24} />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

// Icon sizes
export const Sizes: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Icon Sizes</h3>
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={12} />
        <span className="text-xs text-muted-foreground">12px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={16} />
        <span className="text-xs text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={20} />
        <span className="text-xs text-muted-foreground">20px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={24} />
        <span className="text-xs text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={32} />
        <span className="text-xs text-muted-foreground">32px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SparklesIcon size={48} />
        <span className="text-xs text-muted-foreground">48px</span>
      </div>
    </div>
  </div>
);

// With colors
export const WithColors: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Icons with Colors</h3>
    <div className="flex gap-4">
      <span className="text-green-500">
        <CheckCircleFillIcon size={24} />
      </span>
      <span className="text-yellow-500">
        <WarningIcon size={24} />
      </span>
      <span className="text-red-500">
        <CrossIcon size={24} />
      </span>
      <span className="text-blue-500">
        <InfoIcon size={24} />
      </span>
      <span className="text-purple-500">
        <SparklesIcon size={24} />
      </span>
    </div>
  </div>
);
