"use client";

import {
  BrainCircuitIcon,
  PlugIcon,
  ServerIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  {
    name: "Plugins",
    href: "/settings/plugins",
    description: "Media servers and apps",
    icon: PlugIcon,
  },
  {
    name: "AI",
    href: "/settings/ai",
    description: "AI provider keys",
    icon: BrainCircuitIcon,
  },
  {
    name: "MCP Servers",
    href: "/settings/mcp",
    description: "Custom tool servers",
    icon: ServerIcon,
  },
  {
    name: "Skills",
    href: "/settings/skills",
    description: "AI skills and workflows",
    icon: SparklesIcon,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on a specific tab or the root settings page
  const isOnTab = SETTINGS_TABS.some((tab) => pathname === tab.href);
  const isRootSettings = pathname === "/settings";

  return (
    <div className="flex h-dvh w-full flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center px-4">
          <h1 className="font-semibold text-lg">Settings</h1>
        </div>
        <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
          {SETTINGS_TABS.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (isRootSettings && tab.href === "/settings/plugins");
            const Icon = tab.icon;

            return (
              <Link
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                href={tab.href}
                key={tab.href}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
