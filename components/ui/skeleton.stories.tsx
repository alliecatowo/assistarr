import type { Story, StoryDefault } from "@ladle/react";
import { Skeleton } from "./skeleton";

export default {
  title: "UI / Skeleton",
} satisfies StoryDefault;

// Default skeleton
export const Default: Story = () => <Skeleton className="h-4 w-[250px]" />;

// Various sizes
export const Sizes: Story = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-[100px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[300px]" />
    <Skeleton className="h-4 w-full" />
  </div>
);

// Card skeleton
export const CardSkeleton: Story = () => (
  <div className="flex flex-col space-y-3">
    <Skeleton className="h-[125px] w-[250px] rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

// Media card skeleton
export const MediaCardSkeleton: Story = () => (
  <div className="w-[200px] space-y-3">
    <Skeleton className="h-[300px] w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

// List item skeleton
export const ListItemSkeleton: Story = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton: Story = () => (
  <div className="space-y-2">
    <div className="flex space-x-4">
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 w-[150px]" />
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 flex-1" />
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-6 w-[100px]" />
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-6 w-[100px]" />
        <Skeleton className="h-6 flex-1" />
      </div>
    ))}
  </div>
);

// Chat message skeleton
export const ChatMessageSkeleton: Story = () => (
  <div className="space-y-4">
    <div className="flex items-start space-x-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
    <div className="flex items-start space-x-3 justify-end">
      <div className="space-y-2 flex-1 flex flex-col items-end">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

// Grid skeleton
export const GridSkeleton: Story = () => (
  <div className="grid grid-cols-4 gap-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-[180px] w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

// Avatar with text
export const AvatarWithText: Story = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
  </div>
);
