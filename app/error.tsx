"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorPageProps {
  errorValue: Error & { digest?: string };
  reset: () => void;
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error.tsx requires component named Error
export default function Error({ errorValue, reset }: ErrorPageProps) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: Log error for debugging
    console.error("Route error:", errorValue);
  }, [errorValue]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <div className="rounded-md bg-muted p-3">
                <p className="font-mono text-sm text-muted-foreground break-all">
                  {errorValue.message}
                </p>
              </div>
              {errorValue.digest && (
                <p className="text-xs text-muted-foreground">
                  Error ID: {errorValue.digest}
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/";
            }}
            variant="outline"
          >
            Go home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
