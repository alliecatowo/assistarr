import type { Story, StoryDefault } from "@ladle/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

export default {
  title: "UI / AlertDialog",
} satisfies StoryDefault;

// Default alert dialog
export const Default: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="outline">Show Dialog</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Delete confirmation
export const DeleteConfirmation: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">Delete Movie</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete "The Matrix"?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove the movie from your library. The movie
          files will be deleted from disk and cannot be recovered.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Service disconnect
export const DisconnectService: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="outline">Disconnect Radarr</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Disconnect Radarr?</AlertDialogTitle>
        <AlertDialogDescription>
          This will remove the connection to your Radarr instance. You will no
          longer be able to manage movies through this service. You can always
          reconnect later.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep Connected</AlertDialogCancel>
        <AlertDialogAction>Disconnect</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Clear queue
export const ClearQueue: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="outline">Clear Download Queue</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Clear download queue?</AlertDialogTitle>
        <AlertDialogDescription>
          This will remove all 12 items from your download queue. Downloads in
          progress will be cancelled. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Clear Queue
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Logout confirmation
export const LogoutConfirmation: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost">Sign Out</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Sign out?</AlertDialogTitle>
        <AlertDialogDescription>
          You will be signed out of your account. Any unsaved changes will be
          lost.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Sign Out</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Data reset
export const ResetData: Story = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">Reset All Data</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reset all data?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete all your settings, service connections,
          and preferences. You will need to reconfigure everything from scratch.
          This action is irreversible.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Reset Everything
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
