"use client";

import {
  BarChart3Icon,
  MessageSquareIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/sidebar/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar/sidebar-user-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const handleDeleteAll = () => {
    const deletePromise = fetch("/api/history", {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting all chats...",
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setShowDeleteAllDialog(false);
        router.replace("/chat/new");
        router.refresh();
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="Home">
                <Link
                  href="/home"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  <Logo size={32} />
                  <span className="font-semibold text-lg">Assistarr</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Main navigation at top */}
          {user && (
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="New Chat">
                    <Link
                      href="/chat/new"
                      onClick={() => {
                        setOpenMobile(false);
                        router.refresh();
                      }}
                    >
                      <PlusIcon />
                      <span>New Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Chat">
                    <Link href="/chat/new" onClick={() => setOpenMobile(false)}>
                      <MessageSquareIcon />
                      <span>Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
          {/* Chat history - hidden when collapsed */}
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarHistory user={user} />
          </div>
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <SidebarMenu>
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="w-full justify-start gap-2"
                      onClick={() => setShowDeleteAllDialog(true)}
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon size={16} />
                      <span>Delete All Chats</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Delete All Chats</TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Discover">
                  <Link href="/discover" onClick={() => setOpenMobile(false)}>
                    <SparklesIcon />
                    <span>Discover</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Monitor">
                  <Link href="/monitor" onClick={() => setOpenMobile(false)}>
                    <BarChart3Icon />
                    <span>Monitor</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/settings" onClick={() => setOpenMobile(false)}>
                    <SettingsIcon />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarUserNav user={user} />
            </SidebarMenu>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
