import type { Story, StoryDefault } from "@ladle/react";
import { useEffect, useState } from "react";
import { Progress } from "./progress";

export default {
  title: "UI / Progress",
} satisfies StoryDefault;

// Default progress
export const Default: Story = () => <Progress value={33} />;

// Empty progress
export const Empty: Story = () => <Progress value={0} />;

// Full progress
export const Full: Story = () => <Progress value={100} />;

// Various values
export const Values: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">0%</p>
      <Progress value={0} />
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">25%</p>
      <Progress value={25} />
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">50%</p>
      <Progress value={50} />
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">75%</p>
      <Progress value={75} />
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">100%</p>
      <Progress value={100} />
    </div>
  </div>
);

// Animated progress
export const Animated: Story = () => {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-2 w-full max-w-md">
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground text-center">{progress}%</p>
    </div>
  );
};

// Download context
export const DownloadContext: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>The Matrix (1999)</span>
        <span>45%</span>
      </div>
      <Progress value={45} />
      <p className="text-xs text-muted-foreground">
        Downloading: 2.3 GB / 5.1 GB - 12 MB/s
      </p>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Inception (2010)</span>
        <span>78%</span>
      </div>
      <Progress value={78} />
      <p className="text-xs text-muted-foreground">
        Downloading: 3.9 GB / 5.0 GB - 8 MB/s
      </p>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Interstellar (2014)</span>
        <span>100%</span>
      </div>
      <Progress value={100} />
      <p className="text-xs text-muted-foreground">Complete - Importing...</p>
    </div>
  </div>
);

// Library completion
export const LibraryCompletion: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Movies</span>
        <span>847 / 1000</span>
      </div>
      <Progress value={84.7} />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>TV Shows</span>
        <span>234 / 300</span>
      </div>
      <Progress value={78} />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Episodes</span>
        <span>4521 / 5000</span>
      </div>
      <Progress value={90.4} />
    </div>
  </div>
);

// Custom sizes
export const CustomSizes: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <Progress value={60} className="h-1" />
    <Progress value={60} className="h-2" />
    <Progress value={60} className="h-4" />
    <Progress value={60} className="h-6" />
  </div>
);

// Interactive with controls
export const Interactive: Story<{ value: number }> = ({ value }) => (
  <Progress value={value} className="w-full max-w-md" />
);
Interactive.args = {
  value: 50,
};
Interactive.argTypes = {
  value: {
    control: { type: "range", min: 0, max: 100, step: 1 },
  },
};
