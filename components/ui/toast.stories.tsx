import type { Story, StoryDefault } from "@ladle/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./button";

export default {
  title: "UI / Toast",
} satisfies StoryDefault;

// Note: The toast component uses sonner and needs to be triggered.
// These stories show the static toast appearance.

// Success toast (static display)
export const SuccessToast: Story = () => (
  <div className="flex toast-mobile:w-[356px] w-full justify-center">
    <div className="flex toast-mobile:w-fit w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
      <div className="text-green-600">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div className="text-sm text-zinc-950 dark:text-zinc-100">
        Movie added to your library successfully!
      </div>
    </div>
  </div>
);

// Error toast (static display)
export const ErrorToast: Story = () => (
  <div className="flex toast-mobile:w-[356px] w-full justify-center">
    <div className="flex toast-mobile:w-fit w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
      <div className="text-red-600">
        <XCircle className="h-5 w-5" />
      </div>
      <div className="text-sm text-zinc-950 dark:text-zinc-100">
        Failed to connect to Radarr. Check your configuration.
      </div>
    </div>
  </div>
);

// Multi-line toast
export const MultiLineToast: Story = () => (
  <div className="flex toast-mobile:w-[356px] w-full justify-center">
    <div className="flex toast-mobile:w-fit w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-start">
      <div className="text-green-600 pt-1">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div className="text-sm text-zinc-950 dark:text-zinc-100">
        Download complete: "The Matrix (1999)" has been added to your library and is now available for streaming.
      </div>
    </div>
  </div>
);

// Toast examples gallery
export const ToastGallery: Story = () => (
  <div className="space-y-4 max-w-md">
    <div className="flex w-full justify-center">
      <div className="flex w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
        <div className="text-green-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="text-sm text-zinc-950 dark:text-zinc-100">
          Settings saved successfully
        </div>
      </div>
    </div>
    <div className="flex w-full justify-center">
      <div className="flex w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
        <div className="text-green-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="text-sm text-zinc-950 dark:text-zinc-100">
          Request submitted for "Inception"
        </div>
      </div>
    </div>
    <div className="flex w-full justify-center">
      <div className="flex w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
        <div className="text-red-600">
          <XCircle className="h-5 w-5" />
        </div>
        <div className="text-sm text-zinc-950 dark:text-zinc-100">
          API key is invalid
        </div>
      </div>
    </div>
    <div className="flex w-full justify-center">
      <div className="flex w-full flex-row gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 items-center">
        <div className="text-red-600">
          <XCircle className="h-5 w-5" />
        </div>
        <div className="text-sm text-zinc-950 dark:text-zinc-100">
          Network error. Please try again.
        </div>
      </div>
    </div>
  </div>
);

// Interactive demo (shows how to trigger)
export const InteractiveDemo: Story = () => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Click the buttons below to see toast examples (requires Toaster in provider):
    </p>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => {
          // In real usage: toast({ type: "success", description: "Success!" })
          console.log("Would show success toast");
        }}
      >
        Show Success
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          // In real usage: toast({ type: "error", description: "Error!" })
          console.log("Would show error toast");
        }}
      >
        Show Error
      </Button>
    </div>
    <p className="text-xs text-muted-foreground">
      Note: Toast notifications are displayed by the Toaster component in the app layout.
    </p>
  </div>
);
