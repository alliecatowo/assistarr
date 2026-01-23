import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default {
  title: "Auth / AuthForm",
} satisfies StoryDefault;

// Note: Using mock form to avoid Next.js Form dependency

// Login form
export const Login: Story = () => (
  <form className="flex flex-col gap-4 px-4 sm:px-16 max-w-md mx-auto">
    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="email"
      >
        Email Address
      </Label>
      <Input
        autoComplete="email"
        className="bg-muted text-md md:text-sm"
        id="email"
        name="email"
        placeholder="user@acme.com"
        type="email"
      />
    </div>

    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="password"
      >
        Password
      </Label>
      <Input
        className="bg-muted text-md md:text-sm"
        id="password"
        name="password"
        type="password"
      />
    </div>

    <Button type="submit">Sign In</Button>
  </form>
);

// Register form
export const Register: Story = () => (
  <form className="flex flex-col gap-4 px-4 sm:px-16 max-w-md mx-auto">
    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="email"
      >
        Email Address
      </Label>
      <Input
        autoComplete="email"
        className="bg-muted text-md md:text-sm"
        id="email"
        name="email"
        placeholder="user@acme.com"
        type="email"
      />
    </div>

    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="password"
      >
        Password
      </Label>
      <Input
        className="bg-muted text-md md:text-sm"
        id="password"
        name="password"
        type="password"
      />
    </div>

    <Button type="submit">Create Account</Button>
    <p className="text-center text-xs text-muted-foreground">
      Already have an account?{" "}
      <a className="text-primary hover:underline" href="/login">
        Sign in
      </a>
    </p>
  </form>
);

// With default email
export const WithDefaultEmail: Story = () => (
  <form className="flex flex-col gap-4 px-4 sm:px-16 max-w-md mx-auto">
    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="email"
      >
        Email Address
      </Label>
      <Input
        autoComplete="email"
        className="bg-muted text-md md:text-sm"
        defaultValue="john@example.com"
        id="email"
        name="email"
        placeholder="user@acme.com"
        type="email"
      />
    </div>

    <div className="flex flex-col gap-2">
      <Label
        className="font-normal text-zinc-600 dark:text-zinc-400"
        htmlFor="password"
      >
        Password
      </Label>
      <Input
        className="bg-muted text-md md:text-sm"
        id="password"
        name="password"
        type="password"
      />
    </div>

    <Button type="submit">Sign In</Button>
  </form>
);

// Full page context
export const FullPageContext: Story = () => (
  <div className="min-h-[500px] flex items-center justify-center bg-background">
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      <form className="flex flex-col gap-4 px-4 sm:px-16">
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="email"
          >
            Email Address
          </Label>
          <Input
            autoComplete="email"
            className="bg-muted text-md md:text-sm"
            id="email"
            name="email"
            placeholder="user@acme.com"
            type="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="password"
          >
            Password
          </Label>
          <Input
            className="bg-muted text-md md:text-sm"
            id="password"
            name="password"
            type="password"
          />
        </div>

        <Button type="submit">Sign In</Button>
      </form>
    </div>
  </div>
);
