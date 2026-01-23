import type { GlobalProvider } from "@ladle/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// Import global styles - critical for Tailwind
import "../app/globals.css";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  // Map Ladle theme state to next-themes
  const theme = globalState.theme === "dark" ? "dark" : "light";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      forcedTheme={theme}
      disableTransitionOnChange
      enableSystem={false}
    >
      <div
        className={`min-h-screen bg-background text-foreground antialiased ${theme === "dark" ? "dark" : ""}`}
      >
        <Toaster position="top-center" />
        {children}
      </div>
    </ThemeProvider>
  );
};
