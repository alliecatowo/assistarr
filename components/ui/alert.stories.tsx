import type { Story, StoryDefault } from "@ladle/react";
import { AlertCircle, CheckCircle2, Info as InfoIcon, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export default {
  title: "UI / Alert",
} satisfies StoryDefault;

// Default alert
export const Default: Story = () => (
  <Alert>
    <Terminal className="h-4 w-4" />
    <AlertTitle>Heads up!</AlertTitle>
    <AlertDescription>
      You can add components to your app using the cli.
    </AlertDescription>
  </Alert>
);

// Destructive variant
export const Destructive: Story = () => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      Your session has expired. Please log in again.
    </AlertDescription>
  </Alert>
);

// Service connection alert
export const ServiceConnection: Story = () => (
  <div className="space-y-4 w-full max-w-md">
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Connected</AlertTitle>
      <AlertDescription>
        Radarr is connected and ready to use.
      </AlertDescription>
    </Alert>
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Failed</AlertTitle>
      <AlertDescription>
        Unable to connect to Sonarr. Check your API key and URL.
      </AlertDescription>
    </Alert>
  </div>
);

// Info style alert
export const InfoAlert: Story = () => (
  <Alert className="border-blue-500/50 text-blue-600 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
    <InfoIcon className="h-4 w-4" />
    <AlertTitle>Information</AlertTitle>
    <AlertDescription>
      Your library is currently being scanned. This may take a few minutes.
    </AlertDescription>
  </Alert>
);

// Without title
export const WithoutTitle: Story = () => (
  <Alert>
    <Terminal className="h-4 w-4" />
    <AlertDescription>
      This alert only has a description without a title.
    </AlertDescription>
  </Alert>
);

// Download notification
export const DownloadNotification: Story = () => (
  <Alert>
    <CheckCircle2 className="h-4 w-4" />
    <AlertTitle>Download Complete</AlertTitle>
    <AlertDescription>
      "The Matrix (1999)" has been downloaded and added to your library.
    </AlertDescription>
  </Alert>
);
