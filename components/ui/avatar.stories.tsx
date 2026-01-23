import type { Story, StoryDefault } from "@ladle/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export default {
  title: "UI / Avatar",
} satisfies StoryDefault;

// Default avatar with image
export const Default: Story = () => (
  <Avatar>
    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
);

// Fallback only (no image)
export const Fallback: Story = () => (
  <Avatar>
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
);

// Various sizes
export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <Avatar className="h-6 w-6">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-xs">CN</AvatarFallback>
    </Avatar>
    <Avatar className="h-8 w-8">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-xs">CN</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    <Avatar className="h-14 w-14">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-lg">CN</AvatarFallback>
    </Avatar>
    <Avatar className="h-20 w-20">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-2xl">CN</AvatarFallback>
    </Avatar>
  </div>
);

// User list
export const UserList: Story = () => (
  <div className="space-y-3">
    {[
      { name: "Alice", initials: "AL", color: "bg-red-500" },
      { name: "Bob", initials: "BO", color: "bg-blue-500" },
      { name: "Charlie", initials: "CH", color: "bg-green-500" },
    ].map((user) => (
      <div key={user.name} className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className={user.color}>{user.initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{user.name}</span>
      </div>
    ))}
  </div>
);

// Avatar group
export const AvatarGroup: Story = () => (
  <div className="flex -space-x-3">
    <Avatar className="border-2 border-background">
      <AvatarFallback className="bg-red-500">A</AvatarFallback>
    </Avatar>
    <Avatar className="border-2 border-background">
      <AvatarFallback className="bg-blue-500">B</AvatarFallback>
    </Avatar>
    <Avatar className="border-2 border-background">
      <AvatarFallback className="bg-green-500">C</AvatarFallback>
    </Avatar>
    <Avatar className="border-2 border-background">
      <AvatarFallback className="bg-muted">+2</AvatarFallback>
    </Avatar>
  </div>
);

// With online status
export const WithStatus: Story = () => (
  <div className="flex items-center gap-6">
    <div className="relative">
      <Avatar>
        <AvatarFallback>ON</AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
    </div>
    <div className="relative">
      <Avatar>
        <AvatarFallback>AW</AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background" />
    </div>
    <div className="relative">
      <Avatar>
        <AvatarFallback>OF</AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-background" />
    </div>
  </div>
);
